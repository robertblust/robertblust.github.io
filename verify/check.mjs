// The deliverable is rendered pages, so the tests are assertions against a rendered DOM.
// Run against a served copy of the repo: python3 -m http.server 8000
import { chromium } from "playwright";

const BASE = process.env.BASE || "http://localhost:8000";

// Extended by later tasks. `lang` is the expected documentElement.lang AFTER JS runs.
const PAGES = [
  { path: "/", title: /Robert Blust/, lang: "en",
    links: ["https://github.com/robertblust", "https://www.linkedin.com/in/robertblust/"],
    contains: ["deciding well", "The Mental Model", "Essential Complexity"] },
  { path: "/talks/mental-model/", title: /Mental Model/, lang: "en",
    transport: true, zeroBased: true, sourceLang: true },
  { path: "/talks/essential-complexity/", title: /Essential Complexity/, lang: "en" },
  { path: "/talks/", title: /talks/i, lang: "en",
    contains: ["The Mental Model", "Essential Complexity",
               "machine-readable knowledge base", "essential complexity"] },
];

const CHECKS = {
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
  async sourceLang(page, spec) {
    // lang before JS runs — the static attribute must describe the German markup
    const res = await fetch(spec.absolute);
    const html = await res.text();
    const m = html.match(/<html lang="([a-z]+)"/);
    return m && m[1] === "de" ? null : `static lang is ${m && m[1]}, expected de`;
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
console.log(failures ? `\n${failures} page(s) FAILED` : "\nall checks pass");
process.exit(failures ? 1 : 0);
