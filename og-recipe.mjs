// What goes into each 1200×630 share card, and how to tell whether a card still shows it.
//
// `og.png` is not a banner someone drew: it is the page itself, rendered — an index card is
// the page, a deck's card is its title slide. The cost of that is a copy that has to be
// re-rendered whenever the page moves, and nothing about a stale card looks wrong: it
// advertises the site as it read some commits ago while every check passes. `npm run og:check`
// is what notices; this module is what it and the exporter agree on.
//
// The comparison is the recipe, never the pixels. Two machines rasterise the same text
// differently, so a card compared by its bytes reports which machine rendered it. Re-deriving
// a hash of what went *into* the card needs no browser and no server, which is why the check
// can run in CI before `npm ci`.
//
// The knobs below are the single copy. The exporter reads its frame and its hide rules from
// here rather than holding its own: a second copy is a knob that can be edited without the
// hash moving, which is the one failure this whole mechanism exists to make impossible.
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const REPO_ROOT = path.dirname(fileURLToPath(import.meta.url));

// A share card should not advertise a progress bar and a play button that do nothing inside a
// PNG. `.bar` is two different things by the same name — a deck's transport bar and the header
// bar on the profile and talks pages — and hiding both is what a card wants, but the overlap is
// accidental: rename either one and the other's rule here stops applying, silently.
const HIDE = `.chrome,.bar,.notes,.langind,.hint{display:none!important}
  /* a still image should not be waiting out a transition it does not want */
  .slide.active > *{animation:none!important}`;

// Rendered at 16:9 and the middle band taken: both page types lay themselves out against the
// viewport's shorter side, so squeezed straight into 1.9:1 they shrink and leave the frame
// half empty. deviceScaleFactor stays 1 so each file is exactly the size its og:image:width
// tags claim.
const FRAME = { width: 1200, height: 630, renderHeight: 675, clipY: Math.round((675 - 630) / 2) };

export const cards = [
  { dir: ".", ...FRAME, hide: HIDE, titleSlide: false },
  { dir: "talks", ...FRAME, hide: HIDE, titleSlide: false },
  // The ideas page advertised the landing page's card until 2026-08-25: it was the one
  // page with a share link and no picture of its own, which is exactly what this list exists
  // to prevent.
  { dir: "ideas", ...FRAME, hide: HIDE, titleSlide: false },
  { dir: "principles", ...FRAME, hide: HIDE, titleSlide: false },
  // …and /privacy/ was still borrowing it after that fix. A shared card previews the
  // landing page under the privacy page's title on every LinkedIn or Slack paste.
  { dir: "privacy", ...FRAME, hide: HIDE, titleSlide: false },
  { dir: "talks/mental-model", ...FRAME, hide: HIDE, titleSlide: true },
  { dir: "talks/essential-complexity", ...FRAME, hide: HIDE, titleSlide: true },
];

// Everything the page pulls in from this repository: the fonts it declares, the images it
// shows. A font swap changes every card while no HTML changes at all, so hashing the page
// alone would call a card current that no longer looks like its page.
//
// Quoted spans are consumed whole, so a `>` inside an attribute value cannot end a tag early
// and drop the references after it — the decks keep prose in `data-notes`, where that
// character is ordinary. The attribute pattern admits `?` and `#` so the split below can strip
// them: excluding them from the character class instead means a reference carrying either
// fails to match at all and drops out of the recipe silently, which is under-reporting.
const TAG = /<([a-zA-Z][\w-]*)((?:"[^"]*"|'[^']*'|[^>"'])*)>/g;
const ATTR = /(?:src|href)="([^"]+)"/g;
const CSSURL = /url\((['"]?)([^)'"]+)\1\)/g;

export function sources(dir, root = REPO_ROOT) {
  const page = path.join(dir, "index.html");
  const html = fs.readFileSync(path.join(root, page), "utf8");
  const found = new Set([page]);
  const refs = [];
  for (const [, tag, attrs] of html.matchAll(TAG)) {
    // An `<a>` names somewhere else to go, not something to draw. The talks index is why this
    // exception exists: it links four multi-megabyte PDFs of the two talks, so hashing link
    // targets reported that card stale on every `npm run pdf`, over a page that had not moved
    // a pixel.
    if (tag.toLowerCase() === "a") continue;
    for (const m of attrs.matchAll(ATTR)) refs.push(m[1]);
  }
  for (const m of html.matchAll(CSSURL)) refs.push(m[2]);
  for (const raw of refs) {
    const ref = raw.split(/[?#]/)[0];
    // absolute, inline and protocol-relative references leave this repository, and the card's
    // own og:image is one of them — hashing it would key the card on itself.
    if (!ref || /^(https?:)?\/\/|^data:|^mailto:/.test(ref)) continue;
    const rel = path.normalize(path.join(dir, ref));
    if (rel.startsWith("..")) continue;
    const abs = path.join(root, rel);
    if (fs.existsSync(abs) && fs.statSync(abs).isFile()) found.add(rel);
  }
  return [...found].sort();
}

// Key order in a card literal is not a change to the card, and a knob added to a card later is.
// Sorting the keys and hashing all of them means a new knob enters the recipe by existing,
// rather than by someone remembering to list it here as well.
const canonical = (card) =>
  JSON.stringify(Object.fromEntries(Object.entries(card).sort(([a], [b]) => (a < b ? -1 : 1))));

export function recipe(card, root = REPO_ROOT) {
  const h = crypto.createHash("sha256");
  h.update("og-recipe/1\n" + canonical(card) + "\n");
  for (const rel of sources(card.dir, root)) {
    h.update(rel + "\0");
    h.update(fs.readFileSync(path.join(root, rel)));
  }
  return h.digest("hex");
}

export const stampOf = (dir, root = REPO_ROOT) => path.join(root, dir, "og.sha");

export function state(card, root = REPO_ROOT) {
  const stamp = stampOf(card.dir, root);
  const want = recipe(card, root);
  const have = fs.existsSync(stamp) ? fs.readFileSync(stamp, "utf8").trim() : "";
  return {
    dir: card.dir,
    card: path.join(card.dir, "og.png"),
    want,
    have,
    state: !have ? "unstamped" : have === want ? "current" : "stale",
  };
}

// Written after the screenshot, so an exporter that dies half way leaves its card reported
// stale rather than reported current on a file it never wrote.
export function stamp(card, root = REPO_ROOT) {
  fs.writeFileSync(stampOf(card.dir, root), recipe(card, root) + "\n");
}
