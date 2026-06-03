import { test, expect } from "@playwright/test";

test.describe("Contact", () => {
  test("contact page has form fields", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.getByRole("heading", { name: "Contact" })).toBeVisible();
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('textarea[name="message"]')).toBeVisible();
  });

  test("submit button is visible and enabled by default", async ({ page }) => {
    await page.goto("/contact");
    const button = page.getByRole("button", { name: /enviar/i });
    await expect(button).toBeVisible();
    await expect(button).toBeEnabled();
  });

  test("empty form cannot be submitted (HTML5 required)", async ({ page }) => {
    await page.goto("/contact");
    await page.getByRole("button", { name: /enviar/i }).click();
    // HTML5 required validation keeps form visible (no success state)
    await expect(page.locator('input[name="name"]')).toBeVisible();
  });
});
