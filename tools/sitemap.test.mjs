// A lastmod that is wrong is worse than none: a crawler that catches the sitemap claiming a date
// the page does not bear stops trusting every date in it. These hold the rewrite and the rule
// for which files date a page.
import test from "node:test";
import assert from "node:assert/strict";
import { pageInputs, withLastmod } from "./sitemap.mjs";

const XML = `<urlset>
  <url><loc>https://x.test/</loc><priority>1.0</priority></url>
  <url><loc>https://x.test/model/</loc></url>
</urlset>
`;

test("each URL gets its date right after its loc", () => {
  const out = withLastmod(XML, { "https://x.test/": "2026-09-01", "https://x.test/model/": "2026-09-02" });
  assert.equal(out, `<urlset>
  <url><loc>https://x.test/</loc><lastmod>2026-09-01</lastmod><priority>1.0</priority></url>
  <url><loc>https://x.test/model/</loc><lastmod>2026-09-02</lastmod></url>
</urlset>
`);
});

test("writing twice changes nothing, and a new date replaces the old one", () => {
  const once = withLastmod(XML, { "https://x.test/": "2026-09-01" });
  assert.equal(withLastmod(once, { "https://x.test/": "2026-09-01" }), once);
  const moved = withLastmod(once, { "https://x.test/": "2026-09-05" });
  assert.equal((moved.match(/<lastmod>/g) || []).length, 1);
  assert.ok(moved.includes("<lastmod>2026-09-05</lastmod>"));
});

test("a page that draws the model is dated by model.json too, and only such a page", () => {
  assert.deepEqual(pageInputs("https://x.test/", "<main>prose</main>"), ["index.html"]);
  assert.deepEqual(pageInputs("https://x.test/model/", '<link href="../model.json" data-stage>'),
    ["model/index.html", "model.json"]);
});
