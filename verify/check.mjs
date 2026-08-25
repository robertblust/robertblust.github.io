// The deliverable is rendered pages, so the tests are assertions against a rendered DOM.
// Run against a served copy of the repo: python3 -m http.server 8000
import { chromium } from "playwright";
import { DESIGN_CHECKS, SYSTEM_FACES } from "./design.mjs";

const BASE = process.env.BASE || "http://localhost:8000";

// Extended by later tasks. `lang` is the expected documentElement.lang AFTER JS runs.
const PAGES = [
  { path: "/", title: /Robert Blust/, lang: "en",
    links: ["https://github.com/robertblust", "https://www.linkedin.com/in/robertblust/",
             "https://3ap.ch/", "https://likemagic.tech/"],
    // The career break is on the page deliberately, so it is asserted deliberately: it is
    // the sentence most likely to be quietly dropped later, and it is what explains why
    // both ideas are built in the open.
    contains: ["deciding well", "Robert Blust", "3AP", "LIKE MAGIC",
               "career break", "See the ideas"], card: true,
    // The two project names jump to their own section. Asserted by href, because a
    // fragment that stops matching an id fails silently — the page just lands at the top.
    sameTab: ["talks/", "ideas/", "ideas/#guestgraph", "ideas/#companygraph"], brandMark: true,
    fontsLoaded: ["Bricolage Grotesque", "Instrument Sans"], fontsAvailable: true,
    tokens: true, monoScope: true, contrast: true, tokenVersion: true,
    internalLinks: true },
  { path: "/talks/mental-model/", wayOut: "../", title: /Mental Model/, lang: "en",
    transport: true, zeroBased: true, sourceLang: true, card: true, brandMark: true,
    fontsLoaded: ["Bricolage Grotesque", "Instrument Sans"], fontsAvailable: true,
    tokens: true, monoScope: true, contrast: true, tokenVersion: true,
    internalLinks: true },
  { path: "/talks/essential-complexity/", wayOut: "../", title: /Essential Complexity/, lang: "en",
    transport: true, zeroBased: true, sourceLang: true, card: true, brandMark: true,
    fontsLoaded: ["Bricolage Grotesque", "Instrument Sans"], fontsAvailable: true,
    tokens: true, monoScope: true, contrast: true, tokenVersion: true,
    internalLinks: true },
  { path: "/talks/", title: /talks/i, lang: "en",
    contains: ["The Mental Model", "Essential Complexity",
               "machine-readable knowledge base", "essential complexity"], card: true,
    sameTab: ["mental-model/", "essential-complexity/", "./"], brandMark: true,
    fontsLoaded: ["Bricolage Grotesque", "Instrument Sans"], fontsAvailable: true,
    tokens: true, monoScope: true, contrast: true, tokenVersion: true,
    internalLinks: true },
  // The privacy page. Its claims are checkable, so verify checks them rather than trusting
  // the prose: a page that says it makes no third-party request must make none.
  { path: "/privacy/", title: /Blust/, lang: "en",
    contains: ["This site collects", "There is no imprint yet"],
    sameOrigin: true,
    fontsLoaded: ["Bricolage Grotesque", "Instrument Sans"], fontsAvailable: true,
    tokens: true, monoScope: true, contrast: true, tokenVersion: true,
    internalLinks: true },
  // The ideas page. Two claims make it worth reading and both are checkable: that each
  // idea has exactly one commercial part, and that nothing on the page reaches off-origin —
  // the privacy note promises the second for the whole site.
  { path: "/ideas/", title: /Ideas/, lang: "en",
    contains: ["Two ideas", "Open core", "COMMERCIAL", "OPEN SOURCE"],
    links: ["https://github.com/guestgraph", "https://github.com/companygraph"],
    sameOrigin: true,
    fontsLoaded: ["Bricolage Grotesque", "Instrument Sans"], fontsAvailable: true,
    tokens: true, monoScope: true, contrast: true, tokenVersion: true,
    card: true, cardBase: "https://blust.ch", internalLinks: true },
];

const CHECKS = {
  ...DESIGN_CHECKS,
  // A page that says it makes no third-party request must make none. `links` and
  // `internalLinks` cannot see this: they inspect markup, and a font, an analytics tag or
  // an embed is a request. Copied from guestgraph.github.io, where the same claim is made.
  async sameOrigin(page, spec) {
    const seen = [];
    page.on("request", r => seen.push(r.url()));
    await page.reload({ waitUntil: "networkidle" });
    const origin = new URL(spec.absolute).origin;
    const foreign = [...new Set(seen.filter(u => /^https?:/.test(u) && !u.startsWith(origin)))];
    return foreign.length ? "off-origin request(s): " + foreign.join(", ") : null;
  },
  async title(page, spec) {
    const t = await page.title();
    if (!spec.title.test(t)) return `title ${JSON.stringify(t)} does not match ${spec.title}`;
    if (t.length > 65) return `title is ${t.length} chars, over 65`;
    return null;
  },
  async lang(page, spec) {
    const l = await page.evaluate(() => document.documentElement.lang);
    return l === spec.lang ? null : `lang=${l}, expected ${spec.lang}`;
  },
  async links(page, spec) {
    const found = await page.evaluate(() =>
      [...document.querySelectorAll("a[href^='http']")].map(a =>
        ({ href: a.href, target: a.target, rel: a.rel })));
    for (const want of spec.links) {
      const hit = found.find(l => l.href === want);
      if (!hit) return `missing outbound link ${want}`;
      if (hit.target !== "_blank" || !hit.rel.includes("noopener"))
        return `${want} must open in a new tab with rel=noopener`;
    }
    return null;
  },
  async contains(page, spec) {
    const text = await page.evaluate(() => document.body.innerText);
    for (const s of spec.contains)
      if (!text.includes(s)) return `body text is missing ${JSON.stringify(s)}`;
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
  // The language declared before any JS runs. It used to be `de`, because the markup was
  // German and JS swapped it to English on load — which meant a crawler without JS read
  // German from a page whose og tags and share card were English. The decks are
  // English-first now, so this asserts the page tells the truth cold.
  async sourceLang(page, spec) {
    const res = await fetch(spec.absolute);
    const html = await res.text();
    const m = html.match(/<html lang="([a-z]+)"/);
    return m && m[1] === "en" ? null : `static lang is ${m && m[1]}, expected en`;
  },
  // A deck must open in a new tab; navigation between the two prose pages must not. Both
  // rules are about relative hrefs, which the `links` check above cannot see at all — it
  // only inspects absolute http ones. That blind spot is why these two exist separately.
  async newTab(page, spec) {
    const bad = await page.evaluate(hrefs =>
      [...document.querySelectorAll("a[href]")]
        .filter(a => hrefs.includes(a.getAttribute("href")))
        .filter(a => a.target !== "_blank" || !a.rel.includes("noopener"))
        .map(a => `${a.getAttribute("href")} [target=${a.target || "none"} rel=${a.rel || "none"}]`),
      spec.newTab);
    return bad.length ? "must open in a new tab with rel=noopener: " + bad.join(", ") : null;
  },
  async sameTab(page, spec) {
    const bad = await page.evaluate(hrefs =>
      [...document.querySelectorAll("a[href]")]
        .filter(a => hrefs.includes(a.getAttribute("href")))
        .filter(a => a.target === "_blank")
        .map(a => a.getAttribute("href")),
      spec.sameTab);
    return bad.length ? "must stay in this tab: " + bad.join(", ") : null;
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
  // Decks open in the same tab now, which is only safe because the deck carries its own
  // way out. If that button ever disappears the same-tab links strand the reader on a
  // page with no exit — so the two rules are asserted together, deliberately.
  async wayOut(page, spec) {
    const found = await page.evaluate(href => {
      const links = [...document.querySelectorAll("a[href]")]
        .filter(a => a.getAttribute("href") === href);
      return links.map(a => ({
        inChrome: !!a.closest("#chrome"),
        named: !!(a.getAttribute("aria-label") || (a.textContent || "").trim()),
      }));
    }, spec.wayOut);
    if (!found.length) return `no link back to ${spec.wayOut} — a same-tab deck with no exit`;
    if (!found.some(l => l.inChrome)) return `the way back is not in the transport bar`;
    const unnamed = found.filter(l => !l.named).length;
    return unnamed ? `${unnamed} way-back link(s) without an accessible name` : null;
  },
  async internalLinks(page) {
    // `links` above only inspects a[href^='http'], which is why a root-absolute
    // internal link (broken under file://) survived nine reviews. Any link that
    // isn't external, an anchor, or a special scheme must be relative, not "/...".
    const bad = await page.evaluate(() =>
      [...document.querySelectorAll("a[href]")]
        .map(a => a.getAttribute("href"))
        .filter(h => h && !/^(https?:|mailto:|tel:|#)/i.test(h) && h.startsWith("/")));
    return bad.length ? `root-absolute internal link(s), break file://: ${bad.join(", ")}` : null;
  },
  async card(page, spec) {
    const img = await page.evaluate(() =>
      (document.querySelector('meta[property="og:image"]') || {}).content);
    if (!img) return "no og:image";
    const declared = await page.evaluate(() => [
      (document.querySelector('meta[property="og:image:width"]') || {}).content,
      (document.querySelector('meta[property="og:image:height"]') || {}).content,
    ]);
    const real = await page.evaluate(async u => {
      const r = await fetch(u.replace("https://blust.ch", location.origin));
      if (!r.ok) return null;
      const dv = new DataView(await r.arrayBuffer());
      return [String(dv.getUint32(16)), String(dv.getUint32(20))];   // PNG IHDR
    }, img);
    if (!real) return `${img} is not fetchable`;
    if (real[0] !== declared[0] || real[1] !== declared[1])
      return `card is ${real.join("×")} but declared ${declared.join("×")}`;
    return null;
  },
};

const browser = await chromium.launch();
let failures = 0;

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
    const expected = ["https://blust.ch/", "https://blust.ch/talks/",
                      "https://blust.ch/talks/mental-model/",
                      "https://blust.ch/talks/essential-complexity/",
                      "https://blust.ch/privacy/",
                      "https://blust.ch/ideas/"];
    const missing = expected.filter(u => !locs.includes(u));
    const extra = locs.filter(u => !expected.includes(u));
    if (missing.length || extra.length) {
      console.log(`✗ /sitemap.xml  missing: ${missing} unexpected: ${extra}`); failures++;
    } else {
      let unreachable = 0;
      for (const u of locs) {
        const r = await fetch(u.replace("https://blust.ch", BASE));
        if (!r.ok) { console.log(`✗ sitemap URL ${u} → ${r.status}`); failures++; unreachable++; }
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

  const rb = await fetch(BASE + "/robots.txt");
  if (!rb.ok || !(await rb.text()).includes("sitemap.xml")) {
    console.log("✗ /robots.txt  missing or does not name the sitemap"); failures++;
  } else console.log("✓ /robots.txt");
}

console.log(failures ? `\n${failures} page(s) FAILED` : "\nall checks pass");
process.exit(failures ? 1 : 0);
