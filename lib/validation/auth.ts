import { z } from "zod";
import { ROLES } from "@/constants";

type RoleValue = (typeof ROLES)[number]["value"];
const roleValues = ROLES.map((r) => r.value) as [RoleValue, ...RoleValue[]];

export const emailSchema = z
  .string()
  .trim()
  .min(5, "Enter a valid email address")
  .max(200, "Email is too long")
  .email("Enter a valid email address")
  .toLowerCase();

export const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters")
  .max(200, "Password is too long")
  .refine((v) => /[a-zA-Z]/.test(v), "Include at least one letter")
  .refine((v) => /[0-9]/.test(v), "Include at least one number");

export const nameSchema = z
  .string()
  .trim()
  .min(2, "Enter your full name")
  .max(120, "Name is too long");

export const signUpSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  role: z.enum(["customer", "agent"] as ["customer", "agent"]).default("customer"),
  agencyName: z.string().trim().max(160).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  terms: z.literal(true, { message: "You must accept the terms to continue" }),
});

export type SignUpInput = z.infer<typeof signUpSchema>;

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password").max(200),
});

export type SignInInput = z.infer<typeof signInSchema>;

export const updateProfileSchema = z.object({
  name: nameSchema,
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  bio: z.string().trim().max(2000).optional().or(z.literal("")),
  website: z
    .string()
    .trim()
    .max(300)
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || /^https?:\/\//i.test(v), "Website must start with http:// or https://"),
  avatarUrl: z.string().trim().max(500).optional().or(z.literal("")),
  // Agent-only fields
  licenseNumber: z.string().trim().max(80).optional().or(z.literal("")),
  specializations: z.array(z.string().trim().min(2).max(60)).max(8).default([]),
  languages: z.array(z.string().trim().min(2).max(40)).max(8).default([]),
  yearsExperience: z.coerce.number().int().min(0).max(80).nullable().optional(),
  serviceAreas: z.array(z.string().trim().min(2).max(80)).max(12).default([]),
  agencyName: z.string().trim().max(160).optional().or(z.literal("")),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password").max(200),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, "Confirm your new password").max(200),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const adminUserUpdateSchema = z.object({
  userId: z.string().min(1),
  action: z.enum([
    "suspend",
    "reactivate",
    "verify",
    "reject_verification",
    "request_verification",
    "make_agent",
    "make_customer",
  ]),
  reason: z.string().trim().max(500).optional().or(z.literal("")),
});

export type AdminUserUpdateInput = z.infer<typeof adminUserUpdateSchema>;

export const roleValuesSchema = z.enum(roleValues);
