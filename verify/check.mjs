// The deliverable is rendered pages, so the tests are assertions against a rendered DOM.
// Run against a served copy of the repo: python3 -m http.server 8000
import { chromium } from "playwright";
import { DESIGN_CHECKS, SYSTEM_FACES } from "@robertblust/design/verify/design";
import { httpStatus } from "@robertblust/design/verify/http";
import { STAGE_CHECKS } from "@robertblust/design/verify/stage";
import { pageChecks } from "@robertblust/design/verify/pages";

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
const FOOTER = ["GitHub", "Licence", "Privacy"];

const PAGES = [
  { path: "/", storageKeys: true, mobileNav: true, carriesLang: true, headerBaseline: true, navOrder: true, footer: FOOTER, seo: true, noNewTab: true, title: /Robert Blust/, lang: "en", sourceLang: "en",
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
  { path: "/talks/mental-model/", storageKeys: true, opensFromFile: true, carriesLang: true, seo: true, noNewTab: true, wayOut: "../", title: /Mental Model/, lang: "en", sourceLang: "en",
    transport: true, zeroBased: true,  card: true, brandMark: true,
    transportFits: [320, 350, 360, 390, 393, 414, 430],
    landing: "../../",
    fontsLoaded: ["Bricolage Grotesque", "Instrument Sans"], fontsAvailable: true,
    tokens: true, sky: true, monoScope: true, contrast: true, noFlash: "rb-theme", tokenVersion: true,
    // fences is presence-only and order-blind — deck runtime landing last here while
    // fenceOrder places it third, two lines down, is not the pair disagreeing.
    fences: ["design tokens", "language", "deck transport", "deck lockup", "deck fit", "deck runtime"],
    fenceOrder: ["design tokens", "deck lockup", "deck transport", "deck runtime", "language", "deck fit"],
    lockupCollapses: true,
    internalLinks: true },
  { path: "/talks/essential-complexity/", storageKeys: true, opensFromFile: true, carriesLang: true, seo: true, noNewTab: true, wayOut: "../", title: /Essential Complexity/, lang: "en", sourceLang: "en",
    transport: true, zeroBased: true,  card: true, brandMark: true,
    transportFits: [320, 350, 360, 390, 393, 414, 430],
    landing: "../../",
    fontsLoaded: ["Bricolage Grotesque", "Instrument Sans"], fontsAvailable: true,
    tokens: true, sky: true, monoScope: true, contrast: true, noFlash: "rb-theme", tokenVersion: true,
    // fences is presence-only and order-blind — deck runtime landing last here while
    // fenceOrder places it third, two lines down, is not the pair disagreeing.
    fences: ["design tokens", "language", "deck transport", "deck lockup", "deck fit", "deck runtime"],
    fenceOrder: ["design tokens", "deck lockup", "deck transport", "deck runtime", "language", "deck fit"],
    lockupCollapses: true,
    internalLinks: true },
  { path: "/talks/", storageKeys: true, mobileNav: true, carriesLang: true, headerBaseline: true, navOrder: true, footer: FOOTER, seo: true, noNewTab: true, title: /talks/i, lang: "en", sourceLang: "en",
    contains: ["The Mental Model", "Essential Complexity",
               "machine-readable knowledge base", "essential complexity"], card: true,
    sameTab: ["mental-model/", "essential-complexity/", "./"], brandMark: true,
    fontsLoaded: ["Bricolage Grotesque", "Instrument Sans"], fontsAvailable: true,
    tokens: true, sky: true, header: true, monoScope: true, monoDefined: true, contrast: true, noFlash: "rb-theme", tokenVersion: true, fences: ["design tokens", "header contract", "language", "prose reset", "prose footer"],
    internalLinks: true },
  // The privacy page. Its claims are checkable, so verify checks them rather than trusting
  // the prose: a page that says it makes no third-party request must make none.
  { path: "/privacy/", storageKeys: true, mobileNav: true, carriesLang: true, headerBaseline: true, navOrder: true, footer: FOOTER, seo: true, noNewTab: true, title: /Blust/, lang: "en", sourceLang: "en", card: true,
    contains: ["This site collects", "There is no imprint yet"],
    sameOrigin: true,
    fontsLoaded: ["Bricolage Grotesque", "Instrument Sans"], fontsAvailable: true,
    tokens: true, sky: true, header: true, monoScope: true, monoDefined: true, contrast: true, noFlash: "rb-theme", tokenVersion: true, fences: ["design tokens", "header contract", "language", "prose reset", "prose footer"],
    internalLinks: true },
  // The ideas page. Two claims make it worth reading and both are checkable: that each
  // idea has exactly one commercial part, and that nothing on the page reaches off-origin —
  // the privacy note promises the second for the whole site.
  { path: "/ideas/", storageKeys: true, mobileNav: true, carriesLang: true, headerBaseline: true, navOrder: true, footer: FOOTER, seo: true, noNewTab: true, title: /Ideas/, lang: "en", sourceLang: "en",
    contains: ["Two ideas", "Open core", "COMMERCIAL", "OPEN SOURCE"],
    links: ["https://github.com/guestgraph", "https://github.com/companygraph"],
    sameOrigin: true,
    fontsLoaded: ["Bricolage Grotesque", "Instrument Sans"], fontsAvailable: true,
    tokens: true, sky: true, header: true, monoScope: true, monoDefined: true, contrast: true, noFlash: "rb-theme", tokenVersion: true, fences: ["design tokens", "header contract", "language", "prose reset", "prose footer"],
    card: true, internalLinks: true },
  // Generated from the model, so what it asserts is the shape of the page and one line of the
  // content — the words themselves are `npm run principles:check`'s business, and asserting
  // them twice would mean editing this file every time a value is written.
  { path: "/principles/", storageKeys: true, mobileNav: true, carriesLang: true, headerBaseline: true, navOrder: true, footer: FOOTER, seo: true, noNewTab: true, title: /Principles/, lang: "en", sourceLang: "en",
    contains: ["One model,", "everywhere", "Values", "Generated from"],
    links: ["https://github.com/robertblust/mental-model", "https://companygraph.io/"],
    sameOrigin: true,
    fontsLoaded: ["Bricolage Grotesque", "Instrument Sans"], fontsAvailable: true,
    tokens: true, sky: true, header: true, monoScope: true, monoDefined: true, contrast: true, noFlash: "rb-theme", tokenVersion: true, fences: ["design tokens", "header contract", "language", "prose reset", "prose footer"],
    card: true, internalLinks: true },
  // The model page draws the same graph the example on companygraph.io draws, from this
  // person's own instance rather than the fictional one. `stage` is the check that the
  // drawing actually drew: the data block alone proves nothing rendered.
  { path: "/model/", storageKeys: true, mobileNav: true, carriesLang: true, headerBaseline: true, navOrder: true, footer: FOOTER, seo: true, noNewTab: true, title: /Model/, lang: "en", sourceLang: "en",
    contains: ["A company of one", "drawn", "What is in it", "Generated from"],
    // The source link is not asserted here. The stage rewrites its href from the block's own
    // commit, so any literal in this list would be either the markup's placeholder (gone by
    // the time the check reads the DOM) or a commit that changes on every repin. `graph`
    // asserts it instead, against the block itself.
    links: ["https://companygraph.io/"],
    sameOrigin: true,
    fontsLoaded: ["Bricolage Grotesque", "Instrument Sans"], fontsAvailable: true,
    tokens: true, sky: true, header: true, monoScope: true, monoDefined: true, contrast: true, noFlash: "rb-theme", tokenVersion: true, fences: ["design tokens", "header contract", "language", "prose reset", "prose footer", "stage contract"],
    card: true, internalLinks: true, graph: "model-data", divider: true },
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
};

const browser = await chromium.launch();
let failures = 0;

// Two things the page loop cannot say about itself.
//
// Every page must opt into `seo`. The runner skips any check whose key is undefined, so
// deleting one line from PAGES turns the contract off for that page and changes no output.
{
  const off = PAGES.filter(p => !p.seo).map(p => p.path);
  if (off.length) { console.log("✗ PAGES  seo is not enabled on: " + off.join(", ")); failures++; }
}
// And every page must opt into tokenVersion, for the same reason. The deleted page-against-page
// block below asserted every page in PAGES unconditionally; tokenVersion alone does not, because
// the runner skips any check whose key is undefined — a page added to PAGES with neither a
// `design tokens` fence nor `tokenVersion: true` is invisible to design:check (discovery only
// finds fences that exist) and to this suite alike. This line is what restores that half of it.
{
  const off = PAGES.filter(p => !p.tokenVersion).map(p => p.path);
  if (off.length) { console.log("✗ PAGES  tokenVersion is not enabled on: " + off.join(", ")); failures++; }
}
// And every page must opt into `fences`, for the same reason. Task 2 added the check that
// fails a page whose fences no longer include `prose reset` — but not this line, so deleting
// `fences: [...]` from a page's spec (or adding a page to PAGES without it) turns that check
// off for that page and design:check only finds fences that exist, so the whole suite stays
// green while the page silently loses every fence it should have been checked against.
{
  const off = PAGES.filter(p => !p.fences).map(p => p.path);
  if (off.length) { console.log("✗ PAGES  fences is not enabled on: " + off.join(", ")); failures++; }
}
// And the suite must be talking to this site. A sibling repository left serving on :8000 is
// not hypothetical — it happened during review, and the run reported six failures belonging
// to a site nobody was testing.
{
  const res = await fetch(BASE + "/sitemap.xml");
  const xml = res.ok ? await res.text() : "";
  if (!xml.includes(`<loc>${SITE}/</loc>`)) {
    console.log(`✗ ${BASE} is not serving ${SITE} — check what is on that port`);
    failures++;
  }
}

// The token block used to be compared page-against-page here, because there was no
// recorded source to compare it against and a hash would have been a second thing to
// keep in step. `design:check` is that source now: it asserts every page's fence
// byte-for-byte against what @robertblust/design ships, which is strictly stronger than
// pages merely agreeing with each other, and it reads the `page`/`deck` variant word off
// each page rather than expecting every page to share one block. Keeping this check
// alongside it would mean teaching a weaker check about every variant the stronger one
// already handles for free — so it is deleted, not adjusted.

for (const spec of PAGES) {
  const page = await browser.newPage();
  const jsErrors = [];
  page.on("pageerror", e => jsErrors.push(String(e)));
  const problems = [];
  spec.absolute = BASE + spec.path;
  try {
    const res = await page.goto(BASE + spec.path, { waitUntil: "networkidle" });
    if (!res || !res.ok()) problems.push(`HTTP ${res ? res.status() : "no response"}`);
    for (const [name, fn] of Object.entries(CHECKS)) {
      if (spec[name] === undefined) continue;
      const problem = await fn(page, spec);
      if (problem) problems.push(`${name}: ${problem}`);
    }
  } catch (e) {
    problems.push(String(e));
  }
  if (jsErrors.length) problems.push("JS errors: " + jsErrors.join(" | "));
  console.log((problems.length ? "✗" : "✓") + " " + spec.path +
    (problems.length ? "\n    " + problems.join("\n    ") : ""));
  failures += problems.length ? 1 : 0;
  await page.close();
}

await browser.close();

// The crawl map is not a page, so it is checked separately: every URL a sitemap claims
// must exist, or the sitemap is a list of promises the site does not keep.
{
  const res = await fetch(BASE + "/sitemap.xml");
  if (!res.ok) { console.log(`✗ /sitemap.xml  HTTP ${res.status}`); failures++; }
  else {
    const xml = await res.text();
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
    const expected = PAGES.map(p => SITE + p.path);
    const missing = expected.filter(u => !locs.includes(u));
    const extra = locs.filter(u => !expected.includes(u));
    if (missing.length || extra.length) {
      console.log(`✗ /sitemap.xml  missing: ${missing} unexpected: ${extra}`); failures++;
    } else {
      let unreachable = 0;
      for (const u of locs) {
        const s = await httpStatus(u.replace(SITE, BASE));
        if (s !== 200) { console.log(`✗ sitemap URL ${u} → ${s}`); failures++; unreachable++; }
      }
      if (!unreachable) console.log("✓ /sitemap.xml  " + locs.length + " urls, all reachable");
    }
  }
  // The favicon is the one place the brand mark exists outside a page, so no DOM check can
  // reach it — and it is where the unavailable font name lived longest. It cannot @font-face
  // anything and inherits nothing, so every face it names has to be one a machine already has.
  const fav = await fetch(BASE + "/favicon.svg");
  if (!fav.ok) { console.log(`✗ /favicon.svg  HTTP ${fav.status}`); failures++; }
  else {
    const svg = await fav.text();
    const named = [...svg.matchAll(/font-family="([^"]+)"/g)]
      .flatMap(m => m[1].split(",").map(f => f.trim().replace(/^["']|["']$/g, "")))
      .filter(f => !SYSTEM_FACES.has(f.toLowerCase()));
    if (named.length) {
      console.log(`✗ /favicon.svg  names a face it cannot load and cannot count on: ${named.join(", ")}`);
      failures++;
    } else console.log("✓ /favicon.svg");
  }

  // Presence of the string "sitemap.xml" was the whole of this check, which is a test that
  // the file mentions a sitemap rather than that it names one that exists. guestgraph.io
  // named three and two were 404 in production — the same block is now in all three suites.
  const rb = await fetch(BASE + "/robots.txt");
  if (!rb.ok) { console.log(`✗ /robots.txt  HTTP ${rb.status}`); failures++; }
  else {
    const named = [...(await rb.text()).matchAll(/^\s*Sitemap:\s*(\S+)/gim)].map(m => m[1]);
    if (!named.length) { console.log("✗ /robots.txt  names no sitemap"); failures++; }
    else {
      const dead = [];
      for (const u of named) {
        const s = await httpStatus(u.replace(SITE, BASE));
        if (s !== 200) dead.push(`${u} → ${s}`);
      }
      if (dead.length) { console.log("✗ /robots.txt  names sitemap(s) that do not exist: " + dead.join(", ")); failures++; }
      else console.log(`✓ /robots.txt  ${named.length} sitemap(s), all reachable`);
    }
  }
}

console.log(failures ? `\n${failures} page(s) FAILED` : "\nall checks pass");
process.exit(failures ? 1 : 0);
