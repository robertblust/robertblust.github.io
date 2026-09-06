// Writes the person's sameAs into every page that carries the person node, from the model, or
// checks that what is there is what the model says. The source is the data block `npm run
// model` already writes into model/index.html at the commit source.json pins, so this reads
// no network and cannot disagree with the model page. The person is the profile whose name is
// the root's — the company of one — and the addresses are the URL column of that profile's
// Also at table. JSON-LD cannot carry an HTML comment as a marker, so the array itself is the
// marker: the `"sameAs": [ … ]` under the Person is matched and rewritten with the same
// indentation, on every page below that carries one.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(here, "..");
const MODEL = path.join(ROOT, "model", "index.html");
// Every page whose JSON-LD graph defines the Person at https://blust.ch/#person, not merely
// references it — the seven this repository has today. A page added later that carries the
// node joins this list by hand; nothing derives it, because deriving it means parsing every
// page's JSON-LD before deciding which pages to parse.
const PAGES = ["index.html", "ideas/index.html", "model/index.html", "principles/index.html",
  "privacy/index.html", "talks/index.html", "timeline/index.html"]
  .map((p) => path.join(ROOT, p));
const { repo, commit } = JSON.parse(fs.readFileSync(path.join(ROOT, "source.json"), "utf8"));

const fail = (message) => { console.error(`  ✗ ${message}`); process.exit(1); };

const block = /<script type="application\/json" id="model-data" data-stage>([\s\S]*?)<\/script>/
  .exec(fs.readFileSync(MODEL, "utf8"));
if (!block) fail("model/index.html carries no data block — run: npm run model");
const data = JSON.parse(block[1]);
if (data.commit !== commit) fail(`model/index.html is at ${data.commit.slice(0, 7)}, source.json pins ${commit.slice(0, 7)} — run: npm run model`);

const root = data.entities.find((e) => e.id === data.rootId);
if (!root) fail("the model has no entity at its rootId");
const profile = data.entities.find((e) => e.type === "profile" && e.name === root.name);
if (!profile) fail(`the model holds no profile named ${root.name}`);
const urls = (profile.sections || [])
  .filter((s) => s.heading === "Also at")
  .flatMap((s) => s.tables || [])
  .flatMap((t) => { const u = t.columns.indexOf("URL"); return u < 0 ? [] : t.rows.map((r) => r[u]); })
  .filter(Boolean);
if (!urls.length) fail("the profile has no Also at rows — the page would publish an empty sameAs");

const re = /("sameAs": \[)([^\]]*)(\])/;
const ld = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/;
const check = process.argv.includes("--check");
let anyFailed = false;

for (const PAGE of PAGES) {
  const rel = path.relative(ROOT, PAGE);
  const page = fs.readFileSync(PAGE, "utf8");
  const m = re.exec(page);
  if (!m) fail(`${rel} has no "sameAs": [ … ] to write into`);
  const indent = (/\n([ \t]*)"sameAs"/.exec(page) || [, ""])[1];
  const inner = "\n" + urls.map((u) => `${indent}  ${JSON.stringify(u)}`).join(",\n") + `\n${indent}`;
  const next = page.replace(re, (all, open, _inner, close) => open + inner + close);

  const ldBlock = ld.exec(next);
  if (!ldBlock) fail(`${rel} carries no JSON-LD block to verify`);
  try {
    JSON.parse(ldBlock[1]);
  } catch (e) {
    fail(`${rel}'s JSON-LD no longer parses once sameAs is written: ${e.message}`);
  }

  if (check) {
    if (next !== page) {
      console.error(`  ✗ ${rel}'s sameAs no longer matches ${repo}@${commit.slice(0, 7)} — run: npm run sameas`);
      anyFailed = true;
    } else {
      console.log(`  ✓ ${rel}'s sameAs matches ${repo}@${commit.slice(0, 7)}: ${urls.length} address(es)`);
    }
  } else {
    fs.writeFileSync(PAGE, next);
    console.log(`  wrote ${rel}: sameAs from ${repo}@${commit.slice(0, 7)}, ${urls.length} address(es)`);
  }
}

if (check && anyFailed) process.exit(1);
