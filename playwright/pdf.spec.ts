import { expect, test } from "@playwright/test";
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";

function getCvPages() {
  const cvDistPath = path.resolve("dist", "cv");

  if (!existsSync(cvDistPath)) {
    throw new Error("CV build output was not found. Run `pnpm build` before printing PDFs.");
  }

  const slugPages = readdirSync(cvDistPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
    .map((slug) => ({
      url: `/cv/${slug}`,
      outputPath: `./public/hans-askov-cv-${slug}.pdf`,
    }));

  return [
    {
      url: "/cv",
      outputPath: "./public/hans-askov-cv.pdf",
    },
    ...slugPages,
  ];
}

test("prints every CV page to PDF", async ({ page }) => {
  const cvPages = getCvPages();

  expect(cvPages.length).toBeGreaterThan(1);

  for (const cvPage of cvPages) {
    await page.goto(cvPage.url);
    await page.pdf({
      path: cvPage.outputPath,
      printBackground: true,
      tagged: true,
      height: 1648,
      width: 1240,
    });
  }
});
