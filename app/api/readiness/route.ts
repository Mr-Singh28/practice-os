import { NextResponse } from "next/server";

import { createReadinessPayload } from "@/lib/validation/readiness";

export const dynamic = "force-dynamic";

export function GET() {
  const payload = createReadinessPayload(process.env, {
    version:
      process.env.VERCEL_GIT_COMMIT_SHA ??
      process.env.npm_package_version ??
      "development",
    buildTimestamp: process.env.BUILD_TIMESTAMP,
  });

  return NextResponse.json(payload, {
    status: payload.status === "ready" ? 200 : 503,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
