"use server";

/* ---------------------------------------------------------------------------
 * Listing actions — create/edit/delete listings, moderation, availability.
 * Ownership and role checks run server-side inside every mutation.
 * ------------------------------------------------------------------------ */

import { revalidatePath } from "next/cache";
import { actionRole, limitAction, runAction } from "@/actions/helpers";
import { parseInput } from "@/lib/validation";
import { moderationSchema, propertyInputSchema } from "@/lib/validation/property";
import { listingStatusSchema } from "@/lib/validation/interaction";
import {
  createProperty,
  deleteProperty,
  moderateProperty,
  setListingAvailability,
  updateProperty,
} from "@/lib/services/property.service";
import { AppError } from "@/lib/errors";
import type { ActionResult, PropertySummary } from "@/types";

function fieldError(parsed: { message: string; fields: Record<string, string[]> }): AppError {
  return new AppError(parsed.message, 400, parsed.fields);
}

export async function createListingAction(input: unknown): Promise<ActionResult<PropertySummary>> {
  return runAction(async () => {
    await limitAction("listing-create");
    const actor = await actionRole(["agent", "admin"]);

    const parsed = parseInput(propertyInputSchema, input);
    if (!parsed.success) throw fieldError(parsed);

    const property = await createProperty(parsed.data, actor);
    revalidatePath("/dashboard/listings");
    revalidatePath("/properties");
    return property;
  });
}

export async function updateListingAction(
  propertyId: string,
  input: unknown
): Promise<ActionResult<PropertySummary>> {
  return runAction(async () => {
    await limitAction("listing-update");
    const actor = await actionRole(["agent", "admin"]);

    const parsed = parseInput(propertyInputSchema, input);
    if (!parsed.success) throw fieldError(parsed);

    const property = await updateProperty(propertyId, parsed.data, actor);
    revalidatePath("/dashboard/listings");
    revalidatePath("/properties");
    revalidatePath(`/properties/${property.slug}`);
    return property;
  });
}

export async function deleteListingAction(
  propertyId: string
): Promise<ActionResult<{ archived: boolean }>> {
  return runAction(async () => {
    await limitAction("listing-delete");
    const actor = await actionRole(["agent", "admin"]);
    await deleteProperty(propertyId, actor);
    revalidatePath("/dashboard/listings");
    revalidatePath("/properties");
    return { archived: true };
  });
}

export async function moderateListingAction(
  input: unknown
): Promise<ActionResult<PropertySummary>> {
  return runAction(async () => {
    await limitAction("moderation");
    const admin = await actionRole(["admin"]);

    const parsed = parseInput(moderationSchema, input);
    if (!parsed.success) throw fieldError(parsed);

    const property = await moderateProperty(
      parsed.data.propertyId,
      parsed.data.action,
      parsed.data.reason,
      admin
    );
    revalidatePath("/dashboard/moderation");
    revalidatePath("/properties");
    revalidatePath(`/properties/${property.slug}`);
    return property;
  });
}

export async function setListingStatusAction(
  input: unknown
): Promise<ActionResult<PropertySummary>> {
  return runAction(async () => {
    await limitAction("listing-status");
    const actor = await actionRole(["agent", "admin"]);

    const parsed = parseInput(listingStatusSchema, input);
    if (!parsed.success) throw fieldError(parsed);

    const property = await setListingAvailability(
      parsed.data.propertyId,
      parsed.data.action,
      actor
    );
    revalidatePath("/dashboard/listings");
    revalidatePath("/properties");
    return property;
  });
}
