"use server";

/* ---------------------------------------------------------------------------
 * Engagement actions — favourites and comparison sets.
 * ------------------------------------------------------------------------ */

import { revalidatePath } from "next/cache";
import { actionUser, limitAction, runAction } from "@/actions/helpers";
import {
  addToComparison,
  clearComparison,
  clearRecentlyViewed,
  removeFromComparison,
  toggleFavourite,
} from "@/lib/services/engagement.service";

export async function toggleFavouriteAction(
  propertyId: string
): Promise<import("@/types").ActionResult<{ favourite: boolean; total: number }>> {
  return runAction(async () => {
    await limitAction("favourite");
    const user = await actionUser();
    const result = await toggleFavourite(user.id, propertyId);
    revalidatePath("/dashboard/saved");
    revalidatePath("/properties");
    return result;
  });
}

export async function addComparisonAction(
  propertyId: string
): Promise<import("@/types").ActionResult<{ added: boolean; count: number; message?: string }>> {
  return runAction(async () => {
    await limitAction("compare");
    const user = await actionUser();
    const result = await addToComparison(user.id, propertyId);
    revalidatePath("/dashboard/comparisons");
    return result;
  });
}

export async function removeComparisonAction(
  propertyId: string
): Promise<import("@/types").ActionResult<{ count: number }>> {
  return runAction(async () => {
    const user = await actionUser();
    const result = await removeFromComparison(user.id, propertyId);
    revalidatePath("/dashboard/comparisons");
    return result;
  });
}

export async function clearComparisonAction(): Promise<import("@/types").ActionResult<null>> {
  return runAction(async () => {
    const user = await actionUser();
    await clearComparison(user.id);
    revalidatePath("/dashboard/comparisons");
    return null;
  });
}

export async function clearRecentlyViewedAction(): Promise<import("@/types").ActionResult<null>> {
  return runAction(async () => {
    const user = await actionUser();
    await clearRecentlyViewed(user.id);
    revalidatePath("/dashboard/recent");
    return null;
  });
}
