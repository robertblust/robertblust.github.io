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
// needs no server and no browser — it does need `npm ci`, because the machinery below now
// arrives from the package.
//
// The knobs below are the single copy. The machinery that hashes them is not here at all: it
// is `@robertblust/design/cards/recipe`, shared with the two sibling sites, and the exporter
// and the check read their frame and their hide rules from this file rather than holding their
// own. A second copy of a knob is a knob that can be edited without the hash moving, which is
// the one failure this whole mechanism exists to make impossible.
//
// `REPO_ROOT` is derived here and passed in, never derived by the package: this file really
// does sit at the repository root, and the same line inside a dependency would point into
// `node_modules`.
import path from "node:path";
import { fileURLToPath } from "node:url";
import { recipeFor } from "@robertblust/design/cards/recipe";

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
  { dir: "model", ...FRAME, hide: HIDE, titleSlide: false },
  // …and /privacy/ was still borrowing it after that fix. A shared card previews the
  // landing page under the privacy page's title on every LinkedIn or Slack paste.
  { dir: "privacy", ...FRAME, hide: HIDE, titleSlide: false },
  { dir: "talks/mental-model", ...FRAME, hide: HIDE, titleSlide: true },
  { dir: "talks/essential-complexity", ...FRAME, hide: HIDE, titleSlide: true },
];

// Bound to this site's root, so every caller here keeps calling `state(card)` with one
// argument while the shared tests can still pass a throwaway tree as a second.
export const { sources, recipe, stampOf, state, stamp } = recipeFor(REPO_ROOT);
