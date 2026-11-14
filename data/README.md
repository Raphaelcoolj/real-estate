# Authentic listing data

This folder is the drop-in point for real marketplace content. Add your
listings to `data/listings.json` (an array of objects), then run:

```bash
npm run import                  # validate and upsert into MongoDB
npm run import -- --dry-run     # validate only, writes nothing
npm run import -- ./data/my-file.json
```

Admins can do the same from **Dashboard → Data import** — paste/upload the
JSON there, or use **Generate sample** to produce synthetic listings for
testing. The dashboard accepts up to 500 entries and validates exactly like
the CLI.

Listings are matched by `slug`, so re-running updates the same record instead
of creating duplicates. New listings enter the moderation queue as `pending`
unless you set `"status": "approved"`.

## Where the rest of the data comes from

- **Agents / agencies** — sign up through `/sign-up`, then an admin approves
  the account in Dashboard → Verification. Imported listings reference an
  existing agent by `agentEmail`.
- **Media** — upload files in Dashboard → Listings → Add listing (stored in
  `public/uploads`), or use absolute `https://` URLs. Relative `/images/...`
  paths are reserved for the bundled artwork.
- **Demo data** — `npm run seed` is destructive and replaces everything. Use
  it for demos only, never after importing real content.

## Example entry

```json
{
  "title": "Six-bedroom garden villa in Ikoyi",
  "description": "A substantial family villa set behind a gated drive in old Ikoyi, with mature gardens, a pool terrace and generous reception rooms arranged over three floors. The house has been maintained to a high standard and is offered with vacant possession.",
  "transactionType": "sale",
  "propertyType": "villa",
  "status": "approved",
  "price": 1850000,
  "currency": "NGN",
  "bedrooms": 6,
  "bathrooms": 5,
  "areaSqm": 620,
  "lotSqm": 1100,
  "yearBuilt": 2016,
  "furnishing": "unfurnished",
  "addressLine": "14 Glover Road, Ikoyi",
  "neighbourhood": "Old Ikoyi",
  "city": "Lagos",
  "state": "Lagos",
  "country": "Nigeria",
  "lat": 6.4527,
  "lng": 3.4356,
  "highlights": ["Mature 1,100 sqm plot", "Pool and summer terrace", "Staff quarters"],
  "amenities": ["Swimming pool", "Private garden", "Garage", "24/7 security", "Air conditioning"],
  "images": [
    { "url": "https://example.com/photos/ikoyi-villa-1.jpg", "alt": "Garden elevation" },
    { "url": "https://example.com/photos/ikoyi-villa-2.jpg", "alt": "Pool terrace" }
  ],
  "agentEmail": "tunde@atlantic.example",
  "agencySlug": "atlantic-and-vine",
  "slug": "six-bedroom-garden-villa-ikoyi"
}
```

## Field notes

| Field | Notes |
| --- | --- |
| `title` | 8–180 characters |
| `description` | At least 40 characters |
| `transactionType` | `sale` or `rent` |
| `propertyType` | `apartment`, `villa`, `house`, `penthouse`, `townhouse`, `duplex`, `land`, `commercial` or `chalet` |
| `price` / `currency` | Currency is one of `USD`, `EUR`, `GBP`, `AED`, `NGN` |
| `lat` / `lng` | Strongly recommended; both or neither. Without them the pin is hidden from the map |
| `amenities` | Must match the amenity list in `constants/index.ts` |
| `images` | At least one; `https://` or `/uploads/...` |
| `agentEmail` | Must belong to an existing `agent` account |
| `agencySlug` | Optional; defaults to the agent's agency |
| `status` | `pending` (default), `draft` or `approved` |
| `slug` | Optional; derived from the title when omitted |
| `publishedAt` | Optional ISO date, used when `status` is `approved` |
| `featured` | Optional boolean |

Only the keys above are read; unknown keys are ignored. Invalid entries are
reported with their field path and the import exits non-zero.
