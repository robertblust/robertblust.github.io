// Tells the IndexNow engines which pages a deploy changed.
//
// Bing, Yandex, Seznam, Naver and Yep share one endpoint: a POST naming the host, a key and a
// list of URLs, which they trust because the same key is served from this site's root as
// `<key>.txt`. The key is public by design, so it is committed rather than kept as a secret.
// Google does not take part; the sitemap stays the way it finds pages.
//
// Only pages that changed are sent. An engine that is told about unchanged pages on every
// deploy learns to ignore the site, so a push that touches no page sends nothing at all.
//
//   node tools/indexnow.mjs <base> <head> [--dry-run]
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ENDPOINT = "https://api.indexnow.org/indexnow";

// The URLs a sitemap names, in order.
export function sitemapLocs(xml) {
  return [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]);
}

// The page a file is, or null. Every page on this site is a directory's index.html.
export function pageUrl(file, site) {
  if (file !== "index.html" && !file.endsWith("/index.html")) return null;
  const dir = path.posix.dirname(file);
  return dir === "." ? `${site}/` : `${site}/${dir}/`;
}

// Which sitemap URLs a set of changed files touches. A page changes when its own HTML does,
// and a page that draws the model also changes when `model.json` does: its markup names the
// file and never varies, so the HTML diff alone would never report it.
export function changedUrls({ changed, locs, site, stagePages = [] }) {
  const known = new Set(locs);
  const urls = new Set();
  for (const file of changed) {
    const url = pageUrl(file, site);
    if (url && known.has(url)) urls.add(url);
    if (file === "model.json") for (const page of stagePages) if (known.has(page)) urls.add(page);
  }
  return locs.filter((loc) => urls.has(loc));
}

// The key is the one root file named for its own contents.
export function findKey(root) {
  const keys = readdirSync(root).filter((name) => {
    const m = name.match(/^([0-9a-f]{32})\.txt$/);
    return m && readFileSync(path.join(root, name), "utf8").trim() === m[1];
  });
  if (keys.length !== 1) throw new Error(`expected one IndexNow key file at the root, found ${keys.length}`);
  return keys[0].slice(0, -4);
}

async function main(argv) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const [base, head] = argv.filter((a) => !a.startsWith("--"));
  const dryRun = argv.includes("--dry-run");
  if (!base || !head) throw new Error("usage: node tools/indexnow.mjs <base> <head> [--dry-run]");

  const git = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8" });
  const host = readFileSync(path.join(root, "CNAME"), "utf8").trim();
  const site = `https://${host}`;
  const key = findKey(root);

  // A page removed by this deploy is still worth reporting, so the sitemap is read on both sides.
  const sitemapAt = (rev) => { try { return git("show", `${rev}:sitemap.xml`); } catch { return ""; } };
  const locs = [...new Set([...sitemapLocs(sitemapAt(base)), ...sitemapLocs(sitemapAt(head))])];
  const changed = git("diff", "--name-only", base, head).split("\n").filter(Boolean);
  const stagePages = locs.filter((loc) => {
    const file = path.posix.join(new URL(loc).pathname.slice(1), "index.html");
    try { return git("show", `${head}:${file}`).includes("data-stage"); } catch { return false; }
  });

  const urlList = changedUrls({ changed, locs, site, stagePages });
  if (!urlList.length) {
    console.log(`No page changed between ${base} and ${head}; nothing sent.`);
    return;
  }
  console.log(`${urlList.length} changed:\n${urlList.map((u) => `  ${u}`).join("\n")}`);
  if (dryRun) return;

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host, key, keyLocation: `${site}/${key}.txt`, urlList }),
  });
  // 200 is accepted, 202 is accepted while the key is still being checked. Anything else is
  // a refusal worth reading: 403 a key the engine could not fetch, 422 a URL not on this host.
  if (res.status !== 200 && res.status !== 202) {
    throw new Error(`IndexNow answered ${res.status}: ${await res.text()}`);
  }
  console.log(`IndexNow answered ${res.status}.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
