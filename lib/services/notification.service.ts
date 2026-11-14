/* ---------------------------------------------------------------------------
 * Notification service — in-app notifications for every marketplace event.
 * ------------------------------------------------------------------------ */

import "server-only";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { Notification } from "@/models/Notification";
import { serializeNotification } from "@/lib/mappers";
import type { NotificationDTO, Paginated } from "@/types";
import type { NotificationType } from "@/constants";

export async function notify(input: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  href?: string;
}): Promise<void> {
  if (!Types.ObjectId.isValid(input.userId)) return;
  try {
    await connectDB();
    await Notification.create({
      user: new Types.ObjectId(input.userId),
      type: input.type,
      title: input.title.slice(0, 160),
      body: input.body.slice(0, 500),
      href: input.href ?? null,
    });
  } catch {
    /* notifications must never break the primary workflow */
  }
}

export async function getNotifications(
  userId: string,
  options: { page?: number; unreadOnly?: boolean } = {}
): Promise<Paginated<NotificationDTO> & { unreadCount: number }> {
  await connectDB();
  const page = options.page ?? 1;
  const pageSize = 20;
  const query: Record<string, unknown> = { user: new Types.ObjectId(userId) };
  if (options.unreadOnly) query.read = false;

  const [total, unreadCount, docs] = await Promise.all([
    Notification.countDocuments(query),
    Notification.countDocuments({ user: new Types.ObjectId(userId), read: false }),
    Notification.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean(),
  ]);

  return {
    items: (docs as unknown as Record<string, unknown>[]).map(serializeNotification),
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    hasMore: page * pageSize < total,
    unreadCount,
  };
}

export async function markNotificationsRead(userId: string, ids?: string[]): Promise<number> {
  await connectDB();
  const query: Record<string, unknown> = { user: new Types.ObjectId(userId), read: false };
  if (ids?.length) {
    query._id = { $in: ids.filter((i) => Types.ObjectId.isValid(i)).map((i) => new Types.ObjectId(i)) };
  }
  const result = await Notification.updateMany(query, { $set: { read: true, readAt: new Date() } });
  return result.modifiedCount;
}

export async function markAllNotificationsRead(userId: string): Promise<number> {
  return markNotificationsRead(userId);
}
