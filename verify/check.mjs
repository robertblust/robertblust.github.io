// The deliverable is rendered pages, so the tests are assertions against a rendered DOM.
// Run against a served copy of the repo: python3 -m http.server 8000
import { chromium } from "playwright";
import { DESIGN_CHECKS, SYSTEM_FACES } from "@robertblust/design/verify/design";
import { STAGE_CHECKS } from "@robertblust/design/verify/stage";
import { MODEL_PAGE_CHECKS } from "@robertblust/design/verify/model-pages";
import { pageChecks } from "@robertblust/design/verify/pages";
import { runSuite } from "@robertblust/design/verify/suite";

const BASE = process.env.BASE || "http://localhost:8000";
// The public origin, in one place. It was hardcoded in `card`, in the sitemap's expected
// list, and in the seo fetch rewrite — and *derived* in the seo origin filter, by rewriting
// a literal "http://localhost:8000". Run with BASE=http://127.0.0.1:8000 and that derivation
// produced a filter nothing matched, so every URL in every graph was skipped and the check
// printed ✓ having fetched none of them.
const SITE = "https://blust.ch";

// Extended by later tasks. `lang` is the expected documentElement.lang AFTER JS runs.
// What every prose footer reads, left to right. The check compares this to the rendered DOM,
// so it is the one place that decides the order — and the German labels never appear here
// because the suite loads each page in its source language. `model.json` is the name of the file
// a reader lands on, not a word for it, so that entry is the same in both languages and carries
// no `-de` attribute to translate.
const FOOTER = ["GitHub", "License", "Privacy", "model.json"];

const PAGES = [
  { path: "/", typography: true, storageKeys: true, mobileNav: true, carriesLang: true, headerBaseline: true, navOrder: true, headerFits: true, footer: FOOTER, seo: true, noNewTab: true, title: /Robert Blust/, lang: "en", sourceLang: "en",
    translates: { lang: "de", shows: ["Zu den Vorträgen", "Zu den Ideen", "IDEEN", "PRINZIPIEN", "MODELL", "WERDEGANG", "VORTRÄGE"],
                  hides: ["See the talks", "See the ideas"] },
    // LinkedIn left this list when it left the footer. It is still asserted as identity in
    // the page's JSON-LD `sameAs`, which is what that link was for; this check only ever saw
    // anchors, so keeping it here would fail on a link the page no longer renders.
    links: ["https://github.com/robertblust", "https://3ap.ch/", "https://likemagic.tech/"],
    // The career break is on the page deliberately, so it is asserted deliberately: it is
    // the sentence most likely to be quietly dropped later, and it is what explains why
    // both ideas are built in the open.
    contains: ["deciding well", "Robert Blust", "3AP", "LIKE MAGIC",
               "career break", "See the ideas"], card: true,
    // The two project names jump to their own section. Asserted by href, because a
    // fragment that stops matching an id fails silently — the page just lands at the top.
    sameTab: ["talks/", "ideas/", "ideas/#guestgraph", "ideas/#companygraph"], brandMark: true,
    fontsLoaded: ["Bricolage Grotesque", "Instrument Sans"], fontsAvailable: true,
    // See the note on /privacy/'s entry: this page links tokens.css and page.css instead of
    // fencing design tokens, header contract, prose reset and prose footer, so fences is
    // empty; tokenVersion reads tokens.css's own opening comment instead of a page marker.
    tokens: true, sky: true, header: true, monoScope: true, monoDefined: true, contrast: true, noFlash: "theme", tokenVersion: true, fences: [],
    internalLinks: true },
  // opensFromFile resolves its file:// probe against process.cwd(), which npm sets to this
  // repo's root — so the suite must be run with `npm run verify` from here, not from elsewhere.
  { path: "/talks/mental-model/", typography: true, storageKeys: true, opensFromFile: true, carriesLang: true, seo: true, noNewTab: true, wayOut: "../", title: /Mental Model/, lang: "en", sourceLang: "en",
    // The deck's German is the whole second half of the talk, including every speaker note.
    // "ÜBERBLICK"/"EXPLAINED" is the pair: the title slide's kicker, set in capitals and read as shown, present in exactly one language each.
    translates: { lang: "de", shows: ["ÜBERBLICK", "Das Mental Model"], hides: ["EXPLAINED"], id: "langDe", backId: "langEn" },
    transport: true, zeroBased: true,  card: true, brandMark: true,
    transportFits: [320, 350, 360, 390, 393, 414, 430],
    // One width per tier of the transport's own breakpoints, plus two above them. The
    // desktop pair is where the two controls actually disagreed before design v0.27.0;
    // the three narrow widths hold for free today, because each tier restates
    // `min-height` on `.seg button` — they are named so a change to the theme control's
    // padding cannot break one of them unseen.
    transportBaseline: [320, 360, 430, 500, 900, 1280],
    landing: "../../",
    fontsLoaded: ["Bricolage Grotesque", "Instrument Sans"], fontsAvailable: true,
    // This deck links tokens.css and deck.css instead of fencing design tokens, deck
    // transport and deck lockup, so fences is empty (fenceOrder no longer applies — there
    // is nothing left to order) and tokenVersion reads tokens.css's own opening comment,
    // exactly as /privacy/'s note explains. readoutInvariant is armed: design:check only
    // proves tokens.css itself matches the pinned release byte for byte, which says nothing
    // about the roughly ninety rules this deck still carries in its own <style> — a
    // `.lcd`-targeting rule added there, outside anything the package owns, is exactly what
    // readoutInvariant exists to catch, per its own header in @robertblust/design. Dropping
    // it because the fence is gone would drop the one check that reads this deck's own CSS.
    //
    // Armed, and green since @robertblust/design v0.80.2: the check reads the :root pair from
    // the linked tokens.css where a page's own <style> carries none, and goes on scanning this
    // deck's own <style> for a `.lcd` rule that names a token differing between the themes,
    // which is the half no byte comparison sees. Proved to still bite by adding such a rule to
    // a copy of this deck and reading the failure it reports.
    // lockupCollapses stays armed: @robertblust/design v0.80.0 shipped deck.css with deck
    // transport assembled before deck lockup, the reverse of the order the fenced form
    // always declared, which flipped which .name rule won the cascade at equal specificity;
    // v0.80.1 assembles lockup before transport, the fenced form's own order, so the
    // collapse is correct again with no page-level override.
    tokens: true, sky: true, monoScope: true, contrast: true, noFlash: "theme", tokenVersion: true,
    fences: [],
    readoutInvariant: true,
    lockupCollapses: true,
    internalLinks: true },
  { path: "/talks/essential-complexity/", typography: true, storageKeys: true, opensFromFile: true, carriesLang: true, seo: true, noNewTab: true, wayOut: "../", title: /Essential Complexity/, lang: "en", sourceLang: "en",
    translates: { lang: "de", shows: ["ÜBERBLICK", "Essenzielle"], hides: ["EXPLAINED"], id: "langDe", backId: "langEn" },
    transport: true, zeroBased: true,  card: true, brandMark: true,
    transportFits: [320, 350, 360, 390, 393, 414, 430],
    // One width per tier of the transport's own breakpoints, plus two above them. The
    // desktop pair is where the two controls actually disagreed before design v0.27.0;
    // the three narrow widths hold for free today, because each tier restates
    // `min-height` on `.seg button` — they are named so a change to the theme control's
    // padding cannot break one of them unseen.
    transportBaseline: [320, 360, 430, 500, 900, 1280],
    landing: "../../",
    fontsLoaded: ["Bricolage Grotesque", "Instrument Sans"], fontsAvailable: true,
    // See the note on /talks/mental-model/'s entry.
    tokens: true, sky: true, monoScope: true, contrast: true, noFlash: "theme", tokenVersion: true,
    fences: [],
    readoutInvariant: true,
    lockupCollapses: true,
    internalLinks: true },
  // The figures on slides 03, 05 and 07 come from talks/deciding-well/stats.json and
  // decisions.json. `contains` cannot hold them — it reads visible text, and a deck shows one
  // slide at a time — so talks/deciding-well/test_deck.py reads the source instead, in CI.
  { path: "/talks/deciding-well/", typography: true, storageKeys: true, opensFromFile: true, carriesLang: true, seo: true, noNewTab: true, wayOut: "../", title: /Deciding well is not/, lang: "en", sourceLang: "en",
    translates: { lang: "de", shows: ["EIN VORTRAG", "Schnell bauen"], hides: ["A TALK"], id: "langDe", backId: "langEn" },
    transport: true, zeroBased: true,  card: true, brandMark: true,
    transportFits: [320, 350, 360, 390, 393, 414, 430],
    transportBaseline: [320, 360, 430, 500, 900, 1280],
    landing: "../../",
    fontsLoaded: ["Bricolage Grotesque", "Instrument Sans"], fontsAvailable: true,
    // See the note on /talks/mental-model/'s entry.
    tokens: true, sky: true, monoScope: true, contrast: true, noFlash: "theme", tokenVersion: true,
    fences: [],
    readoutInvariant: true,
    lockupCollapses: true,
    internalLinks: true },
  // The deciding-well talk's cost page. Every figure it prints is computed from stats.json,
  // decisions.json and cost.json by talks/deciding-well/cost/cost.mjs, whose arithmetic
  // `npm run test:cost` holds; this holds what the page does with it: no slot left empty in
  // either language, the defaults shown, and a failed load said rather than shown blank.
  { path: "/talks/deciding-well/cost/", typography: true, storageKeys: true, mobileNav: true, carriesLang: true, headerBaseline: true, navOrder: true, headerFits: true, footer: FOOTER, seo: true, noNewTab: true, title: /would have cost/i, lang: "en", sourceLang: "en", card: true,
    contains: ["What a team", "Would both approaches produce the same result?"],
    slotsFilled: { en: ["CHF 1,235,443", "CHF 57,216", "22"], de: ["CHF 1’235’443", "CHF 57’216"] },
    sameOrigin: true,
    fontsLoaded: ["Bricolage Grotesque", "Instrument Sans"], fontsAvailable: true,
    // See the note on /privacy/'s entry.
    tokens: true, sky: true, header: true, monoScope: true, monoDefined: true, contrast: true, noFlash: "theme", tokenVersion: true, fences: [],
    internalLinks: true },
  { path: "/talks/", typography: true, storageKeys: true, mobileNav: true, carriesLang: true, headerBaseline: true, navOrder: true, headerFits: true, footer: FOOTER, seo: true, noNewTab: true, title: /talks/i, lang: "en", sourceLang: "en",
    // The German PDF is reached by data-de-href, which `sameTab` cannot see: it reads the href as
    // delivered, and the swap happens only after a click. `dlHref` reads the first such link.
    translates: { lang: "de", shows: ["Vorträge über", "Vortrag ansehen", "PDF herunterladen"], hides: ["Watch the talk", "Download PDF"],
                  dlHref: { de: "deciding-well/deciding-well-de.pdf", en: "deciding-well/deciding-well-en.pdf" } },
    contains: ["The Mental Model", "Essential Complexity", "Building fast is solved. Deciding well is not.",
               "machine-readable knowledge base", "essential complexity"], card: true,
    sameTab: ["mental-model/", "essential-complexity/", "deciding-well/", "./"], brandMark: true,
    fontsLoaded: ["Bricolage Grotesque", "Instrument Sans"], fontsAvailable: true,
    // See the note on /privacy/'s entry.
    tokens: true, sky: true, header: true, monoScope: true, monoDefined: true, contrast: true, noFlash: "theme", tokenVersion: true, fences: [],
    internalLinks: true },
  // The privacy page. Its claims are checkable, so verify checks them rather than trusting
  // the prose: a page that says it makes no third-party request must make none.
  { path: "/privacy/", typography: true, storageKeys: true, mobileNav: true, carriesLang: true, headerBaseline: true, navOrder: true, headerFits: true, footer: FOOTER, seo: true, noNewTab: true, title: /Blust/, lang: "en", sourceLang: "en", card: true,
    translates: { lang: "de", shows: ["Was diese Website tut", "Wer das betreibt"], hides: ["What this site does", "Who runs this"] },
    contains: ["This site collects", "There is no imprint yet"],
    sameOrigin: true,
    fontsLoaded: ["Bricolage Grotesque", "Instrument Sans"], fontsAvailable: true,
    // fences reads the served HTML for named marker comments, and this page carries none:
    // design tokens, header contract, title contract, prose reset and prose footer are
    // what tokens.css and page.css supply instead. An empty list satisfies the per-page
    // check (nothing named is missing) and runSuite's own gate, which only asks that every
    // page in PAGES carry the key at all (an empty array is truthy). tokenVersion's gate is
    // the same shape, and since @robertblust/design v0.80.1 the check itself reads it the
    // same way: an empty fences list sends it to tokens.css's own opening comment instead
    // of the page for a `design tokens · vN` marker, so the page needs no hand-written
    // comment naming the version. tokens, sky, header, monoScope, monoDefined and contrast
    // read computed style, which a linked stylesheet satisfies exactly as a fenced one did,
    // and stay declared.
    tokens: true, sky: true, header: true, monoScope: true, monoDefined: true, contrast: true, noFlash: "theme", tokenVersion: true, fences: [],
    internalLinks: true },
  // The ideas page. Two claims make it worth reading and both are checkable: that each
  // idea has exactly one commercial part, and that nothing on the page reaches off-origin —
  // the privacy note promises the second for the whole site.
  { path: "/ideas/", typography: true, storageKeys: true, mobileNav: true, carriesLang: true, headerBaseline: true, navOrder: true, headerFits: true, footer: FOOTER, seo: true, noNewTab: true, title: /Ideas/, lang: "en", sourceLang: "en",
    translates: { lang: "de", shows: ["öffentlich geprüft", "DIE FRAGEN, DIE DIE VALIDIERUNG BEANTWORTEN MUSS"], hides: ["Two ideas", "THE QUESTIONS VALIDATION HAS TO ANSWER"] },
    contains: ["Two ideas", "Open core", "COMMERCIAL", "OPEN SOURCE"],
    links: ["https://github.com/guestgraph", "https://github.com/companygraph"],
    sameOrigin: true,
    fontsLoaded: ["Bricolage Grotesque", "Instrument Sans"], fontsAvailable: true,
    // See the note on /privacy/'s entry.
    tokens: true, sky: true, header: true, monoScope: true, monoDefined: true, contrast: true, noFlash: "theme", tokenVersion: true, fences: [],
    card: true, internalLinks: true },
  // Generated from the model, so what it asserts is the shape of the page and one line of the
  // content — the words themselves are `npm run pages:check`'s business, and asserting
  // them twice would mean editing this file every time a value is written.
  { path: "/principles/", typography: true, storageKeys: true, mobileNav: true, carriesLang: true, headerBaseline: true, navOrder: true, headerFits: true, footer: FOOTER, seo: true, noNewTab: true, title: /Principles/, lang: "en", sourceLang: "en",
    // The page's own words swap; the model's stay English, which its note says. `shows` names
    // the note, `hides` the English note — never a principle, which is the same in both views.
    translates: { lang: "de", shows: ["Aus dem Modell erzeugt", "Werte"], hides: ["Generated from the model, so"] },
    contains: ["One model,", "everywhere", "Values", "Generated from"],
    links: ["https://github.com/robertblust/mental-model", "https://companygraph.io/"],
    sameOrigin: true,
    fontsLoaded: ["Bricolage Grotesque", "Instrument Sans"], fontsAvailable: true,
    tokens: true, sky: true, header: true, monoScope: true, monoDefined: true, contrast: true, noFlash: "theme", tokenVersion: true, fences: [],
    card: true, internalLinks: true },
  // The model page draws the same graph the example on companygraph.io draws, from this
  // person's own instance rather than the fictional one. `stage` is the check that the
  // drawing actually drew: the data block alone proves nothing rendered.
  { path: "/model/", typography: true, storageKeys: true, mobileNav: true, carriesLang: true, headerBaseline: true, navOrder: true, headerFits: true, footer: FOOTER, seo: true, noNewTab: true, title: /Model/, lang: "en", sourceLang: "en",
    translates: { lang: "de", shows: ["Was hier steht", "Dieselbe Form wie das Beispiel"], hides: ["What is in it", "The same shape as the example"] },
    contains: ["A company of one", "drawn", "What is in it", "Generated from"],
    // The source link is not asserted here. The stage rewrites its href from the block's own
    // commit, so any literal in this list would be either the markup's placeholder (gone by
    // the time the check reads the DOM) or a commit that changes on every repin. `graph`
    // asserts it instead, against the block itself.
    links: ["https://companygraph.io/"],
    sameOrigin: true,
    fontsLoaded: ["Bricolage Grotesque", "Instrument Sans"], fontsAvailable: true,
    // fences is not empty here — this page keeps stage contract, its own glue to the model,
    // fenced as it always was. tokenVersion's fenceless branch in @robertblust/design
    // v0.80.1 reads tokens.css instead of a page marker only when fences is exactly [],
    // the signal that a page has moved to the whole-file shape entirely; a page that still
    // declares any fence, even one of its own that assemble.mjs never touched, falls to the
    // marker-reading branch instead. So this page, and /timeline/, /team/ and /surfaces/
    // below, keep the one-line `design tokens · vN` comment that /privacy/'s note explains.
    tokens: true, sky: true, header: true, monoScope: true, monoDefined: true, contrast: true, noFlash: "theme", tokenVersion: true, fences: ["stage contract"], picture: true,
    card: true, internalLinks: true, graph: true, divider: true },  // The timeline lists the experiences out of the same block the model page draws, each row
  // opening into the card card.js renders. `ledger` is the check that the rows are the block's
  // experiences in the order they began and that a card is the entity, field for field.
  { path: "/timeline/", typography: true, storageKeys: true, mobileNav: true, carriesLang: true, headerBaseline: true, navOrder: true, headerFits: true, footer: FOOTER, seo: true, noNewTab: true, title: /Timeline/, lang: "en", sourceLang: "en",
    translates: { lang: "de", shows: ["Wie man es liest", "Alle öffnen", "Nichts hier wurde für diese Seite geschrieben"], hides: ["How to read it", "Open all", "Nothing here was written for this page"] },
    contains: ["Over 25 years,", "in order", "How to read it", "Generated from"],
    links: ["https://companygraph.io/"],
    sameOrigin: true,
    fontsLoaded: ["Bricolage Grotesque", "Instrument Sans"], fontsAvailable: true,
    tokens: true, sky: true, header: true, monoScope: true, monoDefined: true, contrast: true, noFlash: "theme", tokenVersion: true, fences: ["stage contract"],
    card: true, internalLinks: true, ledger: true },
  // The team page. Its claims are checkable, so verify checks them rather than trusting the
  // prose: a page that says every gate is approved by the only human in the company must show
  // exactly that, and must still show it the day the model changes.
  { path: "/team/", typography: true, storageKeys: true, mobileNav: true, carriesLang: true, headerBaseline: true, navOrder: true, headerFits: true, footer: FOOTER, seo: true, noNewTab: true, title: /Team/, lang: "en", sourceLang: "en",
    translates: { lang: "de", shows: ["Wie man es liest", "DAS TEAM", "Ein Sitz ist eine Rolle"], hides: ["How to read it", "THE TEAM", "A seat is a role"] },
    contains: ["A company of one,", "staffed", "How to read it", "Generated from"],
    sameOrigin: true,
    fontsLoaded: ["Bricolage Grotesque", "Instrument Sans"], fontsAvailable: true,
    tokens: true, sky: true, header: true, monoScope: true, monoDefined: true, contrast: true, noFlash: "theme", tokenVersion: true, fences: ["stage contract"],
    card: true, internalLinks: true, board: true },
  // The surfaces page. Where each surface sits is a claim about how the model says it is made,
  // so verify reads it off the page against the block rather than trusting the renderer.
  { path: "/surfaces/", typography: true, storageKeys: true, mobileNav: true, carriesLang: true, headerBaseline: true, navOrder: true, headerFits: true, footer: FOOTER, seo: true, noNewTab: true, title: /Surfaces/, lang: "en", sourceLang: "en",
    translates: { lang: "de", shows: ["Wie man es liest", "DIE SURFACES", "Keine Linie ist von Hand eingetragen"], hides: ["How to read it", "THE SURFACES", "No line is typed"] },
    contains: ["One model,", "every", "surface", "How to read it", "Generated from"],
    sameOrigin: true,
    fontsLoaded: ["Bricolage Grotesque", "Instrument Sans"], fontsAvailable: true,
    tokens: true, sky: true, header: true, monoScope: true, monoDefined: true, contrast: true, noFlash: "theme", tokenVersion: true, fences: ["stage contract"],
    card: true, internalLinks: true, lineage: true },
];

const CHECKS = {
  ...STAGE_CHECKS,
  // The Team board and the Surfaces lineage, held to the artifact the page names and to where
  // STAGE_PAGE sends a card.
  ...MODEL_PAGE_CHECKS,
  ...DESIGN_CHECKS,
  ...pageChecks({ SITE, BASE }),
  // The cost page computes every number it prints after three fetches land, so a figure the
  // page lost is an empty slot, and a figure in the wrong language form is a slot the switch
  // never re-rendered. Both render fine and pass every other check.
  async slotsFilled(page, spec) {
    const read = () => page.evaluate(() => ({
      empty: [...document.querySelectorAll("[data-v]")].filter(e => !e.textContent.trim()).map(e => e.dataset.v),
      text: document.querySelector("main").innerText }));
    await page.waitForFunction(() => document.querySelector('[data-v="ag"]').textContent.trim() !== "");
    let r = await read();
    if (r.empty.length) return `empty slots in English: ${r.empty.join(", ")}`;
    for (const f of spec.slotsFilled.en) if (!r.text.includes(f)) return `the English page does not show ${f}`;
    await page.click("#lde");
    await page.$eval("#peak", e => { e.value = "14"; e.dispatchEvent(new Event("input")); });
    await page.$eval("#peak", e => { e.value = "8"; e.dispatchEvent(new Event("input")); });
    r = await read();
    if (r.empty.length) return `empty slots in German after a slider moved: ${r.empty.join(", ")}`;
    for (const f of spec.slotsFilled.de) if (!r.text.includes(f)) return `the German page does not show ${f}`;
    await page.click("#len");
    // A broken file rather than an aborted request: the suite reports every failed request as a
    // fault of the page, and a file that arrives unreadable fails the page's load the same way.
    await page.route("**/cost.json", route => route.fulfill({ status: 200, contentType: "application/json", body: "{" }));
    await page.goto(BASE + spec.path);
    try { await page.waitForFunction(() => !document.getElementById("costerr").hidden, null, { timeout: 5000 }); }
    catch { return "with cost.json unavailable the page did not say so"; }
    await page.unroute("**/cost.json");
    await page.goto(BASE + spec.path);
    return null;
  },
  // The card's picture is drawn at runtime from a file the model build copied, so nothing in
  // the markup fails when the copy is missing, the page forgot `data-images` or the card stopped
  // drawing it: the page would show a broken box or no face, and every other check stays green.
  // This opens the card of the first entity the model gives an image and asks the browser
  // whether the picture arrived. blust.ch's profile carries one, so a model with none fails too.
  async picture(page, spec) {
    const found = await page.evaluate(async () => {
      const link = document.querySelector("link[data-stage]");
      const data = await (await fetch(link.href)).json();
      const e = data.entities.find((x) => x.fields && x.fields.image);
      return { id: e ? e.id : null, declared: link.getAttribute("data-images") };
    });
    if (!found.id) return "the model gives no entity an image, and this page shows the person's";
    if (!found.declared) return "the data link declares no data-images, so no card draws a picture";
    await page.goto(BASE + spec.path + "?stage=expanded#" + found.id);
    try { await page.waitForSelector(".cbody .avatar", { timeout: 8000 }); }
    catch { return `the card of ${found.id} drew no picture`; }
    await page.waitForFunction(() => document.querySelector(".cbody .avatar").complete);
    const drawn = await page.evaluate(() => {
      const i = document.querySelector(".cbody .avatar"), r = i.getBoundingClientRect();
      return { natural: i.naturalWidth, w: r.width, h: r.height, alt: i.alt, src: i.getAttribute("src"),
               listed: [...document.querySelectorAll(".cbody dt")].some((d) => d.textContent === "image") };
    });
    if (!drawn.natural) return `${drawn.src} did not load`;
    if (drawn.w !== 64 || drawn.h !== 64) return `the picture is ${drawn.w}×${drawn.h}, expected 64×64`;
    if (!drawn.alt) return "the picture has no alt text";
    if (drawn.listed) return "the card lists `image` as a field under the picture it names";
    return null;
  },
  async transport(page) {
    const missing = await page.evaluate(() =>
      ["tFirst","tPrev","tPlay","tNext","tFull","tNotes","langDe","langEn","chrome"]
        .filter(id => !document.getElementById(id)));
    if (missing.length) return "missing controls: " + missing.join(", ");
    const unnamed = await page.evaluate(() =>
      [...document.querySelectorAll(".tbtn")].filter(b => !b.getAttribute("aria-label")).length);
    if (unnamed) return `${unnamed} control(s) without an accessible name`;
    return null;
  },
  async zeroBased(page) {
    const [cur, kicker] = await page.evaluate(() => [
      document.getElementById("cur").textContent.trim(),
      document.querySelector(".slide.active .kicker").dataset.n,
    ]);
    return cur === kicker ? null : `counter says ${cur}, kicker says ${kicker}`;
  },
  // The lockup is a mark plus a wordmark, and the mark is inlined: a linked asset renders as
  // a broken box under file://. Two places carry it — the header on the pages, and the way-out
  // credit in a deck's transport bar, where it is the only thing that says whose talk this is —
  // and the failure is the same one in both, so one check covers them.
  async brandMark(page) {
    const MARK = ".brand svg, .name .namemark svg";
    const svgs = await page.evaluate(s => [...document.querySelectorAll(s)].length, MARK);
    if (svgs !== 1) return `the brand lockup holds ${svgs} inline svg mark(s), expected 1`;
    const linked = await page.evaluate(() =>
      [...document.querySelectorAll(".brand img, .name .namemark img")].map(i => i.getAttribute("src")));
    return linked.length ? `the brand lockup links its mark instead of inlining it: ${linked.join(", ")}` : null;
  },
  // Local to this site until a second site has a ledger. Reads the file the page names
  // and holds the page to it: the rows are the model's experiences in the order they began,
  // an open row's card lists the entity's fields in file order, the foot names the file at
  // the model's commit, and the address opens a row.
  async ledger(page, spec) {
    // The same file the page reads, found the same way, so a row and the model it claims to show
    // cannot disagree. It used to parse a block the build had inlined into the page.
    const found = await page.evaluate(async () => {
      const link = document.querySelector("link[data-stage]");
      if (!link) return { error: 'names no data — add <link rel="preload" as="fetch" href="…" data-stage crossorigin> to it and rebuild' };
      const res = await fetch(link.href);
      if (!res.ok) return { error: `names ${link.href}, and it answers HTTP ${res.status}` };
      return { data: await res.json() };
    });
    if (found.error) return `the page ${found.error}`;
    const data = found.data;
    const exps = data.entities.filter(e => e.type === "experience");
    if (!exps.length) return "the model holds no experiences — run: npm run model";
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
    // The indent: a row began while a track ran — a role or an independent period — and says
    // so with --lvl 1 and the class the stylesheet draws the stem on; every other row is flush.
    const dayEnd = (v) => { const m = /^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?$/.exec(v || ""); if (!m) return Infinity;
      return m[3] ? Date.UTC(+m[1], +m[2] - 1, +m[3] + 1) : m[2] ? Date.UTC(+m[1], +m[2], 1) : Date.UTC(+m[1] + 1, 0, 1); };
    const tracks = exps.filter(e => e.stamp.kind === "Role" || e.stamp.kind === "Independent");
    const wantUnder = new Set(exps.filter(e => !tracks.includes(e) && tracks.some(t => day(t.stamp.start) <= day(e.stamp.start) && day(e.stamp.start) < dayEnd(t.stamp.end)))
      .map(e => e.id.slice(e.id.lastIndexOf("/") + 1)));
    const rowsLvl = await page.evaluate(() => [...document.querySelectorAll("#ledger li:has(details)")]
      .map(li => ({ id: li.querySelector("details").id, lvl: li.style.getPropertyValue("--lvl").trim(), under: li.classList.contains("under") })));
    for (const r of rowsLvl) {
      const want = wantUnder.has(r.id);
      if (r.under !== want || r.lvl !== (want ? "1" : "0")) return `${r.id} is ${r.under ? "under" : "flush"} at --lvl ${r.lvl}; it ${want ? "began while a track ran" : "began outside every track"}`;
    }
    if (!wantUnder.size) return "no row began while a track ran — the block or the rule is wrong";
    // Open the first row and read its card against the entity.
    // The toggle event a details fires is queued, not synchronous: the card and the hash
    // arrive a tick after `open` is set, so the page is given that tick before it is read.
    const first = exps.find(e => e.id.endsWith("/" + ids[0]));
    await page.evaluate((id) => { document.getElementById(id).open = true; }, ids[0]);
    await page.waitForFunction((id) => location.hash === "#" + id, ids[0], { timeout: 2000 }).catch(() => null);
    const card = await page.evaluate((id) => {
      const d = document.getElementById(id);
      return { dts: [...d.querySelectorAll(".cbody dt")].map(x => x.textContent),
               eyebrow: d.querySelector(".cbody .eyebrow").textContent,
               groups: [...d.querySelectorAll(".cbody .grp")].map(g => g.querySelectorAll(".chips a").length),
               foot: d.querySelector(".cfoot a").getAttribute("href"),
               hash: location.hash };
    }, ids[0]);
    // The card draws every field but two: `source`, which reads Local on every page here,
    // and `skills`, which is the card's last section, grouped, rather than a field row.
    const fields = Object.keys(first.fields).filter(k => k !== "source" && k !== "skills");
    if (card.dts.join("|") !== fields.join("|")) return `first card lists ${card.dts.join(", ")}; the file has ${fields.join(", ")}`;
    if (card.eyebrow !== "experience") return `first card's eyebrow reads ${JSON.stringify(card.eyebrow)}`;
    // A skill in a card leaves for the model page with the stage expanded and the node in the hash.
    const skillLink = await page.evaluate((id) => (document.getElementById(id).querySelector(".cbody .grp .chips a") || {}).getAttribute?.("href") || null, ids[0]);
    if (skillLink !== null && !/^\.\.\/model\/\?stage=expanded#skills\//.test(skillLink)) return `a skill link reads ${JSON.stringify(skillLink)}`;
    if (!card.foot.endsWith(`/blob/${data.commit}/${first.path}`)) return `first card's foot link is ${card.foot}`;
    if (card.hash !== "#" + ids[0]) return `opening a row wrote ${JSON.stringify(card.hash)} to the address`;
    // Every skill the file names is in exactly one group's chips.
    const claimed = Array.isArray(first.fields.skills) ? first.fields.skills.length : 0;
    const chipped = card.groups.reduce((n, k) => n + k, 0);
    if (chipped !== claimed) return `first card shows ${chipped} skills in ${card.groups.length} groups; the file names ${claimed}`;
    // Open all opens every row and reads Close all; the address still names the last opened.
    await page.click("#openall");
    await page.waitForFunction(() => document.getElementById("openall").getAttribute("aria-pressed") === "true", null, { timeout: 2000 }).catch(() => null);
    const after = await page.evaluate(() => ({
      open: [...document.querySelectorAll("#ledger details")].filter(d => d.open).length,
      label: document.getElementById("openall").textContent,
      pressed: document.getElementById("openall").getAttribute("aria-pressed") }));
    if (after.open !== ids.length) return `Open all opened ${after.open} of ${ids.length}`;
    if (after.label !== "Close all" || after.pressed !== "true") return `after Open all the control reads ${JSON.stringify(after.label)}, pressed ${after.pressed}`;
    // The kind filter: a kind off takes its rows out of the ledger and the path line counts
    // what is left; Show all kinds brings every row back and the plain count with it. The
    // kinds are the block's, so the first box is whichever kind sorts first.
    await page.evaluate(() => { document.getElementById("kinds").open = true; });
    const kindOff = await page.evaluate(() => { const c = document.querySelector("#kindsmenu input"); c.click(); return c.parentNode.querySelector("span").textContent; });
    const off = await page.evaluate((kind) => {
      const rows = [...document.querySelectorAll("#ledger li.k-" + kind.toLowerCase())];
      return { rows: rows.length, hidden: rows.filter(li => li.hidden).length, others: [...document.querySelectorAll("#ledger li[id], #ledger li:has(details)")].filter(li => !li.classList.contains("k-" + kind.toLowerCase()) && li.hidden).length,
               path: document.getElementById("path").textContent, label: document.getElementById("kindslabel").textContent };
    }, kindOff);
    if (off.rows && off.hidden !== off.rows) return `turning ${kindOff} off hid ${off.hidden} of its ${off.rows} rows`;
    if (off.others) return `turning ${kindOff} off also hid ${off.others} rows of other kinds`;
    if (!/\d+ of \d+ entries/.test(off.path)) return `with ${kindOff} off the path line reads ${JSON.stringify(off.path)}`;
    if (off.label === "All kinds") return `with ${kindOff} off the filter still reads All kinds`;
    await page.click("#kindsmenu .all button");
    const back = await page.evaluate(() => ({ hidden: [...document.querySelectorAll("#ledger li:has(details)")].filter(li => li.hidden).length,
      path: document.getElementById("path").textContent, label: document.getElementById("kindslabel").textContent }));
    if (back.hidden) return `Show all kinds left ${back.hidden} rows hidden`;
    if (/ of /.test(back.path) || back.label !== "All kinds") return `after Show all kinds the head row reads ${JSON.stringify(back.path)} / ${JSON.stringify(back.label)}`;
    await page.evaluate(() => { document.getElementById("kinds").open = false; });
    // Arriving with a hash opens that row.
    const target = ids[Math.floor(ids.length / 2)];
    await page.goto(BASE + spec.path + "#" + target);
    const opened = await page.evaluate((id) => document.getElementById(id).open, target);
    if (!opened) return `arriving at #${target} did not open that row`;
    // Arriving with ?kinds= sets the selection from the address: the kinds named are on and
    // the rest off, the parameter leaves the address the way ?lang= does, and the selection
    // is remembered as if the menu had been used. A name the model does not know is ignored,
    // and a list naming no kind at all is ignored whole.
    await page.goto(BASE + spec.path + "?kinds=" + kindOff.toLowerCase() + ",nosuchkind");
    // The ledger is built from a fetch, not from a block the page carries, so a goto resolves
    // before there is anything to read. Every assertion below reads state the page writes after
    // that fetch lands; without this wait they read the page as it was a moment earlier, which
    // fails as a filter that reads "All kinds" about one in several runs.
    await page.waitForFunction(() => document.querySelectorAll("#ledger details").length > 0);
    const linked = await page.evaluate((kind) => ({
      hidden: [...document.querySelectorAll("#ledger li.k-" + kind.toLowerCase())].filter(li => li.hidden).length,
      others: [...document.querySelectorAll("#ledger li:has(details)")].filter(li => !li.classList.contains("k-" + kind.toLowerCase()) && !li.hidden).length,
      label: document.getElementById("kindslabel").textContent, search: location.search,
      stored: (() => { try { return JSON.parse(localStorage.getItem("timeline-kinds")); } catch (e) { return null; } })() }), kindOff);
    if (linked.hidden) return `?kinds=${kindOff} hid ${linked.hidden} rows of that kind`;
    if (linked.others) return `?kinds=${kindOff} left ${linked.others} rows of other kinds showing`;
    if (linked.label !== kindOff) return `with ?kinds=${kindOff} the filter reads ${JSON.stringify(linked.label)}`;
    if (linked.search) return `the address still carries ${linked.search}`;
    if (!linked.stored || linked.stored[kindOff] !== true || Object.keys(linked.stored).some(k => k !== kindOff && linked.stored[k])) return `?kinds=${kindOff} was not remembered: ${JSON.stringify(linked.stored)}`;
    await page.goto(BASE + spec.path + "?kinds=nosuchkind");
    await page.waitForFunction(() => document.querySelectorAll("#ledger details").length > 0);
    const ignored = await page.evaluate(() => ({ hidden: [...document.querySelectorAll("#ledger li:has(details)")].filter(li => li.hidden).length, label: document.getElementById("kindslabel").textContent }));
    if (ignored.label !== kindOff) return `?kinds naming no kind changed the selection to ${JSON.stringify(ignored.label)}`;
    // Leave the page as it was found — at rest, every kind on, no row open — for whatever
    // check runs next.
    await page.evaluate(() => { try { localStorage.removeItem("timeline-kinds"); } catch (e) {} });
    await page.goto(BASE + spec.path);
    return null;
  },
};

const browser = await chromium.launch();
const failures = await runSuite({ browser, SITE, BASE, PAGES, CHECKS, systemFaces: SYSTEM_FACES });
await browser.close();
process.exit(failures ? 1 : 0);
