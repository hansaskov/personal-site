import { existsSync, readdirSync, readFileSync } from "node:fs";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { join, relative, resolve } from "node:path";
import chromiumBin from "@sparticuz/chromium";
import { chromium } from "playwright-core";
import sharp from "sharp";
import { serveStatic } from "./static-server.mjs";

const PREVIEW_WIDTH = 1200;
const PREVIEW_HEIGHT = 675;
const PREVIEW_PATH = resolve("src", "media", "personal-site.webp");
let PDF_CACHE_DIR;

function listSlugs(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(join(dir, entry.name, "index.html")))
    .map((entry) => entry.name)
    .sort();
}

// Skip stub pages with no real content (e.g. meta-refresh redirects).
function isRedirectStub(htmlPath) {
  return readFileSync(htmlPath, "utf8").includes('http-equiv="refresh"');
}

function collectTargets(distDir) {
  const targets = [];

  for (const [dir, url] of [
    ["en/cv", "/en/cv"],
    ["da/cv", "/da/cv"],
  ]) {
    for (const slug of ["", ...listSlugs(join(distDir, dir))]) {
      const htmlPath = join(distDir, dir, slug, "index.html");
      if (!existsSync(htmlPath)) continue;
      if (isRedirectStub(htmlPath)) continue;
      // The /da/cv landing renders a CV that already has its own PDF route.
      if (dir === "da/cv" && slug === "") continue;
      targets.push({
        url: `${url}/${slug}`,
        htmlPath,
        outputPath: join(distDir, slug ? `hans-askov-cv-${slug}.pdf` : "hans-askov-cv.pdf"),
        width: 1200,
      });
    }
  }

  for (const [dir, url] of [
    ["en/application-letter", "/en/application-letter"],
    ["da/application-letter", "/da/application-letter"],
  ]) {
    for (const slug of listSlugs(join(distDir, dir))) {
      const htmlPath = join(distDir, dir, slug, "index.html");
      if (!existsSync(htmlPath)) continue;
      if (isRedirectStub(htmlPath)) continue;
      targets.push({
        url: `${url}/${slug}`,
        htmlPath,
        outputPath: join(distDir, `application-letter-${slug}.pdf`),
        format: "A3",
      });
    }
  }

  return targets;
}

const FONT_CONFIG = `<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "fonts.dtd">
<fontconfig>
  <dir>${join(tmpdir(), "pdf-fonts", "fonts")}</dir>
  <cachedir>${join(tmpdir(), "pdf-fonts-cache")}</cachedir>
</fontconfig>
`;

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

function browserArgs() {
  const onServerless = Boolean(
    process.env.VERCEL || process.env.AWS_EXECUTION_ENV || process.env.AWS_LAMBDA_JS_RUNTIME || process.env.CODEBUILD_BUILD_IMAGE,
  );

  if (onServerless) return chromiumBin.args;

  return chromiumBin.args.filter((flag) => flag !== "--single-process" && flag !== "--no-zygote");
}

const displayPath = (p) => relative(process.cwd(), p);

const shortHash = async (filePath, extra = "") =>
  createHash("sha256")
    .update(await readFile(filePath))
    .update(extra)
    .digest("hex")
    .slice(0, 16);

const cachedPdfPath = async (target) => {
  return join(PDF_CACHE_DIR, `${await shortHash(target.htmlPath, target.format ?? `auto@${target.width}`)}.pdf`);
};

const GREEN = "\x1b[32m";
const RESET = "\x1b[39m";
const DIM = "\x1b[2m";
const dim = (text) => `${DIM}${text}${RESET}`;
const logArrow = (logger, message, startedAt) =>
  logger.info(`${GREEN}  ▶${RESET} ${message}` + (startedAt === undefined ? "" : ` ${dim(`(+${Date.now() - startedAt}ms)`)}`));

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
    throw new Error(`PDF date normalization changed the byte length of ${displayPath(filePath)}, refusing to write it.`);
  }

  await writeFile(filePath, normalized);
}

const storeInCache = async (filePath, cachePath) => {
  await mkdir(PDF_CACHE_DIR, { recursive: true });
  await copyFile(filePath, cachePath);
};

async function launchBrowser(logger, hostRules) {
  try {
    return await chromium.launch({ args: [hostRules, "--hide-scrollbars"], headless: true });
  } catch (error) {
    logger.info(`No environment Chromium available (${error.message.split("\n")[0]}), falling back to @sparticuz/chromium.`);
    return chromium.launch({
      args: [...browserArgs(), hostRules, "--hide-scrollbars"],
      executablePath: await chromiumBin.executablePath(),
      headless: true,
    });
  }
}

const SITE_ORIGIN = "http://hans.askov.dk";

async function loadPage(page, url) {
  const response = await page.goto(`${SITE_ORIGIN}${url}`, { waitUntil: "networkidle" });
  if (!response?.ok()) {
    throw new Error(`Failed to load ${url} from the build output (status ${response?.status()}).`);
  }
  await page.evaluate(() => document.fonts.ready);
}

async function capturePreview(getPage, logger, distDir, startedAt) {
  const homeHtmlPath = join(distDir, "index.html");
  const cachePath = join(PDF_CACHE_DIR, `preview-${await shortHash(homeHtmlPath)}.webp`);

  if (existsSync(cachePath)) {
    const cached = await readFile(cachePath);
    if (existsSync(PREVIEW_PATH) && (await readFile(PREVIEW_PATH)).equals(cached)) {
      logArrow(logger, `${displayPath(PREVIEW_PATH)} ${dim("(unchanged)")}`, startedAt);
      return;
    }

    await copyFile(cachePath, PREVIEW_PATH);
    logArrow(logger, `${displayPath(PREVIEW_PATH)} ${dim("(reused cache entry)")}`, startedAt);
    return;
  }

  const page = await getPage();
  await loadPage(page, "/");
  await page.setViewportSize({ width: PREVIEW_WIDTH, height: PREVIEW_HEIGHT });
  const screenshot = await page.screenshot({ type: "png" });
  const preview = await sharp(screenshot).webp({ quality: 80 }).toBuffer();

  await writeFile(PREVIEW_PATH, preview);
  await storeInCache(PREVIEW_PATH, cachePath);
  logArrow(logger, `${displayPath(PREVIEW_PATH)} ${dim("(picked up by the next build)")}`, startedAt);
}

export async function postBuild(distDir, cacheDir, logger) {
  PDF_CACHE_DIR = join(cacheDir, "post-build-media");
  const startedAt = Date.now();
  const targets = collectTargets(distDir);
  await installFonts();
  logger.info("printing PDFs and capturing preview...");

  const { server, hitsServed } = await serveStatic(distDir);
  const { port } = server.address();

  /** @type {Promise<import("playwright-core").Browser> | undefined} */
  let browserPromise;
  const getBrowser = () => {
    browserPromise ??= launchBrowser(logger, `--host-resolver-rules=MAP hans.askov.dk 127.0.0.1:${port}`);
    return browserPromise;
  };

  let pagePromise;
  const getPage = () => {
    pagePromise ??= (async () => {
      const page = await (await getBrowser()).newPage();
      page.on("requestfailed", (request) => {
        logger.warn(`Request failed: ${request.url()} — ${request.failure()?.errorText}`);
      });
      return page;
    })();
    return pagePromise;
  };

  try {
    let printed = 0;
    for (const target of targets) {
      const itemStartedAt = Date.now();
      const cachePath = await cachedPdfPath(target);

      if (existsSync(cachePath)) {
        await copyFile(cachePath, target.outputPath);
        logArrow(logger, `${displayPath(target.outputPath)} ${dim("(reused cache entry)")}`, itemStartedAt);
        continue;
      }

      const page = await getPage();

      if (target.width) {
        await page.setViewportSize({ width: target.width, height: 1662 });
      }

      await loadPage(page, target.url);

      if (printed === 0 && hitsServed() === 0) {
        throw new Error(`--host-resolver-rules did not map ${SITE_ORIGIN} to the local static server; refusing to print the live site.`);
      }

      const pdfOptions = target.format
        ? { format: target.format }
        : {
            width: target.width,
            height: `${(await page.evaluate(() => document.documentElement.scrollHeight)) + 1}px`,
          };

      await page.pdf({
        path: target.outputPath,
        printBackground: true,
        tagged: true,
        ...pdfOptions,
      });
      await normalizePdfDates(target.outputPath);
      await storeInCache(target.outputPath, cachePath);
      printed++;

      logArrow(logger, displayPath(target.outputPath), itemStartedAt);
    }

    if (!existsSync(join(distDir, "index.html"))) {
      logger.warn("No homepage in the build output, skipping preview image capture.");
    } else {
      await capturePreview(getPage, logger, distDir, Date.now());
    }

    logger.info(`✓ Completed in ${Date.now() - startedAt}ms.`);
  } finally {
    const browser = await browserPromise;
    if (browser) await browser.close();
    server.closeAllConnections();
    await new Promise((resolvePromise) => server.close(resolvePromise));
  }
}
