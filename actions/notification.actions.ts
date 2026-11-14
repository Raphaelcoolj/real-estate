"use server";

/* ---------------------------------------------------------------------------
 * Notification + report actions.
 * ------------------------------------------------------------------------ */

import { revalidatePath } from "next/cache";
import { actionRole, actionUser, limitAction, runAction } from "@/actions/helpers";
import {
  markAllNotificationsRead,
  markNotificationsRead,
} from "@/lib/services/notification.service";
import { createReport, reviewReport } from "@/lib/services/report.service";
import { parseInput } from "@/lib/validation";
import { reportReviewSchema, reportSchema } from "@/lib/validation/interaction";
import { AppError } from "@/lib/errors";
import type { ActionResult, ReportDTO } from "@/types";

export async function markNotificationsReadAction(
  ids?: string[]
): Promise<ActionResult<{ updated: number }>> {
  return runAction(async () => {
    const user = await actionUser();
    const updated = await markNotificationsRead(user.id, ids);
    revalidatePath("/dashboard/notifications");
    return { updated };
  });
}

export async function markAllNotificationsReadAction(): Promise<ActionResult<{ updated: number }>> {
  return runAction(async () => {
    const user = await actionUser();
    const updated = await markAllNotificationsRead(user.id);
    revalidatePath("/dashboard/notifications");
    return { updated };
  });
}

export async function createReportAction(input: unknown): Promise<ActionResult<ReportDTO>> {
  return runAction(async () => {
    await limitAction("report");
    const user = await actionUser();

    const parsed = parseInput(reportSchema, input);
    if (!parsed.success) throw new AppError(parsed.message, 400, parsed.fields);

    const report = await createReport(parsed.data, user);
    return report;
  });
}

export async function reviewReportAction(input: unknown): Promise<ActionResult<ReportDTO>> {
  return runAction(async () => {
    await limitAction("report-review");
    const admin = await actionRole(["admin"]);

    const parsed = parseInput(reportReviewSchema, input);
    if (!parsed.success) throw new AppError(parsed.message, 400, parsed.fields);

    const report = await reviewReport(
      parsed.data.reportId,
      { status: parsed.data.status, resolution: parsed.data.resolution },
      admin
    );
    revalidatePath("/dashboard/reports");
    return report;
  });
}
