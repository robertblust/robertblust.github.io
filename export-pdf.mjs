// Render each deck to a 16:9 PDF fallback, one slide per page.
// Screenshots each slide exactly as shown on screen, then assembles the PNGs into a PDF.
// German is the printed language; the decks themselves open in English.
import { chromium } from "playwright";
import { PDFDocument } from "pdf-lib";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const W = 1280, H = 720;
const root = path.dirname(fileURLToPath(import.meta.url));

const decks = [
  { dir: "talks/mental-model", out: "mental-model.pdf" },
  { dir: "talks/essential-complexity", out: "essential-complexity.pdf" },
];

const browser = await chromium.launch();
for (const deck of decks) {
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
  await page.goto(pathToFileURL(path.join(root, deck.dir, "index.html")).href, { waitUntil: "networkidle" });
  // the decks have no keyboard shortcuts any more — click the transport's language toggle
  await page.click("#langDe");
  await page.waitForTimeout(300);
  await page.addStyleTag({ content: `.chrome,.bar,.notes{display:none!important}\n     /* a still image should not be waiting out a transition it does not want */\n     .slide.active > *{animation:none!important}` });

  const count = await page.evaluate(() => document.querySelectorAll(".slide").length);
  const pdf = await PDFDocument.create();
  for (let i = 0; i < count; i++) {
    await page.evaluate(n => {
      const s = Array.from(document.querySelectorAll(".slide"));
      s.forEach((el, k) => el.classList.toggle("active", k === n));
    }, i);
    await page.waitForTimeout(700);        // let the rise animation settle
    const png = await page.screenshot({ type: "png", clip: { x: 0, y: 0, width: W, height: H } });
    const img = await pdf.embedPng(png);
    const p = pdf.addPage([W, H]);
    p.drawImage(img, { x: 0, y: 0, width: W, height: H });
  }
  const out = path.join(root, deck.dir, deck.out);
  writeFileSync(out, await pdf.save());
  console.log("  ✓ " + path.relative(root, out));
  await page.close();
}
await browser.close();
