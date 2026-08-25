// What the share-card staleness check has to get right.
//
// Run: npm run test:og   (node --test, no dependencies — the check itself has none either)
//
// The check's whole value is that it over-reports and never under-reports: a card whose page
// has moved must come out stale, and the failure it exists to catch — a card reported current
// after the page changed — must be impossible. These tests drive both directions against real
// files in a temporary tree rather than against this repository, so they still mean something
// after the site's own pages change.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { cards, recipe, sources, stampOf, state, REPO_ROOT } from "../og-recipe.mjs";

// A throwaway repository root. `nest` puts it one level down so a test can also place a file
// *outside* it and prove the escape guard is what excludes it, rather than its absence.
function tree(files, { nest = false } = {}) {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "og-recipe-"));
  const root = nest ? path.join(base, "site") : base;
  for (const [rel, body] of Object.entries(files)) {
    const abs = path.join(root, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, body);
  }
  return { root, base };
}

const card = (over = {}) => ({
  dir: ".",
  hide: ".chrome,.bar{display:none!important}",
  width: 1200, height: 630, renderHeight: 675, clipY: 23,
  titleSlide: false,
  ...over,
});

// --- sources: what counts as going into a card -------------------------------------------

test("the page itself is a source", () => {
  const { root } = tree({ "index.html": "<html></html>" });
  assert.deepEqual(sources(".", root), ["index.html"]);
});

test("a font the page loads with url() is a source", () => {
  const { root } = tree({
    "index.html": "<style>@font-face{src:url(fonts/A.woff2)}</style>",
    "fonts/A.woff2": "A",
  });
  assert.deepEqual(sources(".", root), ["fonts/A.woff2", "index.html"]);
});

test("a file the page names but does not have is not a source", () => {
  const { root } = tree({ "index.html": '<img src="missing.svg">' });
  assert.deepEqual(sources(".", root), ["index.html"]);
});

test("a directory the page links to is not a source", () => {
  const { root } = tree({ "index.html": '<a href="ideas/"></a>', "ideas/index.html": "i" });
  assert.deepEqual(sources(".", root), ["index.html"]);
});

test("references that leave the repository are not sources", () => {
  const { root } = tree({
    "index.html": `<a href="https://blust.ch/talks/"></a>
                   <link href="//cdn.example/x.css">
                   <img src="data:image/svg+xml,x">
                   <a href="mailto:hi@example.com"></a>`,
  });
  assert.deepEqual(sources(".", root), ["index.html"]);
});

// The decks carry their own fonts/, but the talks index and the profile page share the copy at
// the root, so a page one level down reaches back out of its own directory to reach them. Get
// the resolution wrong and those cards silently stop tracking the fonts they render with.
test("a subpage's ../fonts reference resolves back into the repository", () => {
  const { root } = tree({
    "talks/index.html": "<style>@font-face{src:url(../fonts/A.woff2)}</style>",
    "fonts/A.woff2": "A",
  });
  assert.deepEqual(sources("talks", root), ["fonts/A.woff2", "talks/index.html"]);
});

test("a reference climbing above the repository root is not a source", () => {
  const { root, base } = tree({ "index.html": '<img src="../outside.png">' }, { nest: true });
  fs.writeFileSync(path.join(base, "outside.png"), "x");   // it exists; the guard must still drop it
  assert.deepEqual(sources(".", root), ["index.html"]);
});

// A link names somewhere to go, not something to draw. The talks index is why this exception
// exists: it links four multi-megabyte deck PDFs, so hashing link targets reports that card
// stale on every `npm run pdf`, over a page that has not moved a pixel.
test("a file the page only links to is not a source", () => {
  const { root } = tree({
    "index.html": '<a href="talk.pdf">the deck</a>',
    "talk.pdf": "%PDF",
  });
  assert.deepEqual(sources(".", root), ["index.html"]);
});

test("a file the page draws is a source even next to a link", () => {
  const { root } = tree({
    "index.html": '<a href="talk.pdf">the deck</a><img src="comic-1.png">',
    "talk.pdf": "%PDF",
    "comic-1.png": "png",
  });
  assert.deepEqual(sources(".", root), ["comic-1.png", "index.html"]);
});

test("a file the page links with <link> is a source", () => {
  const { root } = tree({ "index.html": '<link rel="icon" href="favicon.svg">', "favicon.svg": "<svg/>" });
  assert.deepEqual(sources(".", root), ["favicon.svg", "index.html"]);
});

// The decks keep prose in `data-notes`, where `>` is an ordinary character. Ending a tag at
// the first `>` regardless of quoting drops every reference after it, silently.
test("a > inside an attribute value does not end the tag early", () => {
  const { root } = tree({
    "index.html": '<section data-notes="a > b"><img src="comic-1.png"></section>',
    "comic-1.png": "png",
  });
  assert.deepEqual(sources(".", root), ["comic-1.png", "index.html"]);
});

test("an uppercase link is still a link", () => {
  const { root } = tree({ "index.html": '<A HREF="talk.pdf">x</A>', "talk.pdf": "%PDF" });
  assert.deepEqual(sources(".", root), ["index.html"]);
});

test("a query string or fragment does not make a second source", () => {
  const { root } = tree({
    "index.html": '<link href="a.css?v=2"><link href="a.css#top">',
    "a.css": "a",
  });
  assert.deepEqual(sources(".", root), ["a.css", "index.html"]);
});

// Both decks fill a marker this way — `url(#ah)` is a reference into the page's own SVG, not
// a file, and there is no `#ah` on disk to hash.
test("a fragment-only url() names nothing on disk", () => {
  const { root } = tree({ "index.html": '<svg><path marker-end="url(#ah)"/></svg>' });
  assert.deepEqual(sources(".", root), ["index.html"]);
});

// --- recipe: what makes a card stale ------------------------------------------------------

test("the recipe is the same twice when nothing changes", () => {
  const { root } = tree({ "index.html": "<p>one</p>" });
  assert.equal(recipe(card(), root), recipe(card(), root));
});

test("editing the page changes the recipe", () => {
  const { root } = tree({ "index.html": "<p>one</p>" });
  const before = recipe(card(), root);
  fs.writeFileSync(path.join(root, "index.html"), "<p>two</p>");
  assert.notEqual(recipe(card(), root), before);
});

// A font swap changes every card while no HTML changes at all. This is the case that made the
// check hash sources instead of the page.
test("swapping a font the page never mentions by name changes the recipe", () => {
  const { root } = tree({
    "index.html": "<style>@font-face{src:url(fonts/A.woff2)}</style>",
    "fonts/A.woff2": "old",
  });
  const before = recipe(card(), root);
  fs.writeFileSync(path.join(root, "fonts/A.woff2"), "new");
  assert.notEqual(recipe(card(), root), before);
});

// The exporter's own frame is part of what the card looks like, so it is part of the recipe.
// If it were not, changing a hide rule would leave every card reported current.
test("changing the exporter's hide rules changes the recipe", () => {
  const { root } = tree({ "index.html": "<p>one</p>" });
  assert.notEqual(recipe(card({ hide: ".chrome{display:none}" }), root), recipe(card(), root));
});

test("changing the crop changes the recipe", () => {
  const { root } = tree({ "index.html": "<p>one</p>" });
  assert.notEqual(recipe(card({ clipY: 22 }), root), recipe(card(), root));
});

test("rendering the title slide instead of the page changes the recipe", () => {
  const { root } = tree({ "index.html": "<p>one</p>" });
  assert.notEqual(recipe(card({ titleSlide: true }), root), recipe(card(), root));
});

// A knob added to a card later must enter the hash on its own. Hand-listing the knobs in the
// hash is how a new one gets forgotten and starts changing cards silently — and the sibling
// repositories carry knobs this one does not, so this is the test that lets the shape differ
// between them without the mechanism differing.
test("a knob the recipe was never told about still changes it", () => {
  const { root } = tree({ "index.html": "<p>one</p>" });
  assert.notEqual(recipe(card({ settle: "wait:900" }), root), recipe(card(), root));
});

test("the order the knobs are written in is not a change", () => {
  const { root } = tree({ "index.html": "<p>one</p>" });
  const a = { dir: ".", hide: "x", width: 1200, height: 630, renderHeight: 675, clipY: 23, titleSlide: false };
  const b = { titleSlide: false, clipY: 23, renderHeight: 675, height: 630, width: 1200, hide: "x", dir: "." };
  assert.equal(recipe(a, root), recipe(b, root));
});

// --- state: what the check reports --------------------------------------------------------

test("a card with no stamp beside it is unstamped", () => {
  const { root } = tree({ "index.html": "<p>one</p>" });
  assert.equal(state(card(), root).state, "unstamped");
});

test("a card stamped with its own recipe is current", () => {
  const { root } = tree({ "index.html": "<p>one</p>" });
  const c = card();
  fs.writeFileSync(stampOf(".", root), recipe(c, root) + "\n");
  assert.equal(state(c, root).state, "current");
});

test("a card whose page moved after it was stamped is stale", () => {
  const { root } = tree({ "index.html": "<p>one</p>" });
  const c = card();
  fs.writeFileSync(stampOf(".", root), recipe(c, root) + "\n");
  fs.writeFileSync(path.join(root, "index.html"), "<p>two</p>");
  assert.equal(state(c, root).state, "stale");
});

test("a stamp is read past the newline it is written with", () => {
  const { root } = tree({ "index.html": "<p>one</p>" });
  const c = card();
  fs.writeFileSync(stampOf(".", root), "  " + recipe(c, root) + "  \n\n");
  assert.equal(state(c, root).state, "current");
});

test("the stamp sits beside the card it stamps", () => {
  assert.equal(stampOf("talks/mental-model", "/site"), path.join("/site", "talks/mental-model", "og.sha"));
});

// --- this repository ----------------------------------------------------------------------

// A fifth card added without a card entry would never be checked, and nothing else would say
// so: the check would keep printing four ✓ while the new one drifted.
test("every og.png in this repository has a card that describes it", () => {
  const found = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(path.join(REPO_ROOT, dir), { withFileTypes: true })) {
      const rel = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (e.name !== "node_modules" && !e.name.startsWith(".")) walk(rel);
      } else if (e.name === "og.png") {
        found.push(path.dirname(rel));
      }
    }
  };
  walk(".");
  assert.deepEqual(found.sort(), cards.map((c) => c.dir).sort());
});

test("every card in this repository names a page that exists", () => {
  for (const c of cards) {
    assert.ok(
      fs.existsSync(path.join(REPO_ROOT, c.dir, "index.html")),
      `${c.dir} has a card but no index.html`,
    );
  }
});
