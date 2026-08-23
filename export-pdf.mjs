// Render each deck to a 16:9 PDF fallback, one slide per page.
// Screenshots each slide exactly as shown on screen, then assembles the PNGs into a PDF.
// Both languages: the decks narrate in two, so the printable fallback exists in two.
import { chromium } from "playwright";
import { PDFDocument } from "pdf-lib";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const W = 1280, H = 720;
const root = path.dirname(fileURLToPath(import.meta.url));

const LANGS = ["de", "en"];
const decks = [
  { dir: "talks/mental-model", slug: "mental-model" },
  { dir: "talks/essential-complexity", slug: "essential-complexity" },
];

const browser = await chromium.launch();
for (const deck of decks) {
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
  await page.goto(pathToFileURL(path.join(root, deck.dir, "index.html")).href, { waitUntil: "networkidle" });
  // Hide the controls, not the credit: .name lives inside .chrome, and hiding the whole
  // bar took the byline off every printed page. A transport in a PDF advertises buttons
  // that do nothing; a byline is the one part of that bar a printed page still wants.
  await page.addStyleTag({ content: `.transport,.bar,.notes{display:none!important}\n     /* a still image should not be waiting out a transition it does not want */\n     .slide.active > *{animation:none!important}` });
  const count = await page.evaluate(() => document.querySelectorAll(".slide").length);

  for (const lang of LANGS) {
    // the decks have no keyboard shortcuts any more — click the transport's language
    // toggle. The rule above hides it, so click it through the DOM, not the pointer.
    await page.evaluate(l => document.getElementById(l === "de" ? "langDe" : "langEn").click(), lang);
    await page.waitForTimeout(400);

    const pdf = await PDFDocument.create();
    for (let i = 0; i < count; i++) {
      await page.evaluate(n => {
        const s = Array.from(document.querySelectorAll(".slide"));
        s.forEach((el, k) => el.classList.toggle("active", k === n));
      }, i);
      await page.waitForTimeout(500);        // let the rise animation settle
      const png = await page.screenshot({ type: "png", clip: { x: 0, y: 0, width: W, height: H } });
      const img = await pdf.embedPng(png);
      const p = pdf.addPage([W, H]);
      p.drawImage(img, { x: 0, y: 0, width: W, height: H });
    }
    const out = path.join(root, deck.dir, `${deck.slug}-${lang}.pdf`);
    writeFileSync(out, await pdf.save());
    console.log(`  ✓ ${path.relative(root, out)}  (${count} slides)`);
  }
  await page.close();
}
await browser.close();
