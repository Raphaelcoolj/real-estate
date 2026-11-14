"use server";

/* ---------------------------------------------------------------------------
 * Admin actions — user management (suspend, verify, change role).
 * ------------------------------------------------------------------------ */

import { revalidatePath } from "next/cache";
import { actionRole, limitAction, runAction } from "@/actions/helpers";
import { adminUpdateUser } from "@/lib/services/user.service";
import { parseInput } from "@/lib/validation";
import { adminUserUpdateSchema } from "@/lib/validation/auth";
import { AppError } from "@/lib/errors";
import type { ActionResult } from "@/types";

export async function adminUserAction(input: unknown): Promise<ActionResult<null>> {
  return runAction(async () => {
    await limitAction("admin-user");
    const admin = await actionRole(["admin"]);

    const parsed = parseInput(adminUserUpdateSchema, input);
    if (!parsed.success) throw new AppError(parsed.message, 400, parsed.fields);

    await adminUpdateUser(parsed.data.userId, parsed.data.action, parsed.data.reason, admin);
    revalidatePath("/dashboard/users");
    revalidatePath("/dashboard/verification");
    return null;
  });
}
