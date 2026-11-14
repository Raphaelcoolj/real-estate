/* ---------------------------------------------------------------------------
 * POST /api/media/upload — authenticated image upload.
 * Uses Cloudinary when configured, otherwise stores under public/uploads.
 * ------------------------------------------------------------------------ */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { AppError, errorMessage } from "@/lib/errors";
import { clientIp, enforceRateLimit } from "@/lib/rate-limit";
import { mediaProvider, uploadImage } from "@/lib/media";

export const runtime = "nodejs";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Sign in to upload images." }, { status: 401 });
    }
    if (user.role !== "agent" && user.role !== "admin") {
      return NextResponse.json(
        { ok: false, error: "Only agent accounts can upload listing media." },
        { status: 403 }
      );
    }

    enforceRateLimit("media-upload", clientIp(request.headers));

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "No file received." }, { status: 400 });
    }

    const folder = String(formData.get("folder") || "listings").replace(/[^a-z0-9-_]/gi, "");
    const result = await uploadImage(file, folder || "listings");

    return NextResponse.json({
      ok: true,
      data: { ...result, provider: mediaProvider() },
    });
  } catch (error) {
    const status = error instanceof AppError ? error.status : 500;
    return NextResponse.json({ ok: false, error: errorMessage(error) }, { status });
  }
}
