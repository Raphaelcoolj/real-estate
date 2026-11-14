import type { z } from "zod";

export * from "./auth";
export * from "./property";
export * from "./interaction";

/** Convert a FormData instance into a plain record of strings. */
export function formDataToObject(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") out[key] = value;
  }
  return out;
}

/** Map zod issues into a `{ field: [message] }` record for form display. */
export function toFieldErrors(error: z.ZodError): Record<string, string[]> {
  const fields: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.length ? issue.path.join(".") : "_";
    (fields[key] ??= []).push(issue.message);
  }
  return fields;
}

export type Parsed<T> =
  | { success: true; data: T }
  | { success: false; fields: Record<string, string[]>; message: string };

export function parseInput<T>(schema: z.ZodType<T>, input: unknown): Parsed<T> {
  const result = schema.safeParse(input);
  if (result.success) return { success: true, data: result.data };
  const fields = toFieldErrors(result.error);
  const first = result.error.issues[0]?.message ?? "Please check the form.";
  return { success: false, fields, message: first };
}

/** Checkbox helper for FormData — only present when checked. */
export function isChecked(formData: FormData, key: string): boolean {
  const value = formData.get(key);
  return value === "on" || value === "true" || value === "yes";
}
