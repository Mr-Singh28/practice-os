import { expect, test } from "@playwright/test";

const forbiddenValues = [
  "https://local-test.example.invalid",
  "e2e-public-placeholder",
  "e2e-server-secret-placeholder",
];

test("@smoke foundation homepage and readiness endpoint are safe", async ({
  page,
  request,
}) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Practice OS foundation" }),
  ).toBeVisible();
  await expect(page.getByTestId("environment-indicator")).toBeVisible();
  await expect(page.locator("body")).not.toContainText("Application error");

  const pageText = await page.locator("body").innerText();
  for (const forbiddenValue of forbiddenValues) {
    expect(pageText).not.toContain(forbiddenValue);
  }

  const response = await request.get("/api/readiness");
  expect(response.ok()).toBe(true);

  const responseText = await response.text();
  const readiness = JSON.parse(responseText) as {
    status: string;
    environment: string;
    configuration: Record<string, boolean>;
  };

  expect(readiness.status).toBe("ready");
  expect(readiness.environment).toBe("local");
  expect(readiness.configuration).toEqual({
    NEXT_PUBLIC_APP_URL: true,
    NEXT_PUBLIC_SUPABASE_URL: true,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: true,
    SUPABASE_SERVICE_ROLE_KEY: true,
  });

  for (const forbiddenValue of forbiddenValues) {
    expect(responseText).not.toContain(forbiddenValue);
  }
});
