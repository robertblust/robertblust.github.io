// The JSON-LD nodes that do not vary from page to page, written into every page that carries a
// graph. That is the rule this file exists to keep: a node that is the same on every page is
// written from one definition, and a node that differs — WebPage, BreadcrumbList — is left
// alone. Nine hand-typed copies of one node is nine chances for eight of them to be right, and
// that had already happened: two pages described the person without an address the other seven
// carried, and the check passed because it held only the pages on its list. This list is checked
// rather than trusted: a page that describes the person without being on it fails here instead of
// drifting quietly.
//
// The three nodes are the leading three entries of @graph on every page, so the whole block is
// re-emitted with them replaced and everything after them preserved. The nodes that stay carry
// no hand formatting, so re-emitting reproduces them byte for byte.
//
// The addresses are the model's; everything else is this site's own words. The model has no
// field for a job title or for what the dataset is, and inventing one would be a model change
// made to satisfy a renderer.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://blust.ch";

// Every page whose graph defines the person, rather than merely pointing at them.
const PAGES = ["index.html", "ideas/index.html", "model/index.html", "principles/index.html",
  "privacy/index.html", "talks/index.html", "timeline/index.html",
  "talks/mental-model/index.html", "talks/essential-complexity/index.html"];

// The person is the profile whose name is the root's — the company of one — and the addresses
// are the URL column of that profile's Also at table. The identity carries an Also at table of
// its own and it is deliberately not read here: by the two schemas the profile's rows are the
// places the person maintains and the identity's are the places the company does, and sameAs on
// a Person node is a claim about the person. Where the two tables differ, the subjects differ;
// that is not drift, and nothing here reconciles them.
export function alsoAt(data) {
  const root = data.entities.find((e) => e.id === data.rootId);
  if (!root) throw new Error("the model has no entity at its rootId");
  const profile = data.entities.find((e) => e.type === "profile" && e.name === root.name);
  if (!profile) throw new Error(`the model holds no profile named ${root.name}`);
  const urls = (profile.sections || [])
    .filter((s) => s.heading === "Also at")
    .flatMap((s) => s.tables || [])
    .flatMap((t) => { const u = t.columns.indexOf("URL"); return u < 0 ? [] : t.rows.map((r) => r[u]); })
    .filter(Boolean);
  if (!urls.length) throw new Error("the profile has no Also at rows — the page would publish an empty sameAs");
  return urls;
}

function invariant(data) {
  return [
    {
      "@type": "Person",
      "@id": `${SITE}/#person`,
      name: "Robert Blust",
      url: `${SITE}/`,
      jobTitle: "Software Engineer & Architect",
      sameAs: alsoAt(data),
      subjectOf: { "@id": `${SITE}/#model` },
    },
    {
      "@type": "Dataset",
      "@id": `${SITE}/#model`,
      name: "Robert Blust — mental model",
      description: "One person described in CompanyGraph: the profile, its experiences, the skills it claims and the evidence under each.",
      // The landing page, which is what url means on a Dataset. It used to name the source
      // repository, which sent every reader off-site rather than to the page that draws it.
      url: `${SITE}/model/`,
      license: "https://creativecommons.org/licenses/by/4.0/",
      creator: { "@id": `${SITE}/#person` },
      about: { "@id": `${SITE}/#person` },
      // The Markdown is what the model is; model.json is what this site serves. Two claims.
      isBasedOn: `https://github.com/${data.repo}`,
      distribution: {
        "@type": "DataDownload",
        contentUrl: `${SITE}/model.json`,
        encodingFormat: "application/json",
      },
    },
    {
      "@type": "WebSite",
      "@id": `${SITE}/#website`,
      name: "Robert Blust",
      url: `${SITE}/`,
      inLanguage: "en",
      publisher: { "@id": `${SITE}/#person` },
    },
  ];
}

const RE = /(<script type="application\/ld\+json">\n)([\s\S]*?)(\n<\/script>)/;

// The list above is checked rather than trusted. A tenth page added with a hand-copied Person
// node and left off it would reproduce the very drift this renderer ends, and nothing would say
// so, so every HTML file under the root is read before any page is written. Naming the person's
// @id is enough to be caught: a page that names it and does not define it publishes a reference
// that resolves nowhere, so there is no honest reason for the string to appear off the list.
const PERSON = `"${SITE}/#person"`;

function htmlFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...htmlFiles(full));
    else if (entry.name.endsWith(".html")) out.push(full);
  }
  return out;
}

function refuseUnlisted(root, pages) {
  const listed = new Set(pages.map((rel) => path.join(root, rel)));
  const found = htmlFiles(root)
    .filter((file) => !listed.has(file) && fs.readFileSync(file, "utf8").includes(PERSON))
    .map((file) => path.relative(root, file));
  if (found.length) {
    throw new Error(`off this renderer's list and naming ${PERSON}: ${found.join(", ")} — ` +
      "add each to PAGES in build/jsonld.mjs, so the node it carries is written rather than typed");
  }
}

export function writeJsonLd(data, { check = false, root = HERE, pages = PAGES } = {}) {
  refuseUnlisted(root, pages);
  const nodes = invariant(data);
  const stale = [];
  for (const rel of pages) {
    const file = path.join(root, rel);
    const page = fs.readFileSync(file, "utf8");
    const m = RE.exec(page);
    if (!m) throw new Error(`${rel} carries no JSON-LD block`);
    const doc = JSON.parse(m[2]);
    if (!Array.isArray(doc["@graph"])) throw new Error(`${rel}'s JSON-LD has no @graph`);
    // The leading three entries are what this renderer replaces, so a page whose graph is
    // shaped differently is a page it must refuse rather than truncate: slicing them off
    // unconditionally would silently drop a fourth node — WebPage on a page with no
    // BreadcrumbList — with no error and no length change to notice.
    const lead = doc["@graph"].slice(0, nodes.length).map((n) => n && n["@type"]);
    const want = nodes.map((n) => n["@type"]);
    if (lead.join() !== want.join()) {
      throw new Error(`${rel}: @graph must lead with ${want.join(", ")}, not ${lead.join(", ") || "nothing"}`);
    }
    doc["@graph"] = [...nodes, ...doc["@graph"].slice(nodes.length)];
    const text = JSON.stringify(doc, null, 2);
    const next = page.replace(RE, (all, open, _body, close) => open + text + close);
    // It has to parse after the write as well as before it: this rewrites a region inside a
    // document that the rest of the site, and every crawler, reads as JSON. Re-extracted from
    // the rewritten page rather than from `text`, because parsing what JSON.stringify just
    // returned proves only that JSON.stringify works.
    const after = RE.exec(next);
    if (!after) throw new Error(`${rel}: the JSON-LD block did not survive the write`);
    JSON.parse(after[2]);
    if (next === page) continue;
    if (check) stale.push(rel);
    else fs.writeFileSync(file, next);
  }
  return stale;
}
