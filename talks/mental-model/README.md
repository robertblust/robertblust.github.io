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
they're not shown anywhere; the buttons are the interface. Play reads the talk aloud from
recorded clips in `audio/`, in whichever language is selected, and falls back to the
browser's own voice if a clip is missing.

## Contents
- `index.html` – the presentation deck (fully self-contained; inline SVG diagrams, no external assets)
- `mental-model.pdf` – the exported PDF fallback

The PDF and share-card exporters (`export-pdf.mjs`, `export-og.mjs`) live at the
repository root and build both decks; there is no per-deck copy.

## Build the PDF fallback
Run from the repository root:
```bash
npm install
npx playwright install chromium
npm run pdf        # → talks/mental-model/mental-model.pdf and talks/essential-complexity/essential-complexity.pdf
```

## Serve locally
From the repository root:
```bash
npm run serve      # → http://localhost:8000/talks/mental-model/
```
