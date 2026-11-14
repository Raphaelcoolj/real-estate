/* ---------------------------------------------------------------------------
 * User service — registration, profiles, agent directory, admin management.
 * ------------------------------------------------------------------------ */

import "server-only";
import { Types, type QueryFilter } from "mongoose";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Agency } from "@/models/Agency";
import { Property } from "@/models/Property";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { AppError, AuthError, ForbiddenError, NotFoundError } from "@/lib/errors";
import { slugify } from "@/lib/utils";
import { serializeAgency, serializeAgent } from "@/lib/mappers";
import { notify } from "@/lib/services/notification.service";
import type { SignUpInput, UpdateProfileInput } from "@/lib/validation/auth";
import type { AgencySummary, Paginated, PublicAgent, SessionUser } from "@/types";
import type { Role, VerificationStatus } from "@/constants";

type AnyDoc = Record<string, unknown>;

/* ------------------------------ Registration ----------------------------- */

export async function registerUser(input: SignUpInput): Promise<{ id: string }> {
  await connectDB();

  const email = input.email.toLowerCase();
  const existing = await User.exists({ email });
  if (existing) {
    throw new AppError("An account with this email already exists.", 409, {
      email: ["An account with this email already exists."],
    });
  }

  const passwordHash = await hashPassword(input.password);
  const wantsAgency = input.role === "agent" && Boolean(input.agencyName?.trim());

  let agencyId: Types.ObjectId | null = null;
  if (wantsAgency) {
    const slug = await uniqueSlug(input.agencyName!.trim(), async (candidate) =>
      Boolean(await Agency.exists({ slug: candidate }))
    );
    const agency = await Agency.create({
      name: input.agencyName!.trim(),
      slug,
      email,
      phone: input.phone?.trim() || null,
      verified: false,
    });
    agencyId = agency._id as Types.ObjectId;
  }

  const name = input.name.trim();
  const userSlug =
    input.role === "agent"
      ? await uniqueSlug(name, async (candidate) =>
          Boolean(await User.exists({ slug: candidate }))
        )
      : null;

  const user = await User.create({
    name,
    email,
    passwordHash,
    role: input.role as Role,
    phone: input.phone?.trim() || null,
    slug: userSlug,
    agency: agencyId,
    verificationStatus: input.role === "agent" ? "pending" : "unverified",
    profileComplete: false,
    specializations: [],
    languages: [],
    serviceAreas: [],
  });

  if (input.role === "agent") {
    await notify({
      userId: String(user._id),
      type: "verification",
      title: "Welcome to Arcadia",
      body: "Complete your agent profile and submit your first listing. Verification documents can be added from Profile.",
      href: "/dashboard/settings",
    });
  }

  return { id: String(user._id) };
}

async function uniqueSlug(
  base: string,
  exists: (candidate: string) => Promise<boolean>
): Promise<string> {
  const root = slugify(base) || "record";
  let slug = root;
  for (let i = 2; i < 50; i++) {
    if (!(await exists(slug))) return slug;
    slug = `${root}-${i}`;
  }
  return `${root}-${Date.now().toString(36)}`;
}

/* -------------------------------- Auth ---------------------------------- */

export async function authenticate(email: string, password: string): Promise<{
  id: string;
  role: Role;
  name: string;
  email: string;
}> {
  await connectDB();
  const user = (await User.findOne({ email: email.toLowerCase() })
    .select("+passwordHash")
    .lean()) as unknown as (AnyDoc & { passwordHash?: string }) | null;

  if (!user?.passwordHash) {
    throw new AuthError("Email or password is incorrect.");
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) throw new AuthError("Email or password is incorrect.");

  if (String(user.status) === "suspended") {
    throw new ForbiddenError(
      user.suspendedReason
        ? `This account is suspended: ${String(user.suspendedReason)}`
        : "This account has been suspended. Contact support."
    );
  }

  await User.updateOne({ _id: user._id }, { $set: { lastLoginAt: new Date() } });

  return {
    id: String(user._id),
    role: String(user.role) as Role,
    name: String(user.name),
    email: String(user.email),
  };
}

/* -------------------------------- Profile -------------------------------- */

export async function updateProfile(
  userId: string,
  input: UpdateProfileInput,
  actor: SessionUser
): Promise<SessionUser> {
  if (userId !== actor.id && actor.role !== "admin") {
    throw new ForbiddenError("You can only update your own profile.");
  }
  await connectDB();

  const update: Record<string, unknown> = {
    name: input.name.trim(),
    phone: input.phone?.trim() || null,
    bio: input.bio?.trim() || null,
    website: input.website?.trim() || null,
    avatarUrl: input.avatarUrl?.trim() || null,
  };

  if (actor.role === "agent") {
    update.licenseNumber = input.licenseNumber?.trim() || null;
    update.specializations = input.specializations ?? [];
    update.languages = input.languages ?? [];
    update.yearsExperience = input.yearsExperience ?? null;
    update.serviceAreas = input.serviceAreas ?? [];

    if (input.agencyName?.trim() && !actor.agencyId) {
      const slug = await uniqueSlug(input.agencyName.trim(), async (candidate) =>
        Boolean(await Agency.exists({ slug: candidate }))
      );
      const agency = await Agency.create({
        name: input.agencyName.trim(),
        slug,
        email: actor.email,
        phone: input.phone?.trim() || null,
      });
      update.agency = agency._id;
    }

    update.profileComplete = Boolean(
      input.bio?.trim() && input.phone?.trim() && (input.licenseNumber?.trim() || input.specializations.length)
    );
  } else {
    update.profileComplete = Boolean(input.phone?.trim() || input.avatarUrl?.trim());
  }

  await User.updateOne({ _id: userId }, { $set: update });

  const fresh = (await User.findById(userId)
    .select("name email role avatarUrl phone status verificationStatus agency bio profileComplete createdAt")
    .populate("agency", "name slug")
    .lean()) as unknown as AnyDoc | null;
  if (!fresh) throw new NotFoundError("Account not found.");

  return {
    id: String(fresh._id),
    name: String(fresh.name),
    email: String(fresh.email),
    role: String(fresh.role) as Role,
    avatarUrl: (fresh.avatarUrl as string | null) ?? null,
    phone: (fresh.phone as string | null) ?? null,
    status: fresh.status as SessionUser["status"],
    verificationStatus: fresh.verificationStatus as SessionUser["verificationStatus"],
    agencyId: fresh.agency ? String((fresh.agency as AnyDoc)._id) : null,
    agencyName: fresh.agency ? String((fresh.agency as AnyDoc).name) : null,
    profileComplete: Boolean(fresh.profileComplete),
    bio: (fresh.bio as string | null) ?? null,
    createdAt: new Date(String(fresh.createdAt)).toISOString(),
  };
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  await connectDB();
  const user = (await User.findById(userId).select("+passwordHash").lean()) as unknown as
    | (AnyDoc & { passwordHash?: string })
    | null;
  if (!user?.passwordHash) throw new NotFoundError("Account not found.");

  const valid = await verifyPassword(currentPassword, user.passwordHash);
  if (!valid) {
    throw new AppError("Your current password is incorrect.", 400, {
      currentPassword: ["Your current password is incorrect."],
    });
  }

  await User.updateOne({ _id: userId }, { $set: { passwordHash: await hashPassword(newPassword) } });
}

export async function requestVerification(userId: string): Promise<void> {
  await connectDB();
  const user = await User.findById(userId);
  if (!user) throw new NotFoundError("Account not found.");
  if (user.role !== "agent") {
    throw new ForbiddenError("Only agent accounts can request verification.");
  }
  user.verificationStatus = "pending";
  await user.save();
}

/* --------------------------- Public directory ---------------------------- */

export type ProfileDetails = {
  website: string | null;
  licenseNumber: string | null;
  specializations: string[];
  languages: string[];
  serviceAreas: string[];
  yearsExperience: number | null;
  agencyName: string | null;
};

/** Extra profile fields not carried in the lightweight session object. */
export async function getProfileDetails(userId: string): Promise<ProfileDetails> {
  await connectDB();
  const doc = (await User.findById(userId)
    .select("website licenseNumber specializations languages serviceAreas yearsExperience agency")
    .populate("agency", "name")
    .lean()) as unknown as AnyDoc | null;
  if (!doc) throw new NotFoundError("Account not found.");
  return {
    website: (doc.website as string | null) ?? null,
    licenseNumber: (doc.licenseNumber as string | null) ?? null,
    specializations: Array.isArray(doc.specializations) ? doc.specializations.map(String) : [],
    languages: Array.isArray(doc.languages) ? doc.languages.map(String) : [],
    serviceAreas: Array.isArray(doc.serviceAreas) ? doc.serviceAreas.map(String) : [],
    yearsExperience: typeof doc.yearsExperience === "number" ? doc.yearsExperience : null,
    agencyName: doc.agency ? String((doc.agency as AnyDoc).name) : null,
  };
}

export async function getAgents(
  options: { q?: string; city?: string; verifiedOnly?: boolean; page?: number } = {}
): Promise<Paginated<PublicAgent>> {
  await connectDB();
  const page = options.page ?? 1;
  const pageSize = 12;

  const query: Record<string, unknown> = { role: "agent", status: "active" };
  if (options.verifiedOnly) query.verificationStatus = "verified";
  if (options.q) {
    const re = new RegExp(options.q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    query.$or = [{ name: re }, { bio: re }, { serviceAreas: re }, { specializations: re }];
  }

  const total = await User.countDocuments(query);
  const docs = (await User.find(query)
    .sort({ verificationStatus: 1, createdAt: -1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .populate("agency", "name slug logoUrl country")
    .lean()) as unknown as AnyDoc[];

  // Listing counts per agent (batched).
  const ids = docs.map((d) => d._id);
  const counts = (await Property.aggregate([
    { $match: { agent: { $in: ids }, status: { $in: ["approved", "sold", "rented"] } } },
    { $group: { _id: "$agent", count: { $sum: 1 } } },
  ])) as Array<{ _id: unknown; count: number }>;
  const countById = new Map(counts.map((c) => [String(c._id), c.count]));

  const items = docs.map((d) => ({
    ...serializeAgent(d),
    listingCount: countById.get(String(d._id)) ?? 0,
  }));

  return {
    items,
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    hasMore: page * pageSize < total,
  };
}

export async function getAgentBySlug(slug: string): Promise<
  (PublicAgent & { listingCount: number }) | null
> {
  await connectDB();
  const doc = (await User.findOne({ slug, role: { $in: ["agent", "admin"] }, status: "active" })
    .populate("agency", "name slug logoUrl country city")
    .lean()) as unknown as AnyDoc | null;
  if (!doc) return null;

  const count = await Property.countDocuments({
    agent: new Types.ObjectId(String(doc._id)),
    status: { $in: ["approved", "sold", "rented"] },
  });

  return { ...serializeAgent(doc), listingCount: count };
}

export async function getAgencyBySlug(slug: string): Promise<
  (AgencySummary & { agents: PublicAgent[] }) | null
> {
  await connectDB();
  const agency = (await Agency.findOne({ slug }).lean()) as unknown as AnyDoc | null;
  if (!agency) return null;

  const agentDocs = (await User.find({ agency: new Types.ObjectId(String(agency._id)), role: "agent", status: "active" })
    .populate("agency", "name slug logoUrl country")
    .sort({ verificationStatus: 1, name: 1 })
    .lean()) as unknown as AnyDoc[];

  const listingCount = await Property.countDocuments({
    agency: new Types.ObjectId(String(agency._id)),
    status: { $in: ["approved", "sold", "rented"] },
  });

  return {
    ...serializeAgency(agency, { agents: agentDocs.length, listings: listingCount }),
    agents: agentDocs.map(serializeAgent),
  };
}

export async function getAgencies(limit = 8): Promise<AgencySummary[]> {
  await connectDB();
  const docs = (await Agency.find({})
    .sort({ verified: -1, name: 1 })
    .limit(limit)
    .lean()) as unknown as AnyDoc[];

  const ids = docs.map((d) => d._id);
  const agentCounts = await User.aggregate([
    { $match: { agency: { $in: ids }, role: "agent", status: "active" } },
    { $group: { _id: "$agency", count: { $sum: 1 } } },
  ]);
  const listingCounts = await Property.aggregate([
    { $match: { agency: { $in: ids }, status: { $in: ["approved", "sold", "rented"] } } },
    { $group: { _id: "$agency", count: { $sum: 1 } } },
  ]);
  const agentBy = new Map(agentCounts.map((r) => [String(r._id), r.count as number]));
  const listingBy = new Map(listingCounts.map((r) => [String(r._id), r.count as number]));

  return docs.map((d) =>
    serializeAgency(d, {
      agents: agentBy.get(String(d._id)) ?? 0,
      listings: listingBy.get(String(d._id)) ?? 0,
    })
  );
}

/* --------------------------- Admin management ---------------------------- */

export async function listUsers(
  options: { q?: string; role?: Role | "all"; status?: string; page?: number } = {}
): Promise<Paginated<Record<string, unknown>>> {
  await connectDB();
  const page = options.page ?? 1;
  const pageSize = 20;

  const query: Record<string, unknown> = {};
  if (options.role && options.role !== "all") query.role = options.role;
  if (options.status && options.status !== "all") query.status = options.status;
  if (options.q) {
    const re = new RegExp(options.q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    query.$or = [{ name: re }, { email: re }];
  }

  const total = await User.countDocuments(query);
  const docs = (await User.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .select("name email role status verificationStatus avatarUrl agency createdAt lastLoginAt")
    .populate("agency", "name slug")
    .lean()) as unknown as AnyDoc[];

  const items = docs.map((d) => ({
    id: String(d._id),
    name: String(d.name),
    email: String(d.email),
    role: String(d.role) as Role,
    status: String(d.status),
    verificationStatus: String(d.verificationStatus) as VerificationStatus,
    avatarUrl: (d.avatarUrl as string | null) ?? null,
    agency: d.agency
      ? { id: String((d.agency as AnyDoc)._id), name: String((d.agency as AnyDoc).name) }
      : null,
    createdAt: new Date(String(d.createdAt)).toISOString(),
    lastLoginAt: d.lastLoginAt ? new Date(String(d.lastLoginAt)).toISOString() : null,
  }));

  return {
    items,
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    hasMore: page * pageSize < total,
  };
}

export type AdminUserAction =
  | "suspend"
  | "reactivate"
  | "verify"
  | "reject_verification"
  | "request_verification"
  | "make_agent"
  | "make_customer";

export async function adminUpdateUser(
  targetId: string,
  action: AdminUserAction,
  reason: string | undefined,
  admin: SessionUser
): Promise<void> {
  if (admin.role !== "admin") throw new ForbiddenError();
  if (targetId === admin.id && (action === "suspend" || action.startsWith("make"))) {
    throw new AppError("You cannot perform this action on your own account.");
  }
  await connectDB();
  const user = await User.findById(targetId);
  if (!user) throw new NotFoundError("User not found.");

  switch (action) {
    case "suspend":
      user.status = "suspended";
      user.suspendedReason = reason?.trim() || "Suspended by administrator";
      break;
    case "reactivate":
      user.status = "active";
      user.suspendedReason = null;
      break;
    case "verify":
      user.verificationStatus = "verified";
      break;
    case "reject_verification":
      user.verificationStatus = "rejected";
      break;
    case "request_verification":
      user.verificationStatus = "pending";
      break;
    case "make_agent":
      if (!user.slug) {
        user.slug = await uniqueSlug(String(user.name), async (candidate) =>
          Boolean(await User.exists({ slug: candidate }))
        );
      }
      user.role = "agent";
      if (user.verificationStatus === "unverified") user.verificationStatus = "pending";
      break;
    case "make_customer":
      user.role = "customer";
      break;
  }

  await user.save();

  if (action === "verify" || action === "reject_verification" || action === "suspend" || action === "reactivate") {
    await notify({
      userId: String(user._id),
      type: "verification",
      title:
        action === "verify"
          ? "Your account is verified"
          : action === "reject_verification"
            ? "Verification not approved"
            : action === "suspend"
              ? "Account suspended"
              : "Account reactivated",
      body:
        action === "verify"
          ? "Congratulations — your agent profile now displays the verified badge."
          : action === "reject_verification"
            ? `Your verification request was not approved.${reason ? ` ${reason}` : ""}`
            : action === "suspend"
              ? `Your account has been suspended.${reason ? ` Reason: ${reason}` : ""}`
              : "Your account has been reactivated. Welcome back.",
      href: "/dashboard/settings",
    });
  }
}

export async function getAgentVerificationQueue(
  page = 1
): Promise<Paginated<PublicAgent>> {
  await connectDB();
  const pageSize = 20;
  const query: QueryFilter<import("@/models/User").UserDocument> = {
    role: "agent",
    verificationStatus: { $in: ["pending", "rejected", "unverified"] },
  };

  const total = await User.countDocuments(query);
  const docs = (await User.find(query)
    .sort({ verificationStatus: 1, createdAt: -1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .populate("agency", "name slug logoUrl country")
    .lean()) as unknown as AnyDoc[];

  return {
    items: docs.map(serializeAgent),
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    hasMore: page * pageSize < total,
  };
}
