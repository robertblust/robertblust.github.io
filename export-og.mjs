// Render the 1200×630 share cards that link previews use (og:image).
//
// A deck's card is its own title slide and an index card is the page itself, so a preview
// shows what the visitor is about to land on rather than a banner kept in step by hand.
//
// What each card is made of — which pages, which frame, which hide rules — lives in
// `og-recipe.mjs`, because `npm run og:check` has to agree with this file about it exactly.
// A knob kept here as well would be a knob that can be edited without the check noticing.
import path from "node:path";
import { chromium } from "playwright";
import { pathToFileURL } from "node:url";

import { cards, REPO_ROOT, stamp } from "./og-recipe.mjs";

const browser = await chromium.launch();
for (const c of cards) {
  const page = await browser.newPage({
    viewport: { width: c.width, height: c.renderHeight },
    deviceScaleFactor: 1,                      // so the file is the size og:image:width claims
  });
  // Spec decision 5: cards are always dark, and pinned rather than inherited — a later change
  // to the default must not silently restyle twenty committed PNGs. `removeItem` clears the
  // key, which *inherits* whatever the boot script's default happens to be rather than pinning
  // anything — it only ever looked pinned because the default was already dark. `setItem` is
  // what actually pins it.
  await page.addInitScript(() => { try { localStorage.setItem("rb-theme", "dark"); } catch (e) {} });
  await page.goto(pathToFileURL(path.join(REPO_ROOT, c.dir, "index.html")).href, { waitUntil: "networkidle" });
  // a card rendered in the fallback face is exactly the silent failure the design notes
  // describe: nothing errors, and the type is simply not the type the page declares.
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({ content: c.hide });
  if (c.titleSlide) {
    await page.evaluate(() => {
      const s = Array.from(document.querySelectorAll(".slide"));
      s.forEach((el, k) => el.classList.toggle("active", k === 0));
    });
  }
  await page.waitForTimeout(900);              // let the rise animation settle
  const out = path.join(REPO_ROOT, c.dir, "og.png");
  await page.screenshot({ path: out, clip: { x: 0, y: c.clipY, width: c.width, height: c.height } });
  stamp(c);
  console.log("  ✓ " + path.relative(REPO_ROOT, out) + " 1200×630");
  await page.close();
}
await browser.close();
