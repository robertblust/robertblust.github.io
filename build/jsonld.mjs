// The JSON-LD nodes that do not vary from page to page, written into every page that carries a
// graph. That is the rule this file exists to keep: a node that is the same on every page is
// written from one definition, and a node that differs — WebPage, BreadcrumbList — is left
// alone. Nine hand-typed copies of one node is nine chances for eight of them to be right, and
// that had already happened: two pages described the person without an address the other seven
// carried, and the check passed because it held only the pages on its list. There is no list to
// be missing from now.
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
// are the URL column of that profile's Also at table.
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

export function writeJsonLd(data, { check = false, root = HERE, pages = PAGES } = {}) {
  const nodes = invariant(data);
  const stale = [];
  for (const rel of pages) {
    const file = path.join(root, rel);
    const page = fs.readFileSync(file, "utf8");
    const m = RE.exec(page);
    if (!m) throw new Error(`${rel} carries no JSON-LD block`);
    const doc = JSON.parse(m[2]);
    if (!Array.isArray(doc["@graph"])) throw new Error(`${rel}'s JSON-LD has no @graph`);
    doc["@graph"] = [...nodes, ...doc["@graph"].slice(nodes.length)];
    const text = JSON.stringify(doc, null, 2);
    // It has to parse after the write as well as before it: this rewrites a region inside a
    // document that the rest of the site, and every crawler, reads as JSON.
    JSON.parse(text);
    const next = page.replace(RE, (all, open, _body, close) => open + text + close);
    if (next === page) continue;
    if (check) stale.push(rel);
    else fs.writeFileSync(file, next);
  }
  return stale;
}
