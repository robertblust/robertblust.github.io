# The timeline page — implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/timeline/` on blust.ch: every experience in the model as a ledger in the order it
began, each row opening into the model page's card, built from the same data block the
model page carries, with the nav item on every page.

**Architecture:** The page is a copy of `model/index.html` with a different body: the stage's
figure section becomes an `ol.ledger` the page's own inline script builds from the
`model-data` block, calling `rbCard` from the design package for every card and every date.
`build/model.mjs` writes the block into both pages. The suite gains a `/timeline/` entry and a
`ledger` check local to this site. The design release v0.30.0 lands first; this plan starts by
taking it.

**Tech Stack:** static HTML with one inline script per page, no build; `@robertblust/design`
v0.30.0 for the fences, `card.js` and `stage.css`; `companygraph-meta-model` v0.13.2 for the
parser; Playwright through `npm run verify`.

**Spec:** `docs/superpowers/specs/2026-09-05-timeline-page-design.md`. The design package's
plan, which ships what this one takes, is `robertblust/design`,
`docs/superpowers/plans/2026-09-05-card-and-timeline-nav.md`.

## Global Constraints

- Every word of a page is en-US; every `-de` attribute is de-CH. English: spaced em-dash,
  curly quotes, no serial comma, "Oct 1999–Jan 2015". German: «…», spaced en-dash, ss never ß.
  `typography` and `translates` hold both.
- The model's own words stay English in both views; only the page's own words carry `data-de`.
- Nothing opens in a new tab. Mono means data. No external assets.
- Fenced blocks are generated: never edit between markers; run `npm run design`.
- `npm run verify` after any page change; `npm run og` after any visual change, and commit
  `og.png` and `og.sha` with the page. `npm run model` after any change to the block or the
  pin, and `npm run model:check` before every commit that touches either page.
- Commits are authored by Rob with the tool in a `Co-Authored-By` trailer; the subject is a
  sentence, no type prefix; the body ends with a `Verified:` line. One branch, one pull
  request, opened and not merged.
- Branch: `timeline`, off `main`, after design v0.30.0 is released.

---

### Task 1: Take design v0.30.0 and put Timeline in every header

**Files:**
- Modify: `package.json:25`
- Modify: `model/index.html` (the script lines at the foot, ~line 850; the nav at ~line 583)
- Modify: `index.html`, `ideas/index.html`, `principles/index.html`, `talks/index.html`, `privacy/index.html` (the nav)
- Modify: `verify/check.mjs:26`
- Modify: `sitemap.xml`
- Regenerate: every `og.png`/`og.sha` the recipe reports stale

**Interfaces:**
- Produces: `card.js` at the site root; the header fence at v8 on every page; the nav item
  `<a href="…timeline/" data-de="Werdegang">Timeline</a>` after Model on six pages.

- [ ] **Step 1: Pin and sync**

```bash
git checkout main && git pull && git checkout -b timeline
npm install @robertblust/design@github:robertblust/design#v0.30.0
npm run design
git status --short
```

Expected: `package.json` and `package-lock.json` changed; every prose page's header fence
rewritten to v8; `card.js` new at the root. `npm run design:check` prints nothing wrong.

- [ ] **Step 2: Load the card before the stage on the model page**

At the foot of `model/index.html`, the three script lines become:

```html
<script src="../d3.v7.min.js"></script>
<script src="../card.js"></script>
<script src="../stage.js"></script>
```

- [ ] **Step 3: The nav item, six pages**

In each page's `.navlinks`, directly after the Model link, add the Timeline link with the
same relative prefix that page's Model link uses:

`index.html`:
```html
          <a href="model/" data-de="Modell">Model</a>
          <a href="timeline/" data-de="Werdegang">Timeline</a>
```

`ideas/index.html`, `principles/index.html`, `talks/index.html`, `privacy/index.html` and
`model/index.html`:
```html
          <a href="../timeline/" data-de="Werdegang">Timeline</a>
```

On `model/index.html` the Model link keeps its `aria-current="page"`; the Timeline link
carries none.

- [ ] **Step 4: The root page's German nav words, and the sitemap**

In `verify/check.mjs` line 26, the root page's `translates.shows` becomes:

```js
    translates: { lang: "de", shows: ["Zu den Vorträgen", "Zu den Ideen", "IDEEN", "PRINZIPIEN", "MODELL", "WERDEGANG", "VORTRÄGE"],
```

In `sitemap.xml`, after the `/model/` line:

```xml
  <url><loc>https://blust.ch/timeline/</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>
```

The suite compares the sitemap to `PAGES`, so it stays red until Task 4 adds the page's
entry; that is expected through Tasks 2 and 3.

- [ ] **Step 5: Render the cards and run what can pass**

```bash
npm run og
npm run og:check; echo "og exit $?"
npm run design:check; echo "design exit $?"
```

Expected: both exit 0. `npm run verify` reports one failure, the sitemap naming a page
`PAGES` lacks; every other check on every page passes, `navOrder` included.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json card.js index.html ideas/index.html principles/index.html talks/index.html privacy/index.html model/index.html verify/check.mjs sitemap.xml
git add -A -- '*/og.png' '*/og.sha' og.png og.sha
git commit -F - <<'EOF'
Design 0.30.0, and every header names Timeline after Model

The entity card lives in card.js now, synced with the stage and loaded before it, so the
model page gains that script line. The header contract is v8 and names Timeline after
Model; the six pages that carry the header gain the item, and the sitemap names the page
it points at, which the next commits build.

Verified: design:check and og:check pass; verify passes on every page, with the sitemap
red until the timeline page has its entry.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
EOF
```

---

### Task 2: The page

**Files:**
- Create: `timeline/index.html` (copied from `model/index.html`, then edited)

**Interfaces:**
- Produces: the page's markup with the ids the script and the checks use: `#path`,
  `#openall`, `#ledger`, `#srclink[data-src]`, `#srccommit`, `#srccount`, the `model-data`
  block between the `model data` markers, the `[data-de]` words of §3 of the spec.
- Consumes: `card.js` (Task 1), `stage.css` v0.30.0 with the `.ledger` rules.

- [ ] **Step 1: Copy the model page**

```bash
mkdir timeline && cp model/index.html timeline/index.html
```

The copy carries every fence and the `model data` block byte for byte; the fences stay,
the block is rewritten by Task 3.

- [ ] **Step 2: The head**

In `timeline/index.html`, replace every occurrence as follows, leaving the fenced blocks
untouched:

- `<title>Model — Robert Blust</title>` → `<title>Timeline — Robert Blust</title>`
- the `metadesc` content and the `og:description` content →
  `Twenty-five years in order: every experience in the model as a ledger, each row the file it is read from, at the commit the page names.`
- `og:title` → `Timeline — Robert Blust`
- `https://blust.ch/model/` → `https://blust.ch/timeline/` (canonical, `og:url`, and the
  JSON-LD `WebPage` `url` and `@id`, the `BreadcrumbList` `@id` and its second item)
- `og:image` → `https://blust.ch/timeline/og.png`; `og:image:alt` → `Twenty-five years, in order.`
- in the JSON-LD `WebPage`, `"name": "Model"` → `"name": "Timeline"`; in the breadcrumb's
  second item, `"name": "Model"` → `"name": "Timeline"`

The `Person`, `Dataset` and `WebSite` nodes stay as they are; the page is about the same
dataset.

- [ ] **Step 3: The page's own style**

After the `stage contract` fence's closing marker and before `</style>`, the model page has
nothing of its own; this page adds the note the model page defines in its first `<style>`
and nothing else. Check that `.note` is already defined in the copied first style block (it
is on the model page at the rule beginning `.note{margin-top:2rem`); if it is, add nothing.

- [ ] **Step 4: The nav**

In the copied `.navlinks`, move `aria-current="page"` from the Model link to the Timeline
link, and make Model's href `../model/`:

```html
          <a href="../ideas/" data-de="Ideen">Ideas</a>
          <a href="../principles/" data-de="Prinzipien">Principles</a>
          <a href="../model/" data-de="Modell">Model</a>
          <a href="./" aria-current="page" data-de="Werdegang">Timeline</a>
          <a href="../talks/" data-de="Vorträge">Talks</a>
```

- [ ] **Step 5: The body, from `<main>` to `</main>`**

Replace everything between `<main>` and `</main>` with:

```html
<main>
  <div class="shell">

    <div class="title">
      <h1 data-de="<span class='r70'>Fünfundzwanzig Jahre,</span><span class='rcl'><em>der Reihe nach</em>.</span>"><span class="r70">Twenty-five years,</span><span class="rcl"><em>in order</em>.</span></h1>
      <p class="tagline" data-de="Jede Erfahrung im Modell, in der Reihenfolge, in der sie begann – Rollen, Projekte, Vorträge und Abschlüsse, und was während wessen lief. Gelesen aus denselben Dateien wie das Modell, am selben Commit.">Every experience in the model, in the order it began — roles, projects, talks and qualifications, and what ran during what. Read from the same files as the model, at the same commit.</p>
      <p class="note" data-de="Nichts davon wurde für diese Seite geschrieben: Jeder Eintrag ist die Datei im Modell, beim Commit, der unter der Liste steht – in der einen Sprache, in der das Modell geschrieben ist. Der Rest dieser Seite ist zweisprachig.">Nothing here was written for this page: every entry is the file in the model, at the commit named under the list — in the one language the model is written in. The rest of this page is bilingual.</p>
    </div>

    <section class="figure-section">
      <div class="stagehead" id="stagehead">
        <p class="path mono" id="path"></p>
        <button type="button" class="expand" id="openall" aria-pressed="false">Open all</button>
      </div>
      <ol class="ledger" id="ledger" aria-label="Every experience, in the order it began" data-de-aria="Jede Erfahrung, in der Reihenfolge ihres Beginns"></ol>
      <p class="stagehint" data-de="Anklicken öffnet die Karte eines Eintrags an Ort und Stelle · die Adresse merkt sich den zuletzt geöffneten">Click an entry to open its card in place · the address remembers the last one opened</p>
      <p class="figcap" data-de="Die Jahre links sind die Spanne eines Eintrags; die Zeile unter dem Namen nennt seine Art, wo er stattfand und seine genaue Zeit. Ein <b>grosses Quadrat</b> ist eine Rolle oder eine unabhängige Zeit, ein <b>kleines</b> alles andere. Ein Eintrag, der unter einer Rolle <b>eingerückt</b> ist, begann, während diese Rolle lief.">The years on the left are the span of an entry; the line under its name is its kind, where it was done and its exact period. A <b>large square</b> is a role or an independent period, a <b>small one</b> anything else. An entry <b>indented</b> under a role began while that role ran.</p>
    </section>

    <section>
      <h2 data-de="Wie man es liest">How to read it</h2>
      <div class="rules">
        <p data-de="<b>Fünf Arten, und die Art sagt, was ein Eintrag ist.</b> Rolle, Projekt, Community, Ausbildung und Unabhängig sind die Erfahrungsarten des Modells, so wie das Modell sie definiert: Eine Rolle ist eine Position, ein Projekt eine Lieferung in einer Rolle oder neben ihr, Community ist Arbeit in der Öffentlichkeit: ein Vortrag, ein Sitz, eine Arbeitsgruppe, ein veröffentlichter Fall.">
          <b>Five kinds, and the kind says what an entry is.</b> Role, Project, Community, Education and Independent are the model’s experience kinds, as the model defines them: a role is a position, a project is a delivery inside a role or beside one, community is work done in public: a talk, a seat, a working group, a published case.</p>
        <p data-de="<b>Die Reihenfolge ist der Beginn, die Einrückung das Während.</b> Ein Vortrag ist ein Tag, ein Vorstandssitz sind Jahre, und beides ist Community-Arbeit, weil das Publikum sie dazu macht, nicht die Dauer. Was ein Eintrag unter einer Rolle sagt, ist nur, dass er begann, während sie lief; wer ihn beauftragt hat, steht in seiner Karte.">
          <b>The order is the beginning, the indent is the during.</b> A talk is a day, a board seat is years, and both are community work because the audience makes them so, not the duration. What an entry under a role says is only that it began while the role ran; who commissioned it is in its card.</p>
        <p data-de="<b>Eine Karte ist die Datei, nicht ein Auszug daraus.</b> Art, Anfang, Ende, Organisation und Fähigkeiten stehen so da, wie die Datei sie schreibt; die Erfolge sind ihre Liste; der Link am Fuss führt zu ihr, beim Commit, den diese Seite zeigt. Ein Datum, das hier falsch ist, ist dort falsch, und wird dort korrigiert.">
          <b>A card is the file, not an excerpt of it.</b> Kind, start, end, organization and skills read as the file writes them; the achievements are its list; the link at the foot goes to it, at the commit this page shows. A date wrong here is wrong there, and is corrected there.</p>
      </div>
    </section>

    <p class="derived"><span data-de="Erzeugt aus">Generated from</span> <a id="srclink" data-src="model/profiles/robert-blust/experiences" href="https://github.com/robertblust/mental-model/tree/HEAD/model/profiles/robert-blust/experiences">robertblust/mental-model</a>@<span id="srccommit">HEAD</span> — <span id="srccount">0</span> <span data-de="Dateien unter">files under</span> <code class="mono">model/profiles/robert-blust/experiences/</code>, <span data-de="dasselbe Repository, aus dem die Modell-Seite gezeichnet wird, und eine Instanz von">the same repository the model page is drawn from, and an instance of</span> <a href="https://companygraph.io/">CompanyGraph</a>.</p>

  </div>
</main>
```

The apostrophe in "the model’s experience kinds" is the curly one, U+2019; `typography`
holds the page to it.

- [ ] **Step 6: The page's script, and the scripts it loads**

Leave the copied language-and-theme `<script>` as it is, but change its `UI` object:

```js
  var UI = {
    de:{ title:"Werdegang – Robert Blust",
         desc:"Fünfundzwanzig Jahre der Reihe nach: jede Erfahrung im Modell als Verzeichnis, jede Zeile die Datei, aus der sie gelesen wird, beim Commit, den die Seite nennt." },
    en:{ title:"Timeline — Robert Blust",
         desc:"Twenty-five years in order: every experience in the model as a ledger, each row the file it is read from, at the commit the page names." }
  };
```

The German title's dash is the spaced en-dash; `translates` holds the German title and
description to the German marks.

At the foot, replace the three `<script src>` lines with one, and add the page's own script
after it:

```html
<script src="../card.js"></script>
<script>
// The ledger: every experience in the block as one row, in the order it began, opening into
// the card card.js draws. This page's own, not the package's — one site has a ledger — but
// it draws no card and formats no date itself; rbCard does both, so a row here and a node on
// the model page can never read differently.
(function(){
  var block = document.querySelector('script[type="application/json"][data-stage]');
  var data = JSON.parse(block.textContent);
  var repo = data.repo || "robertblust/mental-model";
  var src = document.getElementById("srclink");
  src.href = "https://github.com/" + repo + "/tree/" + data.commit + "/" + src.getAttribute("data-src");
  document.getElementById("srccommit").textContent = data.commit.slice(0, 7);

  function lang(){ return document.documentElement.lang === "de" ? "de" : "en"; }
  var STR = {
    entries: { en:"entries",   de:"Einträge" },
    open:    { en:"Open all",  de:"Alle öffnen" },
    close:   { en:"Close all", de:"Alle schliessen" },
    today:   { en:"today",     de:"heute" }
  };
  function t(k){ return STR[k][lang()]; }
  function h(tag, text, cls){ var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

  // A date's place on the line, in days. A start is the first day it names; an end is the
  // day after the last day it names, so 2001-03 ends where 2001-04 begins and two adjacent
  // roles touch without overlapping. No kind decides how a date is read; the schema says so.
  function day(v, endSide){
    var m = /^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?$/.exec(v || "");
    if (!m) return endSide ? Infinity : 0;
    var y = +m[1], mo = m[2] ? +m[2] : 1, d = m[3] ? +m[3] : 1;
    if (!endSide) return Date.UTC(y, mo - 1, d);
    if (m[3]) return Date.UTC(y, mo - 1, d + 1);
    if (m[2]) return Date.UTC(y, mo, 1);
    return Date.UTC(y + 1, 0, 1);
  }
  var byId = {}; data.entities.forEach(function(e){ byId[e.id] = e; });
  var rows = data.entities.filter(function(e){ return e.type === "experience" && e.stamp; })
    .map(function(e){ return { e: e, s: day(e.stamp.start), t: e.stamp.end ? day(e.stamp.end, true) : Infinity }; })
    .sort(function(a, b){ return a.s - b.s || a.t - b.t; });
  var roles = rows.filter(function(r){ return r.e.stamp.kind === "Role"; });
  // One level, never more: the fact the indent states is "began while that role ran".
  function level(r){
    if (r.e.stamp.kind === "Role") return 0;
    for (var i = 0; i < roles.length; i++) if (roles[i].s <= r.s && r.s < roles[i].t) return 1;
    return 0;
  }
  function stem(e){ return e.id.slice(e.id.lastIndexOf("/") + 1); }
  function yearsOf(st){
    // The gutter is years only; rbCard writes the dash and the word for an open end, so the
    // gutter reads the way the stamp does, in the page's language.
    return rbCard.fmtPeriod({ start: st.start.slice(0, 4), end: st.end ? st.end.slice(0, 4) : "" }, lang());
  }
  function metaOf(e){
    var parts = [e.stamp.kind, e.fields.organization, rbCard.fmtPeriod(e.stamp, lang())];
    return parts.filter(function(x){ return x; }).join(" · ");
  }
  // A resolved reference in a card — a skill — leaves for the model page, which reads the
  // hash on load and focuses that node.
  function goLink(id){ var a = h("a", byId[id].name, "go"); a.href = "../model/#" + id; return a; }

  var ol = document.getElementById("ledger"), pathLine = document.getElementById("path"),
      openAll = document.getElementById("openall");
  var built = rows.map(function(r){
    var e = r.e, li = h("li", null, "k-" + e.stamp.kind.toLowerCase());
    li.style.setProperty("--lvl", level(r));
    var d = h("details"); d.id = stem(e);
    var sum = h("summary");
    var when = h("span", null, "when"), mark = h("span", null, "mark"), what = h("span", null, "what");
    mark.setAttribute("aria-hidden", "true");
    what.appendChild(h("span", e.name, "name"));
    what.appendChild(h("span", null, "meta"));
    sum.appendChild(when); sum.appendChild(mark); sum.appendChild(what);
    var body = h("div", null, "body"), card = h("div", null, "card"),
        cbody = h("div", null, "cbody"), cfoot = h("div", null, "cfoot"), cfootLink = h("span");
    cfoot.appendChild(cfootLink); card.appendChild(cbody); card.appendChild(cfoot); body.appendChild(card);
    d.appendChild(sum); d.appendChild(body); li.appendChild(d); ol.appendChild(li);
    return { r: r, li: li, d: d, when: when, meta: what.lastChild, cbody: cbody, cfoot: cfootLink };
  });
  var today = h("li", null, "now"); ol.appendChild(today);

  // Everything in a language: the gutters, the meta lines, the cards, the path line, the
  // control and the TODAY line. Built once and rebuilt when <html lang> changes, the way the
  // stage rebuilds what it draws.
  function render(){
    var L = lang();
    built.forEach(function(b){
      b.when.textContent = yearsOf(b.r.e.stamp);
      b.meta.textContent = metaOf(b.r.e);
      rbCard.render(b.r.e, b.cbody, b.cfoot, { data: data, lang: L, link: goLink });
    });
    var first = rows[0].e.stamp.start.slice(0, 4), now = new Date();
    var ym = now.getUTCFullYear() + "-" + String(now.getUTCMonth() + 1).replace(/^(\d)$/, "0$1");
    today.textContent = rbCard.fmtDate(ym, L) + " · " + t("today");
    pathLine.innerHTML = "";
    pathLine.appendChild(document.createTextNode("experiences · "));
    pathLine.appendChild(h("b", rows.length + " " + t("entries")));
    pathLine.appendChild(document.createTextNode(" · " + first + "–" + now.getUTCFullYear()));
    document.getElementById("srccount").textContent = String(rows.length);
    ol.setAttribute("aria-label", ol.getAttribute(L === "de" ? "data-de-aria" : "data-en-aria"));
    syncOpenAll();
  }
  ol.setAttribute("data-en-aria", ol.getAttribute("aria-label"));

  function openCount(){ return built.filter(function(b){ return b.d.open; }).length; }
  function syncOpenAll(){
    var all = openCount() === built.length;
    openAll.setAttribute("aria-pressed", String(all));
    openAll.textContent = all ? t("close") : t("open");
  }
  // The address names the last entry opened, so a link can point at one row: opening a row
  // writes its id without scrolling, closing the last open row clears it, and arriving with
  // one opens that row and brings it into view.
  ol.addEventListener("toggle", function(ev){
    var d = ev.target; if (d.tagName !== "DETAILS") return;
    try {
      if (d.open) history.replaceState(null, "", "#" + d.id);
      else if (location.hash === "#" + d.id) history.replaceState(null, "", location.pathname + location.search);
    } catch (e) {}
    syncOpenAll();
  }, true);
  openAll.addEventListener("click", function(){
    var open = openAll.getAttribute("aria-pressed") !== "true";
    built.forEach(function(b){ b.d.open = open; });
  });
  function arrive(){
    var id = decodeURIComponent(location.hash.slice(1)), d = id && document.getElementById(id);
    if (d && d.tagName === "DETAILS") { d.open = true; d.scrollIntoView({ block: "start" }); }
  }
  window.addEventListener("hashchange", arrive);
  new MutationObserver(render).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });

  render();
  arrive();
})();
</script>
```

- [ ] **Step 7: Serve it and look once**

```bash
npm run serve &
```

Open `http://localhost:8000/timeline/`. Expected: the header with Timeline in `--c-firm`, the
title, the note with its flag border, the path line `experiences · 31 entries · 1999–2026`,
Open all, 31 rows on one rule with the education row and the talks indented, the TODAY line,
the hint, the caption, the three rules, the provenance line reading `@a535e43 — 31 files
under …`. Click the 3AP row: its card opens under it with the eyebrow
`experience · profiles/robert-blust/experiences/2015-3ap`, the fields, the skills as links,
Achievements, the foot `2015-3ap.md @ a535e43`; the address ends `#2015-3ap`. Press DE: the
gutter reads `2015 – 2022`, the meta line `Role · 3AP AG · Feb 2015 – Mär 2022`, the control
`Alle öffnen`. Then stop the server.

- [ ] **Step 8: Commit**

```bash
git add timeline/index.html
git commit -F - <<'EOF'
The timeline page: every experience as a ledger, each row opening into its card

A copy of the model page with a different figure: one ordered list built from the same
data block, sorted by the day an entry began, an entry indented one level when a role's
span covers its start. Every card and every date comes from card.js, so a row here and a
node on the model page cannot read differently. Opening a row writes its id to the
address; arriving with one opens it.

Verified: rendered at localhost:8000/timeline/ in both languages; the block is the model
page's copy until build/model.mjs writes it in the next commit.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
EOF
```

---

### Task 3: One block, two pages

**Files:**
- Modify: `build/model.mjs:84-105`
- Modify: `AGENTS.md` (a new section before `## CI`)
- Modify: `README.md` (the `## Pages` block)

**Interfaces:**
- Produces: `npm run model` writing the identical block into `model/index.html` and
  `timeline/index.html`; `npm run model:check` holding both.

- [ ] **Step 1: Make the writer loop over the pages**

In `build/model.mjs`, replace everything from `const PAGE = path.join(ROOT, "model", "index.html");`
to the end of the file with:

```js
// Two pages carry the block, and it is one block: the model page draws it, the timeline
// lists one type out of it. Written by one loop so they cannot show different states of
// the model, and checked by the same loop so a page edited by hand goes red for both.
const PAGES = ["model", "timeline"].map((dir) => path.join(ROOT, dir, "index.html"));

let stale = [];
for (const PAGE of PAGES) {
  const page = fs.readFileSync(PAGE, "utf8");
  const start = page.search(START), end = page.indexOf(END);
  if (start < 0 || end < 0) throw new Error(`${path.relative(ROOT, PAGE)} has no data block markers`);
  const current = page.slice(start, end + END.length);
  if (process.argv.includes("--check")) {
    if (current !== block) stale.push(path.relative(ROOT, PAGE));
  } else {
    fs.writeFileSync(PAGE, page.slice(0, start) + block + page.slice(end + END.length));
  }
}

if (process.argv.includes("--check")) {
  if (stale.length) {
    console.log(`  ✗ ${stale.join(", ")} no longer match ${repo}@${commit.slice(0, 7)} — run: npm run model`);
    process.exit(1);
  }
  console.log(`  ✓ model/index.html and timeline/index.html show ${repo}@${commit.slice(0, 7)}`);
} else {
  console.log(`  wrote model/index.html and timeline/index.html: ${data.entities.length} entities, ${data.edges.length} edges from ${repo}@${commit.slice(0, 7)}`);
}
```

- [ ] **Step 2: Run the check, then the build, then the check**

```bash
MENTAL_MODEL=~/git/robertblust/mental-model npm run model:check; echo "exit $?"
```

Expected: exit 0 — the copied block already matches. If `MENTAL_MODEL` is not at the pinned
commit, drop the variable and let the script read GitHub. Then:

```bash
MENTAL_MODEL=~/git/robertblust/mental-model npm run model && git status --short
```

Expected: `wrote model/index.html and timeline/index.html: …` and no file changed.

- [ ] **Step 3: Say so where a reader looks**

In `README.md`, the `## Pages` block names four URLs today, the root, the talks index and
the two decks; it gains one line after the last deck's, and completing the list is not this
plan's business:

```
/timeline/                       the experiences as a ledger — built from the same block as /model/
```

In `AGENTS.md`, before `## CI`, add:

```markdown
## Two pages carry one data block

`/model/` and `/timeline/` both hold the parsed model as a JSON block between `model data`
markers, and `build/model.mjs` writes both from one parse — `npm run model` rewrites both,
`npm run model:check` holds both. So a red check names a page that was not touched: edit
the timeline page's prose by hand and the model page still passes, but re-pin the model and
forget `npm run model`, and both go red together. The timeline page draws no card of its
own: `card.js`, from the design package, renders every card and formats every date on it,
exactly as it does on the model page, and that is why the two pages can never disagree
about what a file says.
```

- [ ] **Step 4: Prose check and commit**

```bash
sh conventions/conventions-check
git add build/model.mjs README.md AGENTS.md
git commit -F - <<'EOF'
build/model.mjs writes the block into the timeline page too

Two pages carry the parsed model and it is one block: written by one loop so they cannot
show different states of the model, checked by the same loop so a page edited by hand goes
red for both. The README names the page; AGENTS.md says why a red check can name a page
nobody touched.

Verified: npm run model:check passes on both pages; conventions-check passes.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
EOF
```

---

### Task 4: The suite knows the page

**Files:**
- Modify: `verify/check.mjs` (the `PAGES` list after the `/model/` entry; the `CHECKS` object)
- Modify: `og-recipe.mjs:52`
- Create: `timeline/og.png`, `timeline/og.sha` (rendered)

**Interfaces:**
- Produces: the `/timeline/` entry in `PAGES`; the `ledger` check, keyed on the block's id.
- Consumes: `#ledger`, `#openall`, `#srclink`, `#srccommit`, the `details` ids (Task 2).

- [ ] **Step 1: The page's entry**

After the `/model/` entry in `PAGES`, add:

```js
  // The timeline lists the experiences out of the same block the model page draws, each row
  // opening into the card card.js renders. `ledger` is the check that the rows are the block's
  // experiences in the order they began and that a card is the entity, field for field.
  { path: "/timeline/", typography: true, storageKeys: true, mobileNav: true, carriesLang: true, headerBaseline: true, navOrder: true, footer: FOOTER, seo: true, noNewTab: true, title: /Timeline/, lang: "en", sourceLang: "en",
    translates: { lang: "de", shows: ["Wie man es liest", "Alle öffnen", "Nichts davon wurde für diese Seite geschrieben"], hides: ["How to read it", "Open all", "Nothing here was written for this page"],
                  title: "Werdegang – Robert Blust",
                  desc: "Fünfundzwanzig Jahre der Reihe nach: jede Erfahrung im Modell als Verzeichnis, jede Zeile die Datei, aus der sie gelesen wird, beim Commit, den die Seite nennt." },
    contains: ["Twenty-five years,", "in order", "How to read it", "Generated from"],
    links: ["https://companygraph.io/"],
    sameOrigin: true,
    fontsLoaded: ["Bricolage Grotesque", "Instrument Sans"], fontsAvailable: true,
    tokens: true, sky: true, header: true, monoScope: true, monoDefined: true, contrast: true, noFlash: "rb-theme", tokenVersion: true, fences: ["design tokens", "header contract", "language", "prose reset", "prose footer", "stage contract"],
    card: true, internalLinks: true, ledger: "model-data" },
```

- [ ] **Step 2: The `ledger` check**

In `CHECKS`, after `brandMark`, add:

```js
  // Local to this site until a second site has a ledger. Reads the block the page carries
  // and holds the page to it: the rows are the block's experiences in the order they began,
  // an open row's card lists the entity's fields in file order, the foot names the file at
  // the block's commit, and the address opens a row.
  async ledger(page, spec) {
    const data = await page.evaluate((id) => JSON.parse(document.getElementById(id).textContent), spec.ledger);
    const exps = data.entities.filter(e => e.type === "experience");
    if (!exps.length) return "the block holds no experiences — run: npm run model";
    const ids = await page.evaluate(() => [...document.querySelectorAll("#ledger details")].map(d => d.id));
    if (ids.length !== exps.length) return `${ids.length} rows for ${exps.length} experiences`;
    const day = (v) => { const m = /^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?$/.exec(v || ""); return m ? Date.UTC(+m[1], m[2] ? +m[2] - 1 : 0, m[3] ? +m[3] : 1) : 0; };
    const want = exps.slice().sort((a, b) => day(a.stamp.start) - day(b.stamp.start)).map(e => e.id.slice(e.id.lastIndexOf("/") + 1));
    for (let i = 0; i < ids.length; i++)
      if (ids[i] !== want[i] && day(exps.find(e => e.id.endsWith("/" + ids[i])).stamp.start) !== day(exps.find(e => e.id.endsWith("/" + want[i])).stamp.start))
        return `row ${i + 1} is ${ids[i]}, expected ${want[i]}`;
    const srcSub = await page.evaluate(() => document.getElementById("srclink").getAttribute("data-src"));
    const srcHref = await page.evaluate(() => document.getElementById("srclink").getAttribute("href"));
    if (!srcHref.endsWith(`/tree/${data.commit}/${srcSub}`)) return `source link is ${JSON.stringify(srcHref)}`;
    const srcCommit = await page.evaluate(() => document.getElementById("srccommit").textContent);
    if (srcCommit !== data.commit.slice(0, 7)) return `source commit reads ${JSON.stringify(srcCommit)}`;
    const count = await page.evaluate(() => document.getElementById("srccount").textContent);
    if (count !== String(exps.length)) return `srccount reads ${count}, expected ${exps.length}`;
    // Open the first row and read its card against the entity.
    const first = exps.find(e => e.id.endsWith("/" + ids[0]));
    const card = await page.evaluate((id) => {
      const d = document.getElementById(id); d.open = true;
      return { dts: [...d.querySelectorAll(".cbody dt")].map(x => x.textContent),
               eyebrow: d.querySelector(".cbody .eyebrow").textContent,
               foot: d.querySelector(".cfoot a").getAttribute("href"),
               hash: location.hash };
    }, ids[0]);
    const fields = Object.keys(first.fields);
    if (card.dts.join("|") !== fields.join("|")) return `first card lists ${card.dts.join(", ")}; the file has ${fields.join(", ")}`;
    if (card.eyebrow !== `experience · ${first.id}`) return `first card's eyebrow reads ${JSON.stringify(card.eyebrow)}`;
    if (!card.foot.endsWith(`/blob/${data.commit}/${first.path}`)) return `first card's foot link is ${card.foot}`;
    if (card.hash !== "#" + ids[0]) return `opening a row wrote ${JSON.stringify(card.hash)} to the address`;
    // Open all opens every row and reads Close all; the address still names the last opened.
    await page.click("#openall");
    const after = await page.evaluate(() => ({
      open: [...document.querySelectorAll("#ledger details")].filter(d => d.open).length,
      label: document.getElementById("openall").textContent,
      pressed: document.getElementById("openall").getAttribute("aria-pressed") }));
    if (after.open !== ids.length) return `Open all opened ${after.open} of ${ids.length}`;
    if (after.label !== "Close all" || after.pressed !== "true") return `after Open all the control reads ${JSON.stringify(after.label)}, pressed ${after.pressed}`;
    // Arriving with a hash opens that row.
    const target = ids[Math.floor(ids.length / 2)];
    await page.goto(BASE + spec.path + "#" + target);
    const opened = await page.evaluate((id) => document.getElementById(id).open, target);
    if (!opened) return `arriving at #${target} did not open that row`;
    return null;
  },
```

- [ ] **Step 3: The share card**

In `og-recipe.mjs`, after the `model` line:

```js
  { dir: "timeline", ...FRAME, hide: HIDE, titleSlide: false },
```

```bash
npm run og
npm run og:check; echo "exit $?"
```

Expected: `timeline/og.png` and `timeline/og.sha` written; exit 0.

- [ ] **Step 4: Run the suite**

```bash
npm run verify; echo "exit $?"
```

Expected: exit 0, every page green, the sitemap check green now that `PAGES` names the
page. If `ledger` fails on the sort, the two ids it names share a start day and the check's
tie rule is wrong, not the page; compare their `stamp.end` before touching either.

- [ ] **Step 5: Commit**

```bash
git add verify/check.mjs og-recipe.mjs timeline/og.png timeline/og.sha
git commit -F - <<'EOF'
The suite holds the timeline page

A PAGES entry with every check the model page runs but the drawing's two, and a ledger
check of this site's own: the rows are the block's experiences in the order they began,
an open card lists the entity's fields in file order, the foot names the file at the
block's commit, the address opens a row and Open all opens them all. The page has its own
share card.

Verified: npm run verify passes on every page; npm run og:check passes.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
EOF
```

---

### Task 5: The pin moves, and the pull request

**Files:**
- Modify: `source.json`
- Regenerate: `model/index.html`, `timeline/index.html` (the block), `principles/index.html`, and the cards of all three

**Interfaces:**
- Consumes: Rob's word on the pin before this task's commit. The spec proposes
  `7ed3f65`, the merge of the community kind's corrected definition, and he merged the spec
  as written; ask once, in one line, before running Step 1, and stop if the answer is no.

- [ ] **Step 1: Re-pin**

```bash
cd ~/git/robertblust/mental-model && git checkout main && git pull && git rev-parse HEAD
```

Expected: `7ed3f65…`. If `main` has moved past it, pin `7ed3f65` anyway — the pin is
editorial and this is the commit the spec names. Then, in this repository, write the full
SHA into `source.json`:

```bash
FULL=$(git -C ~/git/robertblust/mental-model rev-parse 7ed3f65)
python3 -c "import json;p='source.json';d=json.load(open(p));d['commit']='$FULL';json.dump(d,open(p,'w'));open(p,'a').write('\n')"
cat source.json
MENTAL_MODEL=~/git/robertblust/mental-model npm run model
MENTAL_MODEL=~/git/robertblust/mental-model npm run principles
git status --short
```

Expected: `source.json`, `model/index.html`, `timeline/index.html` and `principles/index.html`
changed. `git diff principles/index.html` shows only the commit in the provenance line and
nothing in the values, since no value changed between the two commits; if it shows more,
read it before going on.

- [ ] **Step 2: Cards, checks, suite**

```bash
npm run og
npm run og:check && npm run model:check && npm run principles:check && npm run design:check && npm run pin:check; echo "exit $?"
npm run verify; echo "exit $?"
```

Expected: both exit 0.

- [ ] **Step 3: Commit and open the pull request**

```bash
git add source.json model/index.html timeline/index.html principles/index.html
git add -A -- '*/og.png' '*/og.sha' og.png og.sha
git commit -F - <<'EOF'
The model pin moves to 7ed3f65, where community work is defined by its audience

The timeline's first reading rule paraphrases the community kind, and the kind's own
definition was corrected in the model on the same day the page was designed. The three
generated pages move together; nothing but the commit changes on the principles page.

Verified: model:check, principles:check, og:check, design:check and pin:check pass;
npm run verify passes on every page.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
EOF
git push -u origin timeline
gh pr create --base main --title "The timeline page" --body-file - <<'EOF'
A fifth prose page, /timeline/: every experience in the model as a ledger in the order it began, each row opening into the card the model page draws. It is a copy of the model page with a different figure, built from the same data block by the same script, and every card and every date on it comes from card.js, the file design 0.30.0 moved out of the stage so that no page copies the renderer again.

Five commits: the design release taken and Timeline in every header; the page; build/model.mjs writing the block into both pages; the suite's entry and a ledger check of this site's own; the model pin moved to 7ed3f65, where the community kind is defined by its audience, which regenerates the model and principles pages with it.

Spec: docs/superpowers/specs/2026-09-05-timeline-page-design.md. Design release: https://github.com/robertblust/design/releases/tag/v0.30.0.

Verified: npm run verify passes on every page; model:check, principles:check, og:check, design:check and pin:check pass.
EOF
```

Report the pull request URL and the two checks' status, and stop. Merging is Rob's word.
