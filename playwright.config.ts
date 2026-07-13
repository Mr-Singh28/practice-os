import { defineConfig, devices } from "@playwright/test";

const localBaseUrl = "http://127.0.0.1:3000";
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? localBaseUrl;
const shouldStartLocalServer = baseURL === localBaseUrl;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: shouldStartLocalServer
    ? {
        command: "node node_modules/next/dist/bin/next dev --hostname 127.0.0.1",
        url: `${localBaseUrl}/api/readiness`,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        env: {
          NEXT_PUBLIC_APP_ENV: "local",
          NEXT_PUBLIC_APP_URL: localBaseUrl,
          NEXT_PUBLIC_SUPABASE_URL: "https://local-test.example.invalid",
          NEXT_PUBLIC_SUPABASE_ANON_KEY: "e2e-public-placeholder",
          SUPABASE_SERVICE_ROLE_KEY: "e2e-server-secret-placeholder",
        },
      }
    : undefined,
});
