# A light theme, switchable — one source, three sites, twenty pages

## The request

Some readers prefer a light design. The three sites get a light/dark switch in the same style as
the language toggle, with the usual sun/moon icons. Dark stays the default. The choice is
remembered in `localStorage` and carried across the family domains on links, exactly as the
language already is.

## What is true today, measured

Taken 2026-09-01 across `main` of all three sites.

| Fact | Value |
|---|---|
| Pages in the family | 20 — 16 prose, 4 decks |
| Design tokens in the shared block | 11, in `blocks/tokens.css`, fence `design tokens` v4 |
| Deck-only tokens, declared per page outside the block | 3 — `--warn`, `--slab`, `--lcd` |
| **Literal colours outside token declarations** | **172** — 37 on prose pages, **135 on the four decks** |
| Where those literals sit | 126 in CSS rules, 46 in inline SVG attributes |
| Language storage key | `rb-lang`, from `langKey` in each site's `design.config.json` |

A light theme means every colour a page paints has to come from a token that can be swapped. The
palette is eleven values; the work is the 172.

## The decision that shaped everything else: the ramp inverts

The token block states its own grammar: *"Brightness is confidence"* — one hue at four stops,
`--c-weak` → `--c-mid` → `--c-firm`, plus `--c-flag` for a reversal.

Keeping those four values and swapping only the surfaces **fails**, and not marginally. Measured
as WCAG 2.1 contrast against a light ground:

| token | its stated job | on dark today | unchanged, on light |
|---|---|---|---|
| `--c-mid` | anything interactive — links, controls | 7.48:1 AAA | **2.47:1 FAIL** |
| `--c-firm` | the resolved thing — the thesis, the current page | 12.41:1 AAA | **1.49:1 FAIL** |
| `--c-flag` | a reversal; at most one per page | 8.62:1 AAA | **2.14:1 FAIL** |

`--c-mid` paints every link on every page. So the ramp is re-picked, and the grammar's axis flips
with it: **on dark, brightness is confidence; on light, depth is.** The candidate pales, the
resolved thing deepens. The sentence in the block's comment changes; the idea behind it does not.

## Decisions taken

Settled 2026-09-01. Recorded so they are not re-opened by accident.

**1. Scope is all twenty pages, decks included.** Considered and rejected: prose-only, which
would have cut the work from 172 literals to 37. The decks are the artefact people are sent a
link to, and a dark-only deck inside an otherwise switchable family reads as an oversight.

**2. The palette is Paper.** A warm ground, following the ink already being warm (`#EFEDE8`).
Chosen from three candidates that all cleared AA on every text stop; the choice between them was
character, not correctness.

```
                 dark (today)      light (Paper)
  --ground       #0C0E13           #FAF9F5
  --raise        #171A21           #F2F0EA
  --rule         #232833           #DFDCD3
  --ink          #EFEDE8           #16181D
  --dim          #8A8B86           #5F6058
  --c-weak       #3E5878           #8FA6C2
  --c-mid        #7FA3D8           #3A6DA6
  --c-firm       #B8D0FF           #1C3E68
  --c-flag       #D9A44F           #8A5A12
  --c-path       #B8D0FF           #1C3E68     (carries --c-firm's value, as today)
  --sky          radial-gradient(120% 60% at 50% -10%, var(--raise) 0%, var(--ground) 60%)
```

Measured on the light ground: ink 16.86:1, dim 6.04:1, `--c-mid` 5.09:1, `--c-firm` 10.28:1,
`--c-flag` 5.61:1. Every text stop AA or better. The ramp is monotonic — darker is firmer.

**3. The deck is a Device: the readout stays dark.** The transport describes itself as a physical
object — *"the slab it is milled from"*, *"the recessed window the track number sits in"*. In
light, the slab becomes pale milled metal and `--lcd` **does not flip**, because a real readout is
dark whatever the body is made of. This is the one token that is deliberately theme-invariant, and
saying so is the point: it is a rule someone can apply again without asking.

Considered and rejected: inverting the LCD too (a pale readout stops reading as a display and
becomes a label), and keeping the slide canvas dark inside light chrome (cheapest by far, but it
reads as unfinished rather than deliberate).

**4. First visit is always dark. `prefers-color-scheme` is not read.** Dark is the design;
light is something a visitor opts into. A visitor with an OS set to light still lands on dark.
Considered and rejected: following the OS when nothing is stored — more conventional, and kinder
to people who set light for glare or low vision, but it means most visitors never see the design
that was built and the share cards stop matching the page.

**5. Share cards stay dark, pinned explicitly.** The 20 committed `og.png` files keep the brand
look wherever they are pasted, and stay byte-identical to what is committed today — no re-render.
The renderer sets the theme deliberately rather than inheriting the default, so a later change to
the default cannot silently restyle every card. A check fails if a card renders light.

**6. `--c-weak` stays below 3:1 in both themes, declared non-text-only.** It is 2.64:1 on dark
today and 2.37:1 on light. Its job is "a candidate: considered, not accepted", and darkening it
until it clears the UI threshold stops it reading as tentative. This is a decision, not an
oversight: it must never carry text, a border or an outline on its own.

**7. Theme is its own fence, not an extension of `language`.** Both decorate the same anchor at
click time and compose correctly — the second reads the href the first rewrote, producing
`?lang=de&theme=light`. Keeping them separate avoids putting `theme` into the language block's
declared contract, which already requires the page to provide `lang` in scope.

## How it works

**Storage.** `themeStored()` and `themeRemember(v)` over `localStorage`, both wrapped in
try/catch: `file://` is an opaque origin in some browsers and throws, and a deck that cannot read
a preference must still open — in dark, its default. The key is a per-site parameter `themeKey` in
`design.config.json`, mirroring the existing `langKey`. Value is `rb-theme` on all three sites
today; the parameter exists so the block has no site's key frozen into it.

**Carrying it across domains.** Each origin keeps its own `localStorage`, so a visitor reading in
light who follows a link to a sibling site would arrive in dark. The theme rides along: a link to
a family domain gets `?theme=` at the moment it is clicked — on `mousedown` as well as `click`, so
a middle-click or cmd-click into a new tab carries it too — and a page arriving with one adopts
it, stores it, and takes it back out of the address bar with `replaceState`. Decorated at click
time, never at load, for the same reason the language is: no link in the served markup carries the
param, so nothing crawlable, copyable or bookmarkable does either.

**Applying it before first paint.** The theme must be on `<html>` before the browser paints, or a
light-preferring visitor sees a dark flash on every page. A small inline classic script sits in
`<head>` **above** the `<style>` block; scripts block parsing, so `:root[data-theme="light"]` is
already matching when the stylesheet is read. This has no equivalent in the language block —
language changing text after paint is tolerable, a whole palette repainting is not. It must be a
classic inline script: ES modules are deferred, and are blocked under `file://` anyway.

**The control.** A `.seg` with two buttons carrying inline sun and moon SVG, `aria-pressed`
mirroring the `DE|EN` control it sits beside. In the header on prose pages; in the transport bar
on decks. Inline SVG, because no external assets are permitted anywhere.

## What has to change

**In the package**
- `blocks/tokens.css` — add the `:root[data-theme="light"]` block. Fence `design tokens` → v5.
- `blocks/theme.js` — new fence: storage, URL carry, first-paint application, control wiring.
- `blocks/header.css` — the theme control's rules alongside `.seg`.
- `blocks/deck-transport.css` — the transport's literals become tokens; light values added.
- `verify/pages.mjs` — `storageKeys` must also exercise the theme control, or the theme key is
  written and never checked. New `contrast` and `noFlash` checks.
- `lib/fences.mjs` — the new fence, and `themeKey` as a declared parameter.

**In each site**
- `design.config.json` gains `themeKey`.
- `/privacy/` names `rb-theme`, or `storageKeys` fails — correctly.
- The header (prose) and transport (deck) gain the control.
- Every literal colour becomes a token: 37 on prose, 135 on decks, including 46 inline SVG
  attributes which become `var(--…)` — SVG in HTML resolves custom properties.
- The card renderer pins dark.

## Success criteria

1. Every page in the family switches theme, and the choice survives a reload.
2. A visitor switching to light on blust.ch and following a link to companygraph.io **arrives in
   light**, and the address bar is clean when they get there.
3. **No flash**: with light stored, the computed background at first paint is the light ground —
   asserted, not eyeballed.
4. Every text token clears AA against its ground **in both themes**, asserted by a check that
   fails on a bad palette edit.
5. `storageKeys` exercises the theme control, and `/privacy/` names every key written.
6. The 20 committed `og.png` files are **unchanged** by this work, and a check fails if a card
   renders light.
7. `npm run design:check` reaches a fixed point on all three sites.
8. Every deck still opens from a `file://` URL with no network, in both themes.
9. Zero literal colours remain outside token declarations on any of the 20 pages — the same sweep
   that measured 172 reports 0.

## Delivery

Two plans, each shipping on its own:

- **Plan A — the mechanism and the prose pages.** The token block's light half, the `theme`
  fence, the control in the header, 37 literals tokenised, and all the checks. 16 pages.
- **Plan B — the decks.** 135 literals tokenised, the transport's Device treatment, the control in
  the transport bar. 4 pages.

Plan A must land first: it defines the fence and the tokens Plan B consumes.
