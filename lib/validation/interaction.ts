import { z } from "zod";
import { ENQUIRY_STATUSES, INSPECTION_SLOTS, REPORT_REASONS } from "@/constants";

const slotValues = INSPECTION_SLOTS as unknown as [string, ...string[]];
const reasonValues = REPORT_REASONS.map((r) => r.value) as [string, ...string[]];

export const enquirySchema = z.object({
  propertyId: z.string().min(1, "Property is required"),
  message: z
    .string()
    .trim()
    .min(10, "Write at least 10 characters")
    .max(3000),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
});

export type EnquiryInput = z.infer<typeof enquirySchema>;

type EnquiryStatusValue = (typeof ENQUIRY_STATUSES)[number]["value"];
export const enquiryStatusSchema = z.object({
  enquiryId: z.string().min(1),
  status: z.enum(ENQUIRY_STATUSES.map((s) => s.value) as [EnquiryStatusValue, ...EnquiryStatusValue[]]),
  reply: z.string().trim().max(3000).optional().or(z.literal("")),
});

export const inspectionRequestSchema = z
  .object({
    propertyId: z.string().min(1, "Property is required"),
    preferredDate: z.string().min(1, "Choose a date").refine((v) => {
      const d = new Date(v);
      return !Number.isNaN(d.getTime()) && d.getTime() > Date.now() - 24 * 60 * 60 * 1000;
    }, "Choose a future date"),
    alternativeDate: z
      .string()
      .optional()
      .or(z.literal(""))
      .refine((v) => !v || !Number.isNaN(new Date(v).getTime()), "Invalid date"),
    slot: z.enum(slotValues, { message: "Choose a time slot" }),
    message: z.string().trim().max(2000).optional().or(z.literal("")),
  })
  .refine((d) => !d.alternativeDate || new Date(d.alternativeDate) > new Date(d.preferredDate), {
    message: "The alternative date must be after the preferred date",
    path: ["alternativeDate"],
  });

export type InspectionRequestInput = z.infer<typeof inspectionRequestSchema>;

export const inspectionUpdateSchema = z
  .object({
    inspectionId: z.string().min(1),
    action: z.enum([
      "confirm",
      "decline",
      "reschedule",
      "complete",
      "cancel",
      "accept_reschedule",
    ]),
    note: z.string().trim().max(2000).optional().or(z.literal("")),
    proposedDate: z.string().optional().or(z.literal("")),
    proposedSlot: z.enum(slotValues).optional(),
  })
  .refine((data) => data.action !== "reschedule" || Boolean(data.proposedDate && data.proposedSlot), {
    message: "Choose a new date and time slot",
    path: ["proposedDate"],
  });

export type InspectionUpdateInput = z.infer<typeof inspectionUpdateSchema>;

export const reportSchema = z.object({
  targetType: z.enum(["property", "user", "agency"]),
  targetId: z.string().min(1),
  reason: z.enum(reasonValues),
  details: z.string().trim().max(3000).optional().or(z.literal("")),
});

export type ReportInput = z.infer<typeof reportSchema>;

export const reportReviewSchema = z.object({
  reportId: z.string().min(1),
  status: z.enum(["open", "reviewing", "resolved", "dismissed"]),
  resolution: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const listingStatusSchema = z.object({
  propertyId: z.string().min(1),
  action: z.enum(["mark_sold", "mark_rented", "mark_available", "archive"]),
});
