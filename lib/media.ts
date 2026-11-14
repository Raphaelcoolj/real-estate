/* ---------------------------------------------------------------------------
 * Media — image uploads.
 * Uses Cloudinary when CLOUDINARY_* credentials are configured; otherwise
 * stores files on the local filesystem under public/uploads (git-ignored).
 * SVG uploads are rejected (XSS surface); JPEG/PNG/WebP/AVIF/GIF only.
 * ------------------------------------------------------------------------ */

import "server-only";
import { randomUUID } from "node:crypto";
import { createHash } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { AppError } from "@/lib/errors";

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
};

export type UploadResult = {
  url: string;
  publicId: string | null;
  provider: "cloudinary" | "local";
};

export function isCloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

export function mediaProvider(): "cloudinary" | "local" {
  return isCloudinaryConfigured() ? "cloudinary" : "local";
}

function assertValidImage(file: File): void {
  if (!file || typeof file === "string" || file.size === 0) {
    throw new AppError("Choose an image to upload.");
  }
  if (file.size > MAX_BYTES) {
    throw new AppError("Images must be smaller than 8 MB.");
  }
  if (file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg")) {
    throw new AppError("SVG uploads are not allowed.");
  }
  if (!ALLOWED_TYPES[file.type]) {
    throw new AppError("Supported formats: JPEG, PNG, WebP, AVIF, GIF.");
  }
}

async function uploadToCloudinary(file: File, folder: string): Promise<UploadResult> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME!;
  const apiKey = process.env.CLOUDINARY_API_KEY!;
  const apiSecret = process.env.CLOUDINARY_API_SECRET!;
  const timestamp = Math.floor(Date.now() / 1000);
  const publicId = `${folder}/${randomUUID()}`;

  const toSign = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
  const signature = createHash("sha1").update(toSign).digest("hex");

  const body = new FormData();
  body.append("file", file);
  body.append("api_key", apiKey);
  body.append("timestamp", String(timestamp));
  body.append("folder", folder);
  body.append("public_id", publicId);
  body.append("signature", signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new AppError(
      `Media upload failed (${res.status}). ${detail.slice(0, 200)}`,
      502
    );
  }

  const data = (await res.json()) as { secure_url: string; public_id: string };
  return { url: data.secure_url, publicId: data.public_id, provider: "cloudinary" };
}

async function uploadLocal(file: File, folder: string): Promise<UploadResult> {
  const ext = ALLOWED_TYPES[file.type] ?? "jpg";
  const fileName = `${randomUUID()}.${ext}`;
  const relDir = path.posix.join("uploads", folder);
  const absDir = path.join(process.cwd(), "public", ...relDir.split("/"));
  await mkdir(absDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(/* turbopackIgnore: true */ absDir, fileName), buffer, { flag: "wx" });

  return {
    url: `/${relDir}/${fileName}`,
    publicId: `local:${relDir}/${fileName}`,
    provider: "local",
  };
}

export async function uploadImage(file: File, folder = "listings"): Promise<UploadResult> {
  assertValidImage(file);
  if (isCloudinaryConfigured()) {
    return uploadToCloudinary(file, folder);
  }
  return uploadLocal(file, folder);
}

/** Best-effort cleanup used when a listing/enquiry is removed. */
export async function deleteImage(
  result: { url: string; publicId?: string | null }
): Promise<void> {
  try {
    if (result.publicId?.startsWith("local:")) {
      const rel = result.publicId.slice("local:".length);
      const abs = path.join(/* turbopackIgnore: true */ process.cwd(), "public", ...rel.split("/"));
      // Only allow deletes inside public/uploads.
      if (abs.startsWith(path.join(process.cwd(), "public", "uploads"))) {
        await unlink(abs);
      }
      return;
    }
    if (result.publicId && isCloudinaryConfigured()) {
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME!;
      const apiKey = process.env.CLOUDINARY_API_KEY!;
      const apiSecret = process.env.CLOUDINARY_API_SECRET!;
      const timestamp = Math.floor(Date.now() / 1000);
      const toSign = `public_id=${result.publicId}&timestamp=${timestamp}${apiSecret}`;
      const signature = createHash("sha1").update(toSign).digest("hex");
      const body = new FormData();
      body.append("public_id", result.publicId);
      body.append("timestamp", String(timestamp));
      body.append("api_key", apiKey);
      body.append("signature", signature);
      await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
        method: "POST",
        body,
      });
    }
  } catch {
    /* best effort */
  }
}
