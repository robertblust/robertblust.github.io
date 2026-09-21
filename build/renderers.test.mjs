// The renderers are pure functions of the artifact, so they are tested on a fixture rather
// than on the real model: a test that reads model.json would pass for the wrong reason the
// day the model changes.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const FIXTURE = {
  commit: "0".repeat(40),
  repo: "example/model",
  root: "Someone",
  rootId: "identity",
  types: [],
  entities: [],
  edges: [],
};

import { writeJsonLd, alsoAt } from "./jsonld.mjs";

const PROFILE_FIXTURE = {
  ...FIXTURE,
  root: "Someone",
  rootId: "identity",
  entities: [
    { id: "identity", type: "identity", name: "Someone", tagline: "", sections: [] },
    { id: "profiles/someone", type: "profile", name: "Someone", tagline: "",
      sections: [{ heading: "Also at", tables: [
        { columns: ["What", "URL"], rows: [["GitHub", "https://example.com/a"], ["Elsewhere", "https://example.com/b"]] }] }] },
  ],
};

test("alsoAt takes the URL column of the root profile's Also at table", () => {
  assert.deepEqual(alsoAt(PROFILE_FIXTURE), ["https://example.com/a", "https://example.com/b"]);
});

test("alsoAt leaves out the site's own origin, which the Person node already states as url", () => {
  const own = { ...PROFILE_FIXTURE, entities: [PROFILE_FIXTURE.entities[0],
    { ...PROFILE_FIXTURE.entities[1], sections: [{ heading: "Also at", tables: [
      { columns: ["Where", "URL"], rows: [["Site", "https://blust.ch"], ["Site again", "https://blust.ch/"],
        ["GitHub", "https://example.com/a"]] }] }] }] };
  assert.deepEqual(alsoAt(own), ["https://example.com/a"]);
});

test("alsoAt throws rather than publishing an empty sameAs", () => {
  const bare = { ...PROFILE_FIXTURE, entities: [PROFILE_FIXTURE.entities[0],
    { ...PROFILE_FIXTURE.entities[1], sections: [] }] };
  assert.throws(() => alsoAt(bare), /Also at/);
});

test("writeJsonLd replaces the leading three nodes and leaves the rest byte-identical", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "rb-ld-"));
  const doc = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Person", "@id": "https://blust.ch/#person", name: "Stale" },
      { "@type": "Dataset", "@id": "https://blust.ch/#model", name: "Stale" },
      { "@type": "WebSite", "@id": "https://blust.ch/#website", name: "Stale" },
      { "@type": "WebPage", "@id": "https://blust.ch/#webpage", name: "Kept", about: { "@id": "https://blust.ch/#person" } },
    ],
  };
  fs.writeFileSync(path.join(dir, "index.html"),
    `<head>\n<script type="application/ld+json">\n${JSON.stringify(doc, null, 2)}\n</script>\n</head>\n`);
  writeJsonLd(PROFILE_FIXTURE, { check: false, root: dir, pages: ["index.html"] });
  const written = JSON.parse(fs.readFileSync(path.join(dir, "index.html"), "utf8")
    .match(/<script type="application\/ld\+json">\n([\s\S]*?)\n<\/script>/)[1]);
  assert.equal(written["@graph"].length, 4);
  assert.deepEqual(written["@graph"][3], doc["@graph"][3], "the page-specific node is untouched");
  assert.deepEqual(written["@graph"][0].sameAs, ["https://example.com/a", "https://example.com/b"]);
  assert.equal(written["@graph"][1].distribution.contentUrl, "https://blust.ch/model.json");
});

test("writeJsonLd refuses to write a graph that does not lead with Person, Dataset, WebSite", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "rb-ld-"));
  const doc = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Person", "@id": "https://blust.ch/#person", name: "Stale" },
      { "@type": "Dataset", "@id": "https://blust.ch/#model", name: "Stale" },
      { "@type": "WebPage", "@id": "https://blust.ch/#webpage", name: "Kept" },
    ],
  };
  fs.writeFileSync(path.join(dir, "index.html"),
    `<head>\n<script type="application/ld+json">\n${JSON.stringify(doc, null, 2)}\n</script>\n</head>\n`);
  assert.throws(() => writeJsonLd(PROFILE_FIXTURE, { check: false, root: dir, pages: ["index.html"] }),
    /@graph must lead with Person, Dataset, WebSite/);
});

test("writeJsonLd refuses to run while a page off its list names the person", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "rb-ld-"));
  const doc = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Person", "@id": "https://blust.ch/#person", name: "Stale" },
      { "@type": "Dataset", "@id": "https://blust.ch/#model", name: "Stale" },
      { "@type": "WebSite", "@id": "https://blust.ch/#website", name: "Stale" },
    ],
  };
  fs.writeFileSync(path.join(dir, "index.html"),
    `<head>\n<script type="application/ld+json">\n${JSON.stringify(doc, null, 2)}\n</script>\n</head>\n`);
  fs.mkdirSync(path.join(dir, "tenth"), { recursive: true });
  const unlisted = path.join("tenth", "index.html");
  fs.writeFileSync(path.join(dir, unlisted),
    `<head>\n<script type="application/ld+json">\n${JSON.stringify(doc, null, 2)}\n</script>\n</head>\n`);
  assert.throws(() => writeJsonLd(PROFILE_FIXTURE, { check: false, root: dir, pages: ["index.html"] }),
    (err) => err.message.includes(unlisted), "the error names the page that was left off the list");
});

test("writeJsonLd refuses a page whose own nodes were copied from another page", () => {
  // The bug this exists for, reproduced: the team page was generated from the timeline's
  // markup and carried its @id, name, url and breadcrumb to a different address. Every check
  // in the suite passed, because nothing else reads JSON-LD closely enough to notice.
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "rb-ld-"));
  fs.mkdirSync(path.join(dir, "team"));
  const doc = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Person", "@id": "https://blust.ch/#person", name: "Stale" },
      { "@type": "Dataset", "@id": "https://blust.ch/#model", name: "Stale" },
      { "@type": "WebSite", "@id": "https://blust.ch/#website", name: "Stale" },
      { "@type": "WebPage", "@id": "https://blust.ch/timeline/#webpage", name: "Timeline",
        url: "https://blust.ch/timeline/", breadcrumb: { "@id": "https://blust.ch/timeline/#breadcrumb" } },
    ],
  };
  fs.writeFileSync(path.join(dir, "team/index.html"),
    `<head>\n<script type="application/ld+json">\n${JSON.stringify(doc, null, 2)}\n</script>\n</head>\n`);
  assert.throws(() => writeJsonLd(PROFILE_FIXTURE, { check: false, root: dir, pages: ["team/index.html"] }),
    (err) => err.message.includes("https://blust.ch/team/") && err.message.includes("WebPage"),
    "the error does not name the page it should have been about");
});

test("writeJsonLd accepts a page whose own nodes name its own address", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "rb-ld-"));
  fs.mkdirSync(path.join(dir, "team"));
  const doc = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Person", "@id": "https://blust.ch/#person", name: "Stale" },
      { "@type": "Dataset", "@id": "https://blust.ch/#model", name: "Stale" },
      { "@type": "WebSite", "@id": "https://blust.ch/#website", name: "Stale" },
      { "@type": "WebPage", "@id": "https://blust.ch/team/#webpage", name: "Team",
        url: "https://blust.ch/team/", breadcrumb: { "@id": "https://blust.ch/team/#breadcrumb" } },
    ],
  };
  fs.writeFileSync(path.join(dir, "team/index.html"),
    `<head>\n<script type="application/ld+json">\n${JSON.stringify(doc, null, 2)}\n</script>\n</head>\n`);
  writeJsonLd(PROFILE_FIXTURE, { check: false, root: dir, pages: ["team/index.html"] });
  const written = JSON.parse(fs.readFileSync(path.join(dir, "team/index.html"), "utf8")
    .match(/<script type="application\/ld\+json">\n([\s\S]*?)\n<\/script>/)[1]);
  assert.equal(written["@graph"][3].name, "Team", "the page's own node was not left alone");
});

// ── the surfaces lineage ──────────────────────────────────────────────────────────────
import { writeSurfaces, makersOf, hostOf } from "@robertblust/design/render/surfaces";

// One written surface and three built by two repositories, deliberately not the real model:
// this asserts the grouping, and the real model's shape is asserted by pages:check and verify.
const surface = (slug, name, fields) => ({ id: `surfaces/${slug}`, type: "surface", name, tagline: "t.",
  path: `model/surfaces/${slug}.md`, fields: { source: "Local", ...fields }, sections: [] });
const SURFACES_FIXTURE = {
  ...FIXTURE,
  repo: "someone/a-model",
  entities: [
    surface("zine", "Zine", { production: "written", url: "https://www.example.org/zine/" }),
    surface("site", "Site", { production: "built", "built-by": "https://github.com/someone/zz-site", url: "https://example.org" }),
    surface("feed", "feed listing", { production: "built", "built-by": "https://github.com/someone/aa-server", url: "https://example.org/feed?x=1" }),
    surface("api", "API server", { production: "built", "built-by": "https://github.com/someone/aa-server", url: "https://api.example.org/" }),
  ],
};

function renderSurfacesInto(fixture) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "rb-surfaces-"));
  fs.mkdirSync(path.join(dir, "surfaces"));
  fs.writeFileSync(path.join(dir, "surfaces/index.html"),
    "<html><body><p class=\"tagline\">t</p>\n<!-- surfaces-note:start -->\n<!-- surfaces-note:end -->\n" +
    "<div class=\"lbl\">The surfaces</div>\n<!-- surfaces:start -->\n<!-- surfaces:end --></body></html>");
  writeSurfaces(fixture, { root: dir });
  return fs.readFileSync(path.join(dir, "surfaces/index.html"), "utf8");
}

test("makersOf puts the hand first, then each build by repository", () => {
  assert.deepEqual(makersOf(SURFACES_FIXTURE).map((m) => m.key),
    ["hand", "https://github.com/someone/aa-server", "https://github.com/someone/zz-site"]);
});

test("makersOf groups every surface under the maker its own fields name, sorted by name", () => {
  const m = makersOf(SURFACES_FIXTURE);
  assert.deepEqual(m.map((g) => g.surfaces.map((s) => s.name)), [["Zine"], ["API server", "feed listing"], ["Site"]]);
  assert.equal(m[1].repo, "someone/aa-server");
});

test("a surface the page cannot place is an error, not a node left out", () => {
  const f = structuredClone(SURFACES_FIXTURE);
  f.entities[1].fields.production = "generated";
  assert.throws(() => makersOf(f), /production this page does not draw: generated/);
  const g = structuredClone(SURFACES_FIXTURE);
  delete g.entities[1].fields["built-by"];
  assert.throws(() => makersOf(g), /is built but names no built-by/);
});

test("hostOf shows an address without its scheme, www, query or trailing slash", () => {
  assert.equal(hostOf("https://www.example.org/zine/"), "example.org/zine");
  assert.equal(hostOf("https://example.org/feed?x=1"), "example.org/feed");
});

test("each surface is a button with its slug as an address, under its maker", () => {
  const html = renderSurfacesInto(SURFACES_FIXTURE);
  assert.equal((html.match(/class="ln-s"/g) || []).length, 4);
  assert.match(html, /<li class="ln-group hand">/);
  assert.match(html, /id="api" data-id="surfaces\/api" data-maker="https:\/\/github.com\/someone\/aa-server" aria-pressed="false"/);
  assert.match(html, /<div class="nm">a-model<\/div>/);
  assert.ok(html.indexOf('id="zine"') < html.indexOf('id="api"'), "the hand's surfaces do not come first");
});

test("the surfaces page missing either marker is an error, not a page half-generated", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "rb-surfaces-"));
  fs.mkdirSync(path.join(dir, "surfaces"));
  fs.writeFileSync(path.join(dir, "surfaces/index.html"),
    "<html><body><!-- surfaces:start -->\n<!-- surfaces:end --></body></html>");
  assert.throws(() => writeSurfaces(SURFACES_FIXTURE, { root: dir }), /surfaces-note:start/);
});
