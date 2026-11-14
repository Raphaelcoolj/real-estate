/* ---------------------------------------------------------------------------
 * Enquiry service — customer messages routed to listing agents.
 * ------------------------------------------------------------------------ */

import "server-only";
import { Types, type QueryFilter } from "mongoose";
import { connectDB } from "@/lib/db";
import { Enquiry } from "@/models/Enquiry";
import { Property } from "@/models/Property";
import { AppError, ForbiddenError, NotFoundError } from "@/lib/errors";
import { serializeEnquiry } from "@/lib/mappers";
import { notify } from "@/lib/services/notification.service";
import type { EnquiryInput } from "@/lib/validation/interaction";
import type { EnquiryDTO, SessionUser } from "@/types";
import type { EnquiryStatus } from "@/constants";

type AnyDoc = Record<string, unknown>;

/** Duplicate-submission guard — same customer + property within 5 minutes. */
const DUPLICATE_WINDOW_MS = 5 * 60 * 1000;

export async function createEnquiry(
  input: EnquiryInput,
  actor: SessionUser
): Promise<EnquiryDTO> {
  await connectDB();

  const property = (await Property.findOne({ _id: input.propertyId })
    .select("title slug status agent images price currency")
    .lean()) as unknown as AnyDoc | null;
  if (!property) throw new NotFoundError("Property not found.");
  if (!["approved", "sold", "rented"].includes(String(property.status))) {
    throw new AppError("This property is not accepting enquiries.");
  }

  const agentId = String((property.agent as AnyDoc)?._id ?? property.agent);

  const propertyOid = new Types.ObjectId(String(property._id));
  const recent = await Enquiry.findOne({
    property: propertyOid,
    customer: new Types.ObjectId(actor.id),
    createdAt: { $gte: new Date(Date.now() - DUPLICATE_WINDOW_MS) },
  }).lean();
  if (recent) {
    throw new AppError("You already sent a message about this property — the agent will reply shortly.");
  }

  const enquiry = await Enquiry.create({
    property: propertyOid,
    customer: new Types.ObjectId(actor.id),
    agent: new Types.ObjectId(agentId),
    message: input.message.trim(),
    phone: input.phone?.trim() || actor.phone || null,
    status: "new",
    source: "detail",
  });

  await Property.updateOne({ _id: propertyOid }, { $inc: { "stats.enquiries": 1 } });

  await notify({
    userId: agentId,
    type: "enquiry",
    title: "New enquiry",
    body: `${actor.name} enquired about “${String(property.title)}”.`,
    href: "/dashboard/enquiries",
  });

  const fresh = (await Enquiry.findById(enquiry._id)
    .populate({ path: "property", select: "title slug images price currency" })
    .populate({ path: "customer", select: "name email avatarUrl" })
    .populate({ path: "agent", select: "name slug" })
    .lean()) as unknown as AnyDoc;

  return serializeEnquiry(fresh);
}

export async function listEnquiries(
  actor: SessionUser,
  options: { scope?: "incoming" | "outgoing" | "all"; status?: string; page?: number } = {}
): Promise<{ items: EnquiryDTO[]; total: number; page: number; totalPages: number; newCount: number }> {
  await connectDB();
  const page = options.page ?? 1;
  const pageSize = 20;
  const scope = options.scope ?? (actor.role === "customer" ? "outgoing" : "incoming");

  const query: QueryFilter<import("@/models/Enquiry").EnquiryDocument> = {};
  if (scope === "incoming") query.agent = new Types.ObjectId(actor.id);
  else if (scope === "outgoing") query.customer = new Types.ObjectId(actor.id);
  else {
    query.$or = [
      { agent: new Types.ObjectId(actor.id) },
      { customer: new Types.ObjectId(actor.id) },
    ];
  }
  if (options.status && options.status !== "all") {
    query.status = options.status as EnquiryStatus;
  }

  const [total, newCount, docs] = await Promise.all([
    Enquiry.countDocuments(query),
    Enquiry.countDocuments({ ...query, status: "new" }),
    Enquiry.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .populate({ path: "property", select: "title slug images price currency agent" })
      .populate({ path: "customer", select: "name email avatarUrl" })
      .populate({ path: "agent", select: "name slug" })
      .lean(),
  ]);

  return {
    items: (docs as unknown as AnyDoc[]).map(serializeEnquiry),
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    newCount,
  };
}

export async function updateEnquiry(
  enquiryId: string,
  input: { status: string; reply?: string },
  actor: SessionUser
): Promise<EnquiryDTO> {
  await connectDB();
  const enquiry = (await Enquiry.findById(enquiryId).lean()) as unknown as AnyDoc | null;
  if (!enquiry) throw new NotFoundError("Enquiry not found.");

  const agentId = String(enquiry.agent);
  const customerId = String(enquiry.customer);
  const isAgent = agentId === actor.id || actor.role === "admin";
  const isCustomer = customerId === actor.id;

  if (!isAgent && !isCustomer) {
    throw new ForbiddenError("You are not part of this conversation.");
  }

  const update: Record<string, unknown> = {};
  if (isAgent) {
    if (input.reply?.trim()) {
      update.reply = input.reply.trim();
      update.repliedAt = new Date();
      update.status = "replied";
      await notify({
        userId: customerId,
        type: "enquiry_reply",
        title: "An agent replied to your enquiry",
        body: input.reply.trim().slice(0, 200),
        href: "/dashboard/enquiries",
      });
    } else if (input.status) {
      update.status = input.status;
    }
  } else if (isCustomer && input.status === "closed") {
    // Customers may close their own thread.
    update.status = "closed";
  } else {
    throw new ForbiddenError("Only the listing agent can update this enquiry.");
  }

  await Enquiry.updateOne({ _id: enquiryId }, { $set: update });

  const fresh = (await Enquiry.findById(enquiryId)
    .populate({ path: "property", select: "title slug images price currency" })
    .populate({ path: "customer", select: "name email avatarUrl" })
    .populate({ path: "agent", select: "name slug" })
    .lean()) as unknown as AnyDoc;

  return serializeEnquiry(fresh);
}

export async function getEnquiryCounts(actor: SessionUser): Promise<{ newCount: number; total: number }> {
  await connectDB();
  const query =
    actor.role === "customer"
      ? { customer: new Types.ObjectId(actor.id) }
      : { agent: new Types.ObjectId(actor.id) };
  const [newCount, total] = await Promise.all([
    Enquiry.countDocuments({ ...query, status: "new" }),
    Enquiry.countDocuments(query),
  ]);
  return { newCount, total };
}
