// Render the 1200×630 share cards that link previews use (og:image).
//
// A deck's card is its own title slide and an index card is the page itself, so a preview
// shows what the visitor is about to land on rather than a banner kept in step by hand.
//
// deviceScaleFactor stays 1 so the file is exactly the size the og:image:width tags claim.
// The page is rendered at 16:9 and the middle band taken: both page types lay themselves
// out in vmin, and squeezed straight into 1.9:1 they shrink and leave the frame empty.
//
// `--check` re-derives each card's recipe hash and fails if it no longer matches the
// `og.sha` beside the card. It renders nothing, so CI can run it before anything is
// installed — see "Cards go stale silently" in CLAUDE.md for why it hashes the source
// instead of comparing the pixels.
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const W = 1200, H = 630, RENDER_H = 675, BAND_Y = Math.round((RENDER_H - H) / 2);
const root = path.dirname(fileURLToPath(import.meta.url));

// a share card advertising a progress bar and a play button that do nothing inside a PNG.
// `.bar` is two different things by the same name: a deck's transport bar and the header
// bar on the profile and talks pages. Hiding both is what a card wants, but the overlap is
// accidental — rename either one and the other's rule here stops applying, silently.
const HIDE = `.chrome,.bar,.notes,.langind,.hint{display:none!important}
  /* a still image should not be waiting out a transition it does not want */
  .slide.active > *{animation:none!important}`;

const cards = [
  { dir: ".", titleSlide: false },
  { dir: "talks", titleSlide: false },
  { dir: "talks/mental-model", titleSlide: true },
  { dir: "talks/essential-complexity", titleSlide: true },
];

// Everything the page pulls in from this repository: the fonts it declares, the images it
// shows. A font swap changes every card while no HTML changes at all, so hashing the page
// alone would call a card current that no longer looks like its page.
const REF = /(?:src|href)="([^"#?]+)"|url\((['"]?)([^)'"]+)\2\)/g;

function sources(dir) {
  const page = path.join(dir, "index.html");
  const html = fs.readFileSync(path.join(root, page), "utf8");
  const found = new Set([page]);
  for (const m of html.matchAll(REF)) {
    const ref = (m[1] ?? m[3] ?? "").split(/[?#]/)[0];
    // absolute, inline and protocol-relative references leave this repository, and the
    // card's own og:image is one of them — hashing it would key the card on itself.
    if (!ref || /^(https?:)?\/\/|^data:|^mailto:/.test(ref)) continue;
    const rel = path.normalize(path.join(dir, ref));
    if (rel.startsWith("..")) continue;
    if (fs.existsSync(path.join(root, rel)) && fs.statSync(path.join(root, rel)).isFile()) found.add(rel);
  }
  return [...found].sort();
}

// The recipe, not the rendering: the sources plus the frame and the rules the exporter
// applies to them. Two machines rasterise the same text differently, so a card compared by
// its pixels reports the machine it was made on; compared by its recipe it reports whether
// anything it shows has moved.
function recipe(c) {
  const h = crypto.createHash("sha256");
  h.update(`${W}x${H}@${RENDER_H} titleSlide=${c.titleSlide}\n${HIDE}\n`);
  for (const rel of sources(c.dir)) {
    h.update(rel + "\0");
    h.update(fs.readFileSync(path.join(root, rel)));
  }
  return h.digest("hex");
}

const stampOf = (dir) => path.join(root, dir, "og.sha");

if (process.argv.includes("--check")) {
  let stale = 0;
  for (const c of cards) {
    const card = path.join(c.dir, "og.png");
    const stamp = stampOf(c.dir);
    const want = recipe(c);
    const have = fs.existsSync(stamp) ? fs.readFileSync(stamp, "utf8").trim() : "";
    if (have === want) {
      console.log("  ✓ " + card);
    } else {
      stale++;
      console.log(`  ✗ ${card}  ${have ? "the page has changed since it was rendered" : "never stamped"}`);
    }
  }
  if (stale) {
    console.log(`\n  ${stale} card(s) no longer show their page — run: npm run og`);
    process.exit(1);
  }
  console.log("\n  every card matches the page it renders");
} else {
  const { chromium } = await import("playwright");
  const browser = await chromium.launch();
  for (const c of cards) {
    const page = await browser.newPage({ viewport: { width: W, height: RENDER_H } });
    await page.goto(pathToFileURL(path.join(root, c.dir, "index.html")).href, { waitUntil: "networkidle" });
    await page.addStyleTag({ content: HIDE });
    if (c.titleSlide) {
      await page.evaluate(() => {
        const s = Array.from(document.querySelectorAll(".slide"));
        s.forEach((el, k) => el.classList.toggle("active", k === 0));
      });
    }
    await page.waitForTimeout(900);          // let the rise animation settle
    const out = path.join(root, c.dir, "og.png");
    await page.screenshot({ path: out, clip: { x: 0, y: BAND_Y, width: W, height: H } });
    // stamped after the screenshot, so an exporter that dies half way leaves the card
    // reported stale rather than reported current on a file it never wrote.
    fs.writeFileSync(stampOf(c.dir), recipe(c) + "\n");
    console.log("  ✓ " + path.relative(root, out));
    await page.close();
  }
  await browser.close();
}
