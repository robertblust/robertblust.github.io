# The Mental Model

A short (10-minute) talk by **Robert Blust** on the **Mental Model** — a structured,
machine-readable knowledge base that acts as the *brain* of a company: one source of truth for
vision, strategy, processes, roles, KPIs, rules and decisions, serving both **human company
management** and **agentic AI**.

Same approach as the companion talk [essential-complexity](https://github.com/robertblust/essential-complexity).

## View

**Live:** https://robertblust.github.io/mental-model/

A self-contained HTML deck (dark theme, bilingual DE/EN).

### Controls
- **← →** – navigate
- **N** – speaker notes on/off
- **L** – switch language (DE/EN)
- **F** – fullscreen

## Contents
- `index.html` – the presentation deck (fully self-contained; inline SVG diagrams, no external assets)
- `export-pdf.mjs` – renders a 16:9 PDF fallback, one page per slide
- `mental-model.pdf` – the exported PDF fallback

## Build the PDF fallback
```bash
npm install
npx playwright install chromium
npm run pdf        # → mental-model.pdf
```

## Serve locally
```bash
npm run serve      # → http://localhost:8000
```
