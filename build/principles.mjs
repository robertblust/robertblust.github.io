// Writes the vision and the values into principles/index.html, or checks that what is there
// still matches the model — `npm run principles` and `npm run principles:check`.
//
// The page is derived, never written. That is the claim the vision itself makes: everything
// public about this work comes from one model, and when a surface disagrees the model is what
// gets corrected. A hand-copied page would be a fifth surface free to drift, which is the
// failure this whole idea exists to prevent — and one that has already happened once, to the
// LinkedIn copy.
//
// Rendered to HTML rather than to a data block: a crawler and an assistant have to read this
// without running JS, which is the entire reason the page exists.
//
// Read at exactly the commit source.json names: from a local checkout when MENTAL_MODEL points
// at one, otherwise from GitHub. The repository is private today, so the local path is the
// working route and GITHUB_TOKEN is sent when present and never printed.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(here, "..");
const { repo, commit } = JSON.parse(fs.readFileSync(path.join(ROOT, "source.json"), "utf8"));
const PAGE = path.join(ROOT, "principles", "index.html");
const START = "<!-- principles:start -->";
const END = "<!-- principles:end -->";

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// `code` and em-dashes survive; nothing else in these files needs markup.
const inline = (s) => esc(s).replace(/`([^`]+)`/g, '<code class="mono">$1</code>');

function parse(text) {
  const lines = text.split("\n");
  let i = 0;
  if (lines[0] === "---") { i = lines.indexOf("---", 1) + 1; }
  let name = "", tagline = "";
  const sections = [];
  let cur = null;
  for (; i < lines.length; i++) {
    const l = lines[i];
    if (l.startsWith("# ")) { name = l.slice(2).trim(); continue; }
    if (l.startsWith("> ")) { tagline += (tagline ? " " : "") + l.slice(2).trim(); continue; }
    if (l.startsWith("## ")) { cur = { heading: l.slice(3).trim(), paras: [] }; sections.push(cur); continue; }
    if (!cur) continue;
    if (l.trim() === "") { cur.paras.push([]); continue; }
    if (!cur.paras.length) cur.paras.push([]);
    cur.paras[cur.paras.length - 1].push(l.trim());
  }
  for (const s of sections) s.paras = s.paras.filter((p) => p.length).map((p) => p.join(" "));
  return { name, tagline, sections };
}

async function readModel() {
  const local = process.env.MENTAL_MODEL;
  if (local) {
    const head = execFileSync("git", ["-C", local, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
    if (head !== commit) throw new Error(`${local} is at ${head.slice(0, 7)}, source.json pins ${commit.slice(0, 7)}`);
    const read = (rel) => fs.readFileSync(path.join(local, rel), "utf8");
    const values = fs.readdirSync(path.join(local, "model/values"))
      .filter((f) => f.endsWith(".md") && f !== "README.md").sort()
      .map((f) => read(`model/values/${f}`));
    return { vision: read("model/vision.md"), values };
  }
  const headers = { Accept: "application/vnd.github.raw" };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const get = async (rel) => {
    const r = await fetch(`https://api.github.com/repos/${repo}/contents/${rel}?ref=${commit}`, { headers });
    if (!r.ok) throw new Error(`${rel}: ${r.status} ${r.statusText}`);
    return r.text();
  };
  const listing = await fetch(`https://api.github.com/repos/${repo}/contents/model/values?ref=${commit}`,
    { headers: { ...headers, Accept: "application/vnd.github+json" } });
  if (!listing.ok) throw new Error(`model/values: ${listing.status} ${listing.statusText}`);
  const names = (await listing.json()).map((e) => e.name)
    .filter((n) => n.endsWith(".md") && n !== "README.md").sort();
  return { vision: await get("model/vision.md"), values: await Promise.all(names.map((n) => get(`model/values/${n}`))) };
}

// The connective words are the page's, not the model's: the heading over the values, and the
// note that says why these blocks do not switch language with the rest of the site. The model
// owns the statements; this owns the frame around them.
const NOTE_EN = "Generated from the model, so the words below are its own — and in the one " +
  "language it is written in. The rest of this site is bilingual; a translated copy would be a " +
  "second thing to keep true, which is what this page argues against.";
const NOTE_DE = "Aus dem Modell erzeugt: Die Worte unten sind seine eigenen – und in der einen " +
  "Sprache, in der es geschrieben ist. Der Rest dieser Seite ist zweisprachig; eine übersetzte " +
  "Zweitfassung wäre eine zweite Sache, die wahr bleiben muss – genau das, wogegen diese Seite " +
  "argumentiert.";

// The title pages here all break the headline the same way: a muted first clause, then the rest
// in weight and its last word in the accent. The split is presentation, not content, so it is
// derived from the string rather than stored beside it — at the first comma, which is where this
// kind of sentence turns. A headline without one keeps its whole self in the second half, which
// is the same treatment with an empty first clause rather than a different one.
function headline(name) {
  const i = name.indexOf(",");
  const head = i === -1 ? "" : name.slice(0, i + 1);
  const rest = (i === -1 ? name : name.slice(i + 1)).trim();
  const words = rest.split(" ");
  const last = words.pop();
  const lead = words.length ? esc(words.join(" ")) + " " : "";
  return (head ? `<span class="r70">${esc(head)}</span>` : "") +
         `<span class="rcl">${lead}<em>${esc(last)}</em></span>`;
}

function render({ vision, values }) {
  const v = parse(vision);
  const out = [];
  out.push(`    <div class="title">`);
  out.push(`      <h1>${headline(v.name)}</h1>`);
  out.push(`      <p class="tagline">${inline(v.tagline)}</p>`);
  out.push(`      <p class="note" data-de="${esc(NOTE_DE)}">${esc(NOTE_EN)}</p>`);
  out.push(`    </div>`);
  out.push(``);
  out.push(`    <section>`);
  out.push(`      <h2>${inline(v.sections[0].heading)}</h2>`);
  for (const p of v.sections[0].paras) out.push(`      <p class="lede">${inline(p)}</p>`);
  out.push(`    </section>`);
  out.push(``);
  out.push(`    <section>`);
  out.push(`      <h2 data-de="Werte">Values</h2>`);
  for (const raw of values) {
    const x = parse(raw);
    out.push(`      <article class="value">`);
    out.push(`        <h3>${inline(x.name)}</h3>`);
    out.push(`        <p class="tagline">${inline(x.tagline)}</p>`);
    for (const p of x.sections[0].paras) out.push(`        <p>${inline(p)}</p>`);
    out.push(`      </article>`);
  }
  out.push(`    </section>`);
  // Provenance, generated so it cannot go stale: which repository, which commit, and what that
  // repository is an instance of. The CompanyGraph link is the disambiguation — the name invites
  // the reading that it resolves company records, and it does not.
  out.push(``);
  // The page's own words are bilingual like the rest of the site; only the model's stay in the
  // one language it is written in, which is what the note above says. Static links inside
  // `data-de` are the site's existing pattern — what must not go in there is anything a script
  // rewrites, because the translated copy is one the script never reaches.
  // Nested markup inside `data-de` uses single quotes — the site's convention for every
  // translated attribute — and the attribute escapes only what would end it. Running the German
  // through `esc` turned its tags into `&lt;a href=&quot;…`, which the browser decodes and
  // renders identically, but which no search for the href or for `<a ` ever finds.
  const escAttr = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  const link = `<a href="https://github.com/${repo}">${repo}</a>@${commit.slice(0, 7)}`;
  const linkDE = `<a href='https://github.com/${repo}'>${repo}</a>@${commit.slice(0, 7)}`;
  const cg = `<a href="https://companygraph.io/">CompanyGraph</a>`;
  const cgDE = `<a href='https://companygraph.io/'>CompanyGraph</a>`;
  const derivedEN = `Generated from ${link} — <code class="mono">model/vision.md</code> and ` +
    `<code class="mono">model/values/</code>. That repository is an instance of ${cg}, ` +
    `a meta-model for describing a company as a graph of Markdown.`;
  const derivedDE = `Erzeugt aus ${linkDE} – <code class='mono'>model/vision.md</code> und ` +
    `<code class='mono'>model/values/</code>. Dieses Repository ist eine Instanz von ${cgDE}, ` +
    `einem Meta-Modell, das ein Unternehmen als Graph aus Markdown beschreibt.`;
  out.push(`    <p class="derived" data-de="${escAttr(derivedDE)}">${derivedEN}</p>`);
  return out.join("\n");
}

const check = process.argv.includes("--check");
const model = await readModel();
const block = `${START}\n${render(model)}\n    ${END}`;
const page = fs.readFileSync(PAGE, "utf8");
const re = new RegExp(`${START}[\\s\\S]*?${END}`);
if (!re.test(page)) throw new Error(`principles/index.html has no ${START} … ${END} block`);
const next = page.replace(re, block);

if (check) {
  if (next !== page) {
    console.error(`  ✗ principles/index.html no longer matches ${repo}@${commit.slice(0, 7)} — run: npm run principles`);
    process.exit(1);
  }
  console.log(`  ✓ principles/index.html matches ${repo}@${commit.slice(0, 7)}`);
} else {
  fs.writeFileSync(PAGE, next);
  const n = model.values.length;
  console.log(`  wrote principles/index.html: 1 vision, ${n} values from ${repo}@${commit.slice(0, 7)}`);
}
