import { expect, test } from "@playwright/test";

test("customer can sign in from the public login page", async ({ page }) => {
  test.setTimeout(60_000);

  await page.goto("/login");

  await page.getByLabel(/email/i).fill("customer@datapulse.local");
  await page.getByLabel(/password/i).fill("customer123-local-only");

  const loginResponse = page.waitForResponse(
    (response) => response.url().includes("/auth/login") && response.request().method() === "POST",
  );
  await page.getByRole("button", { name: /^sign in$/i }).click();

  expect((await loginResponse).ok()).toBe(true);
  await expect(page).toHaveURL(/\/account/, { timeout: 30_000 });
  await expect(page.getByRole("banner").getByRole("link", { name: /^Account$/ })).toBeVisible();
  await expect(page.getByText(/order history|account|orders/i).first()).toBeVisible();
});
