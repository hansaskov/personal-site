import { execSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const TODAY = new Date().toISOString().slice(0, 10);
const REPO = process.env.GITHUB_REPOSITORY;
const SERVER = process.env.GITHUB_SERVER_URL || "https://git.hjemmet.net";
const API = `${SERVER}/api/v1/repos/${REPO}`;
const TOKEN = process.env.JOBHUNTER_TOKEN || process.env.GITHUB_TOKEN;
const MODEL = process.env.OPENCODE_MODEL || "";
const WRITER_MODEL = process.env.WRITER_MODEL || MODEL;
const BRANCH_PREFIX = "job-scan/";
const BASE = "main";

if (!REPO || !TOKEN) {
  console.error("Missing GITHUB_REPOSITORY or token");
  process.exit(1);
}

async function forge(path, init = {}) {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `token ${TOKEN}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`${init.method || "GET"} ${path} -> ${res.status}: ${text}`);
  }
  return text ? JSON.parse(text) : null;
}

function git(cmd) {
  return execSync(cmd, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function opencode(prompt, model) {
  const args = ["run", "--auto", "--agent", "jobhunter"];
  const use = model || MODEL;
  if (use) args.push("-m", use);
  args.push(prompt);
  const res = spawnSync("opencode", args, { encoding: "utf8" });
  if (res.status !== 0) {
    throw new Error(`opencode run failed:\n${res.stdout}\n${res.stderr}`);
  }
  return res.stdout;
}

function commentSection(path) {
  const scan = readFileSync(path, "utf8");
  const idx = scan.indexOf("## PR comment");
  if (idx === -1) return null;
  return scan.slice(idx + "## PR comment".length).trim();
}

function scanPathOn(branch) {
  const files = git(`git ls-tree -r --name-only ${JSON.stringify(branch)} job-scans/`).split("\n");
  return files.find((f) => f.endsWith(".md"));
}

async function findScanPr() {
  const prs = await forge("/pulls?state=open");
  return prs.find((p) => (p.head?.ref || "").startsWith(BRANCH_PREFIX)) || null;
}

async function getComments(number) {
  const comments = await forge(`/issues/${number}/comments`);
  return comments.map((c) => `From ${c.user?.login || "user"}:\n${c.body}`).join("\n\n");
}

function commitScanFiles(branch, message) {
  const files = git("git status --porcelain")
    .split("\n")
    .map((l) => l.slice(3).trim())
    .filter((f) => f.startsWith("job-scans/") || f.startsWith("src/content/"));
  if (!files.length) return false;
  for (const f of files) git(`git add ${JSON.stringify(f)}`);
  git(`git commit -m ${JSON.stringify(message)}`);
  git(`git push origin ${JSON.stringify(branch)}`);
  return true;
}

async function ensureScanPr(branch, title, body) {
  const prs = await forge(`/pulls?state=open&head=${encodeURIComponent(REPO.split("/")[1] + ":" + branch)}`);
  const existing = prs.find((p) => p.head?.ref === branch);
  if (existing) return existing;
  return forge("/pulls", {
    method: "POST",
    body: JSON.stringify({ title, head: branch, base: BASE, body }),
  });
}

async function main() {
  git("git config user.name job-hunter");
  git('git config user.email "job-hunter@' + (REPO.split("/")[1] || "local") + '"');

  const scanPr = await findScanPr();

  if (!scanPr) {
    console.log("No open job-scan PR, running scan phase");
    const scanFile = `job-scans/${TODAY}.md`;
    opencode(
      `Today is ${TODAY}. Do a job scan. Search for relevant job postings, filter out ones already applied to, rank them, and write the result to ${scanFile}. Follow the scan instructions in your instructions. Do not commit, push or create PRs; only write the scan file.`,
    );
    if (!existsSync(scanFile)) {
      console.log("Agent produced no scan file");
      process.exit(0);
    }
    const status = (readFileSync(scanFile, "utf8").match(/status:\s*(\S+)/) || [])[1];
    if (status !== "awaiting-choice") {
      console.log(`Scan status is '${status}', nothing to open a PR for`);
      process.exit(0);
    }
    git(`git checkout -b ${BRANCH_PREFIX}${TODAY}`);
    if (!commitScanFiles(`${BRANCH_PREFIX}${TODAY}`, `Add job scan ${TODAY}`)) {
      console.log("No files to commit");
      process.exit(0);
    }
    const title = `Job scan ${TODAY}`;
    const body = readFileSync(scanFile, "utf8");
    const pr = await ensureScanPr(`${BRANCH_PREFIX}${TODAY}`, title, body);
    console.log(`Opened PR #${pr.number}: ${pr.html_url}`);
    process.exit(0);
  }

  const branch = scanPr.head.ref;
  const comments = await getComments(scanPr.number);
  if (!comments.trim()) {
    console.log(`PR #${scanPr.number} has no comments yet, waiting for user input`);
    process.exit(0);
  }

  console.log(`PR #${scanPr.number} has comments, running apply phase`);
  git(`git fetch origin ${JSON.stringify(branch)}`);
  git(`git checkout -B ${JSON.stringify(branch)} origin/${branch}`);
  const scanFile = scanPathOn(branch);
  if (!scanFile || !existsSync(scanFile)) {
    console.error(`No scan file found on branch ${branch}`);
    process.exit(1);
  }
  const scanContent = readFileSync(scanFile, "utf8");

  opencode(
    `The user has responded on the job scan PR. The scan file is ${scanFile} with content:\n\n${scanContent}\n\nUser comments on the PR:\n\n${comments}\n\nFollow the apply instructions in your instructions to research the chosen posting and write the application letter and CV. Do not commit, push or comment; only change files. If the comments do not clearly pick a posting, change nothing.`,
    WRITER_MODEL,
  );

  git("git add -A");
  const staged = git("git diff --cached --name-only");
  if (!staged.trim()) {
    console.log("Agent made no changes (probably no clear choice in comments)");
    process.exit(0);
  }
  git("git commit -m " + JSON.stringify(`Add application from job scan ${branch.replace(BRANCH_PREFIX, "")}`));
  git(`git push origin ${JSON.stringify(branch)}`);

  const comment = commentSection(scanFile);
  if (comment) {
    await forge(`/issues/${scanPr.number}/comments`, {
      method: "POST",
      body: JSON.stringify({ body: comment }),
    });
    console.log("Posted research comment on the PR");
  }
  console.log(`Application added to PR #${scanPr.number}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
