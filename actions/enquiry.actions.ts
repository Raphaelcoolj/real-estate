"use server";

/* ---------------------------------------------------------------------------
 * Enquiry actions — customers message agents; agents reply and triage.
 * ------------------------------------------------------------------------ */

import { revalidatePath } from "next/cache";
import { actionUser, limitAction, runAction } from "@/actions/helpers";
import { parseInput } from "@/lib/validation";
import { enquirySchema, enquiryStatusSchema } from "@/lib/validation/interaction";
import { createEnquiry, updateEnquiry } from "@/lib/services/enquiry.service";
import { AppError } from "@/lib/errors";
import type { ActionResult, EnquiryDTO } from "@/types";

export async function createEnquiryAction(
  input: unknown
): Promise<ActionResult<EnquiryDTO>> {
  return runAction(async () => {
    await limitAction("enquiry");
    const user = await actionUser();

    const parsed = parseInput(enquirySchema, input);
    if (!parsed.success) {
      throw new AppError(parsed.message, 400, parsed.fields);
    }

    const enquiry = await createEnquiry(parsed.data, user);
    revalidatePath("/dashboard/enquiries");
    return enquiry;
  });
}

export async function updateEnquiryAction(
  input: unknown
): Promise<ActionResult<EnquiryDTO>> {
  return runAction(async () => {
    await limitAction("enquiry-update");
    const user = await actionUser();

    const parsed = parseInput(enquiryStatusSchema, input);
    if (!parsed.success) {
      throw new AppError(parsed.message, 400, parsed.fields);
    }

    const enquiry = await updateEnquiry(parsed.data.enquiryId, parsed.data, user);
    revalidatePath("/dashboard/enquiries");
    return enquiry;
  });
}
