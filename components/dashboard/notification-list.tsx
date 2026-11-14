"use client";

import { markAllNotificationsReadAction, markNotificationsReadAction } from "@/actions/notification.actions";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/skeleton";
import { NOTIFICATION_TYPES } from "@/constants";
import { cn, relativeTime } from "@/lib/utils";
import type { NotificationDTO } from "@/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function NotificationList({ items, unreadCount }: { items: NotificationDTO[]; unreadCount: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  const markAll = () => {
    startTransition(async () => {
      await markAllNotificationsReadAction();
      setReadIds(new Set(items.map((i) => i.id)));
      router.refresh();
    });
  };

  const open = (item: NotificationDTO) => {
    if (!item.read) {
      setReadIds((prev) => new Set(prev).add(item.id));
      void markNotificationsReadAction([item.id]);
    }
  };

  if (!items.length) {
    return (
      <EmptyState
        title="You're all caught up"
        description="Enquiries, listing updates and viewing confirmations will appear here."
      />
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-stone-500">
          {unreadCount > 0 ? `${unreadCount} unread` : "All read"}
        </p>
        <Button variant="ghost" size="sm" onClick={markAll} loading={pending} disabled={unreadCount === 0}>
          Mark all as read
        </Button>
      </div>

      <ul className="divide-y divide-ivory-200 overflow-hidden rounded-xl border border-ivory-200 bg-white">
        {items.map((item) => {
          const unread = !item.read && !readIds.has(item.id);
          return (
            <li key={item.id}>
              <Link
                href={item.href || "/dashboard"}
                onClick={() => open(item)}
                className={cn(
                  "flex gap-4 px-5 py-4 transition-colors hover:bg-ivory-50",
                  unread && "bg-brass-300/10"
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "mt-1.5 size-2 shrink-0 rounded-full",
                    unread ? "bg-brass-500" : "bg-ivory-300"
                  )}
                />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-4">
                    <span className={cn("text-sm", unread ? "font-semibold text-charcoal-900" : "font-medium text-charcoal-800")}>
                      {item.title}
                    </span>
                    <span className="shrink-0 text-[0.6875rem] text-stone-400">{relativeTime(item.createdAt)}</span>
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-stone-500">{item.body}</span>
                  <span className="mt-1.5 block text-[0.625rem] font-medium tracking-[0.12em] text-stone-400 uppercase">
                    {NOTIFICATION_TYPES[item.type] ?? item.type}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
