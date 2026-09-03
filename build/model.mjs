// Writes the mental model into `model/index.html` as a data block, or checks that the block
// there still matches — `npm run model` and `npm run model:check`.
//
// The same shape as `build/principles.mjs`: one pin (`source.json`) names one commit of
// `robertblust/mental-model`, and the page shows that commit and no other. Read from a local
// checkout when MENTAL_MODEL points at one whose HEAD is that commit, otherwise from GitHub —
// one call to the git trees API for the file list, then the raw files. No tarball, so nothing
// to untar and no dependency. GITHUB_TOKEN is sent if present and never printed.
//
// The difference from the principles page is what it produces. That one renders HTML, because
// prose is what it shows. This one writes the parsed graph as JSON and lets `stage.js` draw
// it, because a graph is not prose and the drawing is the point. Both pin the same commit, so
// the two pages can never disagree about which model they are showing.
//
// The parser comes from `companygraph-meta-model`, pinned by tag. It implements the
// CompanyGraph conventions and now lives in the repository that defines them, so a rule and
// its implementation can no longer drift apart unseen — that repository's own CI fails if the
// parser cites a rule `core/CONVENTIONS.md` does not define. If the model gains a type or a
// section shape, the fix belongs there and arrives here as a version bump.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { parseInstance } from "companygraph-meta-model/instance";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const { repo, commit } = JSON.parse(fs.readFileSync(path.join(ROOT, "source.json"), "utf8"));

// R13: an instance's content lives in one container, and `model/` is it. Everything outside
// — `meta/`, `.companygraph/`, the READMEs at the root — is machinery, not the company.
const SUB = "model/";

function readLocal() {
  const dir = process.env.MENTAL_MODEL;
  const head = execFileSync("git", ["-C", dir, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  if (head !== commit) {
    throw new Error(`MENTAL_MODEL is at ${head.slice(0, 7)}, source.json pins ${commit.slice(0, 7)}`);
  }
  const root = path.join(dir, SUB);
  const files = new Map();
  const walk = (d) => {
    for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, ent.name);
      if (ent.isDirectory()) walk(p);
      else files.set(path.relative(root, p).split(path.sep).join("/"), fs.readFileSync(p, "utf8"));
    }
  };
  walk(root);
  return files;
}

async function readRemote() {
  const headers = { "user-agent": "blust.ch model build" };
  if (process.env.GITHUB_TOKEN) headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const res = await fetch(`https://api.github.com/repos/${repo}/git/trees/${commit}?recursive=1`, { headers });
  if (!res.ok) throw new Error(`trees API: HTTP ${res.status}`);
  const { tree, truncated } = await res.json();
  if (truncated) throw new Error("trees API truncated the listing");
  const files = new Map();
  for (const e of tree) {
    if (e.type !== "blob" || !e.path.startsWith(SUB)) continue;
    const raw = await fetch(`https://raw.githubusercontent.com/${repo}/${commit}/${e.path}`, { headers });
    if (!raw.ok) throw new Error(`${e.path}: HTTP ${raw.status}`);
    files.set(e.path.slice(SUB.length), await raw.text());
  }
  return files;
}

const files = process.env.MENTAL_MODEL ? readLocal() : await readRemote();
// `repo` travels with the data because the stage draws more than one repository's model and
// the file link has to point at the right one.
// `SUB` is where these files sit in the model's own repository, and the parser needs it: an
// entity's `path` is what the page turns into a link to the file on GitHub. It used to be
// hardcoded upstream to `example/model/`, so every file link from this page was a 404.
const data = { ...parseInstance(files, { sub: SUB }), commit, repo };

// Fenced by markers naming the commit, the way the token block is fenced by its version: a
// reader of the HTML can see which state of the model the page shows, and the check can find
// the block without parsing the page.
const MARKER = "model data";
const ID = "model-data";
const START = new RegExp(`<!-- ${MARKER} · (?:[0-9a-f]+|none) -->\\n<script type="application\\/json" id="${ID}" data-stage>`);
const END = `</script>\n<!-- /${MARKER} -->`;
const block = `<!-- ${MARKER} · ${commit} -->\n<script type="application/json" id="${ID}" data-stage>${JSON.stringify(data)}${END}`;

const PAGE = path.join(ROOT, "model", "index.html");
const page = fs.readFileSync(PAGE, "utf8");
const start = page.search(START), end = page.indexOf(END);
if (start < 0 || end < 0) throw new Error("model/index.html has no data block markers");
const current = page.slice(start, end + END.length);

if (process.argv.includes("--check")) {
  if (current === block) {
    console.log(`  ✓ model/index.html shows ${repo}@${commit.slice(0, 7)}`);
  } else {
    console.log(`  ✗ model/index.html no longer matches ${repo}@${commit.slice(0, 7)} — run: npm run model`);
    process.exit(1);
  }
} else {
  fs.writeFileSync(PAGE, page.slice(0, start) + block + page.slice(end + END.length));
  console.log(`  wrote model/index.html: ${data.entities.length} entities, ${data.edges.length} edges from ${repo}@${commit.slice(0, 7)}`);
}
