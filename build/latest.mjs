// The home page's newest post is the blog index's first entry, copied rather than typed. A post
// is published by one edit, to the blog index, and this is what keeps that true: the home page
// is rewritten from the index, and pages:check fails while the two disagree.
import fs from "node:fs";
import path from "node:path";

const START = "<!-- latest:start -->";
const END = "<!-- latest:end -->";

export function writeLatest(_data, { check = false, root } = {}) {
  const blog = fs.readFileSync(path.join(root, "blog", "index.html"), "utf8");
  const m = /<a class="entry" href="([^"]+)">[\s\S]*?<\/a>/.exec(blog);
  if (!m) throw new Error("blog/index.html has no entry to put on the home page");
  const href = /^(https?:)?\/\//.test(m[1]) || m[1].startsWith("/") ? m[1] : `blog/${m[1]}`;
  const entry = m[0].replace(`href="${m[1]}"`, `href="${href}"`);
  const rel = "index.html";
  const file = path.join(root, rel);
  const page = fs.readFileSync(file, "utf8");
  const re = new RegExp(`${START}[\\s\\S]*?${END}`);
  if (!re.test(page)) throw new Error(`${rel} has no ${START} … ${END} block`);
  const next = page.replace(re, () => `${START}\n        ${entry}\n        ${END}`);
  if (next === page) return [];
  if (check) return [rel];
  fs.writeFileSync(file, next);
  return [];
}
