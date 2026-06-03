import { test, expect } from "@playwright/test";

test.describe("Newsletter", () => {
  test("footer shows newsletter form with email input", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator("footer");
    await expect(footer.getByRole("textbox", { name: /email/i })).toBeVisible();
    await expect(footer.getByRole("button", { name: /suscribir/i })).toBeVisible();
  });

  test("empty email is blocked by HTML5 required", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator("footer");
    await footer.getByRole("button", { name: /suscribir/i }).click();
    // HTML5 required keeps form visible (no success state rendered)
    await expect(footer.getByRole("textbox", { name: /email/i })).toBeVisible();
  });
});
