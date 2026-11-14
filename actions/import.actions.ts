"use server";

/* ---------------------------------------------------------------------------
 * Data import action — admin-only upload of listing JSON (synthetic or real).
 * ------------------------------------------------------------------------ */

import { revalidatePath } from "next/cache";
import { actionRole, limitAction, runAction } from "@/actions/helpers";
import { AppError } from "@/lib/errors";
import {
  MAX_IMPORT_BYTES,
  parseListingPayload,
  runListingImport,
  type ImportSummary,
} from "@/lib/listings-import";
import type { ActionResult } from "@/types";

type ImportInput = {
  payload?: unknown;
  dryRun?: boolean;
};

export async function importListingsAction(
  input: ImportInput
): Promise<ActionResult<ImportSummary>> {
  return runAction(async () => {
    await limitAction("listing-import");
    await actionRole(["admin"]);

    if (!input || typeof input !== "object" || !("payload" in input)) {
      throw new AppError("Paste or upload a JSON array of listings first.", 400);
    }

    const size = JSON.stringify(input.payload)?.length ?? 0;
    if (size > MAX_IMPORT_BYTES) {
      throw new AppError(
        `That payload is too large (${(size / 1_000_000).toFixed(1)} MB). Keep it under 2 MB.`,
        413
      );
    }

    const parsed = parseListingPayload(input.payload);
    if (!parsed.ok) {
      throw new AppError(parsed.issues[0] ?? "The listing data is invalid.", 400, {
        payload: parsed.issues.slice(0, 10),
      });
    }

    const summary = await runListingImport(parsed.listings, { dryRun: input.dryRun === true });

    if (!summary.dryRun) {
      revalidatePath("/");
      revalidatePath("/properties");
      revalidatePath("/dashboard");
      revalidatePath("/dashboard/moderation");
      revalidatePath("/dashboard/listings");
      revalidatePath("/dashboard/analytics");
      revalidatePath("/dashboard/import");
    }

    return summary;
  });
}
