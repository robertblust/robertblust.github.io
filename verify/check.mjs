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
  { path: "/", mobileNav: true, carriesLang: true, headerBaseline: true, navOrder: true, footer: true, seo: true, noNewTab: true, title: /Robert Blust/, lang: "en", sourceLang: "en",
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
  { path: "/talks/mental-model/", carriesLang: true, seo: true, noNewTab: true, footerVersion: true, wayOut: "../", title: /Mental Model/, lang: "en", sourceLang: "en",
    transport: true, zeroBased: true,  card: true, brandMark: true,
    landing: "../../",
    fontsLoaded: ["Bricolage Grotesque", "Instrument Sans"], fontsAvailable: true,
    tokens: true, sky: true, monoScope: true, contrast: true, tokenVersion: true,
    internalLinks: true },
  { path: "/talks/essential-complexity/", carriesLang: true, seo: true, noNewTab: true, footerVersion: true, wayOut: "../", title: /Essential Complexity/, lang: "en", sourceLang: "en",
    transport: true, zeroBased: true,  card: true, brandMark: true,
    landing: "../../",
    fontsLoaded: ["Bricolage Grotesque", "Instrument Sans"], fontsAvailable: true,
    tokens: true, sky: true, monoScope: true, contrast: true, tokenVersion: true,
    internalLinks: true },
  { path: "/talks/", mobileNav: true, carriesLang: true, headerBaseline: true, navOrder: true, footer: true, seo: true, noNewTab: true, title: /talks/i, lang: "en", sourceLang: "en",
    contains: ["The Mental Model", "Essential Complexity",
               "machine-readable knowledge base", "essential complexity"], card: true,
    sameTab: ["mental-model/", "essential-complexity/", "./"], brandMark: true,
    fontsLoaded: ["Bricolage Grotesque", "Instrument Sans"], fontsAvailable: true,
    tokens: true, sky: true, header: true, monoScope: true, contrast: true, tokenVersion: true,
    internalLinks: true },
  // The privacy page. Its claims are checkable, so verify checks them rather than trusting
  // the prose: a page that says it makes no third-party request must make none.
  { path: "/privacy/", mobileNav: true, carriesLang: true, headerBaseline: true, navOrder: true, footer: true, seo: true, noNewTab: true, title: /Blust/, lang: "en", sourceLang: "en", card: true,
    contains: ["This site collects", "There is no imprint yet"],
    sameOrigin: true,
    fontsLoaded: ["Bricolage Grotesque", "Instrument Sans"], fontsAvailable: true,
    tokens: true, sky: true, header: true, monoScope: true, contrast: true, tokenVersion: true,
    internalLinks: true },
  // The ideas page. Two claims make it worth reading and both are checkable: that each
  // idea has exactly one commercial part, and that nothing on the page reaches off-origin —
  // the privacy note promises the second for the whole site.
  { path: "/ideas/", mobileNav: true, carriesLang: true, headerBaseline: true, navOrder: true, footer: true, seo: true, noNewTab: true, title: /Ideas/, lang: "en", sourceLang: "en",
    contains: ["Two ideas", "Open core", "COMMERCIAL", "OPEN SOURCE"],
    links: ["https://github.com/guestgraph", "https://github.com/companygraph"],
    sameOrigin: true,
    fontsLoaded: ["Bricolage Grotesque", "Instrument Sans"], fontsAvailable: true,
    tokens: true, sky: true, header: true, monoScope: true, contrast: true, tokenVersion: true,
    card: true, internalLinks: true },
  // Generated from the model, so what it asserts is the shape of the page and one line of the
  // content — the words themselves are `npm run principles:check`'s business, and asserting
  // them twice would mean editing this file every time a value is written.
  { path: "/principles/", mobileNav: true, carriesLang: true, headerBaseline: true, navOrder: true, footer: true, seo: true, noNewTab: true, title: /Principles/, lang: "en", sourceLang: "en",
    contains: ["One model,", "everywhere", "Values", "Generated from"],
    links: ["https://github.com/robertblust/mental-model", "https://companygraph.io/"],
    sameOrigin: true,
    fontsLoaded: ["Bricolage Grotesque", "Instrument Sans"], fontsAvailable: true,
    tokens: true, sky: true, header: true, monoScope: true, contrast: true, tokenVersion: true,
    card: true, internalLinks: true },
  // The model page draws the same graph the example on companygraph.io draws, from this
  // person's own instance rather than the fictional one. `stage` is the check that the
  // drawing actually drew: the data block alone proves nothing rendered.
  { path: "/model/", mobileNav: true, carriesLang: true, headerBaseline: true, navOrder: true, footer: true, seo: true, noNewTab: true, title: /Model/, lang: "en", sourceLang: "en",
    contains: ["A company of one", "drawn", "What is in it", "Generated from"],
    // The source link is not asserted here. The stage rewrites its href from the block's own
    // commit, so any literal in this list would be either the markup's placeholder (gone by
    // the time the check reads the DOM) or a commit that changes on every repin. `graph`
    // asserts it instead, against the block itself.
    links: ["https://companygraph.io/"],
    sameOrigin: true,
    fontsLoaded: ["Bricolage Grotesque", "Instrument Sans"], fontsAvailable: true,
    tokens: true, sky: true, header: true, monoScope: true, contrast: true, tokenVersion: true,
    card: true, internalLinks: true, graph: "model-data", divider: true },
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
  // The nav is one row across three sites, and it is written by hand on every page, so it
  // drifted: blust.ch put Principles after Talks on four pages and before it on the fifth,
  // and companygraph.io led with Talks while its siblings did not. Nothing caught it — the
  // items were all present, and `contains` does not see order.
  //
  // The family's order, left to right, is Ideas, Principles, Model, Example, Talks, Billing,
  // Privacy, then the language switcher. Read right to left it is the reverse, which is how
  // the rule was given: the switcher sits at the edge, and the further left an item is, the
  // more it is the site's own subject. A site skips what it does not have; no site may
  // reorder what it does have, and nothing outside the list may appear in the row.
  //
  // Privacy is on the list but lives in the footer on all three sites today. That is a
  // placement, not an exception: if it ever moves into the nav, this is where it goes.
  //
  // This function is a fourth copy, kept identical in all three suites the way the head
  // contract and the no-new-tab check are. A rule that is one row for a visitor is worth
  // asserting the same way everywhere.
  // One line runs through the middle of every word in the header — the wordmark, each nav
  // item, and both language segments. It did not before: nav is a flex row, its links
  // stretched to the row's height with their text at the top, and the language control sat
  // 5px lower than the words beside it.
  //
  // Measured on the text, not the boxes. A box can be centred while the text inside it is
  // not — that is exactly the bug this replaced, and a check comparing boxes would have
  // called it aligned.
  //
  // Two tolerances, because there are two fonts. The nav items and the language segments
  // are the same face at the same size, so they must agree to within half a pixel; that is
  // the pair the fix was about, and a loose bound there proved useless — with the link box
  // already symmetric, undoing `align-items:center` still landed inside 1px. The wordmark
  // is a different face, and where a line box falls inside its em box is the font's
  // business and the platform's, so it gets 1.5px and is judged against the row, not
  // against a single item of it.
  async headerBaseline(page) {
    return await page.evaluate(() => {
      const mid = el => {
        const n = [...el.childNodes].find(x => x.nodeType === 3 && x.textContent.trim());
        const r = document.createRange(); r.selectNodeContents(n || el);
        const b = r.getBoundingClientRect(); return (b.top + b.bottom) / 2;
      };
      const row = [];
      document.querySelectorAll("nav a").forEach(a => row.push([a.textContent.trim(), mid(a)]));
      for (const id of ["lde", "len"]) {
        const el = document.getElementById(id);
        if (el) row.push([el.textContent.trim(), mid(el)]);
      }
      if (row.length < 2) return "the nav row has fewer texts than a row";
      const vals = row.map(r => r[1]);
      const base = vals.reduce((a, b) => a + b, 0) / vals.length;
      const spread = Math.max(...vals) - Math.min(...vals);
      if (spread > 0.5)
        return `nav texts are ${spread.toFixed(2)}px apart: ` +
          row.map(([n, v]) => `${n} ${(v - base >= 0 ? "+" : "") + (v - base).toFixed(2)}`).join(", ");
      const mark = document.querySelector(".brand b");
      if (mark) {
        const d = mid(mark) - base;
        if (Math.abs(d) > 1.5) return `the wordmark sits ${d.toFixed(2)}px off the nav row`;
      }
      return null;
    });
  },
  // Three domains, three localStorages, one preference. A visitor reading German on one
  // site and following a link to a sibling used to arrive in English, because an origin
  // cannot see what another origin stored. The language travels in the link instead.
  //
  // Three things have to hold, and the middle one is the reason the implementation looks
  // the way it does. A family link can live inside a data-de attribute, and switching
  // language replaces that element whole, so an href decorated at load would be thrown
  // away by the first toggle; decorating on mousedown survives it, and keeps the param
  // out of the served markup — nothing crawlable or copyable carries it.
  //
  // Driven with mousedown rather than click on purpose: it is the event that fires before
  // the browser follows a link, so it can be dispatched without navigating away.
  async carriesLang(page, spec) {
    const problems = [];
    await page.goto(spec.absolute + "?lang=de", { waitUntil: "networkidle" });
    const arrived = await page.evaluate(() => ({
      lang: document.documentElement.lang, search: location.search,
    }));
    if (arrived.lang !== "de")
      problems.push(`arriving with ?lang=de left the page in ${arrived.lang}`);
    if (/lang=/.test(arrived.search))
      problems.push(`the param stayed in the address bar as ${JSON.stringify(arrived.search)}`);

    const probe = await page.evaluate(() => {
      const pick = test => [...document.querySelectorAll("a[href]")].find(a => {
        try { return test(new URL(a.href, location.href)); } catch (e) { return false; }
      });
      const press = a => {
        const before = a.getAttribute("href");
        a.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
        return { before, after: a.getAttribute("href") };
      };
      const FAMILY = /^(www\.)?(blust\.ch|companygraph\.io|guestgraph\.io)$/;
      const out = { away: null, home: null };
      const away = pick(u => u.origin !== location.origin && FAMILY.test(u.hostname));
      if (away) out.away = press(away);
      const home = pick(u => u.origin === location.origin);
      if (home) out.home = press(home);
      return out;
    });
    // A page with no link to a sibling domain simply has nothing to carry.
    if (probe.away && !/[?&]lang=de(&|$)/.test(probe.away.after))
      problems.push(`a link to ${probe.away.before} did not pick the language up: ${probe.away.after}`);
    if (probe.home && probe.home.after !== probe.home.before)
      problems.push(`a same-origin link was rewritten to ${probe.home.after}; it shares this storage already`);

    // Leave the page as this check found it, for whatever runs next.
    await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
    await page.goto(spec.absolute, { waitUntil: "networkidle" });
    return problems.length ? problems.join("; ") : null;
  },
  // The row at phone widths. Every page in the three sites used to answer this its own way
  // — some wrapped the bar, some wrapped the nav, and the two whose `.bar` carried no
  // `flex-wrap` let the wordmark itself break, so "rb Robert Blust" arrived on two lines.
  //
  // Checked at 360px, which is narrower than the phones in the analytics and wide enough
  // that nothing here is a special case. The wordmark is measured against its own mark: if
  // the name has dropped below it the brand is twice the mark's height, and no tolerance is
  // needed to see it.
  //
  // The switcher is asserted visible on purpose. It would be easy to sweep it into the menu
  // with everything else, and for a bilingual audience that is the wrong trade — a language
  // control someone cannot find costs more than the tap it saves.
  async mobileNav(page, spec) {
    const problems = [];
    await page.setViewportSize({ width: 360, height: 640 });
    try {
      await page.goto(spec.absolute, { waitUntil: "networkidle" });
      const shut = await page.evaluate(() => {
        const q = s => document.querySelector(s);
        const seen = el => el && getComputedStyle(el).display !== "none";
        const brand = q(".brand").getBoundingClientRect().height;
        const mark = q(".brand svg").getBoundingClientRect().height;
        return {
          brand: Math.round(brand), mark: Math.round(mark),
          wide: document.documentElement.scrollWidth > window.innerWidth,
          links: seen(q("#navlinks")), burger: seen(q("#burger")), seg: seen(q("#langind")),
        };
      });
      if (shut.brand > shut.mark)
        problems.push(`the wordmark broke: the brand is ${shut.brand}px against a ${shut.mark}px mark`);
      if (shut.wide) problems.push("the page scrolls sideways");
      if (shut.links) problems.push("the links are still in the row at 360px");
      if (!shut.burger) problems.push("there is no menu button");
      if (!shut.seg) problems.push("the language control is not on the bar");

      // Only drive the button if it is there to be driven: clicking a hidden one waits the
      // full timeout and reports that instead of the thing actually wrong.
      if (shut.burger) {
      await page.click("#burger");
      const open = await page.evaluate(() => ({
        links: getComputedStyle(document.getElementById("navlinks")).display !== "none",
        flag: document.getElementById("burger").getAttribute("aria-expanded"),
      }));
      if (!open.links) problems.push("pressing the button did not open the menu");
      if (open.flag !== "true") problems.push(`the button reports aria-expanded=${open.flag} while open`);

      await page.keyboard.press("Escape");
      const closed = await page.evaluate(() =>
        getComputedStyle(document.getElementById("navlinks")).display === "none");
      if (!closed) problems.push("Escape did not close the menu");
      }
    } finally {
      // Every other check runs at the desktop size; leave the page as they expect it.
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto(spec.absolute, { waitUntil: "networkidle" });
    }
    return problems.length ? problems.join("; ") : null;
  },
  // The drawing, not just the data block: a block that parses proves nothing rendered.
  // Copied whole from companygraph.io, where the same stage draws the example — it carries
  // no literal from either page, deriving every id, name and count from the block itself,
  // which is exactly why it transplants.
  async graph(page, spec) {
    const data = await page.evaluate((id) => JSON.parse(document.getElementById(id).textContent), spec.graph);
    if (!data.entities) return "the data block is empty — run: npm run example";
    // The source link and its short commit are rewritten by the script from the block's own
    // commit, so a stale generator that leaves the markup's placeholder in place would pass
    // every other check here while pointing at the wrong tree.
    // Which folder of the model repository the block came from is the page's to say, not
    // this check's: `stage.js` reads it off #srclink's data-src, so the assertion reads it
    // from the same place rather than carrying a second copy that could disagree.
    const srcSub = await page.evaluate(() => document.getElementById("srclink").getAttribute("data-src"));
    const srcHref = await page.evaluate(() => document.getElementById("srclink").getAttribute("href"));
    const wantHref = `/tree/${data.commit}/${srcSub}`;
    if (!srcHref.endsWith(wantHref)) return `source link is ${JSON.stringify(srcHref)}, expected it to end with ${JSON.stringify(wantHref)}`;
    const srcCommit = await page.evaluate(() => document.getElementById("srccommit").textContent);
    if (srcCommit !== data.commit.slice(0, 7)) return `source commit reads ${JSON.stringify(srcCommit)}, expected ${JSON.stringify(data.commit.slice(0, 7))}`;
    const nodes = () => page.evaluate(() => Array.from(document.querySelectorAll("#fig .n")).map(n => ({ id: n.dataset.id, focus: n.classList.contains("focus") })));
    const click = (id) => page.evaluate((id) => {
      const n = document.querySelector(`#fig .n[data-id="${id}"]`);
      if (n) n.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      return !!n;
    }, id);
    // A singular type has no folder (core 0.4.0, R6/R13): its one entity hangs off the root
    // beside the folders, so it is counted here and never walked down to.
    const singular = new Set(data.types.filter(t => !t.owner && !t.folder).map(t => t.type));
    const roots = data.types.filter(t => !t.owner && t.folder).map(t => t.folder);
    // The root is the identity entity where an instance has one, drawn as one node rather
    // than two carrying the same name; the rest of the singular entities hang beside the
    // folders.
    const loose = data.entities.filter(e => singular.has(e.type) && e.id !== data.rootId);
    let ns = await nodes();
    if (!ns.find(n => n.id === "root" && n.focus)) return "initially the root is not the focus";
    if (ns.length !== roots.length + loose.length + 1)
      return `initially ${ns.length} nodes, expected root + ${roots.length} folders + ${loose.length} singular entities`;
    for (const e of loose)
      if (!ns.find(n => n.id === e.id)) return `${e.id} is a singular type's entity and is not drawn at the root`;
    if (data.rootId && ns.find(n => n.id === data.rootId))
      return `${data.rootId} is drawn beside the root it is`;
    // The walk below descends to a folder, so it needs an edge that starts inside one.
    const edge = data.edges.find(e => {
      const f = data.entities.find(x => x.id === e.from);
      return f && !singular.has(f.type);
    });
    if (!edge) return null;
    const from = data.entities.find(e => e.id === edge.from);
    const folder = from.id.slice(0, from.id.lastIndexOf("/"));
    // Walk down to that folder one click at a time. The canvas is a neighbourhood, not a
    // tree, so a folder four levels down is not on it until its parent is the focus — and
    // every prefix of an id IS a node here, because an id is the thing's path on disk.
    const parts = folder.split("/");
    for (let i = 1; i <= parts.length; i++) {
      const prefix = parts.slice(0, i).join("/");
      if (!(await click(prefix))) return `${prefix} is not on the canvas at this point in the walk`;
      await page.waitForTimeout(500);
    }
    ns = await nodes();
    if (!ns.find(n => n.id === folder && n.focus)) return `clicking ${folder} did not focus it`;
    if (!ns.find(n => n.id === "root")) return `focused ${folder}, but its ancestor root is gone`;
    if (!ns.find(n => n.id === from.id)) return `focused ${folder}, but its child ${from.id} is not drawn`;
    await click(from.id); await page.waitForTimeout(500);
    const name = await page.evaluate(() => (document.querySelector("#card h3") || {}).textContent);
    if (name !== from.name) return `card shows ${JSON.stringify(name)}, expected ${JSON.stringify(from.name)}`;
    // Where you are and how you got here, in the drawing rather than only in the breadcrumb.
    // `spine` was set on the ancestor chain and dropped before it reached the DOM, and the
    // focused node wore the same colour as a hovered one, so the canvas said neither.
    const context = await page.evaluate(() => ({
      spines: document.querySelectorAll("#fig .own.spine").length,
      ancestors: document.querySelectorAll("#fig .n.ancestor").length,
      focusRing: (() => {
        const f = document.querySelector("#fig .n.focus .sq, #fig .n.focus .box");
        return f ? getComputedStyle(f).stroke : null;
      })(),
      hoverShares: (() => {
        // the focus must not simply be what a pointer already does
        const css = [...document.styleSheets].flatMap(s => { try { return [...s.cssRules]; } catch (e) { return []; } });
        return css.some(r => r.selectorText && /\.n:hover .*\.n\.focus|\.n\.focus.*:hover/.test(r.selectorText));
      })(),
    }));
    if (!context.spines) return "the path from the root to the focus is not drawn — no .own.spine";
    if (!context.ancestors) return "no ancestor node is marked, so the path shows only as a line";
    if (!context.focusRing || context.focusRing === "none")
      return "the focused node carries no stroke of its own, so it reads as one more square";
    if (context.hoverShares) return "the focus is styled in the same rule as :hover, so it cannot be told from a pointer";
    // The stage, expanded: Expand moves the whole stage — path, canvas and card — into
    // dialog#stagemodal, closed by its ×, Escape or a backdrop click. It is the same stage
    // moved, not a copy, so this checks the dialog actually contains #fig and #card (rather
    // than a second rendering of them) and that the canvas really grew, then that the move
    // back on close lands #fig inside .figure-section again — nothing here is a literal from
    // the example, every name comes from the block or from the DOM itself.
    if (!(await page.evaluate(() => !!document.getElementById("expand")))) return "#expand is missing";
    const orderBefore = await page.evaluate(() =>
      [...document.querySelector(".figure-section").children].map(e => e.id || e.className));
    const widthBefore = await page.evaluate(() => document.getElementById("fig").getBoundingClientRect().width);
    await page.click("#expand");
    await page.waitForTimeout(300);
    const modalOpen = await page.evaluate(() => !!document.querySelector("dialog#stagemodal[open]"));
    if (!modalOpen) return "clicking #expand did not open dialog#stagemodal";
    const holds = await page.evaluate(() => {
      const dialog = document.getElementById("stagemodal");
      return dialog.contains(document.getElementById("fig")) && dialog.contains(document.getElementById("card"));
    });
    if (!holds) return "dialog#stagemodal does not contain #fig and #card — Expand should move the stage, not copy it";
    const widthAfter = await page.evaluate(() => document.getElementById("fig").getBoundingClientRect().width);
    if (!(widthAfter > widthBefore)) return `#fig width in the dialog is ${widthAfter}, expected more than ${widthBefore} before Expand`;
    const stillFocused = await page.evaluate((id) => {
      const n = document.querySelector(`#fig .n[data-id="${id}"]`);
      return !!n && n.classList.contains("focus");
    }, from.id);
    if (!stillFocused) return `${from.id} is no longer the focus after Expand`;
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
    if (await page.evaluate(() => !!document.querySelector("dialog[open]"))) return "Escape did not close dialog#stagemodal";
    const backInPlace = await page.evaluate(() => document.querySelector(".figure-section").contains(document.getElementById("fig")));
    if (!backInPlace) return "closing the dialog did not move #fig back inside .figure-section";
    // Back inside is not back in place. The restore used to insert the stage before the
    // caption, which was right only while nothing sat between them; the moment a page put a
    // line there, closing the dialog left it above the drawing instead of below it. Compare
    // the whole running order, not just containment.
    const orderAfter = await page.evaluate(() =>
      [...document.querySelector(".figure-section").children].map(e => e.id || e.className));
    if (orderAfter.join(" ") !== orderBefore.join(" "))
      return `closing the dialog left the figure section as ${orderAfter.join(" ")}, was ${orderBefore.join(" ")}`;
    const drawn = await page.evaluate((id) => Array.from(document.querySelectorAll(`#fig .ref[data-from="${id}"]`)).map(p => p.dataset.to), from.id);
    for (const x of data.edges.filter(x => x.from === from.id)) if (!drawn.includes(x.to)) return `reference ${from.id} → ${x.to} is in the block but not drawn`;
    ns = await nodes();
    for (const x of data.edges.filter(x => x.from === from.id)) if (!ns.find(n => n.id === x.to)) return `reference target ${x.to} is not on the canvas`;
    const hash = await page.evaluate(() => decodeURIComponent(location.hash.slice(1)));
    if (hash !== from.id) return `hash is ${JSON.stringify(hash)}, expected ${from.id}`;
    return null;
  },
  // The details pane is draggable, because 360px is right for a folder's card and wrong for a
  // profile claiming fifty-eight skills. Asserted through the behaviour a reader has, not the
  // implementation: drag it, and the pane is wider and the width is remembered; double-click,
  // and it is back to the default with nothing stored; and no drag may push the canvas under
  // its floor, which is the failure that arithmetic ignoring the grid's gaps produced.
  async divider(page, spec) {
    const CANVAS_MIN = 320;
    await page.goto(spec.absolute, { waitUntil: "networkidle" });
    await page.evaluate(() => { try { localStorage.removeItem("cg-stage-card"); } catch (e) {} });
    await page.reload({ waitUntil: "networkidle" });
    const width = () => page.evaluate(() => Math.round(document.querySelector(".card").getBoundingClientRect().width));
    const canvas = () => page.evaluate(() => Math.round(document.querySelector(".canvas").getBoundingClientRect().width));
    const g = await page.$("#gutter");
    if (!g) return "there is no divider between the canvas and the card";
    const before = await width();

    // The stage is taller than the window the suite runs at, so the handle's midpoint can sit
    // below the fold — a press aimed there lands on nothing and the drag silently does not
    // happen. Bring it into view and aim at a point that is certainly on screen.
    await page.$eval(".stage", (el) => el.scrollIntoView({ block: "center" }));
    await page.waitForTimeout(150);
    const box = await g.boundingBox();
    const y = Math.min(box.y + box.height / 2, box.y + 60);
    await page.mouse.move(box.x + box.width / 2, y);
    await page.mouse.down();
    await page.mouse.move(box.x - 160, y, { steps: 8 });
    await page.mouse.up();
    const dragged = await width();
    if (!(dragged > before)) return `dragging the divider left did not widen the card: ${before} → ${dragged}`;
    const stored = await page.evaluate(() => localStorage.getItem("cg-stage-card"));
    if (!stored) return "the width was not remembered after a drag";

    await page.reload({ waitUntil: "networkidle" });
    if (Math.abs((await width()) - dragged) > 2) return `the remembered width did not survive a reload: ${await width()} vs ${dragged}`;

    // A stored width wider than the box must clamp, and the canvas keeps its floor.
    await page.evaluate(() => localStorage.setItem("cg-stage-card", "9000"));
    await page.reload({ waitUntil: "networkidle" });
    if ((await canvas()) < CANVAS_MIN)
      return `a stored width of 9000 left the canvas at ${await canvas()}px, under its ${CANVAS_MIN}px floor`;

    await page.dblclick("#gutter");
    if ((await width()) !== before) return `double-click did not restore the default: ${await width()} vs ${before}`;
    if (await page.evaluate(() => localStorage.getItem("cg-stage-card")))
      return "double-click restored the default but left the old width stored";

    // Drag is not the only way in: a control that needs a pointer is unreachable without one.
    await page.focus("#gutter");
    await page.keyboard.press("ArrowLeft");
    if (!((await width()) > before)) return "the divider does not respond to the keyboard";

    await page.evaluate(() => { try { localStorage.removeItem("cg-stage-card"); } catch (e) {} });
    await page.goto(spec.absolute, { waitUntil: "networkidle" });
    return null;
  },
  async navOrder(page) {
    const ORDER = ["Ideas", "Principles", "Model", "Example", "Talks", "Billing", "Privacy"];
    return await page.evaluate(order => {
      const nav = document.querySelector("nav");
      if (!nav) return "there is no nav";
      const items = [...nav.querySelectorAll("a")].map(a => a.textContent.trim());
      const unknown = items.filter(i => !order.includes(i));
      if (unknown.length) return "not named by the order rule: " + unknown.join(", ");
      const want = order.filter(i => items.includes(i));
      if (items.join(" ") !== want.join(" "))
        return `order is ${items.join(" · ")}; the rule is ${want.join(" · ")}`;
      // The switcher is the right-hand edge of the row, so nothing may follow it.
      const kids = [...nav.children];
      const sw = kids.findIndex(el => el.id === "langind" || el.classList.contains("langind"));
      if (sw === -1) return "the language switcher is not in the nav";
      if (sw !== kids.length - 1) return "something sits to the right of the language switcher";
      return null;
    }, ORDER);
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
