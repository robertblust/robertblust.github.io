# One question answered Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The blog's second post, `/blog/one-question-answered/`, answering in writing the ideas page's two questions, linked from `/ideas/`, first on `/blog/` and therefore the home page's newest post, in English and German.

**Architecture:** A hand-written page on the first post's pattern (`blog/deciding-well-solved/index.html` is the template: header, title contract, tagline, sections, a Rests on section, footer, scripts). It joins the site's page list in `verify/check.mjs`, the card list in `og-recipe.mjs`, the JSON-LD page list in `build/jsonld.mjs` and the sitemap. The blog index takes its row first, and `npm run pages` copies that row onto the home page through `build/latest.mjs`. No design release; the model entry follows once the page is live.

**Tech Stack:** static HTML, the site's `npm run pages | og | sitemap | verify` and its `:check` and `test:` scripts, Playwright inside `verify`, the vendored conventions roles for German, the meta-model's checks in mental-model.

**Spec:** `docs/superpowers/specs/2026-09-30-blog-one-question-answered-design.md`

## Global Constraints

- Work in the worktree `~/git/robertblust/robertblust.github.io-one-question-answered`, branch `one-question-answered`; the clone stays on `main`. `export PATH=/opt/homebrew/bin:$PATH` before any `node`, `npm` or `gh`.
- Every commit is authored by the seat whose work it is and carries the trailers, with the body written through `git commit -F -` from a heredoc, never `-m`: prose in English `--author "Writer <writer@blust.ch>"` with `Track: Prose`; German `--author "Translator <translator@blust.ch>"` with `Track: Prose`; code, checks, plumbing, generated files `--author "Implementer <implementer@blust.ch>"` with `Track: Code`. All with `Process: Delivery` and `Phase: Implement`, then `Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>`, no blank line between the trailers. After each commit, `git log -1 --format='[%s] %an'` shows the subject alone and the seat.
- Nothing is merged, tagged or released without Rob's explicit word for that step. A task that ends at a pull request stops there.
- The address is `/blog/one-question-answered/`. The title is light “One question answered.” and bold “One still *open*.”; German light «Eine Frage beantwortet.» and bold «Eine noch *offen*.».
- The tagline is exactly: “On the ideas page I asked two questions of my two ideas. Fifteen weeks later, the first has an answer with a number. The second has a test, and the test has not been passed.”
- The post names no one who took part in the workshop of Sep 29, 2026, says neither where it took place nor “colleagues”, and calls its thirty and ten minutes the author's own count.
- The 434 hours are always “about 434 hours” and called an estimate from the days git shows work, linked to `../../talks/deciding-well/cost/`.
- No customer, no user outside the instances, no revenue, no price, rate or proposal beyond the billing pages' own words; the graph-database objective is a target, never shipped; no salary; no employer, school or company from the job search.
- The prose register of `conventions/WRITING.md`: en-US, sentence case, spaced em-dash, no serial comma, no adjective that sells; the German is Swiss Standard German, reader Sie, ss, guillemets, spaced en-dash.
- Never edit `page.css`, `tokens.css`, `chat.js` or any fenced copy: `npm run design` owns them.
- Local servers: pick a free port (`lsof -nP -iTCP:<port> -sTCP:LISTEN` shows nothing), serve with `python3 -m http.server <port>`, keep its PID, stop only that PID; `:8000` may be someone else's. Run verify as `BASE=http://localhost:<port> npm run verify`.

## Review Focus

1. **The home page's newest post.** `build/latest.mjs` copies the blog index's first `a.entry` onto `index.html`. Putting the new row first moves the home page too, and `pages:check` fails until `npm run pages` has rewritten it. Pinned in Task 2 by running `npm run pages` then `pages:check`, and by `verify`'s `/` entry.
2. **The `/blog/` checks that name the first post only.** Its `contains` and `sameTab` list the first post alone; the new row must be added to both, or the index check misses a broken link. Pinned in Task 2.
3. **The post before its German exists.** A page without `data-de` passes as long as its verify entry has no `translates`; the entry gains `translates` only in Task 4, when the German is in.
4. **A new page's card, sitemap and JSON-LD.** `og:check` and `sitemap:check` fail on a page in the recipe or the site but not the other, and `build/jsonld.mjs` fails on a page that describes the person without being in `PAGES`. Pinned in Task 1 by running all three.
5. **Links out of the post in the wrong window.** `noNewTab` refuses `target="_blank"` on the site's own links, and the external links to companygraph.io and guestgraph.io are plain links like the first post's. Pinned by the post's verify entry in Task 1.

---

### Task 1: The post in English, and its plumbing

**Files:**

- Create: `blog/one-question-answered/index.html` (from `blog/deciding-well-solved/index.html`)
- Modify: `verify/check.mjs` (a new entry after `/blog/deciding-well-solved/`), `og-recipe.mjs` (a card after `blog/deciding-well-solved`), `build/jsonld.mjs` (`PAGES`)
- Generated: `blog/one-question-answered/og.png`, `blog/one-question-answered/og.sha`, `sitemap.xml`

**Interfaces:**

- Consumes: the first post's page as the template; the spec's sections and sources table; `communication/posts/two-ideas-validated/wip/story.md` for the argument.
- Produces: the page at `/blog/one-question-answered/` with `<h1 id="p1">` holding the title contract and `<p class="tagline" id="p2">` holding the tagline, ids `p3` onward on every later translatable element, as the first post numbers them. Task 2 reads the title and tagline from it; Task 4 adds `data-de` to every element that carries an id.

- [ ] **Step 1: Write the failing check.** Add to `verify/check.mjs`, directly after the `/blog/deciding-well-solved/` entry, with no `translates` yet:

```js
  { path: "/blog/one-question-answered/", typography: true, storageKeys: true, mobileNav: true, carriesLang: true, headerBaseline: true, navOrder: true, headerFits: true, footer: FOOTER, seo: true, noNewTab: true, title: /One question answered/, lang: "en", sourceLang: "en",
    contains: ["One question answered.", "Enough that it answers without me", "about 434 hours", "a no is worth more than a polite yes"], card: true,
    sameTab: ["../../ideas/", "../../talks/deciding-well/cost/", "../../timeline/#2026-career-break", "../"], brandMark: true,
    fontsLoaded: ["Bricolage Grotesque", "Instrument Sans"], fontsAvailable: true,
    // See the note on /privacy/'s entry.
    tokens: true, sky: true, header: true, monoScope: true, monoDefined: true, contrast: true, noFlash: "theme", tokenVersion: true, fences: [],
    internalLinks: true },
```

- [ ] **Step 2: Run it and see it fail.** Serve the worktree on a free port and run `BASE=http://localhost:<port> npm run verify`. Expected: `✗ /blog/one-question-answered/` with a 404 title error.

- [ ] **Step 3: Make the page from the template.** `mkdir -p blog/one-question-answered && cp blog/deciding-well-solved/index.html blog/one-question-answered/index.html`, then in the copy: `<title>` “One question answered — Robert Blust”; canonical, `og:url` and every JSON-LD `@id` and `url` under `https://blust.ch/blog/one-question-answered/`; `og:title` “One question answered. One still open.”; description and `og:description` the tagline; `og:image` `https://blust.ch/blog/one-question-answered/og.png` with alt “One question answered. One still open.”; the `BlogPosting` node's `headline` the title, `description` the tagline, `datePublished` and `dateModified` the day the pull request is opened as `YYYY-MM-DD`, the `BreadcrumbList`'s last item the post. Delete every `data-de` attribute in the copy, since they carry the first post's German.

- [ ] **Step 4: Write the English.** In `<main>`: the `h1` light “One question answered.” bold “One still <em>open</em>.”; the tagline; then eight `<section>`s whose `h2` read, in order, “Two ideas, two questions”, “Enough that it answers without me”, “It happened on Sep 29”, “What it cost”, “A realistic outcome”, “What was learned”, “What would settle it”, “If the honest answer is no”. Each section says what the spec's section 3 says for it, about 1,100 words in all, with a link on the claim a reader would check: `../../ideas/` in section 1; `https://companygraph.io/` and `https://guestgraph.io/` in section 2; `../../talks/deciding-well/cost/` on “about 434 hours” in section 4; `../../timeline/#2026-career-break` on the architect role in section 6; `https://companygraph.io/?chat=open` in section 8. Section 5 quotes GuestGraph's objective as a `<blockquote>`: “Whether the scattered-guest problem is real enough in a hotel's operation that someone would pay to have it solved is settled, in either direction, by hotels rather than by us.” Then the `Rests on` section, `<section class="rests" aria-labelledby="rests">`, one list item per row of the spec's sources table with its link. Remove the first post's sections entirely.

- [ ] **Step 5: The plumbing.** Add `"blog/one-question-answered/index.html"` to `PAGES` in `build/jsonld.mjs` after `"blog/deciding-well-solved/index.html"`, and `{ dir: "blog/one-question-answered", ...FRAME, hide: HIDE, titleSlide: false },` to `cards` in `og-recipe.mjs` after the first post's card. Run `npm run pages`, `npm run og` and `npm run sitemap`.

- [ ] **Step 6: Run the checks.** `npm run pages:check`, `npm run og:check`, `npm run sitemap:check`, `npm run test:og`, `npm run test:build`, then `BASE=http://localhost:<port> npm run verify`. Expected: every one passes, and verify prints `✓ /blog/one-question-answered/`. Count the English body words (sections only, not the Rests on list) and note the reading time as words ÷ 200, rounded; Task 2 writes it.

- [ ] **Step 7: Commit the prose as the Writer.**

```bash
git add blog/one-question-answered/index.html verify/check.mjs
git commit --author "Writer <writer@blust.ch>" -F - <<'EOF'
The second post answers the ideas page in English

The ideas page asks two questions of its two ideas and promises findings as the material matures. The post is that finding: the first question has an answer with a number, enough that the idea answers without its author, at about 434 hours; the second has a test not yet passed. It is written from the spec's eight sections, every claim linked where it stands, and verify gains its entry.

Verified: npm run verify passes on /blog/one-question-answered/, its contains, sameTab, typography and seo checks included.

Process: Delivery
Phase: Implement
Track: Prose
Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>
EOF
```

Write the `Verified:` line from what Step 6 printed; if a check did not pass, fix it before this commit rather than naming a result that was not read.

- [ ] **Step 8: Commit the plumbing as the Implementer.** `git add build/jsonld.mjs og-recipe.mjs blog/one-question-answered/og.png blog/one-question-answered/og.sha sitemap.xml`, commit with the subject “The second post has its card, its sitemap entry and its graph”, a body saying the three lists now carry it, the `Verified:` line naming the checks of Step 6, and the Implementer's trailers with `Track: Code`.

### Task 2: The post on `/blog/`, the home page and `/ideas/`

**Files:**

- Modify: `blog/index.html` (a new first `.row`), `ideas/index.html:340` (the note), `verify/check.mjs` (the `/blog/` and `/ideas/` entries)
- Generated: `index.html` (the `latest` block, by `npm run pages`), the og stamps `npm run og` touches, `sitemap.xml`

**Interfaces:**

- Consumes: the post's title, tagline and reading time from Task 1.
- Produces: the blog index's first entry, which `build/latest.mjs` puts on the home page.

- [ ] **Step 1: Write the failing check.** In `verify/check.mjs`'s `/blog/` entry, make `contains` `["One question answered. One still open.", "Deciding well is solved. For me.", "Read the post"]` and `sameTab` `["one-question-answered/", "deciding-well-solved/", "./"]`. In the `/ideas/` entry add `"../blog/one-question-answered/"` to its `sameTab` list. Run verify for `/blog/` and `/ideas/`. Expected: both fail on the missing text and link.

- [ ] **Step 2: The row.** In `blog/index.html`, directly after `<div class="index">`, insert a row of the first row's shape:

```html
      <div class="row">
      <a class="entry" href="one-question-answered/">
        <span class="t">One question answered. One still open.</span>
        <span class="meta mono"><b>N min</b></span>
        <span class="d">On the ideas page I asked two questions of my two ideas. Fifteen weeks later, the first has an answer with a number. The second has a test, and the test has not been passed.</span>
      </a>
      <p class="dl mono"><a href="one-question-answered/" data-de="Beitrag lesen">Read the post</a></p>
      </div>
```

`N` is the reading time from Task 1 Step 6. The `t`, `meta` and `d` spans get their `data-de` in Task 4.

- [ ] **Step 3: The ideas page's note.** In `ideas/index.html` line 340, wrap the note's first word in a link: `<a href="../blog/one-question-answered/">Findings</a> will be published as the material matures.` Leave the note's `data-de` as it is until Task 4, which links «Was dabei herauskommt» the same way.

- [ ] **Step 4: Regenerate.** `npm run pages` (the home page's `latest` block now holds the new row), `npm run og`, `npm run sitemap`.

- [ ] **Step 5: Run the checks.** `npm run pages:check`, `npm run og:check`, `npm run sitemap:check`, `npm run test:build`, `npm run design:check`, then verify. Expected: all pass; `/`, `/blog/` and `/ideas/` are green.

- [ ] **Step 6: Commit as the Implementer.** Subject “The second post is first on the blog and the ideas page links it”, the body naming the row, the home page's latest block rewritten from it and the ideas note's link, `Verified:` from Step 5, trailers with `Track: Code`.

### Task 3: Rob reviews the English

- [ ] **Step 1:** Serve the worktree on a free port and give Rob the address of the post, `/blog/`, the home page and `/ideas/`.
- [ ] **Step 2:** Stop. Each finding Rob gives comes back as a new commit by the Writer, never folded into an earlier one, and the checks of Task 1 Step 6 run again after it. The German starts only when Rob says the English stands.

### Task 4: The German

**Files:**

- Modify: `blog/one-question-answered/index.html` (`data-de` on every element with an id), `blog/index.html` (the new row's `t`, `meta` and `d`), `ideas/index.html` (the note's `data-de`), `verify/check.mjs` (`translates` on the post's entry)

- [ ] **Step 1: Write the failing check.** Give the post's verify entry `translates: { lang: "de", shows: ["Eine Frage beantwortet", "Genug, dass es ohne mich antwortet", "rund 434 Stunden"], hides: ["One question answered", "Enough that it answers without me", "about 434 hours"] },`. Run verify for the post. Expected: fail, since no German exists.
- [ ] **Step 2: Translate.** Dispatch the translator of `conventions/TRANSLATOR.md` on the post, the new row and the ideas note, with `conventions/GLOSSARY.md` and `conventions/GERMAN.md` open; it writes the `data-de` values, the title as «Eine Frage beantwortet.» and «Eine noch <em>offen</em>.», the section headings so that the three `shows` strings above appear, and the ideas note with «Was dabei herauskommt» linked to `../blog/one-question-answered/`. It changes no English.
- [ ] **Step 3: Edit and back-read.** Dispatch the editor of `conventions/EDITOR.md` on the German alone; apply what it corrects by rule and each flag's first option. Then dispatch the back-reader of `conventions/BACKREADER.md` on the German alone, set its literal English against the post's English, and send back to the translator every value whose meaning moved. Give Rob only the sentences the editor flagged, in German, with their alternatives, and apply his picks.
- [ ] **Step 4: Run the checks.** `npm run pages`, `npm run og`, then `npm run pages:check`, `npm run og:check`, `npm run design:check`, `npx design german stale HEAD^1 HEAD` as CI runs it after each German commit, and verify. Expected: all pass, and the post's `translates` check shows the German strings and hides the English ones.
- [ ] **Step 5: Commit.** The German as the Translator, subject “The second post, its row and the ideas note are in German”, `Track: Prose`; the `translates` entry and any regenerated stamps as the Implementer, `Track: Code`. Each with its `Verified:` line from Step 4.

### Task 5: Every figure checked, then the pull request

- [ ] **Step 1: Check each source.** For every row of the spec's sources table, open the source and confirm the post says what it says: the 434 hours, Jun 9 to Sep 24 and fifteen weeks on `https://blust.ch/talks/deciding-well/cost/`; about 650 francs in mental-model `model/profiles/robert-blust/experiences/2026-talk-deciding-well.md`; GuestGraph's objective word for word in `~/git/guestgraph/mental-model/model/strategic-objectives/whether-a-hotel-would-pay-to-know-its-guests-is-answered.md`; the Nonprofit and Claude-first decisions and the four objectives in `~/git/companygraph/mental-model/model/`. A mismatch is fixed by the Writer, and the Translator follows it.
- [ ] **Step 2: Run everything once more.** Every `:check` and `test:` script in `package.json`, and verify on a free port. All green.
- [ ] **Step 3: Push and open the pull request.** `git -c credential.helper='!/opt/homebrew/bin/gh auth git-credential' push -u origin one-question-answered`, then `gh pr create` with the title “The blog's second post answers the ideas page” and a body in the git register, closing on its `Verified:` line and `🤖 Generated with [Claude Code](https://claude.com/claude-code)`. Wait for `gh pr checks --watch`; report the result.
- [ ] **Step 4:** Stop. Rob merges.

### Task 6: The model, after the post is live

Only on Rob's word, after Task 5's pull request is merged and `https://blust.ch/blog/one-question-answered/` answers 200.

**Files:**

- Create: `model/profiles/robert-blust/experiences/2026-blog-one-question-answered.md` in a mental-model worktree `mental-model-the-second-post`
- Modify: `model/profiles/robert-blust/robert-blust.md` (two Evidence rows)

- [ ] **Step 1: Write the entry** on the first post's entry `2026-blog-deciding-well-solved.md` as the pattern: `kind: Community`, `start` and `end` the day it went live, `url: https://blust.ch/blog/one-question-answered/`, `role: Author`, skills Technical writing and Storytelling, H1 “One question answered. One still open.”, a tagline saying what the post answers, Achievements under Ways of working and Sharing with no figure beyond what the post itself states, References the ideas page and the cost page.
- [ ] **Step 2: Evidence rows.** One row each under Technical writing and Storytelling in the profile, naming the entry.
- [ ] **Step 3: Check.** `npx -y github:companygraph/meta-model#v$(python3 -c "import json;print(json.load(open('.companygraph/manifest.json'))['tooling'])") check`, `sh conventions/conventions-check`, `sh conventions/conventions-format`. All pass.
- [ ] **Step 4: Commit as the Writer, push, open the pull request, stop.** The re-pins of blust.ch and mcp.blust.ch follow only on Rob's word, as the Implementer, each with every check and verify run as for the episode entries.

### Task 7: The LinkedIn post points to the post

- [ ] **Step 1:** In `~/git/robertblust/communication/posts/two-ideas-validated/post.md`, replace the draft's “🎧 *the Substack episode, once it is up*” with `https://blust.ch/blog/one-question-answered/`, and note under the brief that the post is the answer and the episode, if one is made, is a comment. The communication repository is private and local: no push, and no commit unless Rob asks.
