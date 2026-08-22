// Render the 1200×630 share cards that link previews use (og:image).
//
// A deck's card is its own title slide and an index card is the page itself, so a preview
// shows what the visitor is about to land on rather than a banner kept in step by hand.
//
// deviceScaleFactor stays 1 so the file is exactly the size the og:image:width tags claim.
// The page is rendered at 16:9 and the middle band taken: both page types lay themselves
// out in vmin, and squeezed straight into 1.9:1 they shrink and leave the frame empty.
import { chromium } from "playwright";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const W = 1200, H = 630, RENDER_H = 675, BAND_Y = Math.round((RENDER_H - H) / 2);
const root = path.dirname(fileURLToPath(import.meta.url));

// a share card advertising a progress bar and a play button that do nothing inside a PNG
const HIDE = `.chrome,.bar,.notes,.langind,.hint{display:none!important}
  /* a still image should not be waiting out a transition it does not want */
  .slide.active > *{animation:none!important}`;

const cards = [
  { dir: ".", titleSlide: false },
  { dir: "talks", titleSlide: false },
  { dir: "talks/mental-model", titleSlide: true },
  { dir: "talks/essential-complexity", titleSlide: true },
];

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
  console.log("  ✓ " + path.relative(root, out));
  await page.close();
}
await browser.close();
