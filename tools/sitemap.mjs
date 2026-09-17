// Writes each sitemap URL's <lastmod> from git, and checks that it is still what git says.
//
// A crawler uses lastmod only while it stays accurate, and one typed by hand is accurate on the
// day it is typed. So the date is the day of the last commit that changed the page, in UTC and by
// author date, which a rebase leaves alone. A page's change is what tools/indexnow.mjs calls one:
// its own index.html, and model.json as well for a page that draws the model.
//
// A page edited and not yet committed is dated today, so the order is: edit, `npm run sitemap`,
// commit both together. `--check` writes nothing and fails on any date that has moved.
//
//   node tools/sitemap.mjs [--check]
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pageFile, sitemapLocs } from "./indexnow.mjs";

// The files whose change is a change to the page.
export function pageInputs(loc, html) {
  const file = pageFile(loc);
  return html.includes("data-stage") ? [file, "model.json"] : [file];
}

// The sitemap with each URL's lastmod set from `dates`, keyed by URL. A URL missing from `dates`
// keeps no lastmod; one already carrying a lastmod has it replaced, never doubled.
export function withLastmod(xml, dates) {
  return xml.replace(/<url>([\s\S]*?)<\/url>/g, (_, inner) => {
    const loc = inner.match(/<loc>\s*([^<\s]+)\s*<\/loc>/)?.[1];
    const stripped = inner.replace(/<lastmod>[^<]*<\/lastmod>/, "");
    if (!loc || !dates[loc]) return `<url>${stripped}</url>`;
    return `<url>${stripped.replace(/(<\/loc>)/, `$1<lastmod>${dates[loc]}</lastmod>`)}</url>`;
  });
}

function main(argv) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const check = argv.includes("--check");
  const git = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8", env: { ...process.env, TZ: "UTC" } }).trim();

  // A shallow clone reports its one commit as the last change to every file, which would make
  // every date the same and every check pass. CI checks out full history for this step.
  if (git("rev-parse", "--is-shallow-repository") === "true") {
    throw new Error("sitemap dates need full history; fetch with depth 0");
  }

  const file = path.join(root, "sitemap.xml");
  const xml = readFileSync(file, "utf8");
  const today = new Date().toISOString().slice(0, 10);
  const dates = {};
  for (const loc of sitemapLocs(xml)) {
    const inputs = pageInputs(loc, readFileSync(path.join(root, pageFile(loc)), "utf8"));
    const dirty = git("status", "--porcelain", "--", ...inputs);
    dates[loc] = dirty ? today : git("log", "-1", "--format=%ad", "--date=format-local:%Y-%m-%d", "--", ...inputs);
  }

  const next = withLastmod(xml, dates);
  if (!check) {
    writeFileSync(file, next);
    console.log(`sitemap.xml dated ${Object.keys(dates).length} URLs`);
    return;
  }
  if (next !== xml) {
    const stale = Object.entries(dates).filter(([loc, d]) => !xml.includes(`<loc>${loc}</loc><lastmod>${d}</lastmod>`));
    console.error(`sitemap.xml has stale dates — run npm run sitemap and commit it:\n${stale.map(([l, d]) => `  ${l} → ${d}`).join("\n")}`);
    process.exit(1);
  }
  console.log(`sitemap.xml dates match git for ${Object.keys(dates).length} URLs`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try { main(process.argv.slice(2)); } catch (err) { console.error(err.message); process.exit(1); }
}
