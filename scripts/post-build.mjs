import { existsSync, readdirSync, statSync } from "node:fs";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { extname, isAbsolute, join, relative, resolve } from "node:path";
import chromiumBin from "@sparticuz/chromium";
import { chromium } from "playwright-core";
import sharp from "sharp";

const PREVIEW_WIDTH = 1200;
const PREVIEW_HEIGHT = 675;
const PREVIEW_PATH = resolve("src", "media", "personal-site.webp");
// Set from the integration: Astro's configured cacheDir (node_modules/.astro
// by default), same place the content-layer cache lives.
let PDF_CACHE_DIR;

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
      htmlPath: join(distDir, "cv", "index.html"),
      outputPath: join(distDir, "hans-askov-cv.pdf"),
      width: 1200,
      height: 1662,
    });
  }

  for (const slug of listSlugs(join(distDir, "cv"))) {
    targets.push({
      url: `/cv/${slug}`,
      htmlPath: join(distDir, "cv", slug, "index.html"),
      outputPath: join(distDir, `hans-askov-cv-${slug}.pdf`),
      width: 1200,
      height: 1662,
    });
  }

  for (const slug of listSlugs(join(distDir, "application-letter"))) {
    targets.push({
      url: `/application-letter/${slug}`,
      htmlPath: join(distDir, "application-letter", slug, "index.html"),
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

// ponytail: chromium version not part of the key — bump PDF_CACHE_DIR manually
// if a chromium upgrade ever changes rendering.
const cachedPdfPath = async (target) => {
  const key = createHash("sha256")
    .update(await readFile(target.htmlPath))
    .update(target.format ?? `${target.width}x${target.height}`)
    .digest("hex")
    .slice(0, 16);
  return join(PDF_CACHE_DIR, `${key}.pdf`);
};

// Astro-style progress line: green arrow + only the output path.
const GREEN = "\x1b[32m";
const RESET = "\x1b[39m";
const logArrow = (logger, message) => logger.info(`${GREEN}  ▶${RESET} ${message}`);

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

  if (existsSync(PREVIEW_PATH)) {
    const current = await readFile(PREVIEW_PATH);
    if (current.equals(preview)) {
      logArrow(logger, `${displayPath(PREVIEW_PATH)} (unchanged)`);
      return;
    }
  }

  await writeFile(PREVIEW_PATH, preview);
  logArrow(logger, `${displayPath(PREVIEW_PATH)} (picked up by the next build)`);
}

const SITE_ORIGIN = "http://hans.askov.dk";

export async function postBuild(distDir, cacheDir, logger) {
  PDF_CACHE_DIR = join(cacheDir, "post-build-media");
  const startedAt = Date.now();
  const targets = collectTargets(distDir);
  await installFonts();
  logger.info("printing PDFs and capturing preview...");

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

    let printed = 0;
    for (const target of targets) {
      const cachePath = await cachedPdfPath(target);

      if (existsSync(cachePath)) {
        await copyFile(cachePath, target.outputPath);
        logArrow(logger, `${displayPath(target.outputPath)} (reused cache entry)`);
        continue;
      }

      const response = await page.goto(`${SITE_ORIGIN}${target.url}`, {
        waitUntil: "networkidle",
      });

      if (!response?.ok()) {
        throw new Error(
          `Failed to load ${target.url} from the build output (status ${response?.status()}).`,
        );
      }

      if (printed === 0 && hitsServed() === 0) {
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

      await mkdir(PDF_CACHE_DIR, { recursive: true });
      await copyFile(target.outputPath, cachePath);
      printed++;

      logArrow(logger, displayPath(target.outputPath));
    }

    if (!existsSync(join(distDir, "index.html"))) {
      logger.warn("No homepage in the build output, skipping preview image capture.");
    } else {
      await capturePreview(page, logger);
    }

    logger.info(`✓ Completed in ${Date.now() - startedAt}ms.`);
  } finally {
    await browser.close();
    server.closeAllConnections();
    await new Promise((resolvePromise) => server.close(resolvePromise));
  }
}
