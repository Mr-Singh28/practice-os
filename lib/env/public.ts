import { getEnvironmentStatus, type ApplicationEnvironment } from "./environment";

type PublicEnvironmentSource = Readonly<
  Partial<
    Record<
      | "NEXT_PUBLIC_APP_ENV"
      | "NEXT_PUBLIC_APP_URL"
      | "NEXT_PUBLIC_SUPABASE_URL"
      | "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      string
    >
  >
>;

export interface PublicEnvironmentStatus {
  environment: ApplicationEnvironment;
  appUrlConfigured: boolean;
  supabaseConfigured: boolean;
  missingVariableNames: string[];
}

export function getPublicEnvironmentStatus(
  source: PublicEnvironmentSource,
): PublicEnvironmentStatus {
  const status = getEnvironmentStatus(source);

  return {
    environment: status.environment,
    appUrlConfigured: status.appUrlConfigured,
    supabaseConfigured: status.supabaseConfigured,
    missingVariableNames: status.missingPublicVariables,
  };
}
