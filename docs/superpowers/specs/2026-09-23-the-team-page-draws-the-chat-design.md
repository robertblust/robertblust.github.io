# The team page draws the chat — design

> The model holds a second process since today, Answering, with the seats the chat works by: the Answerer, held by the AI Agent, the Visitor, and the Owner at its gate. The site takes that commit, draws the second board after Delivery, and stops counting seats by hand. One pull request here, after the files pull request has landed.

Status: proposed. Decided on 2026-09-23 against this repository at 88e3391, whose `source.json` pins robertblust/mental-model at 6df2c30, and against robertblust/mental-model at 0cb7f5c, whose files were read that day. The model changes the site takes are robertblust/mental-model #175, the ideas page's words in the model, and #176, the chat as a seat and a process, both merged.

## 1. What is true today

`source.json` pins 6df2c30. Since that commit the model gained the words of the ideas, talks, privacy and model pages and the hand-written pages as units of the website surface (#175), and a second process, Answering, with two new seats, the Answerer and the Visitor, the AI Agent holding the Answerer (#176). Everything the site derives from the pin, `model.json`, the timeline, the model page, the principles, team and surfaces pages and the JSON-LD, rebuilds from it.

The team page draws one board today, Delivery. `build/pages.mjs` calls `writeTeam` with no `order`, so boards come in the artifact's order, which is the folder order: Answering would be drawn before Delivery. The page's tagline says "Two profiles hold eight seats. One of them is a person, and that one decides." in both languages, and its meta description, its `og:description` and the language block's two descriptions say "the eight seats between them: who executes each phase of the delivery process". Both are typed into the page, and the model no longer agrees with either: there are nine seats and two processes.

## 2. What was decided

**The order is the site's, and it is Delivery, then Answering.** The work first, then how a stranger is answered, the same argument companygraph.io makes with its three boards. `build/pages.mjs` passes `order: ["Delivery", "Answering"]`, so the renderer refuses the build if either name leaves the model.

**The count goes.** A number typed into a page for something that still moves is the one kind of claim the family has ruled out, and the seat count moved today. The tagline becomes "Two profiles hold every seat. One of them is a person, and that one decides.", with the German drafted for the Translator as "Zwei Profile halten jeden Sitz. Eines davon ist ein Mensch, und dieses entscheidet." The four descriptions become "The two profiles the model holds and the seats between them: who executes each phase of each process, who supports it, and who approves its gate.", with the German made from it. Should the owner prefer the number, it is nine, in all five places, and this paragraph is where that is decided.

**Nothing else on the page is typed.** The second board, its legend, the phases in words and the head rail's "holds n of m" per profile are the renderer's, read from the phase's own fields, so the Answerer's row, the Visitor's unnamed human row and the Owner's gate mark appear without an edit here.

## 3. The pull request

One pull request, opened after #249, the site taking design v0.80.1 and linking what is shared as files, has merged, so that a rebuild of every generated page does not interleave with the move of every page's shared blocks. In order: `source.json` moves to 0cb7f5c; `npm run model` rewrites `model.json`; `build/pages.mjs` gains the order and `npm run pages` regenerates the team page with its second board; the five typed sentences move; `npm run og` re-renders the cards whose stamp moved; `npm run sitemap`.

Verified by `npm run design:check`, `npm run model:check`, `npm run pages:check`, `npm run verify` on a served copy, `npm run og:check` and `npm run sitemap` exiting 0, and by reading the rendered team page in both languages, both themes, at a desk's width and a phone's: two boards in that order, Answering with the Owner approving the gate, the Visitor supporting without a name, the Answerer executing and held by the AI Agent, and the head rail's counts agreeing with the model.

## 4. Not in this design

The re-pin of mcp.blust.ch to the same commit, which waits for the owner's word. The chat's cite line and link style, which are design's #121. The home page's line about the career break, which stays by the owner's decision until the destination is communicated.
