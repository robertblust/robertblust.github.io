// The deliverable is rendered pages, so the tests are assertions against a rendered DOM.
// Run against a served copy of the repo: python3 -m http.server 8000
import { chromium } from "playwright";
import { DESIGN_CHECKS, SYSTEM_FACES } from "@robertblust/design/verify/design";
import { STAGE_CHECKS } from "@robertblust/design/verify/stage";
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
// because the suite loads each page in its source language.
const FOOTER = ["GitHub", "License", "Privacy"];

const PAGES = [
  { path: "/", typography: true, storageKeys: true, mobileNav: true, carriesLang: true, headerBaseline: true, navOrder: true, footer: FOOTER, seo: true, noNewTab: true, title: /Robert Blust/, lang: "en", sourceLang: "en",
    translates: { lang: "de", shows: ["Zu den Vorträgen", "Zu den Ideen", "IDEEN", "PRINZIPIEN", "MODELL", "WERDEGANG", "VORTRÄGE"],
                  hides: ["See the talks", "See the ideas"],
                  title: "Robert Blust – Software Engineer & Architekt",
                  desc: "Der Engpass hat sich vom schnellen Bauen zum guten Entscheiden verschoben. Fünfundzwanzig Jahre Plattformen – und die Vorträge, die das begründen." },
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
    tokens: true, sky: true, header: true, monoScope: true, monoDefined: true, contrast: true, noFlash: "rb-theme", tokenVersion: true, fences: ["design tokens", "header contract", "language", "prose reset", "prose footer"],
    internalLinks: true },
  // opensFromFile resolves its file:// probe against process.cwd(), which npm sets to this
  // repo's root — so the suite must be run with `npm run verify` from here, not from elsewhere.
  { path: "/talks/mental-model/", typography: true, storageKeys: true, opensFromFile: true, carriesLang: true, seo: true, noNewTab: true, wayOut: "../", title: /Mental Model/, lang: "en", sourceLang: "en",
    // The deck's German is the whole second half of the talk, including every speaker note.
    // "Architekt"/"Architect" is the pair: one letter apart, present in exactly one language each.
    translates: { lang: "de", shows: ["Architekt", "Das Mental Model"], hides: ["Architect"], id: "langDe", backId: "langEn",
                  title: "Das mentale Modell · ein Vortrag von Robert Blust",
                  desc: "Eine strukturierte, maschinenlesbare Wissensbasis als Gehirn eines Unternehmens – eine einzige Quelle der Wahrheit für Vision, Strategie, Prozesse, Rollen, KPIs, Regeln und Entscheidungen." },
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
    tokens: true, sky: true, monoScope: true, contrast: true, noFlash: "rb-theme", tokenVersion: true, readoutInvariant: true,
    // fences is presence-only and order-blind — deck runtime landing last here while
    // fenceOrder places it third, two lines down, is not the pair disagreeing.
    fences: ["design tokens", "language", "deck transport", "deck lockup", "deck fit", "deck runtime"],
    fenceOrder: ["design tokens", "deck lockup", "deck transport", "deck runtime", "language", "deck fit"],
    lockupCollapses: true,
    internalLinks: true },
  { path: "/talks/essential-complexity/", typography: true, storageKeys: true, opensFromFile: true, carriesLang: true, seo: true, noNewTab: true, wayOut: "../", title: /Essential Complexity/, lang: "en", sourceLang: "en",
    translates: { lang: "de", shows: ["Architekt", "Essenzielle"], hides: ["Architect"], id: "langDe", backId: "langEn",
                  title: "Essenzielle Komplexität · ein Vortrag von Robert Blust",
                  desc: "Ein Problem in seiner essenziellen Komplexität beschreiben – nicht mehr und nicht weniger. Der Massstab ist derselbe wie vor fünfzehn Jahren; was sich geändert hat, sind die Kosten." },
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
    tokens: true, sky: true, monoScope: true, contrast: true, noFlash: "rb-theme", tokenVersion: true, readoutInvariant: true,
    // fences is presence-only and order-blind — deck runtime landing last here while
    // fenceOrder places it third, two lines down, is not the pair disagreeing.
    fences: ["design tokens", "language", "deck transport", "deck lockup", "deck fit", "deck runtime"],
    fenceOrder: ["design tokens", "deck lockup", "deck transport", "deck runtime", "language", "deck fit"],
    lockupCollapses: true,
    internalLinks: true },
  { path: "/talks/", typography: true, storageKeys: true, mobileNav: true, carriesLang: true, headerBaseline: true, navOrder: true, footer: FOOTER, seo: true, noNewTab: true, title: /talks/i, lang: "en", sourceLang: "en",
    // The German PDF is reached by data-de-href, which `sameTab` cannot see: it reads the href as
    // delivered, and the swap happens only after a click. `dlHref` reads the first such link.
    translates: { lang: "de", shows: ["Vorträge über", "Vortrag ansehen", "PDF herunterladen"], hides: ["Watch the talk", "Download PDF"],
                  dlHref: { de: "mental-model/mental-model-de.pdf", en: "mental-model/mental-model-en.pdf" },
                  title: "Robert Blust – Vorträge",
                  desc: "Vorträge über gutes Entscheiden: Jedes Projekt ist entschieden, bevor es gebaut wird – dadurch, wie präzise das Problem beschrieben wurde." },
    contains: ["The Mental Model", "Essential Complexity",
               "machine-readable knowledge base", "essential complexity"], card: true,
    sameTab: ["mental-model/", "essential-complexity/", "./"], brandMark: true,
    fontsLoaded: ["Bricolage Grotesque", "Instrument Sans"], fontsAvailable: true,
    tokens: true, sky: true, header: true, monoScope: true, monoDefined: true, contrast: true, noFlash: "rb-theme", tokenVersion: true, fences: ["design tokens", "header contract", "language", "prose reset", "prose footer"],
    internalLinks: true },
  // The privacy page. Its claims are checkable, so verify checks them rather than trusting
  // the prose: a page that says it makes no third-party request must make none.
  { path: "/privacy/", typography: true, storageKeys: true, mobileNav: true, carriesLang: true, headerBaseline: true, navOrder: true, footer: FOOTER, seo: true, noNewTab: true, title: /Blust/, lang: "en", sourceLang: "en", card: true,
    translates: { lang: "de", shows: ["Was diese Seite tut", "Wer das betreibt"], hides: ["What this site does", "Who runs this"],
                  title: "Datenschutz – Robert Blust",
                  desc: "Diese Seite setzt keine Cookies, führt keine Statistik und stellt keine Anfragen an Dritte. Was den Browser verlässt, ist kurz genug, um es hier abzudrucken." },
    contains: ["This site collects", "There is no imprint yet"],
    sameOrigin: true,
    fontsLoaded: ["Bricolage Grotesque", "Instrument Sans"], fontsAvailable: true,
    tokens: true, sky: true, header: true, monoScope: true, monoDefined: true, contrast: true, noFlash: "rb-theme", tokenVersion: true, fences: ["design tokens", "header contract", "language", "prose reset", "prose footer"],
    internalLinks: true },
  // The ideas page. Two claims make it worth reading and both are checkable: that each
  // idea has exactly one commercial part, and that nothing on the page reaches off-origin —
  // the privacy note promises the second for the whole site.
  { path: "/ideas/", typography: true, storageKeys: true, mobileNav: true, carriesLang: true, headerBaseline: true, navOrder: true, footer: FOOTER, seo: true, noNewTab: true, title: /Ideas/, lang: "en", sourceLang: "en",
    translates: { lang: "de", shows: ["Zwei Ideen. Offen gebaut", "DIE FRAGEN, DIE DIE VALIDIERUNG BEANTWORTEN MUSS"], hides: ["Two ideas", "THE QUESTIONS VALIDATION HAS TO ANSWER"],
                  title: "Ideen – Robert Blust",
                  desc: "Zwei Ideen, zur Prüfung gestellt: GuestGraph und CompanyGraph. Je fünf Teile – was quelloffen ist, was je Geld verdienen könnte, und wie weit es ist." },
    contains: ["Two ideas", "Open core", "COMMERCIAL", "OPEN SOURCE"],
    links: ["https://github.com/guestgraph", "https://github.com/companygraph"],
    sameOrigin: true,
    fontsLoaded: ["Bricolage Grotesque", "Instrument Sans"], fontsAvailable: true,
    tokens: true, sky: true, header: true, monoScope: true, monoDefined: true, contrast: true, noFlash: "rb-theme", tokenVersion: true, fences: ["design tokens", "header contract", "language", "prose reset", "prose footer"],
    card: true, internalLinks: true },
  // Generated from the model, so what it asserts is the shape of the page and one line of the
  // content — the words themselves are `npm run principles:check`'s business, and asserting
  // them twice would mean editing this file every time a value is written.
  { path: "/principles/", typography: true, storageKeys: true, mobileNav: true, carriesLang: true, headerBaseline: true, navOrder: true, footer: FOOTER, seo: true, noNewTab: true, title: /Principles/, lang: "en", sourceLang: "en",
    // The page's own words swap; the model's stay English, which its note says. `shows` names
    // the note, `hides` the English note — never a principle, which is the same in both views.
    translates: { lang: "de", shows: ["Aus dem Modell erzeugt", "Werte"], hides: ["Generated from the model, so"],
                  title: "Prinzipien – Robert Blust",
                  desc: "Wohin diese Arbeit geht und woran sie sich hält. Erzeugt aus dem Modell, das sie beschreibt – nicht zweimal geschrieben." },
    contains: ["One model,", "everywhere", "Values", "Generated from"],
    links: ["https://github.com/robertblust/mental-model", "https://companygraph.io/"],
    sameOrigin: true,
    fontsLoaded: ["Bricolage Grotesque", "Instrument Sans"], fontsAvailable: true,
    tokens: true, sky: true, header: true, monoScope: true, monoDefined: true, contrast: true, noFlash: "rb-theme", tokenVersion: true, fences: ["design tokens", "header contract", "language", "prose reset", "prose footer"],
    card: true, internalLinks: true },
  // The model page draws the same graph the example on companygraph.io draws, from this
  // person's own instance rather than the fictional one. `stage` is the check that the
  // drawing actually drew: the data block alone proves nothing rendered.
  { path: "/model/", typography: true, storageKeys: true, mobileNav: true, carriesLang: true, headerBaseline: true, navOrder: true, footer: FOOTER, seo: true, noNewTab: true, title: /Model/, lang: "en", sourceLang: "en",
    translates: { lang: "de", shows: ["Was hier steht", "Dieselbe Form wie das Beispiel"], hides: ["What is in it", "The same shape as the example"],
                  title: "Modell – Robert Blust",
                  desc: "Die Firma aus einer Person, gezeichnet: meine eigene Arbeit, in CompanyGraph beschrieben und als der Graph gezeichnet, den ihre Dateien bilden." },
    contains: ["A company of one", "drawn", "What is in it", "Generated from"],
    // The source link is not asserted here. The stage rewrites its href from the block's own
    // commit, so any literal in this list would be either the markup's placeholder (gone by
    // the time the check reads the DOM) or a commit that changes on every repin. `graph`
    // asserts it instead, against the block itself.
    links: ["https://companygraph.io/"],
    sameOrigin: true,
    fontsLoaded: ["Bricolage Grotesque", "Instrument Sans"], fontsAvailable: true,
    tokens: true, sky: true, header: true, monoScope: true, monoDefined: true, contrast: true, noFlash: "rb-theme", tokenVersion: true, fences: ["design tokens", "header contract", "language", "prose reset", "prose footer", "stage contract"],
    card: true, internalLinks: true, graph: "model-data", divider: true },  // The timeline lists the experiences out of the same block the model page draws, each row
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
];

const CHECKS = {
  ...STAGE_CHECKS,
  ...DESIGN_CHECKS,
  ...pageChecks({ SITE, BASE }),
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
    // The toggle event a details fires is queued, not synchronous: the card and the hash
    // arrive a tick after `open` is set, so the page is given that tick before it is read.
    const first = exps.find(e => e.id.endsWith("/" + ids[0]));
    await page.evaluate((id) => { document.getElementById(id).open = true; }, ids[0]);
    await page.waitForFunction((id) => location.hash === "#" + id, ids[0], { timeout: 2000 }).catch(() => null);
    const card = await page.evaluate((id) => {
      const d = document.getElementById(id);
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
    await page.waitForFunction(() => document.getElementById("openall").getAttribute("aria-pressed") === "true", null, { timeout: 2000 }).catch(() => null);
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
    // Leave the page as it was found — at rest, no row open — for whatever check runs next.
    await page.goto(BASE + spec.path);
    return null;
  },
};

const browser = await chromium.launch();
const failures = await runSuite({ browser, SITE, BASE, PAGES, CHECKS, systemFaces: SYSTEM_FACES });
await browser.close();
process.exit(failures ? 1 : 0);
