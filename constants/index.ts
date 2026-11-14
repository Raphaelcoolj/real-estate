/* ---------------------------------------------------------------------------
 * Domain constants — property taxonomy, amenities, sorting, statuses.
 * Every value here is the single source of truth for both the UI and the
 * zod validation schemas (see lib/validation).
 * ------------------------------------------------------------------------ */

export const TRANSACTION_TYPES = [
  { value: "sale", label: "For Sale", cta: "Buy" },
  { value: "rent", label: "For Rent", cta: "Rent" },
] as const;

export type TransactionType = (typeof TRANSACTION_TYPES)[number]["value"];

export const PROPERTY_TYPES = [
  { value: "apartment", label: "Apartment", plural: "Apartments" },
  { value: "villa", label: "Villa", plural: "Villas" },
  { value: "house", label: "House", plural: "Houses" },
  { value: "penthouse", label: "Penthouse", plural: "Penthouses" },
  { value: "townhouse", label: "Townhouse", plural: "Townhouses" },
  { value: "duplex", label: "Duplex", plural: "Duplexes" },
  { value: "land", label: "Land", plural: "Land" },
  { value: "commercial", label: "Commercial", plural: "Commercial" },
  { value: "chalet", label: "Chalet", plural: "Chalets" },
] as const;

export type PropertyType = (typeof PROPERTY_TYPES)[number]["value"];

export const FURNISHING_OPTIONS = [
  { value: "furnished", label: "Furnished" },
  { value: "semi_furnished", label: "Semi-furnished" },
  { value: "unfurnished", label: "Unfurnished" },
] as const;

export type Furnishing = (typeof FURNISHING_OPTIONS)[number]["value"];

export const PROPERTY_STATUSES = [
  { value: "draft", label: "Draft", tone: "neutral" },
  { value: "pending", label: "Pending review", tone: "warning" },
  { value: "approved", label: "Approved", tone: "success" },
  { value: "rejected", label: "Rejected", tone: "danger" },
  { value: "sold", label: "Sold", tone: "neutral" },
  { value: "rented", label: "Rented", tone: "neutral" },
  { value: "archived", label: "Archived", tone: "neutral" },
] as const;

export type PropertyStatus = (typeof PROPERTY_STATUSES)[number]["value"];

/** Statuses that appear in the public marketplace. */
export const PUBLIC_PROPERTY_STATUSES: readonly PropertyStatus[] = [
  "approved",
  "sold",
  "rented",
];

export const AVAILABILITY_FILTERS = [
  { value: "all", label: "Any availability" },
  { value: "available", label: "Available" },
  { value: "under_offer", label: "Sold / Rented" },
] as const;

/** Curated amenity taxonomy — grouped for filters and detail presentation. */
export const AMENITY_GROUPS = [
  {
    group: "Comfort",
    items: [
      "Air conditioning",
      "Central heating",
      "Underfloor heating",
      "Double glazing",
      "Smart home",
      "Backup power",
      "Elevator",
    ],
  },
  {
    group: "Outdoor",
    items: [
      "Swimming pool",
      "Private garden",
      "Terrace",
      "Balcony",
      "Rooftop deck",
      "BBQ area",
      "Private beach access",
      "Tennis court",
    ],
  },
  {
    group: "Wellness & leisure",
    items: [
      "Gym",
      "Spa",
      "Sauna",
      "Cinema room",
      "Wine cellar",
      "Game room",
      "Library",
    ],
  },
  {
    group: "Services & security",
    items: [
      "24/7 security",
      "Concierge",
      "Doorman",
      "CCTV",
      "Gated community",
      "Housekeeping",
      "Valet parking",
    ],
  },
  {
    group: "Parking & storage",
    items: ["Garage", "Covered parking", "Guest parking", "Storage room", "Boat slip"],
  },
  {
    group: "Connectivity",
    items: ["Fibre internet", "Pre-wired for fibre", "Satellite TV"],
  },
] as const;

export const ALL_AMENITIES: string[] = AMENITY_GROUPS.flatMap((g) => [...g.items]);

/** Highlight/spec keys shown as a spec sheet on the detail page. */
export const SPEC_LABELS: Record<string, string> = {
  areaSqm: "Internal area",
  lotSqm: "Plot size",
  yearBuilt: "Year built",
  floors: "Floors",
  parking: "Parking spaces",
  furnishing: "Furnishing",
  orientation: "Orientation",
  heating: "Heating",
  cooling: "Cooling",
  tenure: "Tenure",
  epc: "Energy rating",
};

export const SORT_OPTIONS = [
  { value: "relevance", label: "Featured first" },
  { value: "newest", label: "Newest listed" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "area_desc", label: "Largest area" },
] as const;

export type SortOption = (typeof SORT_OPTIONS)[number]["value"];

export const CURRENCIES = {
  USD: { symbol: "$", code: "USD" },
  EUR: { symbol: "€", code: "EUR" },
  GBP: { symbol: "£", code: "GBP" },
  AED: { symbol: "AED", code: "AED" },
  NGN: { symbol: "₦", code: "NGN" },
} as const;

export type CurrencyCode = keyof typeof CURRENCIES;

export const CURRENCY_OPTIONS = Object.values(CURRENCIES).map((c) => ({
  value: c.code,
  label: `${c.code} (${c.symbol})`,
}));

export const PRICE_PRESETS: Record<TransactionType, { min: number; max: number; step: number }> = {
  sale: { min: 0, max: 25_000_000, step: 250_000 },
  rent: { min: 0, max: 250_000, step: 1_000 },
};

export const BEDROOM_OPTIONS = [
  { value: "", label: "Any beds" },
  { value: "1", label: "1+" },
  { value: "2", label: "2+" },
  { value: "3", label: "3+" },
  { value: "4", label: "4+" },
  { value: "5", label: "5+" },
  { value: "6", label: "6+" },
];

export const BATHROOM_OPTIONS = [
  { value: "", label: "Any baths" },
  { value: "1", label: "1+" },
  { value: "2", label: "2+" },
  { value: "3", label: "3+" },
  { value: "4", label: "4+" },
  { value: "5", label: "5+" },
];

export const ROLES = [
  { value: "customer", label: "Buyer / Renter", description: "Discover, save and enquire" },
  { value: "agent", label: "Agent / Agency", description: "Publish and manage listings" },
  { value: "admin", label: "Administrator", description: "Moderate the marketplace" },
] as const;

export type Role = (typeof ROLES)[number]["value"];

export const ENQUIRY_STATUSES = [
  { value: "new", label: "New", tone: "warning" },
  { value: "read", label: "Read", tone: "neutral" },
  { value: "replied", label: "Replied", tone: "success" },
  { value: "closed", label: "Closed", tone: "neutral" },
] as const;

export type EnquiryStatus = (typeof ENQUIRY_STATUSES)[number]["value"];

export const INSPECTION_STATUSES = [
  { value: "requested", label: "Requested", tone: "warning" },
  { value: "confirmed", label: "Confirmed", tone: "success" },
  { value: "declined", label: "Declined", tone: "danger" },
  { value: "rescheduled", label: "Rescheduled", tone: "warning" },
  { value: "completed", label: "Completed", tone: "neutral" },
  { value: "cancelled", label: "Cancelled", tone: "neutral" },
] as const;

export type InspectionStatus = (typeof INSPECTION_STATUSES)[number]["value"];

export const INSPECTION_SLOTS = [
  "09:00 – 10:00",
  "10:00 – 11:00",
  "11:00 – 12:00",
  "12:00 – 13:00",
  "14:00 – 15:00",
  "15:00 – 16:00",
  "16:00 – 17:00",
];

export const REPORT_REASONS = [
  { value: "misleading", label: "Misleading information" },
  { value: "scam", label: "Suspected scam or fraud" },
  { value: "duplicate", label: "Duplicate listing" },
  { value: "offensive", label: "Offensive or inappropriate content" },
  { value: "unavailable", label: "Property no longer available" },
  { value: "other", label: "Something else" },
] as const;

export const VERIFICATION_STATUSES = [
  { value: "unverified", label: "Unverified", tone: "neutral" },
  { value: "pending", label: "Pending review", tone: "warning" },
  { value: "verified", label: "Verified", tone: "success" },
  { value: "rejected", label: "Rejected", tone: "danger" },
] as const;

export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number]["value"];

export const USER_STATUSES = [
  { value: "active", label: "Active", tone: "success" },
  { value: "suspended", label: "Suspended", tone: "danger" },
] as const;

export type UserStatus = (typeof USER_STATUSES)[number]["value"];

export const NOTIFICATION_TYPES = {
  enquiry: "New enquiry",
  enquiry_reply: "Enquiry replied",
  inspection: "Inspection request",
  inspection_update: "Inspection updated",
  listing_approved: "Listing approved",
  listing_rejected: "Listing requires changes",
  listing_sold: "Listing marked as sold",
  verification: "Verification update",
  system: "Platform notice",
} as const;

export type NotificationType = keyof typeof NOTIFICATION_TYPES;

export const PAGE_SIZE = 12;
export const MAP_PAGE_SIZE = 60;
export const MAX_COMPARE = 4;
export const MAX_IMAGES_PER_LISTING = 12;
export const MAX_FLOOR_PLANS = 6;
export const RECENTLY_VIEWED_LIMIT = 20;

export const COMPARISON_KEYS = [
  "Price",
  "Property type",
  "Bedrooms",
  "Bathrooms",
  "Internal area",
  "Plot size",
  "Year built",
  "Parking",
  "Furnishing",
  "Amenities",
  "Location",
  "Status",
] as const;
