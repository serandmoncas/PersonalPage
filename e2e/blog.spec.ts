import { test, expect } from "@playwright/test";

test.describe("Blog", () => {
  test("blog list shows at least one post", async ({ page }) => {
    await page.goto("/blog");
    const articles = page.locator("article");
    await expect(articles.first()).toBeVisible();
  });

  test("clicking a post navigates to post detail", async ({ page }) => {
    await page.goto("/blog");
    const firstLink = page.locator("article a").first();
    const href = await firstLink.getAttribute("href");
    await firstLink.click();
    await expect(page).toHaveURL(href ?? /\/blog\//);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("blog post page shows content", async ({ page }) => {
    await page.goto("/blog/hello-world");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator("article")).toBeVisible();
  });
});
