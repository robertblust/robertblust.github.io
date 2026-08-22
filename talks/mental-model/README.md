# The Mental Model

A short (10-minute) talk by **Robert Blust** on the **Mental Model** — a structured,
machine-readable knowledge base that acts as the *brain* of a company: one source of truth for
vision, strategy, processes, roles, KPIs, rules and decisions, serving both **human company
management** and **agentic AI**.

Same approach as the companion talk [essential-complexity](https://blust.ch/talks/essential-complexity/).

## View

**Live:** https://blust.ch/talks/mental-model/

A self-contained HTML deck (dark theme, bilingual DE/EN).

### Controls
A transport bar along the bottom edge: back to start, previous, play/pause, next,
fullscreen, then a DE/EN toggle and speaker notes. Swipe left or right on touch. Arrow,
space, page and Home/End keys still drive the deck too — for a presenter remote — but
they're not shown anywhere; the buttons are the interface. Play uses the browser's own
voice — there are no recorded clips.

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
