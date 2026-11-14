/* ---------------------------------------------------------------------------
 * verify — asserts the seeded marketplace satisfies the product contracts.
 *
 *   npm run verify
 *
 * Exits non-zero on the first failed invariant. Run after `npm run seed`.
 * ------------------------------------------------------------------------ */

import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { Agency } from "../models/Agency";
import { User } from "../models/User";
import { Property } from "../models/Property";
import { Enquiry } from "../models/Enquiry";
import { Inspection } from "../models/Inspection";
import { Favourite } from "../models/Favourite";
import { Comparison } from "../models/Comparison";
import { Notification } from "../models/Notification";
import { Report } from "../models/Report";
import { POPULAR_DISTRICTS } from "../constants/locations";
import { ENQUIRY_STATUSES, INSPECTION_STATUSES, PROPERTY_STATUSES } from "../constants";

const MONGODB_URI = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/arcadia";

let failures = 0;
let checks = 0;

function check(name: string, condition: boolean, detail?: string) {
  checks += 1;
  if (condition) {
    console.log(`  \u001b[32m✓\u001b[0m ${name}`);
  } else {
    failures += 1;
    console.log(`  \u001b[31m✗\u001b[0m ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

async function main() {
  console.log("\n  Arcadia — verifying seeded data\n");
  await mongoose.connect(MONGODB_URI);
  console.log(`  Connected to ${mongoose.connection.host}/${mongoose.connection.name}\n`);

  const [agencies, users, agents, customers, admins, properties, enquiries, inspections, favourites, comparisons, notifications, reports] =
    await Promise.all([
      Agency.countDocuments(),
      User.countDocuments(),
      User.countDocuments({ role: "agent" }),
      User.countDocuments({ role: "customer" }),
      User.countDocuments({ role: "admin" }),
      Property.countDocuments(),
      Enquiry.countDocuments(),
      Inspection.countDocuments(),
      Favourite.countDocuments(),
      Comparison.countDocuments(),
      Notification.countDocuments(),
      Report.countDocuments(),
    ]);

  console.log("  Volumes");
  check("agencies seeded", agencies === 3, `found ${agencies}`);
  check("agents seeded", agents === 8, `found ${agents}`);
  check("customers seeded", customers >= 3, `found ${customers}`);
  check("an admin exists", admins >= 1, `found ${admins}`);
  check("listings seeded", properties === 24, `found ${properties}`);
  check("enquiries seeded", enquiries >= 5, `found ${enquiries}`);
  check("viewings seeded", inspections >= 4, `found ${inspections}`);
  check("favourites seeded", favourites >= 4, `found ${favourites}`);
  check("comparisons seeded", comparisons >= 1, `found ${comparisons}`);
  check("notifications seeded", notifications >= 8, `found ${notifications}`);
  check("reports seeded", reports >= 2, `found ${reports}`);
  check("total members", users === agents + customers + admins, `found ${users}`);

  console.log("\n  Listings");
  const approvedDocs = await Property.find({ status: { $in: ["approved", "sold", "rented"] } }).lean();
  const pendingDocs = await Property.find({ status: "pending" }).lean();
  const liveDocs = await Property.find({ status: "approved" }).lean();

  check("live listings present", liveDocs.length >= 12, `found ${liveDocs.length}`);
  check("featured listings present", liveDocs.some((p) => p.featured));
  check("pending moderation queue present", pendingDocs.length >= 2, `found ${pendingDocs.length}`);
  check(
    "every live listing has photography",
    approvedDocs.every((p) => Array.isArray(p.images) && p.images.length > 0)
  );
  check(
    "every live listing has a published date",
    approvedDocs.every((p) => p.publishedAt instanceof Date)
  );
  check(
    "every live listing has a listing agent",
    approvedDocs.every((p) => Boolean(p.agent))
  );
  check(
    "every live listing has coordinates",
    approvedDocs.every((p) => Array.isArray(p.location?.coordinates) && p.location.coordinates.length === 2)
  );
  check(
    "every live listing has a description of 40+ chars",
    approvedDocs.every((p) => (p.description ?? "").length >= 40)
  );
  check(
    "pending listings are submitted but unpublished",
    pendingDocs.every((p) => p.submittedAt instanceof Date && !p.publishedAt)
  );
  check(
    "listing statuses are within the enum",
    [...approvedDocs, ...pendingDocs].every((p) =>
      (PROPERTY_STATUSES as readonly { value: string }[]).some((s) => s.value === p.status)
    )
  );

  const slugs = await Property.distinct("slug");
  check("listing slugs are unique", slugs.length === (await Property.countDocuments()));

  const districts = new Set(POPULAR_DISTRICTS.map((d) => d.name));
  check(
    "listings span every featured district",
    districts.size > 0 &&
      POPULAR_DISTRICTS.every((d) => approvedDocs.some((p) => p.address?.neighbourhood === d.name))
  );

  console.log("\n  Geospatial");
  const lagos = POPULAR_DISTRICTS.find((d) => d.slug === "ikoyi-lagos")!;
  const nearby = await Property.find({
    status: "approved",
    location: {
      $near: {
        $geometry: { type: "Point", coordinates: [lagos.lng, lagos.lat] },
        $maxDistance: 20_000,
      },
    },
  }).limit(5);
  check("viewport/geo query returns Lagos listings", nearby.length >= 2, `found ${nearby.length}`);

  const indexes = await Property.collection.indexes();
  check("2dsphere index present", indexes.some((i) => i.name === "location_2dsphere" || JSON.stringify(i.key).includes("2dsphere")));
  check("text index present", indexes.some((i) => JSON.stringify(i.key).includes("_fts")));

  console.log("\n  People & trust");
  const adminDoc = await User.findOne({ role: "admin" }).select("+passwordHash").lean();
  check("admin can authenticate", adminDoc ? await bcrypt.compare("Arcadia!2026", adminDoc.passwordHash!) : false);
  check(
    "agents have unique slugs",
    new Set((await User.find({ role: "agent" }).select("slug").lean()).map((u) => u.slug)).size === agents
  );
  check(
    "every agent belongs to an agency",
    (await User.countDocuments({ role: "agent", agency: null })) === 0
  );
  check(
    "verification queue has pending or rejected agents",
    (await User.countDocuments({ role: "agent", verificationStatus: { $in: ["pending", "rejected"] } })) >= 1
  );

  console.log("\n  Engagement");
  const enquiryDocs = await Enquiry.find().lean();
  check(
    "enquiry statuses are valid",
    enquiryDocs.every((e) => (ENQUIRY_STATUSES as readonly { value: string }[]).some((s) => s.value === e.status))
  );
  check(
    "every enquiry links a property, customer and agent",
    enquiryDocs.every((e) => Boolean(e.property && e.customer && e.agent))
  );
  check(
    "replied enquiries carry a timestamp",
    enquiryDocs.filter((e) => e.status === "replied").every((e) => e.repliedAt instanceof Date)
  );

  const inspectionDocs = await Inspection.find().lean();
  check(
    "inspection statuses are valid",
    inspectionDocs.every((i) =>
      (INSPECTION_STATUSES as readonly { value: string }[]).some((s) => s.value === i.status)
    )
  );
  check(
    "confirmed viewings have a scheduled time",
    inspectionDocs.filter((i) => i.status === "confirmed").every((i) => i.scheduledAt instanceof Date)
  );
  check(
    "viewings link a property, customer and agent",
    inspectionDocs.every((i) => Boolean(i.property && i.customer && i.agent))
  );

  const comparison = await Comparison.findOne();
  check("comparison holds 2–4 properties", Boolean(comparison && comparison.properties.length >= 2 && comparison.properties.length <= 4));

  const openReports = await Report.countDocuments({ status: "open" });
  check("an open report exists for moderation", openReports >= 1, `found ${openReports}`);

  console.log(
    `\n  ${failures === 0 ? "\u001b[32mPASS\u001b[0m" : "\u001b[31mFAIL\u001b[0m"} — ${checks - failures}/${checks} checks passed\n`
  );

  if (failures > 0) process.exitCode = 1;
}

main()
  .then(async () => {
    await mongoose.disconnect();
  })
  .catch(async (error) => {
    console.error("\n  Verification crashed:", error);
    await mongoose.disconnect().catch(() => undefined);
    process.exit(1);
  });
