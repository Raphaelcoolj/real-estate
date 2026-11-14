"use server";

/* ---------------------------------------------------------------------------
 * Inspection actions — customers request viewings; agents manage them.
 * ------------------------------------------------------------------------ */

import { revalidatePath } from "next/cache";
import { actionUser, limitAction, runAction } from "@/actions/helpers";
import { parseInput } from "@/lib/validation";
import { inspectionRequestSchema, inspectionUpdateSchema } from "@/lib/validation/interaction";
import { requestInspection, updateInspection } from "@/lib/services/inspection.service";
import { AppError } from "@/lib/errors";
import type { ActionResult, InspectionDTO } from "@/types";

export async function requestInspectionAction(
  input: unknown
): Promise<ActionResult<InspectionDTO>> {
  return runAction(async () => {
    await limitAction("inspection");
    const user = await actionUser();

    const parsed = parseInput(inspectionRequestSchema, input);
    if (!parsed.success) {
      throw new AppError(parsed.message, 400, parsed.fields);
    }

    const inspection = await requestInspection(parsed.data, user);
    revalidatePath("/dashboard/inspections");
    return inspection;
  });
}

export async function updateInspectionAction(
  input: unknown
): Promise<ActionResult<InspectionDTO>> {
  return runAction(async () => {
    await limitAction("inspection-update");
    const user = await actionUser();

    const parsed = parseInput(inspectionUpdateSchema, input);
    if (!parsed.success) {
      throw new AppError(parsed.message, 400, parsed.fields);
    }

    const inspection = await updateInspection(parsed.data, user);
    revalidatePath("/dashboard/inspections");
    return inspection;
  });
}
