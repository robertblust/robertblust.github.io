// What a deploy reports to IndexNow is decided here, and both ways of getting it wrong are
// silent: a page left out is never recrawled, and unchanged pages sent on every deploy teach
// the engines to ignore the site. Neither shows up as an error anywhere.
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { changedUrls, findKey, pageUrl, sitemapLocs } from "./indexnow.mjs";

const SITE = "https://x.test";
const LOCS = [`${SITE}/`, `${SITE}/talks/`, `${SITE}/model/`, `${SITE}/timeline/`];

test("the sitemap's URLs are read in order", () => {
  const xml = `<urlset>\n  <url><loc>${SITE}/</loc></url>\n  <url><loc> ${SITE}/talks/ </loc><priority>1</priority></url>\n</urlset>`;
  assert.deepEqual(sitemapLocs(xml), [`${SITE}/`, `${SITE}/talks/`]);
});

test("an index.html is its directory's page, and nothing else is a page", () => {
  assert.equal(pageUrl("index.html", SITE), `${SITE}/`);
  assert.equal(pageUrl("talks/mental-model/index.html", SITE), `${SITE}/talks/mental-model/`);
  assert.equal(pageUrl("stage.css", SITE), null);
  assert.equal(pageUrl("docs/notindex.html", SITE), null);
});

test("a change to shared files alone sends nothing", () => {
  const changed = ["stage.css", "card.js", "verify/check.mjs", "og.png"];
  assert.deepEqual(changedUrls({ changed, locs: LOCS, site: SITE }), []);
});

test("a page outside the sitemap is not sent", () => {
  // Any folder can hold an index.html; only what the sitemap names is a page this site asks
  // to have indexed.
  const changed = ["docs/superpowers/index.html", "talks/index.html"];
  assert.deepEqual(changedUrls({ changed, locs: LOCS, site: SITE }), [`${SITE}/talks/`]);
});

test("model.json changes every page that draws it, and only those", () => {
  const out = changedUrls({
    changed: ["model.json"], locs: LOCS, site: SITE,
    stagePages: [`${SITE}/model/`, `${SITE}/timeline/`],
  });
  assert.deepEqual(out, [`${SITE}/model/`, `${SITE}/timeline/`]);
});

test("each URL is sent once, in sitemap order", () => {
  const out = changedUrls({
    changed: ["timeline/index.html", "model.json", "index.html"], locs: LOCS, site: SITE,
    stagePages: [`${SITE}/timeline/`],
  });
  assert.deepEqual(out, [`${SITE}/`, `${SITE}/timeline/`]);
});

test("the key is the one root file named for its contents", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "indexnow-"));
  const key = "0123456789abcdef0123456789abcdef";
  writeFileSync(path.join(dir, "robots.txt"), "User-agent: *");
  assert.throws(() => findKey(dir), /found 0/);
  writeFileSync(path.join(dir, `${key}.txt`), `${key}\n`);
  assert.equal(findKey(dir), key);
  writeFileSync(path.join(dir, "fedcba9876543210fedcba9876543210.txt"), "something else");
  assert.equal(findKey(dir), key, "a file whose contents are not its name is not a key");
});
