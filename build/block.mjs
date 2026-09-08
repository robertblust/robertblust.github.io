// The data block, written into the two pages that carry it. Fenced by markers naming the
// commit, the way the token block is fenced by its version: a reader of the HTML can see which
// state of the model the page shows, and the check can find the block without parsing the page.
//
// Two pages carry it and it is one block — the model page draws it, the timeline lists one type
// out of it. Written by one loop so they cannot show different states of the model, and checked
// by the same loop so a page edited by hand goes red for both.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const MARKER = "model data";
const ID = "model-data";
const START = new RegExp(`<!-- ${MARKER} · (?:[0-9a-f]+|none) -->\\n<script type="application\\/json" id="${ID}" data-stage>`);
const END = `</script>\n<!-- /${MARKER} -->`;

export function writeBlock(data, { check = false, root = HERE } = {}) {
  const block = `<!-- ${MARKER} · ${data.commit} -->\n<script type="application/json" id="${ID}" data-stage>${JSON.stringify(data)}${END}`;
  const stale = [];
  for (const dir of ["model", "timeline"]) {
    const rel = `${dir}/index.html`;
    const file = path.join(root, rel);
    const page = fs.readFileSync(file, "utf8");
    const start = page.search(START), end = page.indexOf(END);
    if (start < 0 || end < 0) throw new Error(`${rel} has no data block markers`);
    if (page.slice(start, end + END.length) === block) continue;
    if (check) stale.push(rel);
    else fs.writeFileSync(file, page.slice(0, start) + block + page.slice(end + END.length));
  }
  return stale;
}
