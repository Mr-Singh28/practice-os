import { getEnvironmentStatus, type EnvironmentStatus } from "./environment";

type EnvironmentSource = Readonly<Record<string, string | undefined>>;

export function requireHostedEnvironment(
  source: EnvironmentSource = process.env,
): EnvironmentStatus {
  const status = getEnvironmentStatus(source);

  if (status.environment !== "local" && status.limitedMode) {
    const missingNames = [
      ...status.missingPublicVariables,
      ...status.missingServerVariables,
    ];

    throw new Error(
      `Missing required environment variables: ${missingNames.join(", ")}.`,
    );
  }

  return status;
}
