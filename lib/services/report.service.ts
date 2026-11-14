/* ---------------------------------------------------------------------------
 * Report service — user complaints reviewed by administrators.
 * ------------------------------------------------------------------------ */

import "server-only";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { Report } from "@/models/Report";
import { Property } from "@/models/Property";
import { Agency } from "@/models/Agency";
import { User } from "@/models/User";
import { AppError, ForbiddenError, NotFoundError } from "@/lib/errors";
import { serializeReport } from "@/lib/mappers";
import { notify } from "@/lib/services/notification.service";
import type { ReportInput } from "@/lib/validation/interaction";
import type { Paginated, ReportDTO, SessionUser } from "@/types";

type AnyDoc = Record<string, unknown>;

async function targetLabel(targetType: string, targetId: string): Promise<string> {
  if (!Types.ObjectId.isValid(targetId)) return `${targetType}`;
  if (targetType === "property") {
    const p = await Property.findById(targetId).select("title").lean();
    return p ? `“${p.title}”` : "a listing";
  }
  if (targetType === "agency") {
    const a = await Agency.findById(targetId).select("name").lean();
    return a ? a.name : "an agency";
  }
  const u = await User.findById(targetId).select("name").lean();
  return u ? u.name : "a user";
}

export async function createReport(
  input: ReportInput,
  actor: SessionUser
): Promise<ReportDTO> {
  await connectDB();

  if (!Types.ObjectId.isValid(input.targetId)) {
    throw new AppError("The reported item could not be found.");
  }

  const existing = await Report.findOne({
    reporter: new Types.ObjectId(actor.id),
    targetType: input.targetType,
    targetId: new Types.ObjectId(input.targetId),
    status: { $in: ["open", "reviewing"] },
  }).lean();
  if (existing) {
    throw new AppError("You already have an open report for this item.");
  }

  const label = await targetLabel(input.targetType, input.targetId);

  const report = await Report.create({
    reporter: new Types.ObjectId(actor.id),
    targetType: input.targetType,
    targetId: new Types.ObjectId(input.targetId),
    reason: input.reason,
    details: input.details?.trim() || null,
    status: "open",
    targetLabel: label,
  });

  // Surface the label for the admin table.
  await Report.updateOne({ _id: report._id }, { $set: { targetLabel: label } });

  return serializeReport(report.toObject() as unknown as AnyDoc);
}

export async function listReports(
  options: { status?: string; page?: number } = {}
): Promise<Paginated<ReportDTO>> {
  await connectDB();
  const page = options.page ?? 1;
  const pageSize = 20;
  const query: Record<string, unknown> = {};
  if (options.status && options.status !== "all") query.status = options.status;

  const total = await Report.countDocuments(query);
  const docs = (await Report.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .populate("reporter", "name email")
    .lean()) as unknown as AnyDoc[];

  return {
    items: docs.map(serializeReport),
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    hasMore: page * pageSize < total,
  };
}

export async function reviewReport(
  reportId: string,
  input: { status: "open" | "reviewing" | "resolved" | "dismissed"; resolution?: string },
  admin: SessionUser
): Promise<ReportDTO> {
  if (admin.role !== "admin") throw new ForbiddenError();
  await connectDB();

  const report = await Report.findById(reportId);
  if (!report) throw new NotFoundError("Report not found.");

  report.status = input.status;
  report.resolution = input.resolution?.trim() || null;
  report.reviewedBy = new Types.ObjectId(admin.id);
  report.reviewedAt = new Date();
  await report.save();

  if (input.status === "resolved" || input.status === "dismissed") {
    await notify({
      userId: String(report.reporter),
      type: "system",
      title: `Report ${input.status}`,
      body: input.resolution?.trim()
        ? `A moderator reviewed your report: ${input.resolution}`
        : "A moderator reviewed your report. Thank you for helping keep Arcadia trustworthy.",
      href: "/dashboard",
    });
  }

  const fresh = (await Report.findById(reportId)
    .populate("reporter", "name email")
    .lean()) as unknown as AnyDoc;
  return serializeReport(fresh);
}
