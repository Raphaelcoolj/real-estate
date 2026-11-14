/* ---------------------------------------------------------------------------
 * Analytics service — platform and per-agent dashboards (aggregate queries).
 * ------------------------------------------------------------------------ */

import "server-only";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Property } from "@/models/Property";
import { Enquiry } from "@/models/Enquiry";
import { Inspection } from "@/models/Inspection";
import { Report } from "@/models/Report";
import { Favourite } from "@/models/Favourite";
import { Notification } from "@/models/Notification";
import { RecentlyViewed } from "@/models/RecentlyViewed";
import { PUBLIC_PROPERTY_STATUSES } from "@/constants";
import type { AdminOverview, AgentOverview, CustomerOverview, SessionUser } from "@/types";
import { getUpcomingInspections } from "@/lib/services/inspection.service";

type MonthRow = { _id: { y: number; m: number }; count: number };

function toMonthRows(rows: MonthRow[], months = 6): { month: string; count: number }[] {
  const now = new Date();
  const result: { month: string; count: number }[] = [];
  const lookup = new Map(
    rows.map((r) => [`${r._id.y}-${r._id.m}`, r.count] as [string, number])
  );

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
    result.push({
      month: d.toLocaleDateString("en-GB", { month: "short" }),
      count: lookup.get(key) ?? 0,
    });
  }
  return result;
}

export async function getAdminOverview(): Promise<AdminOverview> {
  await connectDB();

  const [
    users,
    agents,
    properties,
    pendingListings,
    enquiries,
    inspections,
    reports,
    listingStatus,
    signups,
    listings,
    topDistricts,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: "agent" }),
    Property.countDocuments(),
    Property.countDocuments({ status: "pending" }),
    Enquiry.countDocuments(),
    Inspection.countDocuments(),
    Report.countDocuments({ status: { $in: ["open", "reviewing"] } }),
    Property.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    User.aggregate([
      {
        $group: {
          _id: { y: { $year: "$createdAt" }, m: { $month: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.y": 1, "_id.m": 1 } },
      { $limit: 12 },
    ]),
    Property.aggregate([
      {
        $group: {
          _id: { y: { $year: "$createdAt" }, m: { $month: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.y": 1, "_id.m": 1 } },
      { $limit: 12 },
    ]),
    Property.aggregate([
      { $match: { status: { $in: PUBLIC_PROPERTY_STATUSES as unknown as string[] } } },
      { $group: { _id: "$address.neighbourhood", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 6 },
      { $match: { _id: { $ne: null } } },
    ]),
  ]);

  return {
    totals: {
      users,
      agents,
      properties,
      pendingListings,
      enquiries,
      inspections,
      reports,
    },
    listingStatus: listingStatus.map((r) => ({ status: String(r._id), count: r.count })),
    signupsByMonth: toMonthRows(signups),
    listingsByMonth: toMonthRows(listings),
    topDistricts: topDistricts
      .filter((r) => r._id)
      .map((r) => ({ name: String(r._id), count: r.count })),
  };
}

export async function getAgentOverview(agentId: string): Promise<AgentOverview> {
  await connectDB();
  const agentOid = new Types.ObjectId(agentId);

  const [listingStats, viewsByDayRaw, enquiriesByStatus, topListings] = await Promise.all([
    Property.aggregate([
      { $match: { agent: agentOid } },
      {
        $group: {
          _id: null,
          listings: { $sum: 1 },
          active: {
            $sum: { $cond: [{ $in: ["$status", ["approved", "sold", "rented"]] }, 1, 0] },
          },
          pending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
          views: { $sum: "$stats.views" },
          favourites: { $sum: "$stats.favourites" },
          enquiries: { $sum: "$stats.enquiries" },
        },
      },
    ]),
    Property.aggregate([
      { $match: { agent: agentOid } },
      { $project: { days: { $objectToArray: "$viewLog" } } },
      { $unwind: "$days" },
      { $group: { _id: "$days.k", count: { $sum: "$days.v" } } },
      { $sort: { _id: -1 } },
      { $limit: 7 },
    ]),
    Enquiry.aggregate([
      { $match: { agent: agentOid } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Property.find({ agent: agentOid })
      .sort({ "stats.views": -1 })
      .limit(5)
      .select("title slug images status price currency stats.views stats.enquiries")
      .lean(),
  ]);

  const stats = listingStats[0] ?? {
    listings: 0,
    active: 0,
    pending: 0,
    views: 0,
    favourites: 0,
    enquiries: 0,
  };

  // Weekly views from the total counter when a view log is unavailable.
  const weekDays: { day: string; count: number }[] = [];
  const today = new Date();
  const logged = new Map(viewsByDayRaw.map((r) => [String(r._id).slice(0, 10), r.count as number]));
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 86_400_000);
    const key = d.toISOString().slice(0, 10);
    weekDays.push({
      day: d.toLocaleDateString("en-GB", { weekday: "short" }),
      count: logged.get(key) ?? 0,
    });
  }

  const statusOrder = ["new", "read", "replied", "closed"];
  const statusMap = new Map(enquiriesByStatus.map((r) => [String(r._id), r.count as number]));

  return {
    totals: {
      listings: stats.listings ?? 0,
      active: stats.active ?? 0,
      pending: stats.pending ?? 0,
      views: stats.views ?? 0,
      enquiries: stats.enquiries ?? 0,
      inspections: await Inspection.countDocuments({ agent: agentOid }),
      favourites: stats.favourites ?? 0,
    },
    viewsByDay: weekDays,
    enquiriesByStatus: statusOrder.map((status) => ({
      status,
      count: statusMap.get(status) ?? 0,
    })),
    topListings: (topListings as unknown as Record<string, unknown>[]).map((p) => {
      const stats = (p.stats as Record<string, number>) ?? {};
      const images = Array.isArray(p.images) ? p.images : [];
      const cover =
        images.length > 0 && typeof images[0] === "object"
          ? String((images[0] as Record<string, unknown>).url ?? "")
          : "";
      return {
        id: String(p._id),
        title: String(p.title),
        slug: String(p.slug),
        coverImage: cover || "/images/placeholder-property.svg",
        views: stats.views ?? 0,
        enquiries: stats.enquiries ?? 0,
        status: String(p.status) as AgentOverview["topListings"][number]["status"],
        price: Number(p.price ?? 0),
        currency: String(p.currency ?? "USD") as AgentOverview["topListings"][number]["currency"],
      };
    }),
  };
}

export async function getCustomerOverview(user: SessionUser): Promise<CustomerOverview> {
  await connectDB();
  const uid = new Types.ObjectId(user.id);
  const isCustomer = user.role === "customer";

  const [saved, comparison, enquiries, inspections, recent, unread, upcoming] =
    await Promise.all([
      Favourite.countDocuments({ user: uid }),
      (async () => {
        const { Comparison } = await import("@/models/Comparison");
        const doc = await Comparison.findOne({ user: uid }).select("properties").lean();
        return doc?.properties?.length ?? 0;
      })(),
      Enquiry.countDocuments(
        isCustomer ? { customer: uid } : { agent: uid }
      ),
      Inspection.countDocuments(
        isCustomer ? { customer: uid } : { agent: uid }
      ),
      RecentlyViewed.countDocuments({ user: uid }),
      Notification.countDocuments({ user: uid, read: false }),
      getUpcomingInspections(user.id, isCustomer ? "customer" : "agent", 4),
    ]);

  return {
    saved,
    comparisons: comparison,
    enquiries,
    inspections,
    recentViewed: recent,
    unreadNotifications: unread,
    upcomingInspections: upcoming,
  };
}
