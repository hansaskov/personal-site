import { expect, test } from "@playwright/test";
import { existsSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const distPath = path.resolve("dist");
const PREVIEW_PATH = path.resolve("dist", "preview.webp");

function requireDist() {
  if (!existsSync(distPath)) {
    throw new Error("Build output was not found. Run `pnpm build` first.");
  }
}

test("preview image keeps its dimensions", async () => {
  requireDist();
  expect(existsSync(PREVIEW_PATH), "preview image is missing from dist/").toBe(true);

  const metadata = await sharp(PREVIEW_PATH).metadata();
  expect(metadata.format).toBe("webp");
  expect(metadata.width).toBe(1200);
  expect(metadata.height).toBe(675);
});
