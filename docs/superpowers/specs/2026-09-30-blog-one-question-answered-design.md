# One question answered — design

> The blog's second post, at `/blog/one-question-answered/`, answers in writing the two questions the ideas page asks of its two ideas. The first has an answer with a number: enough must exist that the idea answers without its author, and that took about 434 hours. The second has a test that has not been passed: no revenue, no clean no, and learning. The ideas page links the post as its first finding, and the LinkedIn post about the two ideas links the post rather than a podcast episode.

Status: proposed on 2026-09-30, four decisions taken with the owner the same day. The post is the answer and everything else points to it. The workshop of Sep 29 stays in, told without naming who took part or where. The 434 hours stand as an estimate linked to the page that counts them. The title is the one below. On review of the built English and German, Rob added “yet” to the tagline's last sentence, in both languages.

---

## 1. Why a post, and why this one

The ideas page puts GuestGraph and CompanyGraph up for scrutiny and asks two questions of both, and it says findings will be published as the material matures. Fifteen weeks of building have produced a finding, and a finding said only in a LinkedIn post or a generated episode is gone from the feed within days and cannot be checked against anything. A post on the site lasts, sits beside the pages it answers, and links every claim to where it stands. So the post is the answer, and the rest points to it: the ideas page, the LinkedIn post and, if one is ever generated, the episode.

The material exists. `communication/posts/two-ideas-validated/wip/story.md` carries the argument, section by section, each with its source, and the lists of what may be said and what must not. The post is written from it and from the sources it names, not from the story's wording.

## 2. What is added where

| Where | What |
| --- | --- |
| blust.ch | `/blog/one-question-answered/`, the post, in English and German, on the first post's pattern |
| blust.ch `/blog/` | a row for the post at the top of the list, newest first, with its reading time |
| blust.ch `/ideas/` | the sentence “Findings will be published as the material matures” links its first finding, the post |
| blust.ch plumbing | the post in `verify/check.mjs`'s page list, `og-recipe.mjs`, `sitemap.xml`, and a `BlogPosting` in its JSON-LD |
| mental-model | after the post is live, a Community entry for it; its LinkedIn post later joins The career break experiment on LinkedIn |
| communication | `two-ideas-validated/post.md` links the post instead of the Substack episode; blust.ch/ideas stays in its first comment |

Nothing else moves. The design package has the index block and every rule the post needs, so there is no design release. The two models' objectives, decisions and questions are quoted and not changed. No episode is part of this work; if one is generated later, it becomes a link inside the post and a comment under the LinkedIn post, and changes no page.

## 3. The post

**Address.** `/blog/one-question-answered/`, named from the title as `/blog/deciding-well-solved/` is.

**Title**, in the title contract: light “One question answered.” and bold “One still *open*.” German: light «Eine Frage beantwortet.» and bold «Eine noch *offen*.»

**Tagline.** “On the ideas page I asked two questions of my two ideas. Fifteen weeks later, the first has an answer with a number. The second has a test, and the test has not been passed yet.”

**Length.** About 1,100 words in English, about six minutes at the blog's 200 words a minute.

**Sections**, each making one point, in this order:

1. **Two ideas, two questions.** GuestGraph resolves the strangers a hotel's systems store into one guest. CompanyGraph writes what a company knows as a graph of Markdown that people and agents can both rely on. Both are open core, and exactly one part of each could ever earn money. The ideas page's two questions are quoted as the page asks them, with a link to it.
2. **Enough that it answers without me.** A slide proves you can explain an idea, not that the idea holds. An idea is validated only when someone who owes it nothing can try it with its author out of the room. For CompanyGraph that took the vocabulary, a check that fails when a reference points at nothing, real instances rather than invented ones, and a chat and an MCP server that answer from them. For GuestGraph it took the engine and one real hotel system connected, Apaleo, because identity resolution against invented data proves only that the data was consistent.
3. **It happened on Sep 29.** In a workshop on Sep 29, 2026, three people asked CompanyGraph what it could not answer yet: does it only work with Claude, and can a graph database hold a model? An agent in the Writer seat drafted the entries, and the author approved each in the Owner seat. Thirty minutes later the chat answered them, and ten of those minutes were the author's, by his own count. Nobody who took part is named, nor where it took place, and the minutes are said to be his own account.
4. **What it cost.** About 434 hours between Jun 9 and Sep 24, 2026, an estimate from the days git shows work, linked to the talk's cost page, which states how it was counted. About 650 francs of AI. The point of the section is where the hours went: building stopped being the bottleneck in the first weeks, and every hour it saved went into deciding what an entry claims, what a page may say and what gets declined.
5. **A realistic outcome.** Revenue: none, because nothing is sold, which is why CompanyGraph's LinkedIn page is typed Nonprofit. A clean no: not yet, though both models carry the question as a strategic objective that a no settles as completely as a yes. GuestGraph's is quoted word for word. Learning: the realistic outcome so far.
6. **What was learned.** Three things. The first test is adoption, not revenue: a company CompanyGraph has never met keeping its own model current, which has not happened. Validating cheaply is a decision of its own: the skills an instance ships are written for Claude first, and that is recorded. And building both ideas in the open answered the question the career break started with, which is why the author chose an architect role from October.
7. **What would settle it.** One company never met that keeps its own model, one engagement billed by the day on the terms the billing page states, one hotel that pays for the hosted service. One of each is enough, and a larger one would not answer the question better.
8. **The ask.** If you are that company or that hotel, or think the honest answer is no, say so; a no is worth more than a polite yes. And ask the chat first, at https://companygraph.io/?chat=open: if it answers, the idea holds a little better, and if it cannot, you have found a gap in the model.

**Sources, one per claim**, linked from the post where a reader would check it:

| Claim | Where it stands |
| --- | --- |
| the two ideas, the two questions, open core, a no is worth more than a polite yes | blust.ch/ideas |
| what CompanyGraph ships; the real instances, the chat and the MCP server | companygraph.io, its products and features |
| GuestGraph's engine and the Apaleo connector | guestgraph.io |
| the workshop's two questions and the Writer and Owner seats | CompanyGraph's objectives *A company keeps its model with whichever agent it chooses* and *A company's model belongs to no tool, and any graph database can hold it*, its questions and its roles |
| about 434 hours, an estimate from the days git shows work, Jun 9 to Sep 24 | blust.ch/talks/deciding-well/cost/ |
| about 650 francs of AI; the hours went into deciding | the talk entry `2026-talk-deciding-well.md`; the cost page |
| nothing is sold; the page typed Nonprofit | CompanyGraph's decision *The LinkedIn company page is typed Nonprofit*; its objective *Whether this is a business is answered* |
| a no settles it as completely as a yes; GuestGraph's objective quoted | *Whether this is a business is answered*; GuestGraph's *Whether a hotel would pay to know its guests is answered* |
| adoption before revenue | CompanyGraph's *A company we have never met keeps its own model* |
| Claude first | CompanyGraph's decision *Claude is the first agent an instance supports, and not the only one* |
| the architect role from October | the career-break entry, on blust.ch/timeline |
| what would settle it | the What falls outside paragraphs of the two business objectives; the billing pages |

**Rules the post holds.** No name for anyone at the workshop, and no employer, school or company from the job search. No customer, no user outside the instances, no revenue, and no price, rate or proposal beyond what the billing pages state. The graph-database objective is a target, and nothing loads a model into a graph database today. The 434 hours are an estimate and are called one. No figure the sources do not give, no salary, and no count that still moves beyond the closed period of Jun 9 to Sep 24. The prose register of the family's `WRITING.md`, en-US in English and Swiss Standard German in German, the reader Sie as on every page.

## 4. The pages around it

**`/blog/`.** The post's row goes above the first post's, with its title and reading time, and the page is otherwise unchanged.

**`/ideas/`.** The note “Findings will be published as the material matures” links its words “Findings” to the post, in both languages, and nothing else on the page changes.

**Plumbing.** As for the first post: the page list in `verify/check.mjs` with `seo: true`, `typography: true`, `carriesLang: true` and the way out; `og-recipe.mjs`, so `npm run og` renders its card; `sitemap.xml` through `npm run sitemap`; and a `BlogPosting` under the site's Person and WebSite nodes with `datePublished` and `inLanguage` for both languages.

## 5. Order of work

1. blust.ch, one branch, `one-question-answered`, in its sibling worktree: the post in English, the `/blog/` row, the `/ideas` link, the plumbing, the card and the sitemap. `verify` green.
2. The owner reviews the English on the rendered page, section by section, before any German is made.
3. The German of the post, the new row and the ideas note, on the same branch, through the translator, the editor and the back-reader; the owner reads only what the editor could not settle.
4. Every figure and quote checked against its source, then the pull request; the owner merges and the page is live.
5. mental-model, after it is live: `2026-blog-one-question-answered.md`, kind Community, `start` and `end` the day it goes live, `url` the post's address, role Author, claiming Technical writing and Storytelling with one Evidence row each; then the re-pins of blust.ch and mcp.blust.ch.
6. communication: `two-ideas-validated/post.md` links the post, and the LinkedIn series entry gains its line when the LinkedIn post goes out.

## 6. What is left out

No episode, no new design block, no change to either model's objectives, decisions or questions, no feed, no tags and no comments. Each is a request of its own if it comes.
