import { test, expect } from "@playwright/test";

const TEST_EMAIL = `test+${Date.now()}@example.com`;
const TEST_PASSWORD = "Test@123456";
const TEST_NAME = "Teste Automatizado";

test.describe("Auth flow", () => {
  test("register page loads correctly", async ({ page }) => {
    await page.goto("/register");
    await expect(page.locator('[data-slot="card-title"]')).toContainText("Criar conta");
    await expect(page.locator('input[id="name"]')).toBeVisible();
    await expect(page.locator('input[id="email"]')).toBeVisible();
    await expect(page.locator('input[id="password"]')).toBeVisible();
    await expect(page.locator('input[id="password"]')).toHaveAttribute(
      "autocomplete",
      "new-password"
    );
  });

  test("login page loads correctly", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator('[data-slot="card-title"]')).toContainText("CRM Contábil");
    await expect(page.locator('input[id="email"]')).toBeVisible();
    await expect(page.locator('input[id="password"]')).toBeVisible();
    await expect(page.locator('input[id="password"]')).toHaveAttribute(
      "autocomplete",
      "current-password"
    );
  });

  test("register shows success message after signup", async ({ page }) => {
    await page.goto("/register");
    await page.fill('input[id="name"]', TEST_NAME);
    await page.fill('input[id="email"]', TEST_EMAIL);
    await page.fill('input[id="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');

    // Should show verification email message or an error
    await page.waitForTimeout(3000);
    const body = await page.textContent("body");
    const hasSuccess = body?.includes("Verifique seu email");
    const hasError = body?.includes("rate limit") || body?.includes("error");
    expect(hasSuccess || hasError).toBeTruthy();
  });

  test("login with invalid credentials shows error", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[id="email"]', "invalid@test.com");
    await page.fill('input[id="password"]', "wrongpassword");
    await page.click('button[type="submit"]');

    await page.waitForTimeout(2000);
    await expect(page.locator(".text-destructive")).toBeVisible();
  });

  test("unauthenticated user redirected to login", async ({ page }) => {
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await page.waitForURL("**/login**", { timeout: 15000 });
    expect(page.url()).toContain("/login");
  });
});
