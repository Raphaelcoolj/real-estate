"use server";

/* ---------------------------------------------------------------------------
 * Authentication actions — registration, sign-in/out, profile management.
 * ------------------------------------------------------------------------ */

import { revalidatePath } from "next/cache";
import {
  actionUser,
  limitAction,
  runAction,
} from "@/actions/helpers";
import { createSession, destroySession } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { parseInput } from "@/lib/validation";
import {
  changePasswordSchema,
  signInSchema,
  signUpSchema,
  updateProfileSchema,
} from "@/lib/validation/auth";
import {
  authenticate,
  changePassword,
  registerUser,
  requestVerification,
  updateProfile,
} from "@/lib/services/user.service";
import type { ActionResult, SessionUser } from "@/types";

export async function signUpAction(
  _prev: ActionResult<{ next: string }> | null,
  formData: FormData
): Promise<ActionResult<{ next: string }>> {
  return runAction(async () => {
    await limitAction("signup");

    const parsed = parseInput(signUpSchema, {
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
      role: formData.get("role") || "customer",
      agencyName: formData.get("agencyName") || "",
      phone: formData.get("phone") || "",
      terms: formData.get("terms") ? true : false,
    });
    if (!parsed.success) throw fieldError(parsed);

    await registerUser(parsed.data);
    const session = await authenticate(parsed.data.email, parsed.data.password);
    await createSession(session);

    revalidatePath("/", "layout");
    return { next: parsed.data.role === "agent" ? "/dashboard/listings/new" : "/dashboard" };
  });
}

export async function signInAction(
  _prev: ActionResult<{ next: string }> | null,
  formData: FormData
): Promise<ActionResult<{ next: string }>> {
  return runAction(async () => {
    await limitAction("signin");

    const parsed = parseInput(signInSchema, {
      email: formData.get("email"),
      password: formData.get("password"),
    });
    if (!parsed.success) throw fieldError(parsed);

    const user = await authenticate(parsed.data.email, parsed.data.password);
    await createSession(user);

    revalidatePath("/", "layout");
    return { next: "/dashboard" };
  });
}

export async function signOutAction(): Promise<ActionResult<{ ok: true }>> {
  return runAction(async () => {
    await destroySession();
    revalidatePath("/", "layout");
    return { ok: true as const };
  });
}

export async function updateProfileAction(
  _prev: ActionResult<SessionUser> | null,
  formData: FormData
): Promise<ActionResult<SessionUser>> {
  return runAction(async () => {
    await limitAction("profile");
    const user = await actionUser();

    const specializations = formData.getAll("specializations").map(String).filter(Boolean);
    const languages = formData.getAll("languages").map(String).filter(Boolean);
    const serviceAreas = formData.getAll("serviceAreas").map(String).filter(Boolean);
    const yearsRaw = formData.get("yearsExperience");

    const parsed = parseInput(updateProfileSchema, {
      name: formData.get("name"),
      phone: formData.get("phone") || "",
      bio: formData.get("bio") || "",
      website: formData.get("website") || "",
      avatarUrl: formData.get("avatarUrl") || "",
      licenseNumber: formData.get("licenseNumber") || "",
      specializations,
      languages,
      serviceAreas,
      yearsExperience:
        yearsRaw === null || yearsRaw === "" ? null : Number(yearsRaw),
      agencyName: formData.get("agencyName") || "",
    });
    if (!parsed.success) throw fieldError(parsed);

    const updated = await updateProfile(user.id, parsed.data, user);
    revalidatePath("/dashboard", "layout");
    return updated;
  });
}

export async function changePasswordAction(
  _prev: ActionResult<null> | null,
  formData: FormData
): Promise<ActionResult<null>> {
  return runAction(async () => {
    await limitAction("password");
    const user = await actionUser();

    const parsed = parseInput(changePasswordSchema, {
      currentPassword: formData.get("currentPassword"),
      newPassword: formData.get("newPassword"),
      confirmPassword: formData.get("confirmPassword"),
    });
    if (!parsed.success) throw fieldError(parsed);

    await changePassword(user.id, parsed.data.currentPassword, parsed.data.newPassword);
    return null;
  });
}

export async function requestVerificationAction(): Promise<ActionResult<null>> {
  return runAction(async () => {
    await limitAction("verification");
    const user = await actionUser();
    await requestVerification(user.id);
    revalidatePath("/dashboard/settings");
    return null;
  });
}

/** Surface zod field errors through the AppError channel. */
function fieldError(parsed: { message: string; fields: Record<string, string[]> }): AppError {
  return new AppError(parsed.message, 400, parsed.fields);
}
