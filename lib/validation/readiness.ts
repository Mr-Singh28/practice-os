import { getEnvironmentStatus } from "../env/environment";

type EnvironmentSource = Readonly<Record<string, string | undefined>>;

export interface BuildMetadata {
  version?: string;
  buildTimestamp?: string;
}

export interface ReadinessPayload {
  status: "ready" | "not_ready";
  environment: string;
  version: string;
  buildTimestamp: string;
  limitedMode: boolean;
  configuration: {
    NEXT_PUBLIC_APP_URL: boolean;
    NEXT_PUBLIC_SUPABASE_URL: boolean;
    NEXT_PUBLIC_SUPABASE_ANON_KEY: boolean;
    SUPABASE_SERVICE_ROLE_KEY: boolean;
  };
}

export function createReadinessPayload(
  source: EnvironmentSource = process.env,
  metadata: BuildMetadata = {},
): ReadinessPayload {
  const environmentStatus = getEnvironmentStatus(source);
  const isReady =
    environmentStatus.environment === "local" || !environmentStatus.limitedMode;

  return {
    status: isReady ? "ready" : "not_ready",
    environment: environmentStatus.environment,
    version: metadata.version?.trim() || "development",
    buildTimestamp: metadata.buildTimestamp?.trim() || "not-provided",
    limitedMode: environmentStatus.limitedMode,
    configuration: {
      NEXT_PUBLIC_APP_URL: environmentStatus.appUrlConfigured,
      NEXT_PUBLIC_SUPABASE_URL: Boolean(source.NEXT_PUBLIC_SUPABASE_URL?.trim()),
      NEXT_PUBLIC_SUPABASE_ANON_KEY: Boolean(
        source.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim(),
      ),
      SUPABASE_SERVICE_ROLE_KEY: environmentStatus.serverSupabaseConfigured,
    },
  };
}
