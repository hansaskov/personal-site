import { expect, test } from "@playwright/test";
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";

function getLetterPages() {
  const letterDistPath = path.resolve("dist", "application-letter");

  if (!existsSync(letterDistPath)) {
    throw new Error(
      "Application letter build output was not found. Run `pnpm build` before printing PDFs.",
    );
  }

  return readdirSync(letterDistPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
    .map((slug) => ({
      url: `/application-letter/${slug}`,
      outputPath: `./public/application-letter-${slug}.pdf`,
    }));
}

test("prints every application letter page to PDF", async ({ page }) => {
  const letterPages = getLetterPages();

  expect(letterPages.length).toBeGreaterThan(0);

  for (const letterPage of letterPages) {
    await page.goto(letterPage.url);
    await page.pdf({
      path: letterPage.outputPath,
      printBackground: true,
      tagged: true,
      height: 1648,
      width: 1240,
    });
  }
});
