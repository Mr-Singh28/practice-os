export const applicationEnvironments = [
  "local",
  "development",
  "preview",
  "staging",
  "production",
] as const;

export type ApplicationEnvironment = (typeof applicationEnvironments)[number];

type EnvironmentSource = Readonly<Record<string, string | undefined>>;

export interface EnvironmentStatus {
  environment: ApplicationEnvironment;
  appUrlConfigured: boolean;
  supabaseConfigured: boolean;
  serverSupabaseConfigured: boolean;
  limitedMode: boolean;
  missingPublicVariables: string[];
  missingServerVariables: string[];
}

const publicVariableNames = [
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;

const serverVariableNames = ["SUPABASE_SERVICE_ROLE_KEY"] as const;

function isPresent(value: string | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function readApplicationEnvironment(source: EnvironmentSource): ApplicationEnvironment {
  const candidate = source.NEXT_PUBLIC_APP_ENV?.trim() || "local";

  if (!applicationEnvironments.includes(candidate as ApplicationEnvironment)) {
    throw new Error(
      "NEXT_PUBLIC_APP_ENV must be one of: local, development, preview, staging, production.",
    );
  }

  return candidate as ApplicationEnvironment;
}

export function getEnvironmentStatus(
  source: EnvironmentSource = process.env,
): EnvironmentStatus {
  const environment = readApplicationEnvironment(source);
  const missingPublicVariables = publicVariableNames.filter(
    (name) => !isPresent(source[name]),
  );
  const missingServerVariables = serverVariableNames.filter(
    (name) => !isPresent(source[name]),
  );

  return {
    environment,
    appUrlConfigured: isPresent(source.NEXT_PUBLIC_APP_URL),
    supabaseConfigured:
      isPresent(source.NEXT_PUBLIC_SUPABASE_URL) &&
      isPresent(source.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    serverSupabaseConfigured: isPresent(source.SUPABASE_SERVICE_ROLE_KEY),
    limitedMode: missingPublicVariables.length > 0 || missingServerVariables.length > 0,
    missingPublicVariables: [...missingPublicVariables],
    missingServerVariables: [...missingServerVariables],
  };
}
