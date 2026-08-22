# Essential Complexity

A short (10-minute) talk by **Robert Blust** on describing a problem in its *essential complexity* —
no more, no less. The standard stays the same as 15 years ago; what changed is the cost: with AI and
the right meta-model you reach the same clarity with far less friction.

Same approach as the companion talk [mental-model](https://blust.ch/talks/mental-model/).

## View

**Live:** https://blust.ch/talks/essential-complexity/

A self-contained HTML deck (dark theme, bilingual DE/EN).

### Controls
A transport bar along the bottom edge: back to start, previous, play/pause, next,
fullscreen, then a DE/EN toggle and speaker notes. Swipe left or right on touch. Arrow,
space, page and Home/End keys still drive the deck too — for a presenter remote — but
they're not shown anywhere; the buttons are the interface. Play uses the browser's own
voice — there are no recorded clips.

## Contents
- `index.html` – the presentation deck (self-contained except for the comic images)
- `comic-1..6.png` – hand-drawn journey panels used as a side motif
- `export-pdf.mjs` – renders a 16:9 PDF fallback, one page per slide
- `essential-complexity.pdf` – the exported PDF fallback
- `essential-complexity.md` – speaker script / outline

## Build the PDF fallback
```bash
npm install
npx playwright install chromium
npm run pdf        # → essential-complexity.pdf
```

## Serve locally
```bash
npm run serve      # → http://localhost:8000
```
