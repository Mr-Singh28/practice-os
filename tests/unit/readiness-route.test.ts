import { afterEach, describe, expect, it, vi } from "vitest";

import { GET } from "../../app/api/readiness/route";

describe("GET /api/readiness", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns 503 without exposing values when hosted configuration is incomplete", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_ENV", "preview");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "route-secret-placeholder");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");

    const response = GET();
    const responseText = await response.text();
    const payload = JSON.parse(responseText) as {
      status: string;
      environment: string;
      limitedMode: boolean;
    };

    expect(response.status).toBe(503);
    expect(payload).toMatchObject({
      status: "not_ready",
      environment: "preview",
      limitedMode: true,
    });
    expect(responseText).not.toContain("route-secret-placeholder");
  });
});
