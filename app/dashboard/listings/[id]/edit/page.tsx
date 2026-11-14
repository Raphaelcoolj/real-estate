import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/page-header";
import { ListingForm, type ListingFormValues } from "@/components/dashboard/listing-form";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { requireRole } from "@/lib/rbac";
import { getPropertyForEdit } from "@/lib/services/property.service";
import { AppError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Edit listing" };

type Raw = Record<string, unknown>;
const str = (value: unknown, fallback = "") => (typeof value === "string" ? value : fallback);
const num = (value: unknown, fallback = 0) => (typeof value === "number" ? value : fallback);
const strOrEmpty = (value: unknown) => (value == null ? "" : String(value));

function toFormValues(doc: Raw): ListingFormValues {
  const address = (doc.address as Raw) ?? {};
  const location = (doc.location as { coordinates?: [number, number] } | null) ?? null;
  const [lng, lat] = location?.coordinates ?? [undefined, undefined];
  const images = Array.isArray(doc.images) ? (doc.images as Raw[]) : [];

  return {
    title: str(doc.title),
    description: str(doc.description),
    transactionType: doc.transactionType === "rent" ? "rent" : "sale",
    propertyType: (doc.propertyType as ListingFormValues["propertyType"]) ?? "apartment",
    price: num(doc.price),
    currency: (doc.currency as ListingFormValues["currency"]) ?? "USD",
    pricePeriod: doc.pricePeriod === "per_month" ? "per_month" : "total",
    priceOnApplication: Boolean(doc.priceOnApplication),
    bedrooms: num(doc.bedrooms),
    bathrooms: num(doc.bathrooms),
    areaSqm: strOrEmpty(doc.areaSqm),
    lotSqm: strOrEmpty(doc.lotSqm),
    yearBuilt: strOrEmpty(doc.yearBuilt),
    floors: strOrEmpty(doc.floors),
    parking: strOrEmpty(doc.parking),
    furnishing: str(doc.furnishing),
    orientation: str(doc.orientation),
    heating: str(doc.heating),
    cooling: str(doc.cooling),
    tenure: str(doc.tenure),
    epc: str(doc.epc),
    addressLine: str(address.line),
    neighbourhood: str(address.neighbourhood),
    city: str(address.city),
    state: str(address.state),
    postalCode: str(address.postalCode),
    country: str(address.country),
    lat: lat != null ? String(lat) : "",
    lng: lng != null ? String(lng) : "",
    highlights: Array.isArray(doc.highlights) ? (doc.highlights as string[]) : [],
    amenities: Array.isArray(doc.amenities) ? (doc.amenities as string[]) : [],
    images: images.map((image) => ({ url: String(image.url), publicId: (image.publicId as string | null) ?? null })),
    videoUrl: str(doc.videoUrl),
    floorPlans: Array.isArray(doc.floorPlans)
      ? (doc.floorPlans as Raw[]).map((plan) => ({ url: String(plan.url), label: str(plan.label, "Floor plan") }))
      : [],
  };
}

export default async function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole(["agent", "admin"]);
  const { id } = await params;

  let doc: Raw;
  try {
    doc = (await getPropertyForEdit(id, user)) as Raw;
  } catch (error) {
    if (error instanceof AppError && error.status === 404) notFound();
    throw error;
  }

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Listings", href: "/dashboard/listings" },
          { label: "Edit" },
        ]}
      />
      <DashboardHeader
        eyebrow={`Ref ${String(doc._id).slice(-6).toUpperCase()}`}
        title="Edit listing"
        description="Changes to approved listings remain live; rejected listings return to review when resubmitted."
      />
      <ListingForm mode="edit" propertyId={id} initialValues={toFormValues(doc)} />
    </>
  );
}
