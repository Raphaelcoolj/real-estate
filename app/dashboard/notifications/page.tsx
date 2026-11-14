import { DashboardHeader } from "@/components/dashboard/page-header";
import { NotificationList } from "@/components/dashboard/notification-list";
import { Pagination } from "@/components/ui/pagination";
import { parseNumber } from "@/lib/utils";
import { requireUser } from "@/lib/rbac";
import { settle } from "@/lib/settle";
import { getNotifications } from "@/lib/services/notification.service";

export const dynamic = "force-dynamic";

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const sp = await searchParams;
  const page = Math.max(1, parseNumber(sp.page) ?? 1);

  const result = await settle(getNotifications(user.id, { page }), {
    items: [],
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 1,
    hasMore: false,
    unreadCount: 0,
  });

  return (
    <>
      <DashboardHeader eyebrow="Inbox" title="Notifications" description="Activity across your Arcadia account." />
      <NotificationList items={result.items} unreadCount={result.unreadCount} />
      <Pagination
        page={result.page}
        totalPages={result.totalPages}
        basePath="/dashboard/notifications"
        searchParams={{}}
        className="mt-10"
      />
    </>
  );
}
