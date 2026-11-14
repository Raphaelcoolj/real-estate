/* ---------------------------------------------------------------------------
 * Navigation — public marketing chrome and per-role dashboard navigation.
 * ------------------------------------------------------------------------ */

import type { Role } from "./index";

export const PUBLIC_NAV = [
  { label: "Buy", href: "/properties?transaction=sale" },
  { label: "Rent", href: "/properties?transaction=rent" },
  { label: "Discover", href: "/properties" },
  { label: "Agents", href: "/agents" },
  { label: "About", href: "/about" },
] as const;

export const FOOTER_NAV: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Marketplace",
    links: [
      { label: "Buy property", href: "/properties?transaction=sale" },
      { label: "Rent property", href: "/properties?transaction=rent" },
      { label: "New listings", href: "/properties?sort=newest" },
      { label: "Popular locations", href: "/#locations" },
    ],
  },
  {
    title: "For professionals",
    links: [
      { label: "Join as an agent", href: "/sign-up?role=agent" },
      { label: "Agent directory", href: "/agents" },
      { label: "List a property", href: "/dashboard/listings/new" },
      { label: "Platform moderation", href: "/dashboard" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Arcadia", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "Sign in", href: "/sign-in" },
      { label: "Create account", href: "/sign-up" },
    ],
  },
];

export type DashboardNavItem = {
  /** Section heading rendered above a group of links. */
  section?: string;
  label?: string;
  href?: string;
  exact?: boolean;
};

export const DASHBOARD_NAV: Record<Role | "admin", DashboardNavItem[]> = {
  customer: [
    { label: "Overview", href: "/dashboard", exact: true },
    { label: "Saved properties", href: "/dashboard/saved" },
    { label: "Comparisons", href: "/dashboard/comparisons" },
    { label: "Recently viewed", href: "/dashboard/recent" },
    { label: "Enquiries", href: "/dashboard/enquiries" },
    { label: "Inspections", href: "/dashboard/inspections" },
    { label: "Notifications", href: "/dashboard/notifications" },
    { label: "Profile settings", href: "/dashboard/settings" },
  ],
  agent: [
    { label: "Overview", href: "/dashboard", exact: true },
    { section: "Listings" },
    { label: "My listings", href: "/dashboard/listings" },
    { label: "Create listing", href: "/dashboard/listings/new" },
    { section: "Inbox" },
    { label: "Enquiries", href: "/dashboard/enquiries" },
    { label: "Inspections", href: "/dashboard/inspections" },
    { section: "Insights" },
    { label: "Analytics", href: "/dashboard/analytics" },
    { label: "Notifications", href: "/dashboard/notifications" },
    { label: "Profile", href: "/dashboard/settings" },
  ],
  admin: [
    { label: "Overview", href: "/dashboard", exact: true },
    { section: "Moderation" },
    { label: "Listings", href: "/dashboard/moderation" },
    { label: "Verifications", href: "/dashboard/verification" },
    { label: "Reports", href: "/dashboard/reports" },
    { section: "People" },
    { label: "Users", href: "/dashboard/users" },
    { section: "Platform" },
    { label: "Analytics", href: "/dashboard/analytics" },
    { label: "Notifications", href: "/dashboard/notifications" },
    { label: "Settings", href: "/dashboard/settings" },
  ],
};
