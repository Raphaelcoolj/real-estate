/* ---------------------------------------------------------------------------
 * Engagement service — favourites, comparison sets, recently viewed.
 * ------------------------------------------------------------------------ */

import "server-only";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { Favourite } from "@/models/Favourite";
import { Comparison } from "@/models/Comparison";
import { RecentlyViewed } from "@/models/RecentlyViewed";
import { Property } from "@/models/Property";
import { AppError, NotFoundError } from "@/lib/errors";
import {
  serializeComparison,
  serializeFavourite,
  serializeRecentlyViewed,
} from "@/lib/mappers";
import { MAX_COMPARE, RECENTLY_VIEWED_LIMIT } from "@/constants";
import type { ComparisonDTO, FavouriteDTO, RecentlyViewedDTO } from "@/types";

/* ------------------------------ Favourites ------------------------------- */

export async function isFavourite(userId: string, propertyId: string): Promise<boolean> {
  if (!Types.ObjectId.isValid(propertyId)) return false;
  await connectDB();
  return Boolean(
    await Favourite.exists({
      user: new Types.ObjectId(userId),
      property: new Types.ObjectId(propertyId),
    })
  );
}

export async function getFavouriteIds(userId: string, propertyIds: string[]): Promise<string[]> {
  const valid = propertyIds.filter((id) => Types.ObjectId.isValid(id));
  if (!valid.length) return [];
  await connectDB();
  const rows = await Favourite.find({
    user: new Types.ObjectId(userId),
    property: { $in: valid.map((id) => new Types.ObjectId(id)) },
  })
    .select("property")
    .lean();
  return rows.map((r) => String(r.property));
}

export async function toggleFavourite(
  userId: string,
  propertyId: string
): Promise<{ favourite: boolean; total: number }> {
  if (!Types.ObjectId.isValid(propertyId)) throw new NotFoundError("Property not found.");
  await connectDB();

  const property = await Property.exists({ _id: new Types.ObjectId(propertyId) });
  if (!property) throw new NotFoundError("Property not found.");

  const existing = await Favourite.findOneAndDelete({
    user: new Types.ObjectId(userId),
    property: new Types.ObjectId(propertyId),
  });

  if (existing) {
    await Property.updateOne(
      { _id: propertyId, "stats.favourites": { $gt: 0 } },
      { $inc: { "stats.favourites": -1 } }
    );
    const total = await Favourite.countDocuments({ property: new Types.ObjectId(propertyId) });
    return { favourite: false, total };
  }

  await Favourite.create({
    user: new Types.ObjectId(userId),
    property: new Types.ObjectId(propertyId),
  }).catch(() => null);

  await Property.updateOne(
    { _id: propertyId },
    { $inc: { "stats.favourites": 1 } }
  );
  const total = await Favourite.countDocuments({ property: new Types.ObjectId(propertyId) });
  return { favourite: true, total };
}

export async function listFavourites(
  userId: string,
  page = 1
): Promise<{ items: FavouriteDTO[]; total: number; page: number; totalPages: number }> {
  await connectDB();
  const pageSize = 12;
  const query = { user: new Types.ObjectId(userId) };
  const total = await Favourite.countDocuments(query);
  const docs = await Favourite.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .populate({
      path: "property",
      populate: [
        { path: "agent", select: "name slug avatarUrl verificationStatus" },
        { path: "agency", select: "name slug logoUrl" },
      ],
    })
    .lean();

  const items = (docs as unknown as Record<string, unknown>[])
    .filter((d) => d.property && (d.property as Record<string, unknown>).slug)
    .map(serializeFavourite);

  return {
    items,
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

/* ------------------------------ Comparisons ------------------------------ */

export async function getComparison(userId: string): Promise<ComparisonDTO> {
  await connectDB();
  const doc = await Comparison.findOne({ user: new Types.ObjectId(userId) })
    .populate({
      path: "properties",
      populate: [
        { path: "agent", select: "name slug avatarUrl verificationStatus" },
        { path: "agency", select: "name slug logoUrl" },
      ],
    })
    .lean();

  if (!doc) return { id: "", properties: [] };
  return serializeComparison(doc as unknown as Record<string, unknown>);
}

export async function addToComparison(
  userId: string,
  propertyId: string
): Promise<{ added: boolean; count: number; message?: string }> {
  if (!Types.ObjectId.isValid(propertyId)) throw new NotFoundError("Property not found.");
  await connectDB();

  const property = await Property.exists({ _id: new Types.ObjectId(propertyId) });
  if (!property) throw new NotFoundError("Property not found.");

  const existing = await Comparison.findOne({ user: new Types.ObjectId(userId) });
  if (!existing) {
    await Comparison.create({
      user: new Types.ObjectId(userId),
      properties: [new Types.ObjectId(propertyId)],
    });
    return { added: true, count: 1 };
  }

  const current = existing.properties.map((p) => String(p));
  if (current.includes(propertyId)) {
    return { added: false, count: current.length, message: "Already in your comparison." };
  }
  if (current.length >= MAX_COMPARE) {
    throw new AppError(`You can compare up to ${MAX_COMPARE} properties at once.`);
  }

  existing.properties.push(new Types.ObjectId(propertyId));
  await existing.save();
  return { added: true, count: existing.properties.length };
}

export async function removeFromComparison(
  userId: string,
  propertyId: string
): Promise<{ count: number }> {
  await connectDB();
  const existing = await Comparison.findOne({ user: new Types.ObjectId(userId) });
  if (!existing) return { count: 0 };
  existing.properties = existing.properties.filter((p) => String(p) !== propertyId);
  await existing.save();
  return { count: existing.properties.length };
}

export async function clearComparison(userId: string): Promise<void> {
  await connectDB();
  await Comparison.deleteOne({ user: new Types.ObjectId(userId) });
}

/** Compare view needs plain summaries in the original order. */
export async function getComparisonProperties(userId: string) {
  const dto = await getComparison(userId);
  return dto.properties;
}

/* ---------------------------- Recently viewed ---------------------------- */

export async function recordRecentlyViewed(userId: string, propertyId: string): Promise<void> {
  if (!Types.ObjectId.isValid(propertyId)) return;
  try {
    await connectDB();
    await RecentlyViewed.findOneAndUpdate(
      { user: new Types.ObjectId(userId), property: new Types.ObjectId(propertyId) },
      { $set: { viewedAt: new Date() } },
      { upsert: true }
    );

    // Keep the history bounded per user.
    const count = await RecentlyViewed.countDocuments({ user: new Types.ObjectId(userId) });
    if (count > RECENTLY_VIEWED_LIMIT) {
      const excess = await RecentlyViewed.find({ user: new Types.ObjectId(userId) })
        .sort({ viewedAt: 1 })
        .limit(count - RECENTLY_VIEWED_LIMIT)
        .select("_id")
        .lean();
      if (excess.length) {
        await RecentlyViewed.deleteMany({ _id: { $in: excess.map((e) => e._id) } });
      }
    }
  } catch {
    /* non-critical */
  }
}

export async function listRecentlyViewed(
  userId: string,
  limit = 20
): Promise<RecentlyViewedDTO[]> {
  await connectDB();
  const docs = await RecentlyViewed.find({ user: new Types.ObjectId(userId) })
    .sort({ viewedAt: -1 })
    .limit(limit)
    .populate({
      path: "property",
      populate: [
        { path: "agent", select: "name slug avatarUrl verificationStatus" },
        { path: "agency", select: "name slug logoUrl" },
      ],
    })
    .lean();

  return (docs as unknown as Record<string, unknown>[])
    .filter((d) => d.property && (d.property as Record<string, unknown>).slug)
    .map(serializeRecentlyViewed);
}

export async function clearRecentlyViewed(userId: string): Promise<void> {
  await connectDB();
  await RecentlyViewed.deleteMany({ user: new Types.ObjectId(userId) });
}
