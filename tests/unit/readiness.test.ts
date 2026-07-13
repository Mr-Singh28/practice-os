import { describe, expect, it } from "vitest";

import { createReadinessPayload } from "../../lib/validation/readiness";

describe("createReadinessPayload", () => {
  it("returns safe configuration presence and build metadata", () => {
    const payload = createReadinessPayload(
      {
        NEXT_PUBLIC_APP_ENV: "staging",
        NEXT_PUBLIC_APP_URL: "https://staging.example.invalid",
        NEXT_PUBLIC_SUPABASE_URL: "https://database.example.invalid",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-sensitive-value",
        SUPABASE_SERVICE_ROLE_KEY: "role-sensitive-value",
      },
      {
        version: "abc123",
        buildTimestamp: "2026-07-13T00:00:00.000Z",
      },
    );

    expect(payload).toEqual({
      status: "ready",
      environment: "staging",
      version: "abc123",
      buildTimestamp: "2026-07-13T00:00:00.000Z",
      limitedMode: false,
      configuration: {
        NEXT_PUBLIC_APP_URL: true,
        NEXT_PUBLIC_SUPABASE_URL: true,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: true,
        SUPABASE_SERVICE_ROLE_KEY: true,
      },
    });

    const serialized = JSON.stringify(payload);
    expect(serialized).not.toContain("anon-sensitive-value");
    expect(serialized).not.toContain("role-sensitive-value");
    expect(serialized).not.toContain("database.example.invalid");
  });

  it("reports not ready when a hosted environment is missing configuration", () => {
    const payload = createReadinessPayload({
      NEXT_PUBLIC_APP_ENV: "preview",
    });

    expect(payload.status).toBe("not_ready");
    expect(payload.environment).toBe("preview");
    expect(payload.limitedMode).toBe(true);
  });
});
