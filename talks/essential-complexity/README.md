# Essential Complexity

A short (10-minute) talk by **Robert Blust** on describing a problem in its *essential complexity* —
no more, no less. The standard stays the same as 15 years ago; what changed is the cost: with AI and
the right meta-model you reach the same clarity with far less friction.

Same approach as the companion talk [mental-model](https://github.com/robertblust/mental-model).

## View

**Live:** https://robertblust.github.io/essential-complexity/

A self-contained HTML deck (dark theme, bilingual DE/EN).

### Controls
- **← →** – navigate
- **N** – speaker notes on/off
- **L** – switch language (DE/EN)
- **F** – fullscreen

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
