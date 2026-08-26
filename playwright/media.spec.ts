import { test } from "@playwright/test";
import path from "node:path";
import sharp from "sharp";

test.use({ viewport: { width: 1200, height: 675 } });

test("captures the homepage preview image", async ({ page }) => {
  await page.goto("/");

  const screenshot = await page.screenshot({ type: "png" });

  await sharp(screenshot)
    .webp({ quality: 80 })
    .toFile(path.resolve("src", "media", "personal-site.webp"));
});
