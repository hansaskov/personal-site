import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const DIST = join(ROOT, "dist");
const SITE_HOST = "hans.askov.dk";
const TAG_RE = /<([a-z][\w:-]*)\b([^>]*)>/gi;
const ATTR_RE = /([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g;
const ENTITY_RE = /&(?:#x([0-9a-f]+)|#(\d+)|(amp|quot|apos|lt|gt));/gi;
const ENTITIES = { amp: "&", quot: '"', apos: "'", lt: "<", gt: ">" };

function listFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? listFiles(path) : [path];
  });
}

function decodeHtml(value) {
  return value.replace(ENTITY_RE, (_, hex, decimal, named) => {
    if (hex) return String.fromCodePoint(Number.parseInt(hex, 16));
    if (decimal) return String.fromCodePoint(Number.parseInt(decimal, 10));
    return ENTITIES[named.toLowerCase()];
  });
}

function referencesIn(html) {
  const references = [];

  for (const tagMatch of html.replace(/<!--[\s\S]*?-->/g, "").matchAll(TAG_RE)) {
    const tag = tagMatch[1].toLowerCase();
    const attrs = {};

    for (const attrMatch of tagMatch[2].matchAll(ATTR_RE)) {
      attrs[attrMatch[1].toLowerCase()] = attrMatch[2] ?? attrMatch[3] ?? attrMatch[4] ?? "";
    }

    // Canonical URLs describe the public route, which does not always match the
    // generated file path (e.g. 404.html is canonicalized as /404/).
    const rels = (attrs.rel ?? "").toLowerCase().split(/\s+/);
    if (tag === "link" && rels.includes("canonical")) continue;

    if (attrs.href !== undefined) references.push(attrs.href);
    if (attrs.src !== undefined) references.push(attrs.src);
  }

  return references;
}

function pageUrl(file) {
  const relativePath = relative(DIST, file).split(sep).join("/");
  const pathname = relativePath === "index.html" ? "/" : `/${relativePath.replace(/index\.html$/, "")}`;
  return new URL(pathname, `https://${SITE_HOST}`);
}

// Returns a pathname for local references, null for references that should be
// ignored (fragments and other hosts), and the raw value if it cannot be parsed.
function internalPath(raw, base) {
  const value = decodeHtml(raw).trim();
  if (!value || value.startsWith("#")) return null;

  let url;
  try {
    url = new URL(value, base);
  } catch {
    return value;
  }

  if (url.hostname !== SITE_HOST) return null;
  return url.pathname;
}

// Mirrors scripts/static-server.mjs: directories are served via index.html.
function localFile(pathname) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }

  const file = resolve(DIST, "." + decoded);
  if (file !== DIST && !file.startsWith(DIST + sep)) return null;

  let stats;
  try {
    stats = statSync(file, { throwIfNoEntry: false });
  } catch {
    return null;
  }

  if (!stats) return null;
  if (stats.isDirectory()) {
    const index = join(file, "index.html");
    return existsSync(index) ? index : null;
  }

  return stats.isFile() ? file : null;
}

test("every internal link and asset in the build resolves", (t) => {
  if (!existsSync(join(DIST, "index.html"))) {
    assert.fail("Build output was not found. Run `pnpm build` first.");
  }

  const pages = listFiles(DIST)
    .filter((file) => file.endsWith(".html"))
    .sort();
  assert.notEqual(pages.length, 0, "No HTML pages found in dist/.");

  const broken = new Map();
  let references = 0;

  for (const page of pages) {
    const html = readFileSync(page, "utf8");
    const base = pageUrl(page);
    const source = relative(DIST, page).split(sep).join("/");

    for (const raw of referencesIn(html)) {
      const pathname = internalPath(raw, base);
      if (pathname === null) continue;

      references++;
      if (localFile(pathname)) continue;

      if (!broken.has(pathname)) broken.set(pathname, { raw, pages: new Set() });
      broken.get(pathname).pages.add(source);
    }
  }

  t.diagnostic(`Checked ${references} internal reference(s) across ${pages.length} page(s).`);

  const details = [...broken]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([pathname, { raw, pages: sources }]) => {
      const list = [...sources].sort();
      const shown = list.slice(0, 3).join(", ") + (list.length > 3 ? `, +${list.length - 3} more` : "");
      const suffix = pathname === raw ? "" : ` (from "${raw}")`;
      return `  ${pathname}${suffix} — referenced by ${shown}`;
    })
    .join("\n");

  assert.equal(broken.size, 0, `Found ${broken.size} broken internal reference(s):\n${details}`);
});
