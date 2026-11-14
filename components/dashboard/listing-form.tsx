"use client";

import {
  adminCreateListingAction,
  createListingAction,
  updateListingAction,
} from "@/actions/property.actions";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Select, Textarea } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import {
  AMENITY_GROUPS,
  CURRENCY_OPTIONS,
  FURNISHING_OPTIONS,
  MAX_FLOOR_PLANS,
  MAX_IMAGES_PER_LISTING,
  PROPERTY_TYPES,
  type CurrencyCode,
  type PropertyType,
} from "@/constants";
import { emptyListingFormValues, type ListingFormValues } from "@/lib/listing-form";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

type Errors = Record<string, string[]>;

const nOrNull = (value: string) => (value.trim() === "" ? null : Number(value));
const intOrNull = (value: string) => (value.trim() === "" ? null : Math.round(Number(value)));

function Section({
  title,
  description,
  children,
  id,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  id: string;
}) {
  return (
    <section id={id} className="rounded-xl border border-ivory-200 bg-white p-6 sm:p-8">
      <h2 className="font-serif text-2xl text-charcoal-900">{title}</h2>
      {description && <p className="mt-1 text-xs text-stone-400">{description}</p>}
      <div className="mt-6 space-y-5">{children}</div>
    </section>
  );
}

function ImageUploader({
  images,
  onChange,
  error,
}: {
  images: ListingFormValues["images"];
  onChange: (next: ListingFormValues["images"]) => void;
  error?: string[];
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [url, setUrl] = useState("");
  const [progress, setProgress] = useState("");
  const { toast } = useToast();
  const remaining = MAX_IMAGES_PER_LISTING - images.length;

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    if (remaining <= 0) {
      toast(`Up to ${MAX_IMAGES_PER_LISTING} images per listing`, "error");
      return;
    }
    const chosen = Array.from(files).slice(0, remaining);
    setUploading(true);
    const next = [...images];
    for (let i = 0; i < chosen.length; i++) {
      setProgress(`Uploading ${i + 1} of ${chosen.length}…`);
      const body = new FormData();
      body.append("file", chosen[i]!);
      body.append("folder", "listings");
      try {
        const res = await fetch("/api/media/upload", { method: "POST", body });
        const json = (await res.json()) as
          | { ok: true; data: { url: string; publicId: string | null } }
          | { ok: false; error: string };
        if (!json.ok) {
          toast(json.error, "error");
          continue;
        }
        next.push({ url: json.data.url, publicId: json.data.publicId });
        onChange([...next]);
      } catch {
        toast("Upload failed — check your connection and try again.", "error");
      }
    }
    setUploading(false);
    setProgress("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const addUrl = () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    if (images.length >= MAX_IMAGES_PER_LISTING) {
      toast(`Up to ${MAX_IMAGES_PER_LISTING} images per listing`, "error");
      return;
    }
    onChange([...images, { url: trimmed, publicId: null }]);
    setUrl("");
  };

  const remove = (index: number) => onChange(images.filter((_, i) => i !== index));
  const makeCover = (index: number) => {
    if (index === 0) return;
    const next = [...images];
    const [picked] = next.splice(index, 1);
    if (picked) next.unshift(picked);
    onChange(next);
  };

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {images.map((image, index) => (
          <div key={`${image.url}-${index}`} className="group relative aspect-[4/3] overflow-hidden rounded-lg bg-ivory-200">
            <Image src={image.url} alt="" fill sizes="200px" className="object-cover" unoptimized />
            {index === 0 && (
              <span className="absolute top-2 left-2 rounded bg-charcoal-950/80 px-1.5 py-0.5 text-[0.5625rem] font-semibold tracking-wider text-ivory-50 uppercase">
                Cover
              </span>
            )}
            <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-gradient-to-t from-charcoal-950/80 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
              {index !== 0 && (
                <button
                  type="button"
                  onClick={() => makeCover(index)}
                  className="text-[0.625rem] font-medium text-ivory-50 hover:underline"
                >
                  Make cover
                </button>
              )}
              <button
                type="button"
                onClick={() => remove(index)}
                className="ml-auto text-[0.625rem] font-medium text-ivory-50 hover:underline"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
        {images.length < MAX_IMAGES_PER_LISTING && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex aspect-[4/3] flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-stone-300 text-stone-400 transition-colors hover:border-brass-500 hover:text-brass-700 disabled:opacity-60"
          >
            <span className="text-2xl leading-none">+</span>
            <span className="text-[0.6875rem] font-medium">{uploading ? progress : "Upload"}</span>
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
        multiple
        className="sr-only"
        onChange={(e) => void upload(e.target.files)}
      />

      <div className="mt-4 flex gap-2">
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="…or paste an image URL"
          aria-label="Image URL"
        />
        <Button type="button" variant="outline" onClick={addUrl} disabled={!url.trim()}>
          Add
        </Button>
      </div>
      <p className="mt-2 text-[0.6875rem] text-stone-400">
        {images.length} of {MAX_IMAGES_PER_LISTING} · first image is the cover. JPEG, PNG, WebP up to 8 MB.
      </p>
      <FieldError error={error} />
    </div>
  );
}

export type AgentChoice = { id: string; name: string; email: string };

type SaveAs = "pending" | "draft" | "approved";

export function ListingForm({
  mode,
  propertyId,
  initialValues,
  agents,
  admin = false,
}: {
  mode: "create" | "edit";
  propertyId?: string;
  initialValues?: ListingFormValues;
  /** Admin creation only: choose the active agent who owns the listing. */
  agents?: AgentChoice[];
  admin?: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [values, setValues] = useState<ListingFormValues>(initialValues ?? emptyListingFormValues());
  const [amenities, setAmenities] = useState<Set<string>>(new Set(values.amenities));
  const [highlights, setHighlights] = useState<string[]>(
    values.highlights.length ? values.highlights : [""]
  );
  const [floorPlans, setFloorPlans] = useState(values.floorPlans.length ? values.floorPlans : []);
  const [errors, setErrors] = useState<Errors>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [saveAs, setSaveAs] = useState<SaveAs>(admin ? "approved" : "pending");
  const [agentId, setAgentId] = useState(agents?.[0]?.id ?? "");

  const adminCreate = admin && mode === "create";

  const set = <K extends keyof ListingFormValues>(key: K, value: ListingFormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const toggleAmenity = (amenity: string) => {
    setAmenities((prev) => {
      const next = new Set(prev);
      if (next.has(amenity)) next.delete(amenity);
      else next.add(amenity);
      return next;
    });
  };

  const submit = (status: SaveAs) => {
    setError(null);
    setErrors({});
    setSaveAs(status);

    const payload = {
      title: values.title,
      description: values.description,
      transactionType: values.transactionType,
      propertyType: values.propertyType,
      price: values.price,
      currency: values.currency,
      pricePeriod: values.transactionType === "rent" ? "per_month" : values.pricePeriod,
      priceOnApplication: values.priceOnApplication,
      bedrooms: values.bedrooms,
      bathrooms: values.bathrooms,
      areaSqm: nOrNull(values.areaSqm),
      lotSqm: nOrNull(values.lotSqm),
      yearBuilt: intOrNull(values.yearBuilt),
      floors: intOrNull(values.floors),
      parking: intOrNull(values.parking),
      furnishing: values.furnishing || null,
      orientation: values.orientation || null,
      heating: values.heating || null,
      cooling: values.cooling || null,
      tenure: values.tenure || null,
      epc: values.epc || null,
      addressLine: values.addressLine,
      neighbourhood: values.neighbourhood || null,
      city: values.city,
      state: values.state || null,
      postalCode: values.postalCode || null,
      country: values.country,
      lat: nOrNull(values.lat),
      lng: nOrNull(values.lng),
      highlights: highlights.map((h) => h.trim()).filter(Boolean),
      amenities: Array.from(amenities),
      images: values.images.map((img) => ({ url: img.url, alt: values.title, publicId: img.publicId ?? null })),
      videoUrl: values.videoUrl || null,
      floorPlans: floorPlans.filter((p) => p.url.trim()).map((p) => ({ url: p.url.trim(), label: p.label.trim() || "Floor plan" })),
      status,
    };

    startTransition(async () => {
      const result =
        mode === "edit" && propertyId
          ? await updateListingAction(propertyId, payload)
          : adminCreate
            ? await adminCreateListingAction({ ...payload, agentId })
            : await createListingAction(payload);
      if (!result.ok) {
        setError(result.error);
        setErrors(result.fields ?? {});
        toast(result.error, "error");
        return;
      }
      toast(
        status === "draft"
          ? "Draft saved"
          : status === "approved"
            ? "Listing published"
            : "Listing submitted for review",
        "success"
      );
      router.push(
        adminCreate
          ? status === "draft"
            ? "/dashboard/import/new"
            : `/dashboard/moderation?status=${status}`
          : "/dashboard/listings"
      );
      router.refresh();
    });
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit(saveAs);
      }}
      className="grid gap-6 lg:grid-cols-[1fr_17rem] lg:items-start"
    >
      <div className="space-y-6 pb-24 lg:pb-0">
        {adminCreate && (
          <Section
            id="owner"
            title="Ownership"
            description="Every listing belongs to an agent. The agent's agency is applied automatically."
          >
            <div>
              <Label htmlFor="agentId">Assign to agent</Label>
              <Select
                id="agentId"
                value={agentId}
                onChange={(e) => setAgentId(e.target.value)}
                disabled={!agents?.length}
              >
                {!agents?.length && <option value="">No active agents available</option>}
                {agents?.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name} · {agent.email}
                  </option>
                ))}
              </Select>
              <FieldError error={errors.agentId} />
              {!agents?.length && (
                <p className="mt-2 text-xs text-stone-500">
                  Create an agent account and verify it before adding listings.
                </p>
              )}
            </div>
          </Section>
        )}
        <Section id="basics" title="The basics" description="What are you listing, and on what terms?">
          <div>
            <Label htmlFor="title">Listing title</Label>
            <Input
              id="title"
              value={values.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Sunlit duplex with private garden in Ikoyi"
              maxLength={180}
            />
            <FieldError error={errors.title} />
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            <div>
              <Label htmlFor="transactionType">Listing type</Label>
              <Select
                id="transactionType"
                value={values.transactionType}
                onChange={(e) => set("transactionType", e.target.value as "sale" | "rent")}
              >
                <option value="sale">For sale</option>
                <option value="rent">To rent</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="propertyType">Property type</Label>
              <Select
                id="propertyType"
                value={values.propertyType}
                onChange={(e) => set("propertyType", e.target.value as PropertyType)}
              >
                {PROPERTY_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="furnishing">Furnishing</Label>
              <Select id="furnishing" value={values.furnishing} onChange={(e) => set("furnishing", e.target.value)}>
                <option value="">Not specified</option>
                {FURNISHING_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-[1fr_8rem]">
            <div>
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                type="number"
                min={0}
                step="any"
                value={values.price}
                onChange={(e) => set("price", Number(e.target.value))}
              />
              <FieldError error={errors.price} />
            </div>
            <div>
              <Label htmlFor="currency">Currency</Label>
              <Select
                id="currency"
                value={values.currency}
                onChange={(e) => set("currency", e.target.value as CurrencyCode)}
              >
                {CURRENCY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.value}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-6">
            {values.transactionType === "rent" && (
              <label className="flex items-center gap-2 text-sm text-stone-600">
                <input
                  type="checkbox"
                  checked={values.pricePeriod === "per_month"}
                  onChange={(e) => set("pricePeriod", e.target.checked ? "per_month" : "total")}
                  className="size-4 accent-brass-500"
                />
                Price is per month
              </label>
            )}
            <label className="flex items-center gap-2 text-sm text-stone-600">
              <input
                type="checkbox"
                checked={values.priceOnApplication}
                onChange={(e) => set("priceOnApplication", e.target.checked)}
                className="size-4 accent-brass-500"
              />
              Price on application
            </label>
          </div>
          <div>
            <Label htmlFor="description" hint={`${values.description.length} characters`}>
              Description
            </Label>
            <Textarea
              id="description"
              value={values.description}
              onChange={(e) => set("description", e.target.value)}
              className="min-h-48"
              placeholder="Describe the architecture, light, setting and lifestyle. Mention recent renovations and what makes the home exceptional."
            />
            <FieldError error={errors.description} />
          </div>
        </Section>

        <Section id="details" title="Property details" description="Specifications buyers use to filter and compare.">
          <div className="grid gap-5 sm:grid-cols-4">
            <div>
              <Label htmlFor="bedrooms">Bedrooms</Label>
              <Input
                id="bedrooms"
                type="number"
                min={0}
                value={values.bedrooms}
                onChange={(e) => set("bedrooms", Number(e.target.value))}
              />
              <FieldError error={errors.bedrooms} />
            </div>
            <div>
              <Label htmlFor="bathrooms">Bathrooms</Label>
              <Input
                id="bathrooms"
                type="number"
                min={0}
                value={values.bathrooms}
                onChange={(e) => set("bathrooms", Number(e.target.value))}
              />
              <FieldError error={errors.bathrooms} />
            </div>
            <div>
              <Label htmlFor="areaSqm">Internal area (m²)</Label>
              <Input id="areaSqm" type="number" min={0} value={values.areaSqm} onChange={(e) => set("areaSqm", e.target.value)} />
              <FieldError error={errors.areaSqm} />
            </div>
            <div>
              <Label htmlFor="lotSqm">Plot size (m²)</Label>
              <Input id="lotSqm" type="number" min={0} value={values.lotSqm} onChange={(e) => set("lotSqm", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="yearBuilt">Year built</Label>
              <Input id="yearBuilt" type="number" min={1800} max={2100} value={values.yearBuilt} onChange={(e) => set("yearBuilt", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="floors">Floors</Label>
              <Input id="floors" type="number" min={0} value={values.floors} onChange={(e) => set("floors", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="parking">Parking spaces</Label>
              <Input id="parking" type="number" min={0} value={values.parking} onChange={(e) => set("parking", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="epc">EPC rating</Label>
              <Input id="epc" value={values.epc} onChange={(e) => set("epc", e.target.value)} placeholder="A" maxLength={10} />
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-4">
            <div>
              <Label htmlFor="orientation" hint="Optional">
                Orientation
              </Label>
              <Input id="orientation" value={values.orientation} onChange={(e) => set("orientation", e.target.value)} placeholder="South-west" />
            </div>
            <div>
              <Label htmlFor="heating" hint="Optional">
                Heating
              </Label>
              <Input id="heating" value={values.heating} onChange={(e) => set("heating", e.target.value)} placeholder="Underfloor" />
            </div>
            <div>
              <Label htmlFor="cooling" hint="Optional">
                Cooling
              </Label>
              <Input id="cooling" value={values.cooling} onChange={(e) => set("cooling", e.target.value)} placeholder="Central air" />
            </div>
            <div>
              <Label htmlFor="tenure" hint="Optional">
                Tenure
              </Label>
              <Input id="tenure" value={values.tenure} onChange={(e) => set("tenure", e.target.value)} placeholder="Freehold" />
            </div>
          </div>
        </Section>

        <Section id="location" title="Location" description="Coarse coordinates power the map — no exact address is published.">
          <div>
            <Label htmlFor="addressLine">Street address</Label>
            <Input
              id="addressLine"
              value={values.addressLine}
              onChange={(e) => set("addressLine", e.target.value)}
              placeholder="12 Glover Road"
            />
            <FieldError error={errors.addressLine} />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="neighbourhood">Neighbourhood</Label>
              <Input id="neighbourhood" value={values.neighbourhood} onChange={(e) => set("neighbourhood", e.target.value)} placeholder="Ikoyi" />
            </div>
            <div>
              <Label htmlFor="city">City</Label>
              <Input id="city" value={values.city} onChange={(e) => set("city", e.target.value)} placeholder="Lagos" />
              <FieldError error={errors.city} />
            </div>
            <div>
              <Label htmlFor="state" hint="Optional">
                State / region
              </Label>
              <Input id="state" value={values.state} onChange={(e) => set("state", e.target.value)} placeholder="Lagos State" />
            </div>
            <div>
              <Label htmlFor="postalCode" hint="Optional">
                Postal code
              </Label>
              <Input id="postalCode" value={values.postalCode} onChange={(e) => set("postalCode", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="country">Country</Label>
              <Input id="country" value={values.country} onChange={(e) => set("country", e.target.value)} placeholder="Nigeria" />
              <FieldError error={errors.country} />
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="lat" hint="Optional — geocoded if omitted">
                Latitude
              </Label>
              <Input id="lat" type="number" step="any" value={values.lat} onChange={(e) => set("lat", e.target.value)} placeholder="6.4541" />
              <FieldError error={errors.lat} />
            </div>
            <div>
              <Label htmlFor="lng" hint="Optional">
                Longitude
              </Label>
              <Input id="lng" type="number" step="any" value={values.lng} onChange={(e) => set("lng", e.target.value)} placeholder="3.4312" />
            </div>
          </div>
        </Section>

        <Section id="media" title="Photography" description="The first image becomes the listing cover.">
          <ImageUploader images={values.images} onChange={(next) => set("images", next)} error={errors.images} />
          <div>
            <Label htmlFor="videoUrl" hint="YouTube, Vimeo or .mp4">
              Film
            </Label>
            <Input id="videoUrl" value={values.videoUrl} onChange={(e) => set("videoUrl", e.target.value)} placeholder="https://…" />
            <FieldError error={errors.videoUrl} />
          </div>
          <div>
            <Label hint={`Up to ${MAX_FLOOR_PLANS}`}>Floor plans</Label>
            <div className="space-y-2">
              {floorPlans.map((plan, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={plan.url}
                    onChange={(e) =>
                      setFloorPlans((prev) => prev.map((p, i) => (i === index ? { ...p, url: e.target.value } : p)))
                    }
                    placeholder="Floor plan image URL"
                  />
                  <Input
                    value={plan.label}
                    onChange={(e) =>
                      setFloorPlans((prev) => prev.map((p, i) => (i === index ? { ...p, label: e.target.value } : p)))
                    }
                    placeholder="Label"
                    className="max-w-40"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setFloorPlans((prev) => prev.filter((_, i) => i !== index))}
                  >
                    Remove
                  </Button>
                </div>
              ))}
              {floorPlans.length < MAX_FLOOR_PLANS && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFloorPlans((prev) => [...prev, { url: "", label: "Ground floor" }])}
                >
                  Add floor plan
                </Button>
              )}
            </div>
          </div>
        </Section>

        <Section id="highlights" title="Highlights" description="Up to six short, evocative lines.">
          <div className="space-y-2">
            {highlights.map((highlight, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={highlight}
                  onChange={(e) => setHighlights((prev) => prev.map((h, i) => (i === index ? e.target.value : h)))}
                  placeholder="Floor-to-ceiling windows framing the marina"
                  maxLength={90}
                />
                {highlights.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setHighlights((prev) => prev.filter((_, i) => i !== index))}
                  >
                    Remove
                  </Button>
                )}
              </div>
            ))}
            {highlights.length < 6 && (
              <Button type="button" variant="outline" size="sm" onClick={() => setHighlights((prev) => [...prev, ""])}>
                Add highlight
              </Button>
            )}
          </div>
          <FieldError error={errors.highlights} />
        </Section>

        <Section id="amenities" title="Amenities" description="Select everything that applies.">
          <div className="space-y-6">
            {AMENITY_GROUPS.map((group) => (
              <div key={group.group}>
                <h3 className="mb-3 text-[0.6875rem] font-semibold tracking-[0.14em] text-stone-400 uppercase">
                  {group.group}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {group.items.map((amenity) => {
                    const checked = amenities.has(amenity);
                    return (
                      <button
                        key={amenity}
                        type="button"
                        onClick={() => toggleAmenity(amenity)}
                        aria-pressed={checked}
                        className={cn(
                          "rounded-full border px-3.5 py-1.5 text-xs transition-colors",
                          checked
                            ? "border-charcoal-900 bg-charcoal-900 text-ivory-50"
                            : "border-stone-200 bg-white text-stone-600 hover:border-stone-400"
                        )}
                      >
                        {amenity}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <FieldError error={errors.amenities} />
        </Section>
      </div>

      <aside className="sticky top-24 hidden lg:block">
        <div className="rounded-xl border border-ivory-200 bg-white p-6">
          <h2 className="font-serif text-lg text-charcoal-900">
            {mode === "edit" ? "Update listing" : adminCreate ? "Add listing" : "Publish listing"}
          </h2>
          <p className="mt-1.5 text-xs leading-relaxed text-stone-400">
            {adminCreate
              ? "Publish immediately on behalf of the assigned agent, send it to moderation, or keep it as a draft."
              : "Submissions are reviewed by our editorial team, usually within one business day."}
          </p>
          {error && (
            <p role="alert" className="mt-4 rounded-md bg-rust-600/10 px-3 py-2 text-xs text-rust-600">
              {error}
            </p>
          )}
          <div className="mt-5 space-y-2">
            {adminCreate && (
              <Button
                type="button"
                variant="accent"
                className="w-full"
                onClick={() => submit("approved")}
                loading={pending && saveAs === "approved"}
                disabled={!agentId}
              >
                Publish now
              </Button>
            )}
            <Button type="button" className="w-full" onClick={() => submit("pending")} loading={pending && saveAs === "pending"} disabled={adminCreate && !agentId}>
              {mode === "edit" ? "Save & resubmit" : "Submit for review"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => submit("draft")}
              loading={pending && saveAs === "draft"}
              disabled={adminCreate && !agentId}
            >
              Save as draft
            </Button>
          </div>
          <ul className="mt-5 space-y-2 border-t border-ivory-200 pt-4 text-[0.6875rem] text-stone-400">
            <li>{values.images.length} photo{values.images.length === 1 ? "" : "s"} added</li>
            <li>{amenities.size} amenities selected</li>
            <li>{values.description.length}-character description</li>
          </ul>
        </div>
      </aside>

      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-2 border-t border-ivory-200 bg-ivory-50/95 px-5 py-3 backdrop-blur lg:hidden">
        {adminCreate && (
          <Button type="button" variant="accent" className="flex-1" onClick={() => submit("approved")} loading={pending && saveAs === "approved"} disabled={!agentId}>
            Publish
          </Button>
        )}
        <Button type="button" className="flex-1" onClick={() => submit("pending")} loading={pending && saveAs === "pending"} disabled={adminCreate && !agentId}>
          {mode === "edit" ? "Save listing" : "Submit"}
        </Button>
        <Button type="button" variant="outline" className="flex-1" onClick={() => submit("draft")} loading={pending && saveAs === "draft"} disabled={adminCreate && !agentId}>
          Draft
        </Button>
      </div>
    </form>
  );
}
