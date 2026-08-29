import { existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, isAbsolute, join, relative, resolve } from "node:path";
import { readFile } from "node:fs/promises";

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

// Static file server for a build output directory. Resolves once listening;
// kill the returned server (or its process) to stop it. Used by the PDF
// pipeline and, via preview-dist.mjs, by the Playwright webServer — unlike
// `astro preview` it stays in the foreground and leaves nothing running.
export function serveStatic(rootInput, { port = 0, host = "127.0.0.1" } = {}) {
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
    server.listen(port, host, () => resolvePromise({ server, hitsServed: () => hits }));
  });
}
