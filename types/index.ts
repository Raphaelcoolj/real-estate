/* ---------------------------------------------------------------------------
 * Shared application types (DTOs crossing the server ↔ client boundary).
 * Services return these shapes; pages/actions never expose raw documents.
 * ------------------------------------------------------------------------ */

import type {
  CurrencyCode,
  EnquiryStatus,
  InspectionStatus,
  NotificationType,
  PropertyStatus,
  PropertyType,
  Role,
  Furnishing,
  UserStatus,
  VerificationStatus,
} from "@/constants";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string | null;
  phone?: string | null;
  status: UserStatus;
  verificationStatus: VerificationStatus;
  agencyId?: string | null;
  agencyName?: string | null;
  profileComplete: boolean;
  bio?: string | null;
  createdAt: string;
};

export type PublicAgent = {
  id: string;
  name: string;
  slug: string;
  role: "agent" | "admin";
  avatarUrl?: string | null;
  bio?: string | null;
  phone?: string | null;
  email?: string;
  verificationStatus: VerificationStatus;
  agency?: {
    id: string;
    name: string;
    slug: string;
    logoUrl?: string | null;
    country?: string | null;
  } | null;
  specializations?: string[];
  languages?: string[];
  yearsExperience?: number | null;
  licenseNumber?: string | null;
  listingCount?: number;
  createdAt: string;
};

export type AgencySummary = {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  description?: string | null;
  country?: string | null;
  city?: string | null;
  website?: string | null;
  email?: string | null;
  phone?: string | null;
  verified: boolean;
  agentCount: number;
  listingCount: number;
  coverImage?: string | null;
};

export type PropertyStats = {
  views: number;
  favourites: number;
  enquiries: number;
};

export type PropertySummary = {
  id: string;
  slug: string;
  title: string;
  transactionType: "sale" | "rent";
  propertyType: PropertyType;
  status: PropertyStatus;
  featured: boolean;
  price: number;
  currency: CurrencyCode;
  pricePeriod: "total" | "per_month";
  bedrooms: number;
  bathrooms: number;
  areaSqm?: number | null;
  lotSqm?: number | null;
  city: string;
  country: string;
  neighbourhood?: string | null;
  addressLine: string;
  coverImage: string;
  images: string[];
  publishedAt?: string | null;
  createdAt: string;
  agent: {
    id: string;
    name: string;
    slug: string;
    avatarUrl?: string | null;
    verificationStatus: VerificationStatus;
  };
  agency?: {
    id: string;
    name: string;
    slug: string;
    logoUrl?: string | null;
  } | null;
  location?: { lat: number; lng: number } | null;
  stats: PropertyStats;
};

export type PropertySpecs = {
  areaSqm?: number | null;
  lotSqm?: number | null;
  yearBuilt?: number | null;
  floors?: number | null;
  parking?: number | null;
  furnishing?: Furnishing | null;
  orientation?: string | null;
  heating?: string | null;
  cooling?: string | null;
  tenure?: string | null;
  epc?: string | null;
};

export type FloorPlan = { url: string; label: string };

export type PropertyDetail = PropertySummary & {
  description: string;
  highlights: string[];
  amenities: string[];
  specs: PropertySpecs;
  videoUrl?: string | null;
  floorPlans: FloorPlan[];
  address: {
    line: string;
    neighbourhood?: string | null;
    city: string;
    state?: string | null;
    postalCode?: string | null;
    country: string;
  };
  approvedAt?: string | null;
  agent: PublicAgent & { email?: string };
  similar: PropertySummary[];
};

/* ------------------------------- Search --------------------------------- */

export type PropertySearchFilters = {
  q?: string;
  transaction?: "sale" | "rent";
  propertyType?: string[];
  city?: string;
  district?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  amenities?: string[];
  availability?: "all" | "available" | "under_offer";
  sort?: string;
  page?: number;
  view?: "grid" | "map";
};

export type Paginated<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
};

/* ---------------------------- Interactions ------------------------------ */

export type EnquiryDTO = {
  id: string;
  property: { id: string; title: string; slug: string; coverImage: string; price: number; currency: CurrencyCode } | null;
  customer: { id: string; name: string; email: string; avatarUrl?: string | null } | null;
  agent: { id: string; name: string; slug: string } | null;
  message: string;
  phone?: string | null;
  status: EnquiryStatus;
  createdAt: string;
  reply?: string | null;
  repliedAt?: string | null;
};

export type InspectionDTO = {
  id: string;
  property: { id: string; title: string; slug: string; coverImage: string; addressLine: string; city: string } | null;
  customer: { id: string; name: string; email: string } | null;
  agent: { id: string; name: string; slug: string } | null;
  preferredDate: string;
  alternativeDate?: string | null;
  slot: string;
  message?: string | null;
  status: InspectionStatus;
  createdAt: string;
  scheduledAt?: string | null;
  responseNote?: string | null;
};

export type NotificationDTO = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  href?: string | null;
  read: boolean;
  createdAt: string;
};

export type FavouriteDTO = {
  id: string;
  property: PropertySummary;
  createdAt: string;
};

export type ComparisonDTO = {
  id: string;
  properties: PropertySummary[];
};

export type RecentlyViewedDTO = {
  property: PropertySummary;
  viewedAt: string;
};

export type ReportDTO = {
  id: string;
  targetType: "property" | "user" | "agency";
  targetId: string;
  targetLabel: string;
  reason: string;
  details?: string | null;
  status: "open" | "reviewing" | "resolved" | "dismissed";
  reporter: { id: string; name: string; email: string } | null;
  resolution?: string | null;
  createdAt: string;
};

/* ------------------------------ Actions --------------------------------- */

export type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string; fields?: Record<string, string[]> };

/* ------------------------------ Analytics ------------------------------- */

export type AdminOverview = {
  totals: {
    users: number;
    agents: number;
    properties: number;
    pendingListings: number;
    enquiries: number;
    inspections: number;
    reports: number;
  };
  listingStatus: { status: string; count: number }[];
  signupsByMonth: { month: string; count: number }[];
  listingsByMonth: { month: string; count: number }[];
  topDistricts: { name: string; count: number }[];
};

export type AgentOverview = {
  totals: {
    listings: number;
    active: number;
    pending: number;
    views: number;
    enquiries: number;
    inspections: number;
    favourites: number;
  };
  viewsByDay: { day: string; count: number }[];
  enquiriesByStatus: { status: string; count: number }[];
  topListings: {
    id: string;
    title: string;
    slug: string;
    coverImage: string;
    views: number;
    enquiries: number;
    status: PropertyStatus;
    price: number;
    currency: CurrencyCode;
  }[];
};

export type CustomerOverview = {
  saved: number;
  comparisons: number;
  enquiries: number;
  inspections: number;
  recentViewed: number;
  unreadNotifications: number;
  upcomingInspections: InspectionDTO[];
};
