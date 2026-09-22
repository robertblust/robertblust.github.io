# The card shows the person implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** blust.ch serves its own copy of the picture the model's profile carries, the profile's card on `/model/` draws it, and every page's `#person` node names it as `image`.

**Architecture:** The model build already reads one pinned commit of the model and writes `model.json`. It now reads an image as bytes, asks the parser's `imagesOf` what to publish and hands that to `syncImages` from `@robertblust/design/images`, which writes `images/<entity id>.<extension>` beside `model.json` and, under `model:check`, fails a copy that differs, is missing or is named by nothing. The four pages that draw cards declare `data-images="../images/"` on the link that names their data, which is all the card needs. `build/jsonld.mjs` writes `image` on the Person node from the same model, so the node stays identical wherever its `@id` appears. A new page check, `picture`, asks the browser whether the picture arrived, because nothing in the markup fails when it does not.

**Tech Stack:** Node 22+, `node:test`, Playwright for the page suite, `@robertblust/design` and `companygraph-meta-model` pinned by tag.

**Spec:** `docs/superpowers/specs/2026-09-21-a-profile-carries-an-image-design.md` in companygraph/meta-model (sections “From the model to a page” and “Beyond the card”).

Every code block and expected output below was run once in a throwaway clone of `main` at 7923533, wired to the prototype of design's release and to meta-model v0.42.0, against a scratch copy of the model holding the owner's 1000 by 1000 photo. The copy was byte-identical to the source, the card drew it at 64 by 64 in both themes and at phone width, and `verify`, `og:check`, `pages:check`, `test:build` and the duplication sweep all passed. With the file taken away, `picture` failed with “did not load” and the existing `seo` check failed every page on the JSON-LD address answering 404.

## Global Constraints

- **Three things must exist before this starts**, each the owner's to release or merge: design **v0.74.0** (`docs/superpowers/plans/2026-09-21-the-card-draws-a-picture.md` in robertblust/design), meta-model **v0.42.0** (released), and a commit on robertblust/mental-model `main` whose profile carries `image` (`docs/superpowers/plans/2026-09-21-the-profile-carries-its-picture.md` there). If a number has moved on since this was written, use the one that carries the feature and say so.
- **Branch and worktree:** `the-card-shows-the-person`, in `~/git/robertblust/robertblust.github.io-the-card-shows-the-person`, which holds this plan. The clone stays on `main`.
- **`export PATH=/opt/homebrew/bin:$PATH`** before any `node`, `npm` or `gh` command. A push names the credential helper: `git -c credential.helper='!/opt/homebrew/bin/gh auth git-credential' push -u origin the-card-shows-the-person`.
- **A re-pin is proven, never assumed.** `npm install <pkg>@github:<owner>/<repo>#<tag>` by name for each package, then read `packages["node_modules/<pkg>"]` in `package-lock.json`: `version` must be the new one and `resolved` must end in the sha `gh api repos/<owner>/<repo>/git/refs/tags/<tag>` gives. A grep for the tag string passes on a stale lockfile.
- **The parser re-pin moves nothing by itself.** At the content pin `00c4927`, v0.42.0 parses to a `model.json` byte-identical to v0.31.0's; this was run. So Task 1 ends with `model:check` green on the old content pin, and any diff in `model.json` there is a finding, not an expectation.
- **Start the local server on a free port and stop it by its PID**, never by pattern; port 8000 may be the owner's. `verify` reads `BASE`.
- **The privacy page stays as it is**: the picture is served from blust.ch itself, which is the reason the site copies it.
- **`npm run sitemap` after the last page edit**, committed with the pages, or `sitemap:check` fails on the dates.
- **Never commit on the default branch.** Never chain a branch delete after a merge. Merging waits for the owner's word.
- **Commit messages** follow the git register, ending with a `Verified:` line and the trailer `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.

---

### Task 1: Both pins move, and nothing else does

**Files:**

- Modify: `package.json`, `package-lock.json`
- Modify: whatever `npm run design` rewrites (`card.js`, `stage.css`, and the shared fences design v0.73.0 and v0.74.0 changed — on the prototype, a comment inside the `header contract` fence on every page)

**Interfaces:**

- Produces: `@robertblust/design/images` and `companygraph-meta-model/instance`'s `imagesOf` and `IMAGE_FILE` importable here, for Task 2.

- [ ] **Step 1: Move the pins by name**

```bash
export PATH=/opt/homebrew/bin:$PATH
cd ~/git/robertblust/robertblust.github.io-the-card-shows-the-person
npm ci > /dev/null 2>&1; echo "install $?"
npm install --save-dev "@robertblust/design@github:robertblust/design#v0.74.0" "companygraph-meta-model@github:companygraph/meta-model#v0.42.0" > /dev/null 2>&1; echo "re-pin $?"
node -e 'const l=require("./package-lock.json").packages;for(const p of ["node_modules/@robertblust/design","node_modules/companygraph-meta-model"])console.log(p,l[p].version,l[p].resolved.split("#")[1])'
gh api repos/robertblust/design/git/refs/tags/v0.74.0 --jq .object.sha
gh api repos/companygraph/meta-model/git/refs/tags/v0.42.0 --jq .object.sha
grep -c "export function imagesOf" node_modules/companygraph-meta-model/lib/instance.mjs
ls node_modules/@robertblust/design/lib/images.mjs
```

Expected: versions `0.74.0` and `0.42.0`, each `resolved` sha equal to the tag's (an annotated tag's `object.sha` is the tag object; then compare with `gh api repos/<owner>/<repo>/commits/<tag> --jq .sha`), `1`, and the file listed. If a sha differs, remove `node_modules` and `package-lock.json`, run `npm install`, and check again.

- [ ] **Step 2: Sync the design files and check nothing else moved**

```bash
npm run design > /dev/null; echo "design $?"
npm run -s design:check > /dev/null; echo "design:check $?"
npm run -s model:check; echo "model:check $?"
npm run -s pages:check > /dev/null; echo "pages:check $?"
npm run -s test:build > /dev/null 2>&1; echo "test:build $?"
git status --short
```

Expected: five zeros; `model.json` and `source.json` not in the status. `card.js` and `stage.css` are.

- [ ] **Step 3: Commit**

Commit `package.json`, `package-lock.json` and every file `npm run design` rewrote, with a message in the git register saying that the site takes design v0.74.0 and the parser v0.42.0, that the parser's eleven releases parse the pinned commit to the same bytes, and that no page draws a picture yet because none declares its images.

---

### Task 2: The model build copies the images

**Files:**

- Modify: `build/read.mjs` (one import, the local read, the remote read)
- Modify: `build/model.mjs` (imports, the images step, the check, the write, the summary line)
- Modify: `source.json` (the content pin)
- Modify: `model.json` (rebuilt)
- Create: `images/profiles/robert-blust.jpg` (written by the build, committed)
- Modify: `AGENTS.md` (the paragraph that opens `` `model.json` is the parsed model at the commit ``)

**Interfaces:**

- Consumes: `IMAGE_FILE`, `imagesOf(files, data, { sub, schemas })` from `companygraph-meta-model/instance`; `syncImages({ root, images, check })` from `@robertblust/design/images`.
- Produces: `images/<entity id>.<extension>` beside `model.json`, held by `npm run model:check`.

- [ ] **Step 1: Apply the build change**

This is the whole change to the three build files, as a diff of the prototype (the `jsonld.mjs` hunks belong to Task 3; apply only `read.mjs` and `model.mjs` here):

```diff
diff --git a/build/jsonld.mjs b/build/jsonld.mjs
index ed120c9..12cbce7 100644
--- a/build/jsonld.mjs
+++ b/build/jsonld.mjs
@@ -34,11 +34,26 @@ const PAGES = ["index.html", "ideas/index.html", "model/index.html", "principles
 // that is not drift, and nothing here reconciles them.
 // The site's own address is left out: the Person node states it as `url`, and sameAs names the
 // other places that are the same person, which the site itself is not.
-export function alsoAt(data) {
+function personOf(data) {
   const root = data.entities.find((e) => e.id === data.rootId);
   if (!root) throw new Error("the model has no entity at its rootId");
   const profile = data.entities.find((e) => e.type === "profile" && e.name === root.name);
   if (!profile) throw new Error(`the model holds no profile named ${root.name}`);
+  return profile;
+}
+
+// The person's picture, where the profile carries one: the address of this site's own copy,
+// which `npm run model` writes at `images/<entity id>.<extension>`. Absent where the profile
+// names none, since a node that claimed a picture the site does not serve would be a claim
+// with nothing behind it.
+export function imageOf(data) {
+  const profile = personOf(data);
+  const name = profile.fields?.image;
+  return typeof name === "string" && name ? `${SITE}/images/${profile.id}.${name.split(".").pop()}` : null;
+}
+
+export function alsoAt(data) {
+  const profile = personOf(data);
   const urls = (profile.sections || [])
     .filter((s) => s.heading === "Also at")
     .flatMap((s) => s.tables || [])
@@ -57,6 +72,7 @@ function invariant(data) {
       name: "Robert Blust",
       url: `${SITE}/`,
       jobTitle: "Software Engineer & Architect",
+      ...(imageOf(data) ? { image: imageOf(data) } : {}),
       sameAs: alsoAt(data),
       subjectOf: { "@id": `${SITE}/#model` },
     },
diff --git a/build/model.mjs b/build/model.mjs
index 09b2916..6670083 100644
--- a/build/model.mjs
+++ b/build/model.mjs
@@ -18,7 +18,8 @@
 import fs from "node:fs";
 import path from "node:path";
 import { fileURLToPath } from "node:url";
-import { parseInstance } from "companygraph-meta-model/instance";
+import { parseInstance, imagesOf } from "companygraph-meta-model/instance";
+import { syncImages } from "@robertblust/design/images";
 import { readInstance } from "./read.mjs";
 
 const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
@@ -44,6 +45,10 @@ const [files, schemas] = await Promise.all([
 // the file on GitHub.
 const data = { ...parseInstance(files, { sub: SUB, schemas }), commit, repo };
 const text = JSON.stringify(data, null, 2) + "\n";
+// The pictures the model names, copied beside model.json at `images/<entity id>.<extension>`
+// and pinned exactly as it is: the site serves its own copy, so a visitor's browser asks no
+// third party for one, which is what the privacy page says.
+const images = imagesOf(files, data, { sub: SUB, schemas });
 
 if (process.argv.includes("--check")) {
   const current = fs.existsSync(OUT) ? fs.readFileSync(OUT, "utf8") : "";
@@ -51,8 +56,14 @@ if (process.argv.includes("--check")) {
     console.log(`  ✗ model.json is not what ${repo}@${commit.slice(0, 7)} parses to — run: npm run model`);
     process.exit(1);
   }
-  console.log(`  ✓ model.json is ${repo}@${commit.slice(0, 7)}: ${data.entities.length} entities, ${data.edges.length} edges`);
+  const { problems } = syncImages({ root: ROOT, images, check: true });
+  if (problems.length) {
+    for (const p of problems) console.log(`  ✗ ${p} — run: npm run model`);
+    process.exit(1);
+  }
+  console.log(`  ✓ model.json is ${repo}@${commit.slice(0, 7)}: ${data.entities.length} entities, ${data.edges.length} edges, ${images.length} image(s)`);
 } else {
   fs.writeFileSync(OUT, text);
+  syncImages({ root: ROOT, images });
   console.log(`  wrote model.json: ${data.entities.length} entities, ${data.edges.length} edges from ${repo}@${commit.slice(0, 7)}`);
 }
diff --git a/build/read.mjs b/build/read.mjs
index a1a5225..56ed5ef 100644
--- a/build/read.mjs
+++ b/build/read.mjs
@@ -9,6 +9,7 @@
 import fs from "node:fs";
 import path from "node:path";
 import { execFileSync } from "node:child_process";
+import { IMAGE_FILE } from "companygraph-meta-model/instance";
 
 function readLocal(dir, commit, sub) {
   const head = execFileSync("git", ["-C", dir, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
@@ -21,7 +22,8 @@ function readLocal(dir, commit, sub) {
     for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
       const p = path.join(d, ent.name);
       if (ent.isDirectory()) walk(p);
-      else files.set(path.relative(root, p).split(path.sep).join("/"), fs.readFileSync(p, "utf8"));
+      // An image is bytes: read as text it is corrupted before the copy step sees it.
+      else files.set(path.relative(root, p).split(path.sep).join("/"), fs.readFileSync(p, IMAGE_FILE.test(p) ? undefined : "utf8"));
     }
   };
   walk(root);
@@ -40,7 +42,7 @@ async function readRemote(repo, commit, sub) {
     if (e.type !== "blob" || !e.path.startsWith(sub)) continue;
     const raw = await fetch(`https://raw.githubusercontent.com/${repo}/${commit}/${e.path}`, { headers });
     if (!raw.ok) throw new Error(`${e.path}: HTTP ${raw.status}`);
-    files.set(e.path.slice(sub.length), await raw.text());
+    files.set(e.path.slice(sub.length), IMAGE_FILE.test(e.path) ? new Uint8Array(await raw.arrayBuffer()) : await raw.text());
   }
   return files;
 }
```

- [ ] **Step 2: Move the content pin and build**

Set `source.json`'s `commit` to the full sha of robertblust/mental-model `main` once the profile carries `image` (`gh api repos/robertblust/mental-model/commits/main --jq .sha`, after confirming `model/profiles/robert-blust/robert-blust.jpg` exists at it).

```bash
npm run -s model
ls -l images/profiles/
npm run -s model:check; echo "model:check $?"
git diff --stat model.json | tail -1
```

Expected: `wrote model.json: …`, one file `robert-blust.jpg` of 159,462 bytes (the owner's photo; another size if he chose another picture), `✓ … 1 image(s)`, `model:check 0`. `model.json` gains the `image` field on the profile and whatever else moved on the model's `main` since `00c4927`; read that diff, since a re-pin is editorial.

- [ ] **Step 3: Control the check**

```bash
cp images/profiles/robert-blust.jpg /tmp/held.jpg
echo x >> images/profiles/robert-blust.jpg; touch images/stray.png
npm run -s model:check; echo "model:check $?"
npm run -s model > /dev/null; npm run -s model:check > /dev/null; echo "after rebuild $?"
cmp images/profiles/robert-blust.jpg /tmp/held.jpg && rm /tmp/held.jpg; ls images
```

Expected: two `✗` lines, “is not the image the pinned model holds” and “images/stray.png is named by nothing in the pinned model”, and `model:check 1`; then `after rebuild 0`, `cmp` silent, and `images` holding only `profiles`.

- [ ] **Step 4: Say it in the agent file**

In `AGENTS.md`, append to the paragraph that opens `` `model.json` is the parsed model at the commit `` (same line):

```markdown
 The same run copies each picture the model names to `images/<entity id>.<extension>`, committed like `model.json` and held by `model:check` the same way: a copy that differs from the pinned commit's, one that is missing and one that nothing names each fail by name. The site serves its own copy so that a visitor's browser asks no third party for a picture, which is what the privacy page says.
```

- [ ] **Step 5: Commit**

Commit `build/read.mjs`, `build/model.mjs`, `source.json`, `model.json`, `images/` and `AGENTS.md`. The message says why the site copies rather than links, that the content pin moved and to what, and names the control in its `Verified:` line.

---

### Task 3: The person node names the picture

**Files:**

- Modify: `build/jsonld.mjs` (the `jsonld.mjs` hunks of the diff in Task 2 Step 1: `personOf`, `imageOf`, `alsoAt` reading through `personOf`, and `image` on the Person node)
- Modify: `build/renderers.test.mjs`
- Modify: every page `npm run pages` rewrites

- [ ] **Step 1: Write the failing tests**

In `build/renderers.test.mjs`, change the import to `import { writeJsonLd, alsoAt, imageOf } from "./jsonld.mjs";` and append:

```js
// The person's picture is this site's own copy, addressed as `npm run model` writes it: the
// profile's id and the extension the profile's `image` names.
test("imageOf is the address of the site's copy, and null where the profile names no image", () => {
  assert.equal(imageOf(PROFILE_FIXTURE), null);
  const pictured = { ...PROFILE_FIXTURE, entities: PROFILE_FIXTURE.entities.map((e) =>
    e.type === "profile" ? { ...e, fields: { image: "someone.jpg" } } : e) };
  assert.equal(imageOf(pictured), "https://blust.ch/images/profiles/someone.jpg");
});

test("the Person node carries image only where the profile names one", () => {
  const graphOf = (data) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "rb-ld-"));
    const doc = { "@context": "https://schema.org", "@graph": [
      { "@type": "Person", "@id": "https://blust.ch/#person" },
      { "@type": "Dataset", "@id": "https://blust.ch/#model" },
      { "@type": "WebSite", "@id": "https://blust.ch/#website" } ] };
    fs.writeFileSync(path.join(dir, "index.html"),
      `<head>\n<script type="application/ld+json">\n${JSON.stringify(doc, null, 2)}\n</script>\n</head>\n`);
    writeJsonLd(data, { check: false, root: dir, pages: ["index.html"] });
    return JSON.parse(fs.readFileSync(path.join(dir, "index.html"), "utf8")
      .match(/<script type="application\/ld\+json">\n([\s\S]*?)\n<\/script>/)[1])["@graph"];
  };
  assert.ok(!("image" in graphOf(PROFILE_FIXTURE)[0]));
  const pictured = { ...PROFILE_FIXTURE, entities: PROFILE_FIXTURE.entities.map((e) =>
    e.type === "profile" ? { ...e, fields: { image: "someone.png" } } : e) };
  assert.equal(graphOf(pictured)[0].image, "https://blust.ch/images/profiles/someone.png");
});
```

Run: `npm run -s test:build 2>&1 | grep -E "SyntaxError|^ℹ (pass|fail)"`

Expected: `SyntaxError: … does not provide an export named 'imageOf'`, `pass 0`, `fail 1`.

- [ ] **Step 2: Apply the `jsonld.mjs` hunks, run, rebuild the pages**

```bash
npm run -s test:build 2>&1 | grep -E "^ℹ (pass|fail)"
npm run -s pages | tail -1
grep -l '"image": "https://blust.ch/images/profiles/robert-blust.jpg"' index.html */index.html talks/*/index.html | wc -l
npm run -s pages:check > /dev/null; echo "pages:check $?"
```

Expected: `fail 0` with two more passing than before; every page that carries the Person node listed (eleven on the prototype); `pages:check 0`.

- [ ] **Step 3: Commit**

Commit `build/jsonld.mjs`, the test and the rewritten pages. The message says the node is written from the model on every page by the one generator, so it stays identical wherever its `@id` appears, and that a profile without a picture gets no `image` rather than an address nothing serves.

---

### Task 4: The pages declare their images, and a check asks the browser

**Files:**

- Modify: `model/index.html`, `team/index.html`, `surfaces/index.html`, `timeline/index.html` (the `data-stage` link)
- Modify: `verify/check.mjs` (a `picture` check, and `picture: true` on the `/model/` page)
- Modify: `sitemap.xml`

- [ ] **Step 1: Write the check first**

In `verify/check.mjs`, insert into the checks map directly above `async transport(page) {`:

```js
  // The card's picture is drawn at runtime from a file the model build copied, so nothing in
  // the markup fails when the copy is missing, the page forgot `data-images` or the card stopped
  // drawing it: the page would show a broken box or no face, and every other check stays green.
  // This opens the card of the first entity the model gives an image and asks the browser
  // whether the picture arrived. blust.ch's profile carries one, so a model with none fails too.
  async picture(page, spec) {
    const found = await page.evaluate(async () => {
      const link = document.querySelector("link[data-stage]");
      const data = await (await fetch(link.href)).json();
      const e = data.entities.find((x) => x.fields && x.fields.image);
      return { id: e ? e.id : null, declared: link.getAttribute("data-images") };
    });
    if (!found.id) return "the model gives no entity an image, and this page shows the person's";
    if (!found.declared) return "the data link declares no data-images, so no card draws a picture";
    await page.goto(BASE + spec.path + "?stage=expanded#" + found.id);
    try { await page.waitForSelector(".cbody .avatar", { timeout: 8000 }); }
    catch { return `the card of ${found.id} drew no picture`; }
    await page.waitForFunction(() => document.querySelector(".cbody .avatar").complete);
    const drawn = await page.evaluate(() => {
      const i = document.querySelector(".cbody .avatar"), r = i.getBoundingClientRect();
      return { natural: i.naturalWidth, w: r.width, h: r.height, alt: i.alt, src: i.getAttribute("src"),
               listed: [...document.querySelectorAll(".cbody dt")].some((d) => d.textContent === "image") };
    });
    if (!drawn.natural) return `${drawn.src} did not load`;
    if (drawn.w !== 64 || drawn.h !== 64) return `the picture is ${drawn.w}×${drawn.h}, expected 64×64`;
    if (!drawn.alt) return "the picture has no alt text";
    if (drawn.listed) return "the card lists `image` as a field under the picture it names";
    return null;
  },
```

and add `picture: true,` to the `/model/` page's entry, directly after its `fences: […],`.

- [ ] **Step 2: See it fail**

Serve the worktree on a free port and run the suite:

```bash
PORT=$(python3 -c 'import socket;s=socket.socket();s.bind(("127.0.0.1",0));print(s.getsockname()[1])')
python3 -m http.server $PORT --bind 127.0.0.1 > /dev/null 2>&1 & SERVER=$!
BASE=http://127.0.0.1:$PORT npm run -s verify 2>&1 | grep -A2 "✗ /model/"; kill $SERVER
```

Expected: `picture: the data link declares no data-images, so no card draws a picture`.

- [ ] **Step 3: Declare the images**

In each of the four pages, the one line `<link rel="preload" as="fetch" href="../model.json" data-stage crossorigin>` becomes:

```html
<link rel="preload" as="fetch" href="../model.json" data-stage data-images="../images/" crossorigin>
```

All four, not only `/model/`: a card is a card wherever it opens, and a later profile card on the timeline or the board should not depend on someone remembering this line.

- [ ] **Step 4: Run everything, and look**

```bash
npm run sitemap > /dev/null
PORT=$(python3 -c 'import socket;s=socket.socket();s.bind(("127.0.0.1",0));print(s.getsockname()[1])')
python3 -m http.server $PORT --bind 127.0.0.1 > /dev/null 2>&1 & SERVER=$!
BASE=http://127.0.0.1:$PORT npm run -s verify > /tmp/verify.out 2>&1; echo "verify $?"; kill $SERVER
tail -1 /tmp/verify.out
npm run -s og:check > /dev/null 2>&1; echo "og:check $?"
npm run -s design:check > /dev/null; echo "design:check $?"
npm run -s pin:check > /dev/null; echo "pin:check $?"
npm run -s test:dupes > /dev/null 2>&1; echo "dupes $?"
```

Expected: `verify 0` and `all checks pass`, then four zeros. Then open `http://127.0.0.1:<port>/model/?stage=expanded#profiles/robert-blust` on a server of your own and take a screenshot of the card in each theme for the pull request; the picture sits left of the name, round, with a hairline ring.

- [ ] **Step 5: Commit, push, open the pull request, then stop**

Commit the four pages, `verify/check.mjs` and `sitemap.xml`. Push with the credential helper. Read the last two merged pull request bodies and match their shape; link robertblust/design's and robertblust/mental-model's pull requests and companygraph/meta-model#136. Watch `gh pr checks --watch` and report. Merging is the owner's word, and the page is live on the merge, so say in the report that the picture publishes with it.

---

## What this plan does not do

companygraph.io and guestgraph.io take design v0.74.0 with their next re-pin and copy no images until a profile of theirs carries one. The MCP servers' `image_url` and the Obsidian plugin's avatar are their own plans. The `/team/` board names the Owner's holder in text, and a small picture there is a separate idea.
