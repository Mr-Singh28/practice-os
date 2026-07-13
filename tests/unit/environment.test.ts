import { describe, expect, it } from "vitest";

import { getEnvironmentStatus } from "../../lib/env/environment";
import { requireHostedEnvironment } from "../../lib/env/server";

describe("getEnvironmentStatus", () => {
  it("supports a documented limited local mode without hosted credentials", () => {
    expect(getEnvironmentStatus({})).toEqual({
      environment: "local",
      appUrlConfigured: false,
      supabaseConfigured: false,
      serverSupabaseConfigured: false,
      limitedMode: true,
      missingPublicVariables: [
        "NEXT_PUBLIC_APP_URL",
        "NEXT_PUBLIC_SUPABASE_URL",
        "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      ],
      missingServerVariables: ["SUPABASE_SERVICE_ROLE_KEY"],
    });
  });

  it("reports configuration presence without returning values", () => {
    const status = getEnvironmentStatus({
      NEXT_PUBLIC_APP_ENV: "preview",
      NEXT_PUBLIC_APP_URL: "https://preview.example.invalid",
      NEXT_PUBLIC_SUPABASE_URL: "https://project.example.invalid",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "public-test-value",
      SUPABASE_SERVICE_ROLE_KEY: "server-secret-value",
    });

    expect(status).toEqual({
      environment: "preview",
      appUrlConfigured: true,
      supabaseConfigured: true,
      serverSupabaseConfigured: true,
      limitedMode: false,
      missingPublicVariables: [],
      missingServerVariables: [],
    });
    expect(JSON.stringify(status)).not.toContain("public-test-value");
    expect(JSON.stringify(status)).not.toContain("server-secret-value");
  });

  it("rejects an unknown environment without including its supplied value", () => {
    expect(() =>
      getEnvironmentStatus({ NEXT_PUBLIC_APP_ENV: "secret-invalid-value" }),
    ).toThrow("NEXT_PUBLIC_APP_ENV");

    try {
      getEnvironmentStatus({ NEXT_PUBLIC_APP_ENV: "secret-invalid-value" });
    } catch (error) {
      expect(String(error)).not.toContain("secret-invalid-value");
    }
  });

  it("rejects limited mode for a hosted development environment", () => {
    const source = {
      NEXT_PUBLIC_APP_ENV: "development",
      NEXT_PUBLIC_APP_URL: "https://development.example.invalid",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "do-not-leak-this-value",
    };

    expect(() => requireHostedEnvironment(source)).toThrow("NEXT_PUBLIC_SUPABASE_URL");

    try {
      requireHostedEnvironment(source);
    } catch (error) {
      expect(String(error)).not.toContain("do-not-leak-this-value");
      expect(String(error)).not.toContain("development.example.invalid");
    }
  });
});
