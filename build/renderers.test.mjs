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

import { writePrinciples, paragraphs } from "./principles.mjs";

test("paragraphs splits on blank lines and unwraps each paragraph", () => {
  const text = "One line\nwrapped here.\n\nA second\nparagraph.";
  assert.deepEqual(paragraphs(text), ["One line wrapped here.", "A second paragraph."]);
});

test("paragraphs drops the empty trailing paragraph", () => {
  assert.deepEqual(paragraphs("Only this.\n\n"), ["Only this."]);
});

const PRINCIPLES_FIXTURE = {
  ...FIXTURE,
  entities: [
    { id: "vision", type: "vision", name: "One thing, everywhere",
      tagline: "A `tagline` with code.", path: "model/vision.md",
      sections: [{ heading: "What it means", text: "First para\nwrapped.\n\nSecond para." }] },
    { id: "values/b", type: "value", name: "Bee", tagline: "Bee tagline.",
      path: "model/values/b.md", sections: [{ heading: "In practice", text: "Bee body." }] },
    { id: "values/a", type: "value", name: "Ay", tagline: "Ay tagline.",
      path: "model/values/a.md", sections: [{ heading: "In practice", text: "Ay body." }] },
  ],
};

test("writePrinciples orders values by path, not by entity order", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "rb-princ-"));
  fs.mkdirSync(path.join(dir, "principles"), { recursive: true });
  fs.writeFileSync(path.join(dir, "principles", "index.html"),
    "<div>\n    <!-- principles:start -->\n    old\n    <!-- principles:end -->\n</div>\n");
  writePrinciples(PRINCIPLES_FIXTURE, { check: false, root: dir });
  const page = fs.readFileSync(path.join(dir, "principles", "index.html"), "utf8");
  assert.ok(page.indexOf("Ay") < page.indexOf("Bee"), "a/ sorts before b/");
  assert.ok(page.includes('<code class="mono">tagline</code>'), "backticks become code");
  assert.ok(page.includes('<p class="lede">First para wrapped.</p>'));
  assert.ok(page.includes('<p class="lede">Second para.</p>'));
});

test("writePrinciples writes a $& in a section's text as itself", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "rb-princ-"));
  fs.mkdirSync(path.join(dir, "principles"), { recursive: true });
  const file = path.join(dir, "principles", "index.html");
  fs.writeFileSync(file,
    "<div>\n    <!-- principles:start -->\n    old\n    <!-- principles:end -->\n</div>\n");
  const dollars = {
    ...PRINCIPLES_FIXTURE,
    entities: PRINCIPLES_FIXTURE.entities.map((e) => e.type !== "vision" ? e
      : { ...e, sections: [{ heading: "What it means", text: "A $& sign, kept." }] }),
  };
  writePrinciples(dollars, { check: false, root: dir });
  const page = fs.readFileSync(file, "utf8");
  assert.ok(page.includes("A $&amp; sign, kept."), "the model's text reaches the page as itself");
  assert.equal(page.split("<!-- principles:start -->").length - 1, 1, "one start marker, not two");
});

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

// ── the team board ────────────────────────────────────────────────────────────────────
import { writeTeam, marksOf, phasesOf, seatsOf } from "./team.mjs";

// Two phases, three roles, and every relation the board draws. Deliberately not the real
// model: this asserts the derivation, and the real model's shape is asserted by pages:check.
const TEAM_FIXTURE = {
  ...FIXTURE,
  entities: [
    { id: "profiles/p", type: "profile", name: "A Person", tagline: "One line.",
      path: "model/profiles/p/p.md", fields: { nature: "human", roles: ["Boss"] }, sections: [] },
    { id: "profiles/a", type: "profile", name: "An Agent", tagline: "Another line.",
      path: "model/profiles/a/a.md", fields: { nature: "agent", roles: ["Maker", "Checker"] }, sections: [] },
    { id: "roles/boss", type: "role", name: "Boss", tagline: "Decides.",
      path: "model/roles/boss.md", fields: { requires: ["Deciding"] }, sections: [] },
    { id: "roles/maker", type: "role", name: "Maker", tagline: "Makes.",
      path: "model/roles/maker.md", fields: { requires: [] }, sections: [] },
    { id: "roles/checker", type: "role", name: "Checker", tagline: "Checks.",
      path: "model/roles/checker.md", fields: { requires: [] }, sections: [] },
    { id: "processes/d", type: "process", name: "Doing", tagline: "How.",
      path: "model/processes/d/d.md", fields: { owner: "Boss" },
      sections: [{ heading: "Phases", text: "1. [One](phases/one.md)\n2. [Two](phases/two.md)", tables: [] }] },
    { id: "processes/d/phases/one", type: "phase", name: "One", tagline: "First.",
      path: "model/processes/d/phases/one.md",
      fields: { owner: "Maker", "executed-by": ["Maker"], "supported-by": ["Checker"],
                "gate-approvers": ["Boss"], "gate-to": "Two" }, sections: [] },
    { id: "processes/d/phases/two", type: "phase", name: "Two", tagline: "Second.",
      path: "model/processes/d/phases/two.md",
      fields: { owner: "Boss", "executed-by": ["Boss", "Checker"], "gate-approvers": ["Boss"] },
      sections: [] },
  ],
};

function renderTeamInto(fixture) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "rb-team-"));
  fs.mkdirSync(path.join(dir, "team"));
  fs.writeFileSync(path.join(dir, "team/index.html"),
    "<html><body><p class=\"tagline\">t</p>\n<!-- team-note:start -->\n<!-- team-note:end -->\n" +
    "<div class=\"lbl\">The team</div>\n<!-- team:start -->\n<!-- team:end --></body></html>");
  writeTeam(fixture, { root: dir });
  return fs.readFileSync(path.join(dir, "team/index.html"), "utf8");
}

test("phasesOf follows the process's numbered list, not the folder listing", () => {
  assert.deepEqual(phasesOf(TEAM_FIXTURE).map((p) => p.name), ["One", "Two"]);
});

test("seatsOf puts the human profile's seats first", () => {
  assert.deepEqual(seatsOf(TEAM_FIXTURE).map((s) => s.role.name), ["Boss", "Maker", "Checker"]);
});

test("marksOf reads executes, supports and approves off each phase", () => {
  const m = marksOf(TEAM_FIXTURE);
  assert.deepEqual(m.Maker, [["ex"], []]);
  assert.deepEqual(m.Checker, [["su"], ["ex"]]);
  assert.deepEqual(m.Boss, [["ga"], ["ex", "ga"]]);
});

test("marksOf falls back to owner when a phase names no executed-by", () => {
  const f = structuredClone(TEAM_FIXTURE);
  const two = f.entities.find((e) => e.id === "processes/d/phases/two");
  delete two.fields["executed-by"];
  assert.deepEqual(marksOf(f).Boss, [["ga"], ["ex", "ga"]]);
});

test("marksOf orders a cell executes, supports, approves — never file order", () => {
  assert.deepEqual(marksOf(TEAM_FIXTURE).Boss[1], ["ex", "ga"]);
});

test("a phase the model does not hold is an error, not a missing column", () => {
  const f = structuredClone(TEAM_FIXTURE);
  f.entities = f.entities.filter((e) => e.id !== "processes/d/phases/two");
  assert.throws(() => phasesOf(f), /names a phase the model does not hold: Two/);
});

test("every row says itself in words, because the grid is not a table", () => {
  const html = renderTeamInto(TEAM_FIXTURE);
  assert.match(html, /aria-label="Boss, human\. executes Two\. approves the gate of One, Two\."/);
  assert.match(html, /aria-label="Maker, agent\. executes One\. approves no gate\."/);
  assert.match(html, /aria-label="Checker, agent\. executes Two\. supports One\. approves no gate\."/);
});

test("the board carries one details per seat, with its slug as an address", () => {
  const html = renderTeamInto(TEAM_FIXTURE);
  assert.equal((html.match(/<details/g) || []).length, 3);
  assert.match(html, /<details class="human" id="boss" data-role="roles\/boss">/);
  assert.match(html, /<details id="checker" data-role="roles\/checker">/);
});

test("the note that says why a region does not translate has one home", () => {
  const princ = fs.readFileSync(new URL("./principles.mjs", import.meta.url), "utf8");
  const team = fs.readFileSync(new URL("./team.mjs", import.meta.url), "utf8");
  for (const [name, src] of [["principles.mjs", princ], ["team.mjs", team]]) {
    assert.match(src, /from "\.\/note\.mjs"/, `${name} does not import the note`);
    assert.ok(!/Generated from the model, so the words below/.test(src),
      `${name} carries its own copy of the note`);
  }
});


test("the note lands in the title block, above the section label and the board", () => {
  const html = renderTeamInto(TEAM_FIXTURE);
  // It is about the page, not about the figure, so it reads before the label rather than under
  // it — where /model/ and /principles/ put theirs. Written from here and not typed into the
  // page, so the sentence keeps one home.
  const note = html.indexOf('<p class="note"');
  const label = html.indexOf('class="lbl">The team');
  const board = html.indexOf('<div class="grid"');
  assert.ok(note > 0, "the note was not written");
  assert.ok(note < label, "the note reads after the section label");
  assert.ok(label < board, "the section label reads after the board");
});

test("a page missing either marker is an error, not a page half-generated", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "rb-team-"));
  fs.mkdirSync(path.join(dir, "team"));
  fs.writeFileSync(path.join(dir, "team/index.html"),
    "<html><body><!-- team:start -->\n<!-- team:end --></body></html>");
  assert.throws(() => writeTeam(TEAM_FIXTURE, { root: dir }), /team-note:start/);
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

test("the board is followed by what each phase is, in the model's own words", () => {
  const html = renderTeamInto(TEAM_FIXTURE);
  // The columns name the phases; until this block nothing on the page said what any of them
  // was for, because the page carries no tooltip.
  assert.match(html, /<dl class="phases">/);
  assert.match(html, /<dt><span class="phnum">01<\/span><span class="phname">One<\/span><\/dt>\n\s*<dd>First\.<\/dd>/);
  assert.match(html, /<dt><span class="phnum">02<\/span><span class="phname">Two<\/span><\/dt>\n\s*<dd>Second\.<\/dd>/);
  // In the process's order, not the folder's, and every phase present.
  assert.equal((html.match(/<dd>/g) || []).length, 2);
  // The model's words, so no data-de on them — the note above the board says why.
  const block = html.slice(html.indexOf('<dl class="phases">'));
  assert.ok(!/data-de/.test(block), "a phase tagline carries a translation it should not");
});
