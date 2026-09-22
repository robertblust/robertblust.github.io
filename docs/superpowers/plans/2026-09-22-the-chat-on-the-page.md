# The Chat on the Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Put the chat's button on every prose page of blust.ch and companygraph.io, say on each privacy page what the chat does with a message, and re-pin the chat servers to the release that writes the Markdown subset, so the chat is live for visitors.

**Architecture:** Each site takes the design package's `chat` group, one tag per prose page with the site's endpoint and model page on it, and one stylesheet link; the privacy page gains a section and one changed line; the sitemap is regenerated. The chat servers' deployments re-pin to v0.4.0. The English is written here and reviewed by the owner in the pull request; the German is the translator's, after that review, in a second commit on the same branch.

**Tech Stack:** `@robertblust/design` v0.75.0 (`design sync`, `design sitemap`, `npm run verify`), the sites' own page checks, `companygraph/chat-server` v0.4.0 in the two deployment repositories.

**Spec:** `companygraph/chat-server`'s `docs/superpowers/specs/2026-09-22-chat-server-design.md` §7 and §8.

## Global Constraints

- English is the markup and German lives in `data-de`, as every prose page here does; a `data-de` on the new elements is left empty until the translator's commit, and the page check that holds every element with a `data-de` sibling to carrying one is respected by writing the German placeholders as the English until then only if the check demands it; otherwise the attribute is added in the translator's commit.
- The privacy page's list of stored keys does not change: the widget stores nothing.
- `npm run design` after the pin moves, then `npm run verify` and `npm run sitemap` before every commit; `sh conventions/conventions-check` and `sh conventions/conventions-format check` exit 0.
- Commits in the git register with the trailer `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`; the pull request is opened and stops there.
- `export PATH=/opt/homebrew/bin:$PATH` before every `node`, `npm` or `gh` command.

## The values

| Value | blust.ch | companygraph.io |
| --- | --- | --- |
| repository, worktree | `robertblust/robertblust.github.io`, `~/git/robertblust/robertblust.github.io-the-chat-on-the-page` | `companygraph/companygraph.github.io`, `~/git/companygraph/companygraph.github.io-the-chat-on-the-page` |
| endpoint | `https://chat.blust.ch/chat` | `https://chat.companygraph.io/chat` |
| prose pages | `index.html`, `model/`, `timeline/`, `surfaces/`, `team/`, `principles/`, `privacy/`, `talks/` | `index.html`, `model/`, `surfaces/`, `team/`, `principles/`, `privacy/`, `talks/`, `cli/`, `example/`, `billing/` |
| deployment repository | `robertblust/mcp-blust-ch` | `companygraph/mcp-companygraph-io` |

---

### Task 1: blust.ch takes the chat

**Files:**

- Modify: `package.json` (+ lockfile), `design.config.json`, every prose page, `privacy/index.html`, `sitemap.xml`
- Create (by sync): `chat.js`, `chat.css`

- [ ] **Step 1: The pin and the group.** In `package.json` move `@robertblust/design` to `github:robertblust/design#v0.75.0` and install it by name: `npm install @robertblust/design@github:robertblust/design#v0.75.0`. In `design.config.json` add `"chat"` to `groups`. Run `npm run design`; `chat.js` and `chat.css` appear at the root. Run `npm run design:check`: clean.

- [ ] **Step 2: The tag on every prose page.** In each page of the values table, before `</body>`, after any script the page already loads, add the tag with the path the page's depth needs (`chat.js` at the root, `../chat.js` in a folder): `<script src="../chat.js" data-chat="https://chat.blust.ch/chat" data-model="/model/" defer></script>`. In each page's `<head>`, beside the page's other `<link>` lines, add `<link rel="stylesheet" href="../chat.css">` with the same depth rule. A comment above the tag, once per page, in the family's voice: `<!-- The chat: one tag, the design package's widget. It loads nothing and sends nothing until a visitor opens it; the privacy page says what leaves the browser then. -->`.

- [ ] **Step 3: The privacy page.** After the section `What this site does` and before `What else happens here`, add a section, English only in this commit, every element that will carry German marked with `data-de=""` if the page check tolerates an empty attribute, else without the attribute until the translator's commit:

```html
    <section>
      <h2>The chat</h2>
      <p class="lede">The button at the foot of each page opens a chat with the model. Nothing happens until you open it and press send. Then your message, and the messages before it in that conversation, go to chat.blust.ch, a service of this site, which asks the model at mcp.blust.ch through its tools and asks Claude, Anthropic's language model, through Anthropic's API in the United States, to write the answer from what the tools said. Anthropic keeps what it receives for up to thirty days under its own terms; this site keeps nothing of it. The service counts what an answer cost and stores no word of what was said, and the browser stores nothing either: closing the page ends the conversation.</p>
      <p class="lede">What the chat answers comes from the model and names the entries it rests on; it is written by a language model and can be wrong. The service refuses a message before asking the model when the day's share of answers is spent, when an address sends too many in an hour, or when the chat is switched off, and a refusal costs nothing and reaches nobody.</p>
    </section>
```

In the `Not used at all` list, change the `Third-party requests` line's English to: "Fonts, images and styles all come from this origin. No CDN sees your address. The one exception is the chat, and only once you have opened it and pressed send: that message goes to chat.blust.ch and from there to Anthropic." Leave its `data-de` for the translator.

- [ ] **Step 4: Verify, sitemap, commit.** `npm run verify`, `npm run sitemap`, the two conventions checks. If `verify` fails on an element without German, note which check and give the new elements a `data-de` equal to the English as a placeholder, saying so in the commit.

```sh
git add package.json package-lock.json design.config.json chat.js chat.css sitemap.xml privacy/index.html index.html model/index.html timeline/index.html surfaces/index.html team/index.html principles/index.html talks/index.html
git commit -F - <<'EOF'
Every prose page opens the chat, and the privacy page says what it does

The chat over the model has run at chat.blust.ch since the design's widget shipped as a group, and no page opened it. Every prose page now loads the widget with the endpoint and the model page on one tag, so a visitor gets the button at the foot of the page and nothing else until they open it. The privacy page gains a section saying what leaves the browser then, and where it goes, and its line on third-party requests names the one exception; the German of both is the translator's, after this English is reviewed.

Verified: npm run design:check, npm run verify and npm run sitemap pass; conventions-check and conventions-format check exit 0.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
EOF
git push -u origin the-chat-on-the-page
gh pr create --repo robertblust/robertblust.github.io --base main --head the-chat-on-the-page --title "Every prose page opens the chat, and the privacy page says what it does" --body-file - <<'EOF'
The chat over the model has run at chat.blust.ch since the design's widget shipped as its `chat` group, and no page opened it. Every prose page now takes the group and loads the widget with the endpoint and the model page on one tag, so a visitor gets the button at the foot of the page and nothing else until they open it: nothing is fetched and nothing is sent before they press send, and nothing is stored, which is why the privacy page's list of keys does not change.

The privacy page gains a section saying what happens to a message and where it goes, chat.blust.ch and from there Anthropic's API in the United States, and its line on third-party requests names that one exception. The English is here for review; the German follows in a second commit by the translator once the English stands, and until then the new elements carry no German.

Verified: npm run design:check, npm run verify and npm run sitemap pass; conventions-check and conventions-format check exit 0.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
```

---

### Task 2: companygraph.io takes the chat

The same task with the second column of the values table: the worktree, the endpoint `https://chat.companygraph.io/chat`, the ten prose pages, and `chat.companygraph.io` and `mcp.companygraph.io` in the privacy section's English in place of blust.ch's hosts; the section's second sentence says "a service of this site" as before. The commit message and the pull request body are Task 1's with the hosts and `--repo companygraph/companygraph.github.io` swapped.

---

### Task 3: The German, after the owner's review

Not started until the owner has read the English in both pull requests. Then, in each worktree, the translator role of `conventions/TRANSLATOR.md` makes the German of the new section and the changed line into `data-de` attributes, with a back-translation per element in its report, and one commit per site in the register: "The chat's privacy section speaks German", body saying the translator made it after the English review, `Verified:` naming `npm run verify` and the checks.

---

### Task 4: The deployments take chat-server v0.4.0

In each deployment repository, on a branch `chat-server-v0-4-0`: `chat/package.json` and its lockfile by name (`npm install companygraph-chat-server@github:companygraph/chat-server#v0.4.0` in `chat/`), `chat.yml`'s `@v0.4.0`, `infra/chat/main.tf`'s `?ref=v0.4.0`; `npx companygraph-chat-deploy page-css && npm test` in `chat/`; commit "The chat takes v0.4.0 and writes the subset the widget renders", body: the Markdown-subset rule, the always-a-tool rule and the evidence cite, the pin in three places; pull request in the same register; the plan reads the image and nothing else.

---

## Self-review

§7: the tag with the endpoint on every prose page, the stylesheet, nothing before send, nothing stored: Tasks 1 and 2. §8: the privacy section in both languages with the one exception named, Anthropic in the United States rather than Google in Europe, the list of keys unchanged: Tasks 1 to 3. The design README's exception shipped with the group. The surfaces and the conventions row are the plan after this one.
