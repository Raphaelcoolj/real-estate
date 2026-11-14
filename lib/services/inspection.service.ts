/* ---------------------------------------------------------------------------
 * Inspection service — viewing appointments between customers and agents.
 * ------------------------------------------------------------------------ */

import "server-only";
import { Types, type QueryFilter } from "mongoose";
import { connectDB } from "@/lib/db";
import { Inspection } from "@/models/Inspection";
import { Property } from "@/models/Property";
import { AppError, ForbiddenError, NotFoundError } from "@/lib/errors";
import { serializeInspection } from "@/lib/mappers";
import { notify } from "@/lib/services/notification.service";
import type { InspectionRequestInput, InspectionUpdateInput } from "@/lib/validation/interaction";
import type { InspectionDTO, SessionUser } from "@/types";
import type { InspectionStatus } from "@/constants";

type AnyDoc = Record<string, unknown>;

export async function requestInspection(
  input: InspectionRequestInput,
  actor: SessionUser
): Promise<InspectionDTO> {
  await connectDB();

  const property = (await Property.findOne({ _id: input.propertyId })
    .select("title slug status agent address images")
    .lean()) as unknown as AnyDoc | null;
  if (!property) throw new NotFoundError("Property not found.");
  if (!["approved", "sold", "rented"].includes(String(property.status))) {
    throw new AppError("This property is not available for viewings.");
  }

  const agentId = String((property.agent as AnyDoc)?._id ?? property.agent);
  const propertyOid = new Types.ObjectId(String(property._id));

  const duplicate = await Inspection.findOne({
    property: propertyOid,
    customer: new Types.ObjectId(actor.id),
    status: { $in: ["requested", "confirmed"] },
  }).lean();
  if (duplicate) {
    throw new AppError("You already have an open viewing request for this property.");
  }

  const preferredDate = new Date(input.preferredDate);
  preferredDate.setHours(12, 0, 0, 0);

  const inspection = await Inspection.create({
    property: propertyOid,
    customer: new Types.ObjectId(actor.id),
    agent: new Types.ObjectId(agentId),
    preferredDate,
    alternativeDate: input.alternativeDate ? new Date(input.alternativeDate) : null,
    slot: input.slot,
    message: input.message?.trim() || null,
    status: "requested",
  });

  await notify({
    userId: agentId,
    type: "inspection",
    title: "New viewing request",
    body: `${actor.name} requested a viewing of “${String(property.title)}” on ${preferredDate.toDateString()} (${input.slot}).`,
    href: "/dashboard/inspections",
  });

  const fresh = (await Inspection.findById(inspection._id)
    .populate({ path: "property", select: "title slug images address" })
    .populate({ path: "customer", select: "name email" })
    .populate({ path: "agent", select: "name slug" })
    .lean()) as unknown as AnyDoc;

  return serializeInspection(fresh);
}

export async function listInspections(
  actor: SessionUser,
  options: { scope?: "incoming" | "outgoing"; status?: string; page?: number } = {}
): Promise<{ items: InspectionDTO[]; total: number; page: number; totalPages: number; pendingCount: number }> {
  await connectDB();
  const page = options.page ?? 1;
  const pageSize = 20;
  const scope = options.scope ?? (actor.role === "customer" ? "outgoing" : "incoming");

  const query: QueryFilter<import("@/models/Inspection").InspectionDocument> =
    scope === "incoming"
      ? { agent: new Types.ObjectId(actor.id) }
      : { customer: new Types.ObjectId(actor.id) };

  if (options.status && options.status !== "all") {
    query.status = options.status as InspectionStatus;
  }

  const [total, pendingCount, docs] = await Promise.all([
    Inspection.countDocuments(query),
    Inspection.countDocuments(
      scope === "incoming"
        ? { agent: new Types.ObjectId(actor.id), status: "requested" }
        : { customer: new Types.ObjectId(actor.id), status: { $in: ["requested", "confirmed"] } }
    ),
    Inspection.find(query)
      .sort({ preferredDate: 1, createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .populate({ path: "property", select: "title slug images address" })
      .populate({ path: "customer", select: "name email" })
      .populate({ path: "agent", select: "name slug" })
      .lean(),
  ]);

  return {
    items: (docs as unknown as AnyDoc[]).map(serializeInspection),
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    pendingCount,
  };
}

export async function updateInspection(
  input: InspectionUpdateInput,
  actor: SessionUser
): Promise<InspectionDTO> {
  await connectDB();
  const doc = (await Inspection.findById(input.inspectionId).lean()) as unknown as AnyDoc | null;
  if (!doc) throw new NotFoundError("Appointment not found.");

  const agentId = String(doc.agent);
  const customerId = String(doc.customer);
  const isAgent = agentId === actor.id || actor.role === "admin";
  const isCustomer = customerId === actor.id;
  const status = String(doc.status);

  if (!isAgent && !isCustomer) {
    throw new ForbiddenError("You are not part of this appointment.");
  }

  const update: Record<string, unknown> = {};
  let notifyCustomer: { title: string; body: string } | null = null;
  let notifyAgent: { title: string; body: string } | null = null;

  if (isAgent) {
    switch (input.action) {
      case "confirm":
        if (!["requested", "rescheduled"].includes(status)) {
          throw new AppError("Only a requested appointment can be confirmed.");
        }
        update.status = "confirmed";
        update.scheduledAt = doc.preferredDate;
        notifyCustomer = {
          title: "Viewing confirmed",
          body: `Your viewing is confirmed for ${new Date(String(doc.preferredDate)).toDateString()}, ${String(doc.slot)}.`,
        };
        break;
      case "decline":
        if (status !== "requested") throw new AppError("Only a requested appointment can be declined.");
        update.status = "declined";
        update.responseNote = input.note?.trim() || null;
        notifyCustomer = {
          title: "Viewing declined",
          body: input.note?.trim() || "The agent declined this viewing request. Try another time.",
        };
        break;
      case "reschedule": {
        if (!input.proposedDate || !input.proposedSlot) {
          throw new AppError("Provide a new date and time slot.");
        }
        const date = new Date(input.proposedDate);
        date.setHours(12, 0, 0, 0);
        update.status = "rescheduled";
        update.proposedDate = date;
        update.proposedSlot = input.proposedSlot;
        update.responseNote = input.note?.trim() || null;
        notifyCustomer = {
          title: "New time proposed",
          body: `The agent proposed ${date.toDateString()} (${input.proposedSlot}). Accept to confirm.`,
        };
        break;
      }
      case "complete":
        if (!["confirmed", "rescheduled"].includes(status)) {
          throw new AppError("Only a confirmed appointment can be completed.");
        }
        update.status = "completed";
        notifyCustomer = {
          title: "Viewing completed",
          body: "Thank you for viewing. Follow up with the agent from your enquiries.",
        };
        break;
      default:
        throw new AppError("That action is not available to the agent.");
    }
  } else if (isCustomer) {
    switch (input.action) {
      case "cancel":
        if (!["requested", "confirmed", "rescheduled"].includes(status)) {
          throw new AppError("This appointment can no longer be cancelled.");
        }
        update.status = "cancelled";
        notifyAgent = {
          title: "Viewing cancelled",
          body: `${actor.name} cancelled the viewing of “${String((doc.property as AnyDoc)?.title ?? "a property")}”.`,
        };
        break;
      case "accept_reschedule":
        if (status !== "rescheduled" || !doc.proposedDate) {
          throw new AppError("There is no proposed time to accept.");
        }
        update.status = "confirmed";
        update.preferredDate = doc.proposedDate;
        update.slot = doc.proposedSlot;
        update.scheduledAt = doc.proposedDate;
        notifyAgent = {
          title: "New time accepted",
          body: `${actor.name} accepted the proposed viewing time.`,
        };
        break;
      default:
        throw new AppError("That action is not available to you.");
    }
  } else {
    throw new ForbiddenError();
  }

  await Inspection.updateOne({ _id: input.inspectionId }, { $set: update });

  if (notifyCustomer) {
    await notify({
      userId: customerId,
      type: "inspection_update",
      title: notifyCustomer.title,
      body: notifyCustomer.body,
      href: "/dashboard/inspections",
    });
  }
  if (notifyAgent) {
    await notify({
      userId: agentId,
      type: "inspection_update",
      title: notifyAgent.title,
      body: notifyAgent.body,
      href: "/dashboard/inspections",
    });
  }

  const fresh = (await Inspection.findById(input.inspectionId)
    .populate({ path: "property", select: "title slug images address" })
    .populate({ path: "customer", select: "name email" })
    .populate({ path: "agent", select: "name slug" })
    .lean()) as unknown as AnyDoc;

  return serializeInspection(fresh);
}

export async function getUpcomingInspections(
  userId: string,
  role: "customer" | "agent",
  limit = 5
): Promise<InspectionDTO[]> {
  await connectDB();
  const field = role === "customer" ? "customer" : "agent";
  const docs = await Inspection.find({
    [field]: new Types.ObjectId(userId),
    status: { $in: ["requested", "confirmed", "rescheduled"] },
    preferredDate: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
  })
    .sort({ preferredDate: 1 })
    .limit(limit)
    .populate({ path: "property", select: "title slug images address" })
    .populate({ path: "customer", select: "name email" })
    .populate({ path: "agent", select: "name slug" })
    .lean();

  return (docs as unknown as AnyDoc[]).map(serializeInspection);
}
