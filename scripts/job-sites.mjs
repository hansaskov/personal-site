const SITES = {
  jobindex: { base: "https://www.jobindex.dk", label: "jobindex.dk" },
  "it-jobbank": { base: "https://www.it-jobbank.dk", label: "it-jobbank.dk" },
};

const REGIONS = {
  odense: "73",
  fyn: "15179",
  koebenhavn: "15182",
  kbh: "15182",
  storkbh: "15182",
  nordsj: "15187",
  sydjylland: "15180",
  regionhovedstaden: "1",
  regionmidtjylland: "2",
  regionnordjylland: "3",
  regionsjaelland: "4",
  regionsyddanmark: "5",
  danmark: "1221",
};

const NAMED_ENTITIES = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  oslash: "ø",
  Oslash: "Ø",
  aring: "å",
  Aring: "Å",
  aelig: "æ",
  AElig: "Æ",
  hellip: "…",
  ndash: "–",
  mdash: "—",
  eacute: "é",
  ouml: "ö",
  auml: "ä",
  uuml: "ü",
  slash: "/",
};

function usage() {
  console.log(`Usage: node scripts/job-sites.mjs [query...] [--site all|jobindex|it-jobbank] [--region <name|id>] [--limit N]

Searches jobindex.dk and it-jobbank.dk for job postings and prints a compact
list per site: title, company, location, dates, posting URL and a text snippet.
No login or credentials involved.

  query      free-text search words (optional; omit to list everything in region)
  --region   odense | fyn | koebenhavn | storkbh | kbh | nordsj | sydjylland |
             danmark | a numeric geoareaid
  --limit    max postings printed per site (default 20)

Exits 1 only if every selected site failed to return results.`);
}

function parseArgs(argv) {
  const query = [];
  let site = "all";
  let region = "";
  let limit = 20;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--site") site = argv[++i];
    else if (a === "--region") region = argv[++i];
    else if (a === "--limit") limit = Number(argv[++i]);
    else if (a === "-h" || a === "--help") {
      usage();
      process.exit(0);
    } else query.push(a);
  }
  if (!SITES[site] && site !== "all") {
    console.error(`Unknown site '${site}' (choices: ${Object.keys(SITES).join(", ")}, all)`);
    process.exit(2);
  }
  const regionId = region ? (REGIONS[region.toLowerCase()] ?? (/^\d+$/.test(region) ? region : null)) : "";
  if (region && regionId == null) {
    console.error(`Unknown region '${region}' (choices: ${Object.keys(REGIONS).join(", ")})`);
    process.exit(2);
  }
  return { query: query.join(" ").trim(), site, regionId: regionId || "", limit: Math.max(1, limit || 20) };
}

function scanJson(text, start) {
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (c === "\\") escaped = true;
      else if (c === '"') inString = false;
      continue;
    }
    if (c === '"') inString = true;
    else if (c === "{" || c === "[") depth++;
    else if (c === "}" || c === "]") {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

function findSearchResponse(node, seen = new Set()) {
  if (!node || typeof node !== "object" || seen.has(node)) return null;
  seen.add(node);
  if (Array.isArray(node.results) && typeof node.hitcount === "number") return node;
  for (const v of Array.isArray(node) ? node : Object.values(node)) {
    const found = findSearchResponse(v, seen);
    if (found) return found;
  }
  return null;
}

function decodeEntities(s) {
  return s.replace(/&#x([0-9a-f]+);|&#(\d+);|&([a-zA-Z][a-zA-Z0-9]*);/g, (m, hex, dec, name) => {
    if (hex) return String.fromCodePoint(parseInt(hex, 16));
    if (dec) return String.fromCodePoint(Number(dec));
    return NAMED_ENTITIES[name] ?? m;
  });
}

function stripTags(html) {
  return decodeEntities(html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ");
}

function snippetFromHtml(html) {
  if (!html) return "";
  const paragraphs = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)].map((m) => stripTags(m[1]).trim()).filter(Boolean);
  const text = (paragraphs.join(" ") || stripTags(html)).trim();
  return text.length > 220 ? text.slice(0, 217) + "..." : text;
}

function applyLinkFromHtml(html) {
  if (!html) return "";
  const m = html.match(/seejobdesktop"[^>]*\shref="([^"]+)"/i) ?? html.match(/<a[^>]*class="[^"]*seejobdesktop[^"]*"[^>]*href="([^"]+)"/i);
  return m ? decodeEntities(m[1]) : "";
}

function toPosting(site, hit) {
  const tid = hit.tid || "";
  const url = hit.share_url || (tid ? `${site.base}/vis-job/${tid}` : "");
  const applyUrl = applyLinkFromHtml(hit.html);
  return {
    title: hit.headline || "(no title)",
    company: hit.companytext || hit.workplace_company?.name || "",
    area: hit.area || "",
    posted: hit.firstdate || "",
    deadline: hit.lastdate || "",
    url,
    applyUrl: applyUrl && !applyUrl.startsWith(site.base) ? applyUrl : "",
    snippet: snippetFromHtml(hit.html),
  };
}

async function searchSite(site, query, regionId) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (regionId) params.set("geoareaid", regionId);
  const searchUrl = `${site.base}/jobsoegning${params.size ? `?${params}` : ""}`;
  const res = await fetch(searchUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0",
      "Accept-Language": "da,da-DK;q=0.9",
    },
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  const resultsIdx = html.indexOf('"results"');
  if (resultsIdx === -1) throw new Error("no results data in page (site layout may have changed)");
  const scriptStart = html.lastIndexOf("<script", resultsIdx);
  const jsonStart = html.indexOf("{", scriptStart);
  const raw = scanJson(html, jsonStart);
  if (!raw) throw new Error("could not extract embedded JSON");
  const response = findSearchResponse(JSON.parse(raw));
  if (!response) throw new Error("no results data in embedded JSON");
  const seen = new Set();
  const postings = [];
  for (const hit of response.results) {
    if (hit?.tid && seen.has(hit.tid)) continue;
    if (hit?.tid) seen.add(hit.tid);
    postings.push(toPosting(site, hit));
  }
  return { site, searchUrl, hitcount: response.hitcount, postings };
}

function printSite(result, limit) {
  const { site, searchUrl, hitcount, postings } = result;
  console.log(`\n${site.label} — hits: ${hitcount} — fetched: ${Math.min(postings.length, limit)} — ${searchUrl}`);
  if (!postings.length) {
    console.log("  (no postings matched)");
    return;
  }
  postings.slice(0, limit).forEach((p, i) => {
    const dates = [p.posted && `posted ${p.posted}`, p.deadline && `deadline ${p.deadline}`].filter(Boolean).join(", ");
    console.log(`${i + 1}. ${p.title} | ${p.company} | ${p.area}${dates ? ` | ${dates}` : ""}`);
    if (p.url) console.log(`   ${p.url}`);
    if (p.applyUrl) console.log(`   apply: ${p.applyUrl}`);
    if (p.snippet) console.log(`   ${p.snippet}`);
  });
}

const { query, site, regionId, limit } = parseArgs(process.argv.slice(2));
const sites = site === "all" ? Object.values(SITES) : [SITES[site]];

const settled = await Promise.allSettled(
  sites.map(async (s) => {
    const t0 = performance.now();
    try {
      const result = await searchSite(s, query, regionId);
      return { result, elapsed: performance.now() - t0 };
    } catch (err) {
      return {
        result: { site: s, searchUrl: `${s.base}/jobsoegning`, hitcount: 0, postings: [] },
        error: err,
        elapsed: performance.now() - t0,
      };
    }
  }),
);

const outcomes = settled.map((s) => s.value);
for (const { result, error, elapsed } of outcomes) {
  if (error) {
    console.log(`${result.site.label}: FAILED (${Math.round(elapsed)}ms) — ${error.message}`);
    console.log(`  tried ${result.searchUrl}`);
  } else {
    console.log(`${result.site.label}: OK (${Math.round(elapsed)}ms)`);
  }
}

const successes = outcomes.filter((o) => !o.error);
const anyHits = successes.some((o) => o.result.postings.length > 0 || o.result.hitcount > 0);

for (const { result } of successes) printSite(result, limit);

if (!successes.length) {
  console.error("\nAll job sources failed — the sites may have changed their layout.");
  process.exit(1);
}
if (!anyHits) {
  console.log("\nNo matching postings on any source.");
}
process.exit(0);
