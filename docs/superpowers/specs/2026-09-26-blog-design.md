# The blog — design

> A section of blust.ch for longer writing, at `/blog/`, beside the talks. An index page in the family's style lists the posts, built on an index block that the talks page adopts too, so the "list of things under a section" exists once in the design package. The first post says why deciding well is solved for its author: the October decision as the worked example, from the question through the facts, the application tooling and the arguments to the choice.

Status: approved by the owner on 2026-09-26. Three decisions were taken the same day: the section is called Blog, the collection, and each entry is a post; the index list becomes a design block rather than a second copy of the talks page's CSS; the first post is written from the model's career-break and application-tooling entries and adds no figure.

---

## 1. What is being added

| Where | What |
| --- | --- |
| design | a fence `index` and the label Blog in the nav-order rule, released as v0.91.0 |
| blust.ch | Blog in the nav of every page; `/blog/` on the index block; `/blog/deciding-well-solved/`, the first post; `/talks/` on the index block instead of its inline rules |
| mental-model | an experience of kind Community for the post, with its URL; a Blog bullet in the website surface's What it shows |

Nothing else moves. The talk entry, the talks themselves and the home page are not touched, except for the nav row every page shares.

## 2. The design package

**The `index` fence.** What `/talks/index.html` carries inline today for its list becomes a fence in `blocks/index.css`, in the form the other fences take: a header comment naming the pages that carry it and why it is one fence, then the rules. The class names lose the word talk: `.index` is the list, `.row` a row with a top rule and, on the last, a bottom rule, `.entry` the link that fills the row as a two-column grid of `.t`, the title in Bricolage, and `.meta`, the mono figure on the right, with `.d`, the dim description, under the title in the first column. `.dl` is the mono line under the entry naming what can be done with it, with `.sep` between two actions. The hover moves the rule and the title to the accent. The phone collapse at 900px stacks the grid, and the reduced-motion rule drops the transitions. The values are the talks page's values, moved and not changed, so the talks page renders the same bytes of layout after the swap.

**The nav order.** `verify/pages.mjs` names the labels a nav may carry and their order. Blog goes between Timeline and Talks, and the comment beside the list says why: what was written comes before what was spoken, and both come after the record they draw on. The German label is Blog as well, so `data-de` on the link carries the same word, which is what the translates check expects of a label that does not change.

**The check.** The design's own verify has a page fixture per fence. The index fence gets one: a title contract above an index with two rows, and the test reads the rendered grid, the rules, the hover colour and the collapse at a phone width.

**Release.** v0.91.0, with the notes naming the fence and the label. blust.ch re-pins in the same pull request that adopts the fence, the three-place pin as the re-pin memory records it.

## 3. blust.ch

**The nav.** Every page with the header gains `<a href="…/blog/" data-de="Blog">Blog</a>` before the Talks link, with the relative path the page's depth needs: index, team, principles, surfaces, ideas, model, timeline, talks, privacy, the cost page under the talk, and the two new pages. The nav-fit script handles the width, and the header checks in verify fail on a page left out.

**`/blog/`.** A hand-written page on the prose pattern of `/talks/`: the header, the title contract, a tagline, the index fence with one row per post, the footer, the `window.rbPage` script, `page.js` and `chat.js`. The title reads, light, "Writing on" and, bold, "deciding well.", with the German "Texte über" and "gutes Entscheiden.", the same pair the talks page uses, so the two indexes read as siblings. The tagline says what a post is here: an argument the talks make in ten minutes, taken slowly, with the facts it rests on linked. Each row shows the post's title, the reading time in the meta column as the talks show a duration, the description, and one action, "Read the post", German "Beitrag lesen". Bilingual through `data-de`, with a `UI` object for the page's own title and description.

**`/talks/`.** The inline rules for the list go, the fence comes in, and the markup takes the fence's class names. The page's look is unchanged, and the diff is the proof, since the rules move rather than change.

**`/blog/deciding-well-solved/`.** The first post, on the prose pattern of `/ideas/`: the header, the title contract, a tagline, sections of paragraphs, the footer and the scripts. No deck, no narration, no PDF. The reading time in the index is counted from the English text at 200 words a minute and rounded to the minute, and written into the index by hand, as the talks' durations are.

**Plumbing.** Both pages go into `verify/check.mjs`'s page list with `seo: true`, `typography: true`, `carriesLang: true` and the way out, so the sitemap check expects them; into `og-recipe.mjs`, so `npm run og` renders each page's card; and into `sitemap.xml`. The post's JSON-LD is a BlogPosting under the site's Person and WebSite nodes, with `datePublished`, `inLanguage` for both languages and `isPartOf` the blog's WebPage, written by hand like the other pages' WebPage nodes. IndexNow runs after deploy on its own.

**German.** Both pages are bilingual through `data-de`, and the post's German is produced through the pipeline the German memory records: the writer's English first, the translator's German after, the back-translation as the review. The `german stale` check keeps the two in step from then on.

## 4. The model

**The experience.** `model/profiles/robert-blust/experiences/2026-blog-deciding-well-solved.md`, kind Community, `start` and `end` the day it goes live, `url` the post's address, `role` Author, and the skills the talk claims that the post exercises: Storytelling and Public speaking do not apply, so the entry claims Agentic AI development and Spec-driven development, the career break's own, and nothing the post does not show. Its H1 is the post's title, its tagline the post's tagline, and its Achievements say what the post argues and what it rests on, in the entry form the other Community experiences take. It lands after the post is live, so the URL it names resolves, the same order the podcast entry followed.

**The surface.** `model/surfaces/blust-ch-website.md` gains, under What it shows, between Talks and Privacy: "**Blog** — the posts this site serves, each an experience of the profile, in both languages." The projection rules need no change: a post is a Community experience with a URL, which the surface already knows how to show.

**The checks.** The instance checks run on the model's pull request as on any other, and the site's pin of the model moves on the next re-pin, not in this work.

## 5. The first post

**Title.** In the title contract: light "Deciding well is solved." and bold "For me." German: light "Gut entscheiden ist gelöst." and bold "Für mich."

**Tagline.** "The talk kept the claim open for everyone else. This is the one case I can close, because the decision is written down and you can read it."

**Length.** About 1,200 words in English, about six minutes.

**Sections**, each making one point, in this order:

1. **The claim and its exception.** The talk says building fast is solved and deciding well is not, and it proposes a method, not a result. One case is closed: the author's own. Not because the outcome was good, but because the decision was made the way the method says, so it can be checked.
2. **The question came first.** The break got one question, written down before any application: what I like doing, not what I am used to being hired for. Two tracks were held open on purpose, engineering and architecture, and the market was allowed to answer.
3. **The facts were kept in one place.** One CV in Markdown, every application an overlay, git holding what was sent where. The honesty line: no certification not held, no cloud not run, a gap stated rather than covered. What that cost on paper and bought in the room.
4. **The agents rated, never decided.** Three agents per posting: one rated the match against the experience and the written feedback of former colleagues, one wrote the application when the rating was a go, one checked the process and the correspondence. The rubric was the colleagues', which is what made the ratings worth reading.
5. **What the evidence said.** 25 applications between Jun 9 and Aug 20, 2026, 16 engineering, 5 architect, 3 leadership, 1 business engineer. 12 reached an interview or an invitation. All 3 leadership applications led to an interview, 7 of 16 engineering, 2 of 5 architect, and the offer taken was one of those two. What the declines taught: a former CTO applying near the code reads as a flight risk unless the stay is stated first, and the story has to be told as a choice.
6. **The decision.** An 80% architect role in a product company outside finance, chosen while three finance processes were open, two senior engineering roles, one past its second round and one a day from an offer, and a hands-on lead role at a higher salary range, and all three withdrawn. The fifth day kept for formal education in how AI is led and governed. Values over pay, stated before the offers, not after.
7. **Why that is deciding well.** Question first, the evidence in one model, agents inside written boundaries, the owner deciding, the record public on the timeline. One person and one decision prove nothing about a team, which is why the talk's proposal stays a proposal. Then the ask: where does it break for you.

**Rules the post holds.** No employer, no declined company, no school, no salary figure and no comparison of offers beyond "a higher salary range", which the model states. Every figure comes from the career-break and application-tooling entries and is linked to the timeline where it stands. The colleagues are not named, since the post of Sep 25 thanked them. The prose register of the family's WRITING.md: sentence case, American English, one idea per sentence, no adjective that sells, the cause before the mechanism. The post links the talk once, in the first section, and the timeline once, where the facts are.

## 6. Order of work

1. design: the fence, the fixture and test, the nav label, v0.91.0.
2. blust.ch, one branch: the re-pin, `/talks/` on the fence, the nav on every page, `/blog/`, the post in English, the plumbing, the og cards, the sitemap. Verify green.
3. The German of both pages through the pipeline, on the same branch, before the pull request opens.
4. The pull request; the owner merges; the pages are live.
5. mental-model: the experience and the surface bullet, one pull request, after the post is live.

## 7. What is left out

No feed, no dates in the URL, no tags, no comments, no narration, no PDF, no generation of the index from the model. Each is a request of its own if it comes. The section starts with one post and a list that can hold more.
