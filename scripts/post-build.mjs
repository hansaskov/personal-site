import { existsSync, readdirSync, statSync } from "node:fs";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { extname, isAbsolute, join, relative, resolve } from "node:path";
import chromiumBin from "@sparticuz/chromium";
import { chromium } from "playwright-core";
import sharp from "sharp";

const PREVIEW_WIDTH = 1200;
const PREVIEW_HEIGHT = 675;
const PREVIEW_PATH = resolve("src", "media", "personal-site.webp");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".pdf": "application/pdf",
};

function listSlugs(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(join(dir, entry.name, "index.html")))
    .map((entry) => entry.name)
    .sort();
}

function collectTargets(distDir) {
  const targets = [];

  if (existsSync(join(distDir, "cv", "index.html"))) {
    targets.push({
      url: "/cv",
      outputPath: join(distDir, "hans-askov-cv.pdf"),
      width: 1200,
      height: 1662,
    });
  }

  for (const slug of listSlugs(join(distDir, "cv"))) {
    targets.push({
      url: `/cv/${slug}`,
      outputPath: join(distDir, `hans-askov-cv-${slug}.pdf`),
      width: 1200,
      height: 1662,
    });
  }

  for (const slug of listSlugs(join(distDir, "application-letter"))) {
    targets.push({
      url: `/application-letter/${slug}`,
      outputPath: join(distDir, `application-letter-${slug}.pdf`),
      format: "A3",
    });
  }

  return targets;
}

function serveStatic(rootInput) {
  const root = resolve(rootInput);
  let hits = 0;
  const server = createServer(async (req, res) => {
    hits++;
    try {
      const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
      let filePath = resolve(root, "." + pathname);
      const relativePath = relative(root, filePath);

      if (relativePath.startsWith("..") || isAbsolute(relativePath)) {
        res.writeHead(403).end();
        return;
      }

      if (statSync(filePath, { throwIfNoEntry: false })?.isDirectory()) {
        filePath = join(filePath, "index.html");
      }

      if (!existsSync(filePath)) {
        res.writeHead(404).end();
        return;
      }

      res.writeHead(200, {
        "content-type": MIME_TYPES[extname(filePath)] ?? "application/octet-stream",
      });
      res.end(await readFile(filePath));
    } catch {
      res.writeHead(500).end();
    }
  });

  return new Promise((resolvePromise, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolvePromise({ server, hitsServed: () => hits }));
  });
}

const FONT_CONFIG = `<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "fonts.dtd">
<fontconfig>
  <dir>${join(tmpdir(), "pdf-fonts", "fonts")}</dir>
  <cachedir>${join(tmpdir(), "pdf-fonts-cache")}</cachedir>
</fontconfig>
`;

// A private fontconfig environment with only the vendored Noto Sans makes the
// PDF output identical everywhere (local, Forgejo, Vercel), independent of the
// system's installed fonts and aliases (e.g. Arial → Liberation Sans).
async function installFonts() {
  const fontRoot = join(tmpdir(), "pdf-fonts");
  const fontDir = join(fontRoot, "fonts");
  await mkdir(fontDir, { recursive: true });
  await mkdir(join(tmpdir(), "pdf-fonts-cache"), { recursive: true });

  const vendorDir = resolve("fonts");
  for (const font of existsSync(vendorDir) ? readdirSync(vendorDir) : []) {
    await copyFile(join(vendorDir, font), join(fontDir, font));
  }

  await writeFile(join(fontRoot, "fonts.conf"), FONT_CONFIG);
  process.env.FONTCONFIG_PATH = fontRoot;
  process.env.HOME ??= tmpdir();
}

// On Lambda/AL2023 sparticuz needs --single-process to survive its sandbox
// (prctl PR_SET_NO_NEW_PRIVS). Everywhere else that mode makes chromium hit a
// CHECK failure on shutdown (SIGTRAP + coredump after every build), so drop it.
function browserArgs() {
  const onServerless = Boolean(
    process.env.VERCEL ||
    process.env.AWS_EXECUTION_ENV ||
    process.env.AWS_LAMBDA_JS_RUNTIME ||
    process.env.CODEBUILD_BUILD_IMAGE,
  );

  if (onServerless) return chromiumBin.args;

  return chromiumBin.args.filter((flag) => flag !== "--single-process" && flag !== "--no-zygote");
}

const displayPath = (p) => relative(process.cwd(), p);

// Skia stamps /CreationDate and /ModDate into every PDF, so the bytes (and
// therefore asset hashes/caches) differ on every build even when the content
// is identical. Both date strings are a fixed length, so overwriting them with
// a constant timestamp shifts no bytes and keeps every xref offset valid.
const FIXED_PDF_DATE = "D:20000101000000+00'00'";

const PDF_DATE_RE = /((?:CreationDate|ModDate) \()D:[^)]+\)/g;

async function normalizePdfDates(filePath) {
  const raw = await readFile(filePath);
  const text = raw.toString("latin1");
  const stampCount = text.match(PDF_DATE_RE)?.length ?? 0;
  if (stampCount === 0) {
    throw new Error(
      `No PDF date stamps found in ${displayPath(filePath)}; metadata may live in a compressed object stream — hashes are not deterministic.`,
    );
  }

  const normalized = Buffer.from(text.replace(PDF_DATE_RE, `$1${FIXED_PDF_DATE})`), "latin1");

  if (normalized.length !== raw.length) {
    throw new Error(
      `PDF date normalization changed the byte length of ${displayPath(filePath)}, refusing to write it.`,
    );
  }

  await writeFile(filePath, normalized);
}

async function capturePreview(page, logger) {
  const response = await page.goto(`${SITE_ORIGIN}/`, { waitUntil: "networkidle" });

  if (!response?.ok()) {
    throw new Error(`Failed to load / from the build output (status ${response?.status()}).`);
  }

  await page.evaluate(() => document.fonts.ready);
  await page.setViewportSize({ width: PREVIEW_WIDTH, height: PREVIEW_HEIGHT });
  const screenshot = await page.screenshot({ type: "png" });
  const preview = await sharp(screenshot).webp({ quality: 80 }).toBuffer();

  const current = existsSync(PREVIEW_PATH) ? await readFile(PREVIEW_PATH) : null;
  if (current?.equals(preview)) {
    logger.info(`Homepage preview is unchanged, keeping ${displayPath(PREVIEW_PATH)}`);
    return;
  }

  await writeFile(PREVIEW_PATH, preview);
  logger.info(
    `Captured homepage preview → ${displayPath(PREVIEW_PATH)} (picked up by the next build)`,
  );
}

const SITE_ORIGIN = "http://hans.askov.dk";

export async function postBuild(distDir, logger) {
  const targets = collectTargets(distDir);
  await installFonts();

  const { server, hitsServed } = await serveStatic(distDir);
  const { port } = server.address();

  // Navigate to the production origin so link annotations inside the PDFs are
  // stable and point at the real site, while chromium actually connects to the
  // local static server (the same trick as the old CI /etc/hosts entry).
  const hostRules = `--host-resolver-rules=MAP hans.askov.dk 127.0.0.1:${port}`;

  // Prefer the environment's own Chromium (Playwright image in CI, local
  // Playwright install). @sparticuz/chromium is the fallback for serverless
  // builds where no browser is preinstalled.
  let browser;
  try {
    browser = await chromium.launch({ args: [hostRules], headless: true });
  } catch (error) {
    logger.info(
      `No environment Chromium available (${error.message.split("\n")[0]}), falling back to @sparticuz/chromium.`,
    );
    browser = await chromium.launch({
      args: [...browserArgs(), hostRules],
      executablePath: await chromiumBin.executablePath(),
      headless: true,
    });
  }

  try {
    const page = await browser.newPage();
    page.on("requestfailed", (request) => {
      logger.warn(`Request failed: ${request.url()} — ${request.failure()?.errorText}`);
    });

    for (const [index, target] of targets.entries()) {
      const response = await page.goto(`${SITE_ORIGIN}${target.url}`, {
        waitUntil: "networkidle",
      });

      if (!response?.ok()) {
        throw new Error(
          `Failed to load ${target.url} from the build output (status ${response?.status()}).`,
        );
      }

      if (index === 0 && hitsServed() === 0) {
        throw new Error(
          `--host-resolver-rules did not map ${SITE_ORIGIN} to the local static server; refusing to print the live site.`,
        );
      }

      await page.evaluate(() => document.fonts.ready);
      await page.pdf({
        path: target.outputPath,
        printBackground: true,
        tagged: true,
        ...(target.format
          ? { format: target.format }
          : { width: target.width, height: target.height }),
      });
      await normalizePdfDates(target.outputPath);

      logger.info(`Printed ${target.url} → ${displayPath(target.outputPath)}`);
    }

    if (!existsSync(join(distDir, "index.html"))) {
      logger.warn("No homepage in the build output, skipping preview image capture.");
    } else {
      await capturePreview(page, logger);
    }
  } finally {
    await browser.close();
    server.closeAllConnections();
    await new Promise((resolvePromise) => server.close(resolvePromise));
  }
}
