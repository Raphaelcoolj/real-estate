/* ---------------------------------------------------------------------------
 * GET /api/health — liveness + database connectivity probe.
 * ------------------------------------------------------------------------ */

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(): Promise<NextResponse> {
  const started = Date.now();
  try {
    await connectDB();
    return NextResponse.json({
      ok: true,
      status: "healthy",
      database: "connected",
      latencyMs: Date.now() - started,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        status: "degraded",
        database: "disconnected",
        error: error instanceof Error ? error.message.slice(0, 200) : "unknown",
        latencyMs: Date.now() - started,
      },
      { status: 503 }
    );
  }
}
