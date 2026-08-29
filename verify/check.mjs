// The deliverable is rendered pages, so the tests are assertions against a rendered DOM.
// Run against a served copy of the repo: python3 -m http.server 8000
import { chromium } from "playwright";
import { DESIGN_CHECKS, SYSTEM_FACES } from "./design.mjs";

const BASE = process.env.BASE || "http://localhost:8000";
// The public origin, in one place. It was hardcoded in `card`, in the sitemap's expected
// list, and in the seo fetch rewrite — and *derived* in the seo origin filter, by rewriting
// a literal "http://localhost:8000". Run with BASE=http://127.0.0.1:8000 and that derivation
// produced a filter nothing matched, so every URL in every graph was skipped and the check
// printed ✓ having fetched none of them.
const SITE = "https://blust.ch";

// Extended by later tasks. `lang` is the expected documentElement.lang AFTER JS runs.
const PAGES = [
  { path: "/", footer: true, seo: true, noNewTab: true, title: /Robert Blust/, lang: "en", sourceLang: "en",
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
    tokens: true, sky: true, header: true, monoScope: true, contrast: true, tokenVersion: true,
    internalLinks: true },
  { path: "/talks/mental-model/", seo: true, noNewTab: true, footerVersion: true, wayOut: "../", title: /Mental Model/, lang: "en", sourceLang: "en",
    transport: true, zeroBased: true,  card: true, brandMark: true,
    landing: "../../",
    fontsLoaded: ["Bricolage Grotesque", "Instrument Sans"], fontsAvailable: true,
    tokens: true, sky: true, monoScope: true, contrast: true, tokenVersion: true,
    internalLinks: true },
  { path: "/talks/essential-complexity/", seo: true, noNewTab: true, footerVersion: true, wayOut: "../", title: /Essential Complexity/, lang: "en", sourceLang: "en",
    transport: true, zeroBased: true,  card: true, brandMark: true,
    landing: "../../",
    fontsLoaded: ["Bricolage Grotesque", "Instrument Sans"], fontsAvailable: true,
    tokens: true, sky: true, monoScope: true, contrast: true, tokenVersion: true,
    internalLinks: true },
  { path: "/talks/", footer: true, seo: true, noNewTab: true, title: /talks/i, lang: "en", sourceLang: "en",
    contains: ["The Mental Model", "Essential Complexity",
               "machine-readable knowledge base", "essential complexity"], card: true,
    sameTab: ["mental-model/", "essential-complexity/", "./"], brandMark: true,
    fontsLoaded: ["Bricolage Grotesque", "Instrument Sans"], fontsAvailable: true,
    tokens: true, sky: true, header: true, monoScope: true, contrast: true, tokenVersion: true,
    internalLinks: true },
  // The privacy page. Its claims are checkable, so verify checks them rather than trusting
  // the prose: a page that says it makes no third-party request must make none.
  { path: "/privacy/", footer: true, seo: true, noNewTab: true, title: /Blust/, lang: "en", sourceLang: "en", card: true,
    contains: ["This site collects", "There is no imprint yet"],
    sameOrigin: true,
    fontsLoaded: ["Bricolage Grotesque", "Instrument Sans"], fontsAvailable: true,
    tokens: true, sky: true, header: true, monoScope: true, contrast: true, tokenVersion: true,
    internalLinks: true },
  // The ideas page. Two claims make it worth reading and both are checkable: that each
  // idea has exactly one commercial part, and that nothing on the page reaches off-origin —
  // the privacy note promises the second for the whole site.
  { path: "/ideas/", footer: true, seo: true, noNewTab: true, title: /Ideas/, lang: "en", sourceLang: "en",
    contains: ["Two ideas", "Open core", "COMMERCIAL", "OPEN SOURCE"],
    links: ["https://github.com/guestgraph", "https://github.com/companygraph"],
    sameOrigin: true,
    fontsLoaded: ["Bricolage Grotesque", "Instrument Sans"], fontsAvailable: true,
    tokens: true, sky: true, header: true, monoScope: true, contrast: true, tokenVersion: true,
    card: true, internalLinks: true },
  // Generated from the model, so what it asserts is the shape of the page and one line of the
  // content — the words themselves are `npm run principles:check`'s business, and asserting
  // them twice would mean editing this file every time a value is written.
  { path: "/principles/", footer: true, seo: true, noNewTab: true, title: /Principles/, lang: "en", sourceLang: "en",
    contains: ["One model,", "everywhere", "Values", "Generated from"],
    links: ["https://github.com/robertblust/mental-model", "https://companygraph.io/"],
    sameOrigin: true,
    fontsLoaded: ["Bricolage Grotesque", "Instrument Sans"], fontsAvailable: true,
    tokens: true, sky: true, header: true, monoScope: true, contrast: true, tokenVersion: true,
    card: true, internalLinks: true },
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
  // Presence only. This used to assert `target="_blank" rel="noopener"` on every outbound link
  // as well; that half moved to noNewTab and inverted, because nothing opens in a new tab any
  // more. What is left is the one thing no other check does: fail when an absolute href is
  // simply wrong.
  async links(page, spec) {
    const found = await page.evaluate(() =>
      [...document.querySelectorAll("a[href^='http']")].map(a => a.href));
    for (const want of spec.links)
      if (!found.includes(want)) return `missing outbound link ${want}`;
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
  // German from a page whose og tags, share card and canonical content were all English.
  // The markup is English-first now, so this asserts the page tells the truth cold.
  //
  // `lang` is not this check. That one reads documentElement.lang *after* applyLang() has
  // run, so a page whose source said `de` would be corrected on load and pass anyway, while
  // a crawler that runs no JS still read German. Only this one is fetched cold, which is why
  // it belongs on every page and not just the decks.
  async sourceLang(page, spec) {
    const html = await (await fetch(spec.absolute)).text();
    const m = html.match(/<html lang="([a-z]+)"/);
    return m && m[1] === spec.sourceLang ? null : `static lang is ${m && m[1]}, expected ${spec.sourceLang}`;
  },
  // A deck must open in a new tab; navigation between the two prose pages must not. Both
  // rules are about relative hrefs, which the `links` check above cannot see at all — it
  // only inspects absolute http ones. That blind spot is why these two exist separately.
  // Nothing opens in a new tab. The three sites are one ring — each links the other two, and
  // every deck carries its own way out — so a new tab is a workaround for a problem that no
  // longer exists, and it costs the visitor their back button.
  //
  // The exception, which this site does not use, is a link inside a slide: a presenter who
  // clicks one mid-talk in the same tab loses the deck. It keys on *where* a link sits rather
  // than where it points, so it needs no list of hrefs to maintain. Neither deck here has an
  // outbound link in a slide; companygraph's has two, which is why the exception is written
  // the same way in all three suites.
  //
  // This replaces `newTab`, which asserted the opposite. That function had already outlived
  // its last caller — no page spec named it — so it was asserting nothing at all.
  // The footer is the same three links on every page, and it is copied by hand from a
  // sibling when a page is added. Both ways that copy goes wrong shipped together on
  // /principles/: the opening `<div class="shell">` was left behind, so the footer escaped
  // the content column and sat flush against the viewport, and the privacy link came from
  // the privacy page, where `./` is correct and `aria-current` is true — on any other page
  // it points at itself and lies about where the visitor is.
  //
  // Neither is visible to a check that only reads text. The links are all present, the page
  // renders, nothing 404s. What is wrong is where the footer sits and where one link goes,
  // so those are what this asserts.
  async footer(page) {
    const bad = await page.evaluate(() => {
      const f = document.querySelector("footer");
      if (!f) return ["there is no footer"];
      const out = [];
      if (!f.closest(".shell")) out.push("footer is not inside .shell — it will not line up with the page");
      const priv = [...f.querySelectorAll("a")]
        .find(a => /^(privacy|datenschutz)$/i.test(a.textContent.trim()));
      if (!priv) out.push("footer has no privacy link");
      else {
        const here = new URL(location.href).pathname.replace(/\/+$/, "/");
        const to = new URL(priv.getAttribute("href"), location.href).pathname.replace(/\/+$/, "/");
        if (to !== "/privacy/") out.push(`privacy link goes to ${to}, not /privacy/`);
        const current = priv.hasAttribute("aria-current");
        if (current && here !== "/privacy/") out.push("privacy link claims aria-current on a page that is not /privacy/");
        if (!current && here === "/privacy/") out.push("privacy link is the current page and does not say so");
      }
      return out;
    });
    return bad.length ? bad.join("; ") : null;
  },
  async noNewTab(page) {
    const bad = await page.evaluate(() => {
      const live = [...document.querySelectorAll('a[target="_blank"]')]
        .filter(a => !a.closest(".slide"))
        .map(a => a.getAttribute("href"));
      // The rendered DOM is only ever one language. German rides in `data-de` as markup that
      // does not exist until a visitor switches, so a link check that trusts the DOM inspects
      // half the site. That is not hypothetical: the privacy page's German credit kept
      // `target='_blank'` — in single quotes, because it is nested inside an attribute — and
      // survived both a source-wide strip and this check until the attributes were parsed.
      const translated = [...document.querySelectorAll("[data-de]")].flatMap(el => {
        if (el.closest(".slide")) return [];
        const t = document.createElement("template");
        t.innerHTML = el.getAttribute("data-de");
        return [...t.content.querySelectorAll('a[target="_blank"]')]
          .map(a => `${a.getAttribute("href")} [de]`);
      });
      return [...live, ...translated];
    });
    return bad.length ? "must stay in this tab: " + bad.join(", ") : null;
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
  // The footer carries two destinations now: the lockup to the site's landing page and
  // "Talks" to the index. wayOut covers only the second. Nothing else would notice the
  // brand pointing at a page that no longer exists — a relative href is invisible to the
  // `links` check, and a 404 on a deck's own chrome looks like a working deck until clicked.
  async landing(page, spec) {
    const found = await page.evaluate(href =>
      [...document.querySelectorAll("#chrome a[href]")]
        .filter(a => a.getAttribute("href") === href)
        .map(a => ({
          named: !!(a.getAttribute("aria-label") || (a.textContent || "").trim()),
          isLockup: !!a.querySelector(".namemark svg"),
        })), spec.landing);
    if (!found.length) return `no link to the landing page (${spec.landing}) in the transport bar`;
    if (!found.some(l => l.isLockup)) return `the landing link is not the brand lockup`;
    const unnamed = found.filter(l => !l.named).length;
    return unnamed ? `${unnamed} landing link(s) without an accessible name` : null;
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
  // The head Google reads, asserted as a contract rather than page by page. Three of these
  // were live failures before the check existed: a logo.svg this site has never served, an
  // isPartOf naming a #website node defined on another document, and /ideas/ advertising the
  // landing page's card. All three had shipped green.
  //
  // The canonical is compared against the page's own URL, not merely against og:url. Agreeing
  // with og:url proves only that two tags say the same thing; both can say the same wrong
  // thing, and a canonical pointing at another page removes this one from the index and hands
  // its signals over — quietly, and worse than anything above.
  async seo(page, spec) {
    const problems = [];
    const want = SITE + spec.path;
    const m = await page.evaluate(() => {
      const meta = (sel) => (document.querySelector(sel) || {}).content || null;
      return {
        canonical: (document.querySelector('link[rel="canonical"]') || {}).getAttribute?.("href") ?? null,
        ogUrl: meta('meta[property="og:url"]'),
        ogTitle: meta('meta[property="og:title"]'),
        ogDesc: meta('meta[property="og:description"]'),
        ogType: meta('meta[property="og:type"]'),
        image: meta('meta[property="og:image"]'),
        desc: meta('meta[name="description"]'),
        site: meta('meta[property="og:site_name"]'),
        locale: meta('meta[property="og:locale"]'),
        alt: meta('meta[property="og:image:alt"]'),
        twitter: meta('meta[name="twitter:card"]'),
        ld: [...document.querySelectorAll('script[type="application/ld+json"]')].map(s => s.textContent),
      };
    });

    if (!m.canonical) problems.push("no canonical");
    else if (m.canonical !== want) problems.push(`canonical ${JSON.stringify(m.canonical)} should be ${want}`);
    if (m.ogUrl !== m.canonical) problems.push(`og:url ${m.ogUrl} != canonical ${m.canonical}`);

    // Every page renders its own card. A page pointing at another's previews the wrong page
    // on every share, looks perfectly healthy, and is what `card` below cannot see: it only
    // asks whether the image resolves at its declared size, and a borrowed card does.
    if (!m.image) problems.push("no og:image");
    else if (m.image !== want + "og.png") problems.push(`og:image ${m.image} is not this page's own card (${want}og.png)`);

    if (!m.desc) problems.push("no meta description");
    else if (m.desc.length > 200) problems.push(`description is ${m.desc.length} chars, over 200`);

    for (const [k, v] of [["og:site_name", m.site], ["og:locale", m.locale],
                          ["og:image:alt", m.alt], ["twitter:card", m.twitter],
                          ["og:title", m.ogTitle], ["og:description", m.ogDesc],
                          ["og:type", m.ogType]])
      if (!v) problems.push(`no ${k}`);
    if (m.ogType && !["website", "article"].includes(m.ogType))
      problems.push(`og:type ${m.ogType} is neither website nor article`);

    // Structured data has to resolve, not merely parse. Google reads @graph within one
    // document, so an @id referenced but defined elsewhere is a pointer to nothing — and a
    // URL inside it is a promise the site either keeps or does not.
    if (!m.ld.length) problems.push("no application/ld+json");
    const defined = new Set(), referenced = [], urls = new Set();
    for (const block of m.ld) {
      let data;
      try { data = JSON.parse(block); }
      catch (e) { problems.push("ld+json does not parse: " + e.message); continue; }
      const nodes = data["@graph"] || (Array.isArray(data) ? data : [data]);
      const walk = (o) => {
        if (Array.isArray(o)) {
          for (const v of o)
            if (typeof v === "string" && /^https?:\/\//.test(v)) urls.add(v); else walk(v);
          return;
        }
        if (!o || typeof o !== "object") return;
        for (const [k, v] of Object.entries(o)) {
          // A bare { "@id": ... } is a pointer; the same key alongside an @type defines the
          // thing pointed at. Both are registered here as well as from the top-level @graph
          // members, so a node inlined under a property satisfies references to it instead of
          // being reported dangling.
          if (k === "@id" && typeof v === "string") {
            if (o["@type"]) defined.add(v);   // a node inlined under a property still defines one
            else referenced.push(v);          // a bare { "@id": … } is a pointer that must land
          }
          else if (typeof v === "string" && /^https?:\/\//.test(v) && k !== "@context") urls.add(v);
          else walk(v);
        }
      };
      nodes.forEach(n => { if (n && n["@id"]) defined.add(n["@id"]); });
      nodes.forEach(walk);
    }
    for (const r of referenced)
      if (!defined.has(r)) problems.push(`ld+json references ${r}, which no node on this page defines`);

    // Fetched from Node against BASE, not in-page against location.origin: an origin carries
    // no path, and a BASE can (the sibling sites are served under one). Nothing about these
    // URLs needs a browser.
    for (const u of urls) {
      if (!u.startsWith(SITE)) continue;              // off-site URLs are not ours to keep
      let status = 0;
      try { status = (await fetch(u.replace(SITE, BASE))).status; } catch { status = 0; }
      if (status !== 200) problems.push(`ld+json names ${u} → HTTP ${status}`);
    }

    return problems.length ? problems.join("; ") : null;
  },

  async card(page, spec) {
    const img = await page.evaluate(() =>
      (document.querySelector('meta[property="og:image"]') || {}).content);
    if (!img) return "no og:image";
    const declared = await page.evaluate(() => [
      (document.querySelector('meta[property="og:image:width"]') || {}).content,
      (document.querySelector('meta[property="og:image:height"]') || {}).content,
    ]);
    const real = await page.evaluate(async ({ url, site }) => {
      const r = await fetch(url.replace(site, location.origin));
      if (!r.ok) return null;
      const dv = new DataView(await r.arrayBuffer());
      return [String(dv.getUint32(16)), String(dv.getUint32(20))];   // PNG IHDR
    }, { url: img, site: SITE });
    if (!real) return `${img} is not fetchable`;
    if (real[0] !== declared[0] || real[1] !== declared[1])
      return `card is ${real.join("×")} but declared ${declared.join("×")}`;
    return null;
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
        const r = await fetch(u.replace(SITE, BASE));
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
        const r = await fetch(u.replace(SITE, BASE));
        if (!r.ok) dead.push(`${u} → ${r.status}`);
      }
      if (dead.length) { console.log("✗ /robots.txt  names sitemap(s) that do not exist: " + dead.join(", ")); failures++; }
      else console.log(`✓ /robots.txt  ${named.length} sitemap(s), all reachable`);
    }
  }
}

console.log(failures ? `\n${failures} page(s) FAILED` : "\nall checks pass");
process.exit(failures ? 1 : 0);
