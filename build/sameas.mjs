// Writes the person's sameAs into index.html from the model, or checks that what is there is
// what the model says. The source is the data block `npm run model` already writes into
// model/index.html at the commit source.json pins, so this reads no network and cannot
// disagree with the model page. The person is the profile whose name is the root's — the
// company of one — and the addresses are the URL column of that profile's Also at table.
// JSON-LD cannot carry an HTML comment as a marker, so the array itself is the marker: the
// `"sameAs": [ … ]` under the Person is matched and rewritten with the same indentation.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(here, "..");
const PAGE = path.join(ROOT, "index.html");
const MODEL = path.join(ROOT, "model", "index.html");
const { repo, commit } = JSON.parse(fs.readFileSync(path.join(ROOT, "source.json"), "utf8"));

const block = /<script type="application\/json" id="model-data" data-stage>([\s\S]*?)<\/script>/
  .exec(fs.readFileSync(MODEL, "utf8"));
if (!block) throw new Error("model/index.html carries no data block — run: npm run model");
const data = JSON.parse(block[1]);
if (data.commit !== commit) throw new Error(`model/index.html is at ${data.commit.slice(0, 7)}, source.json pins ${commit.slice(0, 7)} — run: npm run model`);

const root = data.entities.find((e) => e.id === data.rootId);
const profile = data.entities.find((e) => e.type === "profile" && root && e.name === root.name)
  || data.entities.find((e) => e.type === "profile");
if (!profile) throw new Error("the model holds no profile to read Also at from");
const urls = (profile.sections || [])
  .filter((s) => s.heading === "Also at")
  .flatMap((s) => s.tables || [])
  .flatMap((t) => { const u = t.columns.indexOf("URL"); return u < 0 ? [] : t.rows.map((r) => r[u]); })
  .filter(Boolean);

const page = fs.readFileSync(PAGE, "utf8");
const re = /("sameAs": \[)([^\]]*)(\])/;
const m = re.exec(page);
if (!m) throw new Error('index.html has no "sameAs": [ … ] to write into');
const indent = (/\n([ \t]*)"sameAs"/.exec(page) || [, ""])[1];
const inner = urls.length
  ? "\n" + urls.map((u) => `${indent}  ${JSON.stringify(u)}`).join(",\n") + `\n${indent}`
  : "";
const next = page.replace(re, `$1${inner}$3`);

if (process.argv.includes("--check")) {
  if (next !== page) {
    console.error(`  ✗ index.html's sameAs no longer matches ${repo}@${commit.slice(0, 7)} — run: npm run sameas`);
    process.exit(1);
  }
  console.log(`  ✓ index.html's sameAs matches ${repo}@${commit.slice(0, 7)}: ${urls.length} address(es)`);
} else {
  fs.writeFileSync(PAGE, next);
  console.log(`  wrote index.html: sameAs from ${repo}@${commit.slice(0, 7)}, ${urls.length} address(es)`);
}
