# The talk prices a team — implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A bilingual companion page at `/talks/deciding-well/cost/` that prices the talk's result as a Swiss delivery team and as it happened, computed in the browser from `stats.json` and a new `cost.json`, linked from slides 05 and 11 of the deck.

**Architecture:** Counts stay in `stats.json`, which `stats.py` extends with lines of code and active days without recounting anything else. Estimates and the owner's figures live in `cost.json`, numbers only. The page is a prose page on the privacy page's shell; every sentence is markup with `data-de`, and every number is an empty `<span data-v="…">` that `cost/cost.mjs` fills after each language switch. The arithmetic is one pure function, `compute()`, tested with `node --test`.

**Tech Stack:** Python 3 unittest (the talk's scripts), plain ES modules and `node --test` (the page's arithmetic), the site's `tokens.css`, `page.css`, `page.js`, Playwright via `npm run verify`.

**Spec:** `docs/superpowers/specs/2026-09-25-the-talk-prices-a-team-design.md`

## Global constraints

- No external assets: no Google Fonts, no CDN; fonts from `../../../fonts/` through `tokens.css`.
- Every number the page prints is read from `stats.json`, `decisions.json` or `cost.json`; no digit of a result is typed into the markup.
- Every figure is marked counted or estimated; the owner's rate is labeled "a lead architect's market rate" and never as his own.
- No revenue, margin or income anywhere on the page.
- English is en-US in the markup; German is de-CH in `data-de`, made only after the owner has reviewed the English, by translator, editor and back-reader.
- English numbers group by comma (`1,235,443`), German by the typographic apostrophe (`1’235’443`).
- Nothing opens in a new tab on the page; inside a slide, links open in a new tab as slide 11's already do.
- Mono is for data only: values in tables may be mono, labels and prose never.
- The page stores nothing; the privacy page's list of storage keys does not change.
- Commits in the git register of `WRITING.md`, ending `Verified:` and the `Co-Authored-By` trailer; the pull request is opened and not merged.

## Deviations from the spec, for the owner at this gate

Four details the spec left open are settled here; Task 1 writes them back into the spec so the two agree.

1. **Nothing is stored.** The spec allowed storing the reader's choices. The page resets to the defaults on every visit instead, so the privacy page stays true without an edit.
2. **Hosts are left out of the facts.** `stats.json` does not carry the count of live hosts, and the deck types it; the page shows ten facts that are all in the files.
3. **The team's tools are licences only**, CHF 60 per person-month. The agentic hosting is CHF 0 because of the free tier, and a team's services would sit in the same free tier.
4. **Slide 11 gets a seventh reading, in "The proof" column.** The grid flows by column so the argument and the answer keep two entries each and the proof gets three.

## Review focus

- A reader switches to German after moving a slider: every number must re-render in the German form, and no slot may be left empty. Pinned in Task 4, step 1.
- `cost.json` and `stats.json` fail to load (a stale cache or an offline copy): the page must say so in both languages rather than show empty spans. Pinned in Task 4, step 1.
- The workstreams and the roster drift apart after an edit to `cost.json`: a test must fail. Pinned in Task 2.
- A slider at its extreme (6 or 14 hours, owner share 30% or 100%): the ratio must stay finite and every bar must stay inside its track. Pinned in Task 3.
- A later `stats.py` run on another day must not change the new figures: line counts read the tree at the cutoff commit, not the working copy. Pinned in Task 1.

---

## File structure

| File | Responsibility |
| --- | --- |
| `talks/deciding-well/stats.py` | adds `line_counts()`, `active_days()` and an `--extend` mode that adds both to the existing `stats.json` |
| `talks/deciding-well/test_stats.py` | tests for the two new functions |
| `talks/deciding-well/cost.json` | every estimate and owner's figure, dated, numbers only |
| `talks/deciding-well/test_cost.py` | holds `cost.json` together: totals, required keys, the owner's figures |
| `talks/deciding-well/cost/cost.mjs` | `compute()` and `money()`, pure; `render()` for the page |
| `talks/deciding-well/cost/cost.test.mjs` | `node --test` over `compute()` and `money()` |
| `talks/deciding-well/cost/index.html` | the page: shell, prose, slots, controls |
| `talks/deciding-well/index.html` | slide 05 line and note, slide 11 entry |
| `verify/check.mjs`, `og-recipe.mjs`, `build/jsonld.mjs`, `package.json`, `.github/workflows/ci.yml` | registration and the new test step |
| `talks/deciding-well/README.md` | the page and `cost.json` described |

---

### Task 1: The spec takes the four deviations, and `stats.py` counts lines and active days

**Files:**

- Modify: `docs/superpowers/specs/2026-09-25-the-talk-prices-a-team-design.md`
- Modify: `talks/deciding-well/stats.py`
- Test: `talks/deciding-well/test_stats.py`
- Modify (generated): `talks/deciding-well/stats.json`

**Interfaces:**

- Produces: `stats.json` keys `code` = `{"repos": [{"repo", "code", "test", "markdown"}], "totals": {"code", "test", "markdown"}}` and `activeDays` = `{"peakFrom": "2026-08-17", "early": int, "peak": int, "peakDays": int}`.

- [ ] **Step 1: Write the deviations into the spec.** In §2 replace the sentence "The defaults are the figures above; nothing the reader changes is stored except the choices themselves, per visitor, under the family's storage rules." with "The defaults are the figures above, and the page stores nothing: every visit starts from them, so the privacy page's list of what is stored stays as it is." In §3's "What was built" row write "Ten counted facts in a grid, each read from `stats.json` or `decisions.json`". In §1 add a row `| The team's tools | estimated | licences at CHF 60 per person-month; hosting at CHF 0 on both sides, in the same free tier |`. In §4's deck bullet write "one entry on slide 11, in the proof column, which then flows by column".

- [ ] **Step 2: Write the failing tests** — append to `test_stats.py` inside `class Stats`:

```python
    def test_line_counts_split_code_test_and_markdown(self):
        files = {"src/a.ts": "x\n\ny\n", "test/a.test.ts": "t\n", "e2e/run.mjs": "e\n",
                 "README.md": "# t\n\nbody\n", "package-lock.json": "{\n}\n", "vendor/v.js": "v\n",
                 "dist/d.js": "d\n", "lib/x.min.js": "m\n", "img.png": "\x89PNG"}
        self.assertEqual(stats.line_counts(files), {"code": 2, "test": 2, "markdown": 2})

    def test_active_days_split_at_the_peak(self):
        daily = [{"date": "2026-08-15", "commits": 3}, {"date": "2026-08-16", "commits": 0},
                 {"date": "2026-08-17", "commits": 1}, {"date": "2026-08-18", "commits": 0}]
        self.assertEqual(stats.active_days(daily, "2026-08-17"),
                         {"peakFrom": "2026-08-17", "early": 1, "peak": 1, "peakDays": 2})

    def test_extend_keeps_every_existing_figure(self):
        old = {"totals": {"commits": 5}, "daily": [{"date": "2026-08-17", "commits": 1}]}
        new = stats.extend(old, code={"repos": [], "totals": {"code": 1, "test": 0, "markdown": 0}})
        self.assertEqual(new["totals"], {"commits": 5})
        self.assertEqual(new["activeDays"]["peak"], 1)
        self.assertEqual(new["code"]["totals"]["code"], 1)
```

- [ ] **Step 3: Run them to see them fail**

Run: `cd talks/deciding-well && python3 -m unittest test_stats -v`

Expected: three errors, `AttributeError: module 'stats' has no attribute 'line_counts'` and the like.

- [ ] **Step 4: Implement** — add to `stats.py` after `docs()`:

```python
CODE = {".js", ".mjs", ".cjs", ".ts", ".tsx", ".py", ".java", ".kt", ".css", ".sh", ".go", ".sql",
        ".yml", ".yaml", ".html", ".svelte", ".vue"}
SKIP = re.compile(r"(^|/)(vendor|dist|node_modules)/|package-lock\.json$|pnpm-lock|yarn\.lock$|\.min\.js$")
TESTISH = re.compile(r"test|e2e", re.I)
PEAK_FROM = "2026-08-17"

def line_counts(files):
    """Non-blank lines by kind. A path naming a test or e2e counts as test; lockfiles, vendored
    and built files count as nothing, because nobody wrote them."""
    c = collections.Counter({"code": 0, "test": 0, "markdown": 0})
    for path, text in files.items():
        if SKIP.search(path):
            continue
        ext = os.path.splitext(path)[1].lower()
        n = sum(1 for l in text.split("\n") if l.strip())
        if ext == ".md":
            c["markdown"] += n
        elif ext in CODE:
            c["test" if TESTISH.search(path) else "code"] += n
    return dict(c)

def tree_texts(gitdir, ref):
    """Every text file of the tree at ref, read in one cat-file batch. Blobless clones fetch the
    blobs they lack on first read, which is slow once and cached after."""
    names = [f for f in run("git", "--git-dir", gitdir, "ls-tree", "-r", "--name-only", ref).split("\n") if f]
    wanted = [f for f in names if os.path.splitext(f)[1].lower() in CODE | {".md"} and not SKIP.search(f)]
    batch = "".join(f"{ref}:{f}\n" for f in wanted)
    out = subprocess.run(["git", "--git-dir", gitdir, "cat-file", "--batch"], input=batch.encode(),
                         capture_output=True, check=True).stdout
    texts, i = {}, 0
    for f in wanted:
        header_end = out.index(b"\n", i)
        size = int(out[i:header_end].split()[2])
        texts[f] = out[header_end + 1:header_end + 1 + size].decode("utf-8", "ignore")
        i = header_end + 1 + size + 1
    return texts

def active_days(daily, peak_from=PEAK_FROM):
    early = [d for d in daily if d["date"] < peak_from]
    peak = [d for d in daily if d["date"] >= peak_from]
    return {"peakFrom": peak_from, "early": sum(1 for d in early if d["commits"]),
            "peak": sum(1 for d in peak if d["commits"]), "peakDays": len(peak)}

def extend(old, code):
    return dict(old, code=code, activeDays=active_days(old["daily"]))

def count_code():
    """Only the repositories this effort created: two older ones predate START and are not its work."""
    rows, tot = [], collections.Counter()
    for r in repos():
        if r["createdAt"][:10] < START:
            continue
        g = bare(r["nameWithOwner"])
        ref = tip(g)
        c = line_counts(tree_texts(g, ref)) if ref else {"code": 0, "test": 0, "markdown": 0}
        rows.append(dict(repo=r["nameWithOwner"], **c))
        tot.update(c)
    return {"repos": rows, "totals": dict(tot)}
```

Replace the tail of the file with:

```python
if __name__ == "__main__":
    import sys
    if "--extend" in sys.argv:
        out = extend(load_stats(), count_code())
        (HERE / "stats.json").write_text(json.dumps(out, indent=1) + "\n")
        print(out["code"]["totals"], out["activeDays"])
    else:
        main()
```

Add one line to `main()`'s `out` dict, `"activeDays": active_days(daily_series(alldays, START, CUTOFF)),`, and after it `out["code"] = count_code()`, so a full run writes both too. Add to the module docstring: `  ./stats.py --extend   # adds lines of code and active days to the stats.json already there`.

- [ ] **Step 5: Run the tests to see them pass**

Run: `cd talks/deciding-well && python3 -m unittest discover -p 'test_*.py' -v`

Expected: all pass, including the deck's figure tests.

- [ ] **Step 6: Extend the snapshot**

Run: `cd talks/deciding-well && ./stats.py --extend`

Expected: prints totals near `{'code': 84000, 'test': 36000, 'markdown': 93000}` (the draft's hand count over 19 repositories; the script counts 21, the two `.github` profiles included, at the cutoff commit) and `{'peakFrom': '2026-08-17', 'early': 26, 'peak': 38, 'peakDays': 39}`. Then `git diff --stat talks/deciding-well/stats.json` shows only additions, and `python3 -c "import json;d=json.load(open('talks/deciding-well/stats.json'));print(d['totals']['commits'])"` still prints `5065`.

- [ ] **Step 7: Commit**

```bash
git add docs/superpowers/specs/2026-09-25-the-talk-prices-a-team-design.md talks/deciding-well/stats.py talks/deciding-well/test_stats.py talks/deciding-well/stats.json
git commit -F - <<'EOF'
The talk's snapshot counts lines of code and active days

The cost page prices what was built and the hours it took, and both have to come from the snapshot rather than from a hand count. stats.py now counts non-blank lines of code, tests and Markdown in the tree each repository had at the cutoff, and the days with a commit before and from 17 Aug; --extend adds them to the stats.json already there without recounting anything else. The spec takes the four details the plan settled.

Verified: the talk's Python tests pass, and every existing figure in stats.json is unchanged.

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>
EOF
```

---

### Task 2: `cost.json` holds the estimates and the owner's figures

**Files:**

- Create: `talks/deciding-well/cost.json`
- Test: `talks/deciding-well/test_cost.py`

**Interfaces:**

- Produces: `cost.json` in exactly this shape; Task 3 reads every key named here.

- [ ] **Step 1: Write the failing test** — `talks/deciding-well/test_cost.py`:

```python
"""cost.json holds every estimate the cost page shows, and holds together.

The page computes its totals from this file, so a workstream edited without its role, or an
owner's figure mistyped, renders a plausible page with a wrong number. These tests read the file."""
import json, pathlib, unittest

HERE = pathlib.Path(__file__).resolve().parent
COST = json.loads((HERE / "cost.json").read_text())

class Cost(unittest.TestCase):
    def test_workstreams_and_roster_are_the_same_effort(self):
        self.assertEqual(sum(w["pm"] for w in COST["workstreams"]), sum(r["pm"] for r in COST["roles"]))

    def test_every_role_and_workstream_has_an_id(self):
        ids = [r["id"] for r in COST["roles"]] + [w["id"] for w in COST["workstreams"]]
        self.assertEqual(len(ids), len(set(ids)))

    def test_the_owners_figures(self):
        t = COST["tools"]
        self.assertEqual((t["subscription"]["usd"], t["subscription"]["vat"]), (750, True))
        self.assertEqual((t["voice"]["usd"], t["voice"]["vat"]), (50, False))
        self.assertEqual((t["chatApi"]["usd"], t["chatApi"]["vat"]), (20, True))
        self.assertEqual(t["hosting"]["chf"], 0)
        self.assertEqual(COST["owner"]["earlyHours"], 5)
        self.assertEqual(COST["owner"]["peakHours"], 8)

    def test_scenarios_and_default(self):
        self.assertEqual(COST["scenarios"]["default"], "expected")
        self.assertEqual(COST["scenarios"]["expected"], {"factor": 1.0, "months": 9})

    def test_every_value_names_its_kind(self):
        for name, t in COST["tools"].items():
            with self.subTest(name):
                self.assertIn(t["kind"], {"owner", "counted", "estimated"})

    def test_it_is_dated(self):
        self.assertEqual(COST["date"], "2026-09-25")

if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run it to see it fail**

Run: `cd talks/deciding-well && python3 -m unittest test_cost -v`

Expected: `FileNotFoundError` for `cost.json`.

- [ ] **Step 3: Write `cost.json`**

```json
{
 "date": "2026-09-25",
 "usdChf": 0.80,
 "vat": 0.081,
 "hoursPerMonth": 150,
 "yearHours": 1800,
 "employerLoad": 1.30,
 "agenticMonths": 3.5,
 "licenceChfPerPersonMonth": 60,
 "scenarios": {
  "default": "expected",
  "lean": {"factor": 0.7, "months": 7},
  "expected": {"factor": 1.0, "months": 9},
  "conservative": {"factor": 1.3, "months": 12}
 },
 "roles": [
  {"id": "lead", "pm": 9, "salary": 165000, "rate": 190},
  {"id": "backend", "pm": 24, "salary": 140000, "rate": 160},
  {"id": "frontend", "pm": 16, "salary": 135000, "rate": 150},
  {"id": "ux", "pm": 4, "salary": 120000, "rate": 140},
  {"id": "devops", "pm": 4, "salary": 145000, "rate": 160},
  {"id": "qa", "pm": 7, "salary": 115000, "rate": 130},
  {"id": "analyst", "pm": 3, "salary": 125000, "rate": 150},
  {"id": "writer", "pm": 4, "salary": 105000, "rate": 120},
  {"id": "delivery", "pm": 5, "salary": 145000, "rate": 160}
 ],
 "owner": {"salary": 180000, "rate": 190, "share": 0.6, "earlyHours": 5, "peakHours": 8},
 "workstreams": [
  {"id": "engine", "pm": 14},
  {"id": "design", "pm": 11},
  {"id": "sites", "pm": 10},
  {"id": "metamodel", "pm": 8},
  {"id": "plugin", "pm": 6},
  {"id": "ws-qa", "pm": 6},
  {"id": "ws-delivery", "pm": 6},
  {"id": "mcp", "pm": 5},
  {"id": "platform", "pm": 4},
  {"id": "chat", "pm": 3},
  {"id": "models", "pm": 3}
 ],
 "tools": {
  "subscription": {"kind": "owner", "usd": 750, "vat": true},
  "voice": {"kind": "owner", "usd": 50, "vat": false},
  "chatApi": {"kind": "owner", "usd": 20, "vat": true},
  "hosting": {"kind": "counted", "chf": 0},
  "domains": {"kind": "estimated", "chf": 90}
 },
 "gaps": [
  {"id": "review", "chf": 15000},
  {"id": "usability", "chf": 12000},
  {"id": "maintainer", "chf": 20000}
 ]
}
```

Workstream ids carry a `ws-` prefix where a role has the same name, because the test in step 1 holds roles and workstreams to one list of ids.

- [ ] **Step 4: Run the tests to see them pass**

Run: `cd talks/deciding-well && python3 -m unittest discover -p 'test_*.py' -v`

Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add talks/deciding-well/cost.json talks/deciding-well/test_cost.py
git commit -F - <<'EOF'
The talk's estimates live in cost.json beside the counts

The cost page mixes counts from git with estimates, and the estimates need a file of their own so that one can be changed without touching a count, and so that nobody mistakes one for the other. cost.json holds the team, the rates, the scenarios, the owner's hours and the paid tools as the owner gave them, numbers only; the page's words stay in its markup, where the German pipeline reaches them.

Verified: the talk's Python tests pass, including the new ones holding cost.json together.

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>
EOF
```

---

### Task 3: `compute()` and `money()` do the arithmetic, tested

**Files:**

- Create: `talks/deciding-well/cost/cost.mjs`
- Test: `talks/deciding-well/cost/cost.test.mjs`
- Modify: `package.json` (script `test:cost`), `.github/workflows/ci.yml` (one step)

**Interfaces:**

- Consumes: `cost.json` from Task 2, `stats.json` keys `activeDays` from Task 1 and `tokens.listPriceUsd`.
- Produces: `export function compute(cost, stats, opts)` with `opts = {lens: "inhouse"|"contract", scenario: "lean"|"expected"|"conservative", peakHours: number, share: number}` returning `{months, factor, roles: [{id, pm, fte, hourly, cost}], team, teamPm, teamFte, ownerHourly, convOwnerHours, convOwner, convTools, conv, agHours, agEarly, agPeak, agOwner, subscription, voice, chatApi, hosting, domains, agTools, ag, ratio, saved, faster, listAg, listRatio, gaps, gapAg, gapRatio, workstreams: [{id, pm}]}`; `export function money(n, lang)` returning `"CHF 1,235,443"` or `"CHF 1’235’443"`; `export function num(n, lang, digits = 0)`.

- [ ] **Step 1: Write the failing test** — `talks/deciding-well/cost/cost.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { compute, money, num } from "./cost.mjs";

const cost = JSON.parse(readFileSync(new URL("../cost.json", import.meta.url)));
const stats = JSON.parse(readFileSync(new URL("../stats.json", import.meta.url)));
const DEF = { lens: "inhouse", scenario: "expected", peakHours: 8, share: 0.6 };

test("the defaults give the figures the spec was approved with", () => {
  const c = compute(cost, stats, DEF);
  assert.equal(Math.round(c.team), 1125583);
  assert.equal(Math.round(c.conv), 1235443);
  assert.equal(c.agHours, 434);
  assert.equal(Math.round(c.agTools), 796);
  assert.equal(Math.round(c.ag), 57216);
  assert.equal(Math.round(c.ratio), 22);
  assert.equal(Math.round(c.gapRatio), 12);
});

test("contractor rates and the scenarios move the team, never the agentic hours", () => {
  const a = compute(cost, stats, { ...DEF, lens: "contract" });
  assert.equal(Math.round(a.team), 1768500);
  const lean = compute(cost, stats, { ...DEF, scenario: "lean" });
  const cons = compute(cost, stats, { ...DEF, scenario: "conservative" });
  assert.equal(lean.months, 7);
  assert.equal(cons.months, 12);
  assert.ok(lean.conv < compute(cost, stats, DEF).conv && cons.conv > compute(cost, stats, DEF).conv);
  assert.equal(lean.agHours, cons.agHours);
});

test("the sliders at their ends keep every figure finite and positive", () => {
  for (const peakHours of [6, 14]) for (const share of [0.3, 1]) {
    const c = compute(cost, stats, { ...DEF, peakHours, share });
    for (const k of ["conv", "ag", "ratio", "gapRatio", "listRatio"]) {
      assert.ok(Number.isFinite(c[k]) && c[k] > 0, `${k} at ${peakHours} h, ${share}`);
    }
  }
});

test("the workstreams add up to the roster in every scenario", () => {
  for (const scenario of ["lean", "expected", "conservative"]) {
    const c = compute(cost, stats, { ...DEF, scenario });
    const ws = c.workstreams.reduce((a, w) => a + w.pm, 0);
    assert.ok(Math.abs(ws - c.teamPm) < 1e-9);
  }
});

test("money and numbers group the way each language writes them", () => {
  assert.equal(money(1235443.4, "en"), "CHF 1,235,443");
  assert.equal(money(1235443.4, "de"), "CHF 1’235’443");
  assert.equal(num(8.4, "en", 1), "8.4");
  assert.equal(num(8.4, "de", 1), "8,4");
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `node --test talks/deciding-well/cost/`

Expected: fails with `Cannot find module …/cost.mjs`.

- [ ] **Step 3: Implement `cost.mjs`**

```js
// The cost page's arithmetic. Pure: it reads cost.json and stats.json as given and returns
// numbers, so node --test holds it and the page only formats and places what it returns.

export function compute(cost, stats, { lens, scenario, peakHours, share }) {
  const sc = cost.scenarios[scenario];
  const hourly = (salary, rate) => lens === "inhouse" ? salary * cost.employerLoad / cost.yearHours : rate;
  const H = cost.hoursPerMonth;
  const roles = cost.roles.map(r => {
    const pm = r.pm * sc.factor, h = hourly(r.salary, r.rate);
    return { id: r.id, pm, fte: pm / sc.months, hourly: h, cost: pm * H * h };
  });
  const team = roles.reduce((a, r) => a + r.cost, 0);
  const teamPm = roles.reduce((a, r) => a + r.pm, 0);
  const ownerHourly = hourly(cost.owner.salary, cost.owner.rate);
  const convOwnerHours = share * sc.months * H;
  const convOwner = convOwnerHours * ownerHourly;
  const convTools = teamPm * cost.licenceChfPerPersonMonth + cost.tools.hosting.chf;
  const conv = team + convOwner + convTools;

  const d = stats.activeDays;
  const agEarly = d.early * cost.owner.earlyHours, agPeak = d.peak * peakHours;
  const agHours = agEarly + agPeak;
  const agOwner = agHours * ownerHourly;
  const chf = t => t.usd * (t.vat ? 1 + cost.vat : 1) * cost.usdChf;
  const subscription = chf(cost.tools.subscription), voice = chf(cost.tools.voice), chatApi = chf(cost.tools.chatApi);
  const hosting = cost.tools.hosting.chf, domains = cost.tools.domains.chf;
  const agTools = subscription + voice + chatApi + hosting + domains;
  const ag = agOwner + agTools;

  const listAg = ag - subscription + stats.tokens.listPriceUsd * cost.usdChf;
  const gaps = cost.gaps.reduce((a, g) => a + g.chf, 0);
  return {
    months: sc.months, factor: sc.factor, roles, team, teamPm, teamFte: teamPm / sc.months,
    ownerHourly, convOwnerHours, convOwner, convTools, conv,
    agHours, agEarly, agPeak, agOwner, subscription, voice, chatApi, hosting, domains, agTools, ag,
    ratio: conv / ag, saved: conv - ag, faster: sc.months / cost.agenticMonths,
    listAg, listRatio: conv / listAg, gaps, gapAg: ag + gaps, gapRatio: conv / (ag + gaps),
    workstreams: cost.workstreams.map(w => ({ id: w.id, pm: w.pm * sc.factor })),
  };
}

const LOCALE = { en: "en-US", de: "de-CH" };

export function num(n, lang, digits = 0) {
  const s = new Intl.NumberFormat(LOCALE[lang], { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n);
  // de-CH groups by U+2019 in current engines and by an ASCII apostrophe in older ones; the
  // page writes the typographic one everywhere, as WRITING.md sets.
  return lang === "de" ? s.replace(/'/g, "’") : s;
}

export function money(n, lang) {
  return "CHF " + num(Math.round(n), lang);
}
```

- [ ] **Step 4: Run the tests to see them pass**

Run: `node --test talks/deciding-well/cost/`

Expected: 5 tests pass. `money(…, "de")` must give `’`; if the Node build lacks full ICU the replace still yields it.

- [ ] **Step 5: Wire the test into the scripts and CI.** In `package.json` add `"test:cost": "node --test talks/deciding-well/cost/"` after `"test:dupes"`. In `.github/workflows/ci.yml`, directly after the step `- run: npm ci`, add:

```yaml
      # The cost page computes every figure it prints; this holds the arithmetic to the figures
      # the spec was approved with. It reads two JSON files and needs no browser.
      - name: The cost page's arithmetic
        run: npm run test:cost
```

- [ ] **Step 6: Commit**

```bash
git add talks/deciding-well/cost/cost.mjs talks/deciding-well/cost/cost.test.mjs package.json .github/workflows/ci.yml
git commit -F - <<'EOF'
The cost page's arithmetic is one tested function

Every figure the page prints is computed from cost.json and stats.json, so the computation is where a wrong number would come from. compute() does all of it and nothing else, money() and num() write numbers the way each language groups them, and node --test holds the defaults to the figures the spec was approved with, the scenarios to their direction and the sliders' ends to finite values. CI runs it after npm ci.

Verified: npm run test:cost passes, 5 tests.

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>
EOF
```

---

### Task 4: The page, in English

**Files:**

- Create: `talks/deciding-well/cost/index.html`
- Modify: `talks/deciding-well/cost/cost.mjs` (adds `render()` and the boot)
- Modify: `verify/check.mjs` (a `PAGES` entry)

**Interfaces:**

- Consumes: `compute`, `money`, `num` from Task 3; the slot names below.
- Produces: slots `<span data-v="NAME">` for NAME in `conv, convFte, convMonths, ag, agMonths, agHours, ratio, saved, faster, fRepos, fCommits, fMerged, fReleases, fCode, fTest, fMarkdown, fSpecs, fDecisions, fClaude, bConvOwner, bConvOwnerH, bTeam, bTeamPm, bConvTools, bConvTotal, bAgOwner, bAgOwnerH, bAgTools, bAgTotal, oConvH, oAgH, rTeamFte, rTeamPm, rTeamCost, rOwnerShare, rOwnerPm, rOwnerRate, rOwnerCost, aPeakDays, aPeakH, aPeak, aEarlyDays, aEarlyH, aEarly, aSub, aVoice, aChat, aHosting, aDomains, aTotal, listUsd, listAg, listRatio, toolsShare, gapAg, gapRatio, gaps, qSpecs, qPlans, qDecisions, qRevised, qDropped, qReverts, qCommits, qClosed, qTestShare, uSub, uVoice, uChat, vat, mLoad, mYearH, mSenior, mRateLo, mRateHi, mOwnerSalary, mOwnerRate, mFx, locPerPm`, plus per-row cells `<td data-role="ID" data-c="fte|pm|rate|cost">` and bars `<div class="bar" data-ws="ID">`. Task 5 adds `data-de` to every element that has English text and no slot of its own.

- [ ] **Step 1: Add the page's behaviour tests to `verify/check.mjs`.** Insert after the `/talks/deciding-well/` entry:

```js
  // The deciding-well talk's cost page. Every figure it prints is computed from stats.json,
  // decisions.json and cost.json by talks/deciding-well/cost/cost.mjs, whose arithmetic
  // `npm run test:cost` holds; this holds what the page does with it: no slot left empty in
  // either language, the defaults shown, and a failed load said rather than shown blank.
  { path: "/talks/deciding-well/cost/", typography: true, storageKeys: true, mobileNav: true, carriesLang: true, headerBaseline: true, navOrder: true, headerFits: true, footer: FOOTER, seo: true, noNewTab: true, title: /would have cost/i, lang: "en", sourceLang: "en", card: true,
    contains: ["What a team", "Would both approaches produce the same result?"],
    slotsFilled: { en: ["CHF 1,235,443", "CHF 57,216", "22"], de: ["CHF 1’235’443", "CHF 57’216"] },
    sameOrigin: true,
    fontsLoaded: ["Bricolage Grotesque", "Instrument Sans"], fontsAvailable: true,
    // See the note on /privacy/'s entry.
    tokens: true, sky: true, header: true, monoScope: true, monoDefined: true, contrast: true, noFlash: "theme", tokenVersion: true, fences: [],
    internalLinks: true },
```

Then add the check it names to the `CHECKS` object, after `...pageChecks({ SITE, BASE }),`. A local check is `async name(page, spec)` and returns a sentence on failure or `null`:

```js
  // The cost page computes every number it prints after three fetches land, so a figure the
  // page lost is an empty slot, and a figure in the wrong language form is a slot the switch
  // never re-rendered. Both render fine and pass every other check.
  async slotsFilled(page, spec) {
    const ready = () => page.waitForFunction(() => document.querySelector('[data-v="ag"]').textContent.trim() !== "");
    const read = () => page.evaluate(() => ({
      empty: [...document.querySelectorAll("[data-v]")].filter(e => !e.textContent.trim()).map(e => e.dataset.v),
      text: document.querySelector("main").innerText }));
    await ready();
    let r = await read();
    if (r.empty.length) return `empty slots in English: ${r.empty.join(", ")}`;
    for (const f of spec.slotsFilled.en) if (!r.text.includes(f)) return `the English page does not show ${f}`;
    await page.click("#lde");
    await page.$eval("#peak", e => { e.value = "14"; e.dispatchEvent(new Event("input")); });
    await page.$eval("#peak", e => { e.value = "8"; e.dispatchEvent(new Event("input")); });
    r = await read();
    if (r.empty.length) return `empty slots in German after a slider moved: ${r.empty.join(", ")}`;
    for (const f of spec.slotsFilled.de) if (!r.text.includes(f)) return `the German page does not show ${f}`;
    await page.click("#len");
    await page.route("**/cost.json", route => route.abort());
    await page.goto(BASE + spec.path);
    await page.waitForFunction(() => !document.getElementById("costerr").hidden);
    await page.unroute("**/cost.json");
    await page.goto(BASE + spec.path);
    return null;
  },
```

- [ ] **Step 2: Run verify to see the new entry fail**

Run: `npm ci && (python3 -m http.server 8000 >/dev/null 2>&1 &) && npm run verify`

Expected: the `/talks/deciding-well/cost/` entry fails on `title`, `contains` and `slotsFilled` because the page does not exist; everything else passes.

- [ ] **Step 3: Write the page.** Copy `privacy/index.html` to `talks/deciding-well/cost/index.html`, then:

1. Replace every `../` path prefix with `../../../` (tokens.css, page.css, page.js, chat.js, favicon, fonts, nav links, footer links), and the privacy page's own footer link with `<span><a href="../../../privacy/" data-de="Datenschutz">Privacy</a></span>`.
2. In the head: `<title>What a team would have cost — Robert Blust</title>`; description, `og:title`, `og:description`: "The deciding-well talk's result priced twice: as a Swiss delivery team and as it happened with agentic AI, with the owner's hours counted in both."; canonical and `og:url` `https://blust.ch/talks/deciding-well/cost/`; `og:image` `https://blust.ch/talks/deciding-well/cost/og.png`, `og:image:alt` "What a team would have cost."; the `WebPage` node named "What a team would have cost" at that URL with its breadcrumb Home › Talks › Building fast is solved. Deciding well is not. › What a team would have cost.
3. The page's `UI` object gets `en: {title: "What a team would have cost — Robert Blust", desc: <the description>}`, and `de` the same English until Task 5.
4. `applyLang` ends with `if (window.rbCost) window.rbCost.render(lang);`.
5. Before `<script src="../../../page.js" defer>` add `<script type="module" src="cost.mjs"></script>`.
6. Replace `<main>…</main>` with the body below.

```html
<main>
  <div class="shell">
    <div class="title">
      <h1><span class="r70">What a team</span><span class="rcl">would have <em>cost</em>.</span></h1>
      <p class="tagline">The talk’s result priced twice: as a Swiss delivery team, and as it happened with agentic AI. The owner’s hours count in both.</p>
      <p class="note">Counts are from git as of Sep 24, 2026, like every figure in <a href="../">the talk</a>. Estimates are marked, stated with their basis, and can be changed below.</p>
    </div>

    <p class="costerr" id="costerr" hidden>The figures did not load, so this page shows none. Reload it, or read them in stats.json and cost.json beside the talk.</p>

    <section class="assume" aria-label="Assumptions">
      <div class="ctl"><span class="lbl">Price labor as</span>
        <div class="seg" role="group" id="lens"><button type="button" data-v-lens="inhouse" aria-pressed="true">Employer cost</button><button type="button" data-v-lens="contract" aria-pressed="false">Contractor rates</button></div></div>
      <div class="ctl"><span class="lbl">Team estimate</span>
        <div class="seg" role="group" id="scen"><button type="button" data-v-scen="lean" aria-pressed="false">Lean</button><button type="button" data-v-scen="expected" aria-pressed="true">Expected</button><button type="button" data-v-scen="conservative" aria-pressed="false">Conservative</button></div></div>
      <div class="ctl"><label class="lbl" for="peak">Owner’s hours a day, from Aug 17</label>
        <span class="rng"><input type="range" id="peak" min="6" max="14" step="1" value="8"><output for="peak" id="peakOut"></output></span></div>
      <div class="ctl"><label class="lbl" for="share">Owner’s share of the team’s months</label>
        <span class="rng"><input type="range" id="share" min="0.3" max="1" step="0.1" value="0.6"><output for="share" id="shareOut"></output></span></div>
    </section>

    <section class="verdict">
      <div><span class="lbl">Conventional team <i class="kind est">estimated</i></span><b data-v="conv"></b><span><span data-v="convFte"></span> FTE on average for <span data-v="convMonths"></span> months, plus the owner</span></div>
      <div><span class="lbl">Agentic AI, as it happened</span><b data-v="ag"></b><span>One person and agents, about <span data-v="agMonths"></span> months, <span data-v="agHours"></span> owner hours</span></div>
      <div><span class="lbl">Difference</span><b><span data-v="ratio"></span>× cheaper</b><span><span data-v="saved"></span> less, about <span data-v="faster"></span>× faster</span></div>
    </section>

    <section>
      <h2>What was built</h2>
      <p class="lede">Both bills buy the same result: two products, CompanyGraph and GuestGraph, and this site on a model of its own. Every figure here is counted.</p>
      <div class="facts">
        <div><b data-v="fRepos"></b><span>public repositories</span></div>
        <div><b data-v="fCommits"></b><span>commits on default branches</span></div>
        <div><b data-v="fMerged"></b><span>merged pull requests</span></div>
        <div><b data-v="fReleases"></b><span>releases</span></div>
        <div><b data-v="fClaude"></b><span>of the commits written with Claude</span></div>
        <div><b data-v="fCode"></b><span>lines of code</span></div>
        <div><b data-v="fTest"></b><span>lines of tests</span></div>
        <div><b data-v="fMarkdown"></b><span>lines of Markdown</span></div>
        <div><b data-v="fSpecs"></b><span>specs</span></div>
        <div><b data-v="fDecisions"></b><span>decisions recorded in them</span></div>
      </div>
    </section>

    <section>
      <h2>The two bills</h2>
      <p class="lede">One scale for both. The owner’s hours are the same color in both, because they are paid in both.</p>
      <div class="legend"><span><i class="sw owner"></i>The owner’s hours</span><span><i class="sw team"></i>The delivery team</span><span><i class="sw tools"></i>Tools, AI and hosting</span></div>
      <div class="bars" id="bills">
        <div class="row"><span class="name">Conventional</span><div class="track"><i class="owner" data-w="convOwner"></i><i class="team" data-w="team"></i><i class="tools" data-w="convTools"></i></div><b data-v="bConvTotal"></b></div>
        <div class="row"><span class="name">Agentic AI</span><div class="track"><i class="owner" data-w="agOwner"></i><i class="tools" data-w="agTools"></i></div><b data-v="bAgTotal"></b></div>
      </div>
      <div class="tbl"><table>
        <thead><tr><th>Line</th><th class="n">Conventional</th><th class="n">Agentic AI</th></tr></thead>
        <tbody>
          <tr><td><i class="sw owner"></i>The owner’s hours</td><td class="n"><span data-v="bConvOwner"></span><small><span data-v="bConvOwnerH"></span> h</small></td><td class="n"><span data-v="bAgOwner"></span><small><span data-v="bAgOwnerH"></span> h</small></td></tr>
          <tr><td><i class="sw team"></i>The delivery team</td><td class="n"><span data-v="bTeam"></span><small><span data-v="bTeamPm"></span> person-months</small></td><td class="n">—</td></tr>
          <tr><td><i class="sw tools"></i>Tools, AI and hosting</td><td class="n"><span data-v="bConvTools"></span><small>licences</small></td><td class="n"><span data-v="bAgTools"></span><small>as paid</small></td></tr>
        </tbody>
      </table></div>
    </section>

    <section>
      <h2>Time, and the owner’s time</h2>
      <p class="lede">The team takes longer from start to live. The owner’s hours barely change, which is the talk’s point: the time building saved went into deciding.</p>
      <div class="bars" id="owner">
        <div class="row"><span class="name">Conventional</span><div class="track"><i class="owner" data-w="convOwnerHours"></i></div><b><span data-v="oConvH"></span> h</b></div>
        <div class="row"><span class="name">Agentic AI</span><div class="track"><i class="owner" data-w="agHours"></i></div><b><span data-v="oAgH"></span> h</b></div>
      </div>
    </section>

    <section>
      <h2>The team it would take</h2>
      <p class="lede">A Swiss team at market rates, available from the first day. Its person-months are estimated per workstream below; the conservative case matches the measured code at about <span data-v="locPerPm"></span> lines of tested code per person-month.</p>
      <div class="tbl"><table>
        <thead><tr><th>Role</th><th class="n">FTE</th><th class="n">Person-months</th><th class="n">CHF an hour</th><th class="n">Cost</th></tr></thead>
        <tbody>
          <tr><td>Tech lead and solution architect</td><td class="n" data-role="lead" data-c="fte"></td><td class="n" data-role="lead" data-c="pm"></td><td class="n" data-role="lead" data-c="rate"></td><td class="n" data-role="lead" data-c="cost"></td></tr>
          <tr><td>Senior backend engineers</td><td class="n" data-role="backend" data-c="fte"></td><td class="n" data-role="backend" data-c="pm"></td><td class="n" data-role="backend" data-c="rate"></td><td class="n" data-role="backend" data-c="cost"></td></tr>
          <tr><td>Senior frontend engineers</td><td class="n" data-role="frontend" data-c="fte"></td><td class="n" data-role="frontend" data-c="pm"></td><td class="n" data-role="frontend" data-c="rate"></td><td class="n" data-role="frontend" data-c="cost"></td></tr>
          <tr><td>UX and UI designer</td><td class="n" data-role="ux" data-c="fte"></td><td class="n" data-role="ux" data-c="pm"></td><td class="n" data-role="ux" data-c="rate"></td><td class="n" data-role="ux" data-c="cost"></td></tr>
          <tr><td>DevOps and platform engineer</td><td class="n" data-role="devops" data-c="fte"></td><td class="n" data-role="devops" data-c="pm"></td><td class="n" data-role="devops" data-c="rate"></td><td class="n" data-role="devops" data-c="cost"></td></tr>
          <tr><td>QA and test engineer</td><td class="n" data-role="qa" data-c="fte"></td><td class="n" data-role="qa" data-c="pm"></td><td class="n" data-role="qa" data-c="rate"></td><td class="n" data-role="qa" data-c="cost"></td></tr>
          <tr><td>Business analyst and knowledge modeler</td><td class="n" data-role="analyst" data-c="fte"></td><td class="n" data-role="analyst" data-c="pm"></td><td class="n" data-role="analyst" data-c="rate"></td><td class="n" data-role="analyst" data-c="cost"></td></tr>
          <tr><td>Technical writer and translator</td><td class="n" data-role="writer" data-c="fte"></td><td class="n" data-role="writer" data-c="pm"></td><td class="n" data-role="writer" data-c="rate"></td><td class="n" data-role="writer" data-c="cost"></td></tr>
          <tr><td>Delivery manager</td><td class="n" data-role="delivery" data-c="fte"></td><td class="n" data-role="delivery" data-c="pm"></td><td class="n" data-role="delivery" data-c="rate"></td><td class="n" data-role="delivery" data-c="cost"></td></tr>
          <tr class="own"><td>Owner and lead, at a lead architect’s market rate <i class="kind">in both</i></td><td class="n" data-v="rOwnerShare"></td><td class="n" data-v="rOwnerPm"></td><td class="n" data-v="rOwnerRate"></td><td class="n" data-v="rOwnerCost"></td></tr>
        </tbody>
        <tfoot><tr><td>The delivery team</td><td class="n" data-v="rTeamFte"></td><td class="n" data-v="rTeamPm"></td><td></td><td class="n" data-v="rTeamCost"></td></tr></tfoot>
      </table></div>
      <h3>Where the person-months go</h3>
      <div class="bars ws">
        <div class="row" data-ws="engine"><span class="name">GuestGraph engine and Apaleo connector</span><div class="track"><i class="team"></i></div><b></b></div>
        <div class="row" data-ws="design"><span class="name">Design system</span><div class="track"><i class="team"></i></div><b></b></div>
        <div class="row" data-ws="sites"><span class="name">Three bilingual sites and the talks</span><div class="track"><i class="team"></i></div><b></b></div>
        <div class="row" data-ws="metamodel"><span class="name">Meta-model, command line and checks</span><div class="track"><i class="team"></i></div><b></b></div>
        <div class="row" data-ws="plugin"><span class="name">Obsidian plugin and its end-to-end tests</span><div class="track"><i class="team"></i></div><b></b></div>
        <div class="row" data-ws="ws-qa"><span class="name">Quality assurance</span><div class="track"><i class="team"></i></div><b></b></div>
        <div class="row" data-ws="ws-delivery"><span class="name">Delivery management</span><div class="track"><i class="team"></i></div><b></b></div>
        <div class="row" data-ws="mcp"><span class="name">MCP server on three hosts</span><div class="track"><i class="team"></i></div><b></b></div>
        <div class="row" data-ws="platform"><span class="name">Conventions, CI and the cloud platform</span><div class="track"><i class="team"></i></div><b></b></div>
        <div class="row" data-ws="chat"><span class="name">Chat server on three hosts</span><div class="track"><i class="team"></i></div><b></b></div>
        <div class="row" data-ws="models"><span class="name">Three models, as content</span><div class="track"><i class="team"></i></div><b></b></div>
      </div>
    </section>

    <section>
      <h2>What it actually took</h2>
      <p class="lede">One person with Claude Code, from the first commit on Jun 9 to Sep 24. The hours are the days git shows work, times the hours a day the owner gives.</p>
      <div class="tbl"><table>
        <thead><tr><th>Line</th><th>Basis</th><th class="n">CHF</th></tr></thead>
        <tbody>
          <tr><td>The owner, from Aug 17</td><td><span data-v="aPeakDays"></span> days with commits × <span data-v="aPeakH"></span> h</td><td class="n" data-v="aPeak"></td></tr>
          <tr><td>The owner, before Aug 17</td><td><span data-v="aEarlyDays"></span> days with commits × <span data-v="aEarlyH"></span> h</td><td class="n" data-v="aEarly"></td></tr>
          <tr><td>Claude subscription <i class="kind">as paid</i></td><td>Max 5x until mid-June, then Max 20x: USD <span data-v="uSub"></span>, plus <span data-v="vat"></span>% Swiss VAT</td><td class="n" data-v="aSub"></td></tr>
          <tr><td>Narration voice <i class="kind">as paid</i></td><td>USD <span data-v="uVoice"></span> of ElevenLabs credit</td><td class="n" data-v="aVoice"></td></tr>
          <tr><td>The chats’ API <i class="kind">as paid</i></td><td>USD <span data-v="uChat"></span> of Anthropic credit for Sonnet 5, plus VAT</td><td class="n" data-v="aChat"></td></tr>
          <tr><td>Google Cloud hosting <i class="kind">counted</i></td><td>Six services that scale to zero, inside the free tier</td><td class="n" data-v="aHosting"></td></tr>
          <tr><td>Two domains <i class="kind est">estimated</i></td><td>companygraph.io and guestgraph.io for a year</td><td class="n" data-v="aDomains"></td></tr>
        </tbody>
        <tfoot><tr><td>Agentic total</td><td></td><td class="n" data-v="aTotal"></td></tr></tfoot>
      </table></div>
      <p class="rule">The AI was the smallest line: <span data-v="toolsShare"></span>% of the total. At the API’s list price instead of the subscription, USD <span data-v="listUsd"></span>, the total would be <span data-v="listAg"></span>, still <span data-v="listRatio"></span>× cheaper. The cost moved to the owner’s hours, which is where the deciding is.</p>
    </section>

    <section>
      <h2>Would both approaches produce the same result?</h2>
      <p class="lede">Not quite. A good Swiss team could match each bar here, spec by spec and test by test. At this pace it would deliver less scope and write down less of its reasoning, and it would bring what one person with agents lacks: independent review, real users and shared ownership. The evidence is counted; the rating is the owner’s judgement.</p>
      <div class="tbl"><table class="q">
        <thead><tr><th>Dimension</th><th>Evidence from this build</th><th>Could a team do the same?</th><th>Outcome</th></tr></thead>
        <tbody>
          <tr><td>Specification</td><td><span data-v="qSpecs"></span> specs and <span data-v="qPlans"></span> plans, written before the code, with <span data-v="qDecisions"></span> decisions each traced to a quote; <span data-v="qRevised"></span> revised later and <span data-v="qDropped"></span> dropped, so they were used.</td><td>Yes. The decisions are the owner’s either way, but writing them down at this depth costs an architect weeks a quarter, and most teams cut it first.</td><td><span class="lean ag">Agentic ahead</span></td></tr>
          <tr><td>Implementation</td><td><span data-v="qReverts"></span> revert in <span data-v="qCommits"></span> commits, and <span data-v="qClosed"></span> pull requests closed without merging: the gate turned work away.</td><td>Yes. Senior engineers write code like this and bring judgement from years in production, which an agent has only when the owner supplies it.</td><td><span class="lean ev">Even</span></td></tr>
          <tr><td>Tests</td><td><span data-v="qTestShare"></span> lines of tests for every ten of code; the plugin tested end to end in a real Obsidian; CI on every change.</td><td>Yes, and the team includes a QA engineer for it. Under a deadline, tests are the second thing a team trims.</td><td><span class="lean ag">Agentic ahead</span></td></tr>
          <tr><td>Consistency</td><td>One set of conventions in every repository, rolled out in release waves.</td><td>Hard. Style and wording drift between people; linting gets a team close.</td><td><span class="lean ag">Agentic ahead</span></td></tr>
          <tr><td>Scope and iteration</td><td>Ideas prototyped and declined within a day; two products and three models in about fifteen weeks.</td><td>A team runs fewer experiments, since each costs a sprint, and scopes smaller. Often healthy, but a different product.</td><td><span class="lean ag">Agentic ahead</span></td></tr>
          <tr><td>German and English</td><td>Every page in both, with a translator’s review and a glossary.</td><td>Yes. A professional translator is the standard for Swiss Standard German.</td><td><span class="lean ev">Even</span></td></tr>
          <tr><td>Independent review</td><td>The owner is the only human reviewer; agents review agents, and the owner merges.</td><td>Better: two people on every change, and security review by someone who did not write it.</td><td><span class="lean tm">Team ahead</span></td></tr>
          <tr><td>Design with users</td><td>One person’s judgement, refined in review; no usability or accessibility study with real users.</td><td>Better: a designer with user research sees what the builder cannot.</td><td><span class="lean tm">Team ahead</span></td></tr>
          <tr><td>Ownership</td><td>One person holds the context; the specs write the reasoning down, which lowers the risk without removing it.</td><td>Better: the knowledge is spread across the team.</td><td><span class="lean tm">Team ahead</span></td></tr>
          <tr><td>Operations</td><td>Every host deploys through CI; there is no on-call and no service level.</td><td>Better with a DevOps engineer. Neither side’s running costs are counted.</td><td><span class="lean tm">Team ahead</span></td></tr>
        </tbody>
      </table></div>
      <p class="rule">Closing the gaps where the team is ahead — an external code and security review, a usability and accessibility study, a month to bring in a second maintainer — adds about <span data-v="gaps"></span>. The agentic total would then be <span data-v="gapAg"></span>, still <span data-v="gapRatio"></span>× cheaper.</p>
      <p class="note">These are counts from git, not an audit. Nobody outside the project has reviewed the code, so the implementation row compares capability, not a measured outcome.</p>
    </section>

    <section>
      <h2>How the figures are made</h2>
      <div class="rules">
        <p><b>Employer cost</b> is the salary × <span data-v="mLoad"></span> for social charges and workplace, over <span data-v="mYearH"></span> productive hours a year. Salaries sit at the Zurich market middle, a senior engineer at <span data-v="mSenior"></span> against a reported average of about CHF 137,000 (<a href="https://www.levels.fyi/t/software-engineer/levels/senior/locations/zurich-che">Levels.fyi</a>, <a href="https://www.glassdoor.com/Salaries/zurich-switzerland-senior-software-engineer-salary-SRCH_IL.0,18_IM1144_KO19,43.htm">Glassdoor</a>).</p>
        <p><b>Contractor rates</b> are CHF <span data-v="mRateLo"></span>–<span data-v="mRateHi"></span> an hour, inside the reported day rates of CHF 850–1,500 for Swiss IT contractors (<a href="https://salary2freelance.com/ch/it-contractor-rate-switzerland">salary2freelance</a>).</p>
        <p><b>The owner</b> is priced as a lead architect at market rate, <span data-v="mOwnerSalary"></span> on the employer basis or CHF <span data-v="mOwnerRate"></span> an hour, not at what he earns or charges.</p>
        <p><b>Dollars</b> are converted at <span data-v="mFx"></span>, near the 2026 average. Anthropic bills Switzerland in dollars, plus <span data-v="vat"></span>% VAT.</p>
      </div>
      <h3>What this leaves out</h3>
      <div class="rules">
        <p>Hiring the team, which in Switzerland usually takes three to six months before the months above begin. The meetings and handovers a larger team needs. Running costs on either side. The risk the talk names: the speed rests on a few providers’ prices and terms.</p>
      </div>
    </section>
  </div>
</main>
```

Add a `<style>` block after `<link rel="stylesheet" href="../../../page.css">`, colors from the tokens only:

```html
<style>
  .costerr{color:var(--c-flag); margin-block:1rem}
  .assume{display:flex; flex-wrap:wrap; gap:1rem 2rem; align-items:flex-end; margin-block:1.5rem}
  .assume .ctl{display:grid; gap:.4rem}
  .assume .lbl,.verdict .lbl{font-size:.8rem; color:var(--dim)}
  .rng{display:flex; align-items:center; gap:.6rem}
  .rng input{width:8rem; accent-color:var(--c-mid)}
  .rng output{font-variant-numeric:tabular-nums; min-width:3.5em}
  .verdict{display:grid; grid-template-columns:repeat(3,1fr); border-top:2px solid var(--ink); margin-block:1.5rem}
  .verdict > div{display:grid; gap:.25rem; align-content:start; padding:1rem 1rem 1rem 0}
  .verdict > div + div{padding-left:1rem; border-left:1px solid var(--rule)}
  .verdict b{font-family:"Bricolage Grotesque", "Instrument Sans", ui-sans-serif, system-ui, sans-serif; font-size:clamp(1.6rem,4vw,2.6rem); line-height:1.1; font-variant-numeric:tabular-nums}
  .verdict > div:last-child b{color:var(--c-firm)}
  .verdict span{color:var(--dim)}
  @media (max-width:720px){ .verdict{grid-template-columns:1fr} .verdict > div + div{padding-left:0; border-left:0; border-top:1px solid var(--rule)} }
  .kind{font-style:normal; font-size:.72rem; color:var(--dim); border:1px solid var(--rule); border-radius:3px; padding:0 .3rem; margin-left:.35rem; white-space:nowrap}
  .kind.est{border-style:dashed}
  .facts{display:grid; grid-template-columns:repeat(5,1fr); gap:1px; background:var(--rule); border:1px solid var(--rule)}
  .facts div{background:var(--ground); padding:.8rem 1rem; display:grid; gap:.1rem}
  .facts b{font-size:1.4rem; font-variant-numeric:tabular-nums}
  .facts span{font-size:.85rem; color:var(--dim)}
  @media (max-width:760px){ .facts{grid-template-columns:repeat(2,1fr)} }
  .legend{display:flex; flex-wrap:wrap; gap:.4rem 1.2rem; font-size:.85rem; color:var(--dim); margin-block:.8rem}
  .sw{display:inline-block; width:.7rem; height:.7rem; margin-right:.45rem; vertical-align:-.05rem}
  .sw.owner,.track .owner{background:var(--c-firm)}
  .sw.team,.track .team{background:var(--c-weak)}
  .sw.tools,.track .tools{background:var(--dim)}
  .sw.owner{border-radius:50%} .sw.tools{border-radius:1px; transform:rotate(45deg) scale(.8)}
  .bars{display:grid; gap:.6rem; margin-block:1rem}
  .bars .row{display:grid; grid-template-columns:minmax(7rem,14rem) 1fr auto; gap:.8rem; align-items:center}
  .bars .name{font-size:.9rem}
  .bars b{font-variant-numeric:tabular-nums; font-size:.9rem; white-space:nowrap}
  .track{display:flex; gap:2px; height:1.1rem; min-width:0}
  .track i{display:block; height:100%; border-radius:2px; min-width:0}
  .ws .track{height:.7rem}
  @media (max-width:560px){ .bars .row{grid-template-columns:1fr auto} .bars .track{grid-column:1 / -1; grid-row:2} }
  .tbl{overflow-x:auto; margin-block:1rem}
  .tbl table{border-collapse:collapse; width:100%; min-width:36rem; font-size:.9rem}
  .tbl th,.tbl td{text-align:left; padding:.5rem .8rem; border-bottom:1px solid var(--rule); vertical-align:top}
  .tbl th{font-weight:500; font-size:.78rem; color:var(--dim)}
  .tbl td.n,.tbl th.n{text-align:right; white-space:nowrap; font-variant-numeric:tabular-nums}
  .tbl td small{display:block; color:var(--dim); font-size:.78rem}
  .tbl tfoot td{border-top:2px solid var(--ink); border-bottom:0; font-weight:600}
  .tbl tr.own td{color:var(--c-firm)}
  table.q{min-width:46rem} table.q td:first-child{font-weight:600}
  .lean{display:inline-flex; align-items:center; gap:.4rem; font-size:.8rem; white-space:nowrap}
  .lean::before{content:""; width:.55rem; height:.55rem}
  .lean.ag::before{background:var(--c-firm); border-radius:50%}
  .lean.tm::before{background:var(--c-weak)}
  .lean.ev::before{border:1.5px solid var(--dim); border-radius:50%; width:.4rem; height:.4rem}
  p.rule{border-left:3px solid var(--c-firm); padding-left:1rem; margin-block:1rem; max-width:62ch}
</style>
```

- [ ] **Step 4: Add `render()` and the boot to `cost.mjs`**

```js
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

export function render(state, data, lang) {
  const c = compute(data.cost, data.stats, state);
  const t = data.stats.totals, code = data.stats.code.totals;
  const m = n => money(n, lang), n0 = n => num(n, lang), n1 = n => num(n, lang, 1);
  const v = {
    conv: m(Math.round(c.conv / 1000) * 1000), convFte: n1(c.teamFte), convMonths: n0(c.months),
    ag: m(Math.round(c.ag / 1000) * 1000), agMonths: n1(data.cost.agenticMonths), agHours: n0(c.agHours),
    ratio: n0(c.ratio), saved: m(Math.round(c.saved / 1000) * 1000), faster: n1(c.faster),
    fRepos: n0(t.repos), fCommits: n0(t.commits), fMerged: n0(t.merged), fReleases: n0(t.releases),
    fClaude: n0(100 * t.claude / t.nonMerge) + "%", fCode: n0(code.code), fTest: n0(code.test),
    fMarkdown: n0(code.markdown), fSpecs: n0(t.specs), fDecisions: n0(data.decisions.counts.total),
    bConvOwner: m(c.convOwner), bConvOwnerH: n0(c.convOwnerHours), bTeam: m(c.team), bTeamPm: n1(c.teamPm),
    bConvTools: m(c.convTools), bConvTotal: m(c.conv), bAgOwner: m(c.agOwner), bAgOwnerH: n0(c.agHours),
    bAgTools: m(c.agTools), bAgTotal: m(c.ag), oConvH: n0(c.convOwnerHours), oAgH: n0(c.agHours),
    rTeamFte: n1(c.teamFte), rTeamPm: n1(c.teamPm), rTeamCost: m(c.team),
    rOwnerShare: n1(state.share), rOwnerPm: n1(state.share * c.months), rOwnerRate: n0(c.ownerHourly), rOwnerCost: m(c.convOwner),
    aPeakDays: n0(data.stats.activeDays.peak), aPeakH: n0(state.peakHours), aPeak: m(c.agPeak * c.ownerHourly),
    aEarlyDays: n0(data.stats.activeDays.early), aEarlyH: n0(data.cost.owner.earlyHours), aEarly: m(c.agEarly * c.ownerHourly),
    aSub: m(c.subscription), aVoice: m(c.voice), aChat: m(c.chatApi), aHosting: m(c.hosting), aDomains: m(c.domains),
    aTotal: m(c.ag), listUsd: n0(data.stats.tokens.listPriceUsd), listAg: m(c.listAg), listRatio: n0(c.listRatio),
    toolsShare: n1(100 * c.agTools / c.ag), gapAg: m(c.gapAg), gapRatio: n0(c.gapRatio), gaps: m(c.gaps),
    qSpecs: n0(t.specs), qPlans: n0(t.plans), qDecisions: n0(data.decisions.counts.total),
    qRevised: n0(data.decisions.counts.revised), qDropped: n0(data.decisions.counts.dropped),
    qReverts: n0(t.reverts), qCommits: n0(t.commits), qClosed: n0(t.closedUnmerged),
    qTestShare: n0(10 * code.test / code.code),
    uSub: n0(data.cost.tools.subscription.usd), uVoice: n0(data.cost.tools.voice.usd), uChat: n0(data.cost.tools.chatApi.usd),
    vat: n1(100 * data.cost.vat), mLoad: num(data.cost.employerLoad, lang, 2), mYearH: n0(data.cost.yearHours),
    mSenior: m(data.cost.roles.find(r => r.id === "backend").salary),
    mRateLo: n0(Math.min(...data.cost.roles.map(r => r.rate))), mRateHi: n0(Math.max(...data.cost.roles.map(r => r.rate))),
    mOwnerSalary: m(data.cost.owner.salary), mOwnerRate: n0(data.cost.owner.rate), mFx: num(data.cost.usdChf, lang, 2),
    locPerPm: n0((code.code + code.test) / (c.teamPm / c.factor * 1.3)),
  };
  for (const el of $$("[data-v]")) if (el.dataset.v in v) el.textContent = v[el.dataset.v];
  for (const r of c.roles) for (const el of $$(`[data-role="${r.id}"]`)) {
    el.textContent = { fte: n1(r.fte), pm: n1(r.pm), rate: n0(r.hourly), cost: m(r.cost) }[el.dataset.c];
  }
  const width = (el, x, max) => { el.style.width = (100 * x / max).toFixed(3) + "%"; };
  for (const el of $$("#bills [data-w]")) width(el, c[el.dataset.w], c.conv);
  for (const el of $$("#owner [data-w]")) width(el, c[el.dataset.w], Math.max(c.convOwnerHours, c.agHours));
  const wsMax = Math.max(...c.workstreams.map(w => w.pm));
  for (const w of c.workstreams) {
    const row = document.querySelector(`[data-ws="${w.id}"]`);
    width(row.querySelector("i"), w.pm, wsMax);
    row.querySelector("b").textContent = n1(w.pm);
  }
  document.getElementById("peakOut").textContent = n0(state.peakHours) + " h";
  document.getElementById("shareOut").textContent = n0(100 * state.share) + "%";
}

async function boot() {
  const state = { lens: "inhouse", scenario: "expected", peakHours: 8, share: 0.6 };
  let data;
  try {
    const get = u => fetch(u).then(r => { if (!r.ok) throw new Error(u); return r.json(); });
    const [cost, stats, decisions] = await Promise.all([get("../cost.json"), get("../stats.json"), get("../decisions.json")]);
    data = { cost, stats, decisions };
    state.scenario = cost.scenarios.default;
    state.peakHours = cost.owner.peakHours;
    state.share = cost.owner.share;
  } catch (e) {
    document.getElementById("costerr").hidden = false;
    return;
  }
  const lang = () => document.documentElement.lang === "de" ? "de" : "en";
  const draw = () => render(state, data, lang());
  const seg = (id, key, attr) => document.getElementById(id).addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    state[key] = b.getAttribute(attr);
    for (const x of document.querySelectorAll(`#${id} button`)) x.setAttribute("aria-pressed", String(x === b));
    draw();
  });
  seg("lens", "lens", "data-v-lens");
  seg("scen", "scenario", "data-v-scen");
  const peak = document.getElementById("peak"), share = document.getElementById("share");
  peak.value = state.peakHours; share.value = state.share;
  peak.addEventListener("input", () => { state.peakHours = +peak.value; draw(); });
  share.addEventListener("input", () => { state.share = +share.value; draw(); });
  window.rbCost = { render: () => draw() };
  draw();
}

if (typeof document !== "undefined") boot();
```

The `seg` buttons carry `data-v-lens` and `data-v-scen`, not `data-v`, so the slot loop never touches them.

- [ ] **Step 5: Run the tests and look at the page**

Run: `npm run test:cost && npm run verify`

Expected: both pass; `slotsFilled` finds `CHF 1,235,443`, `CHF 57,216` and `22` in English and the German forms after the switch. The `translates` key is not on the entry yet; Task 5 adds it with the German. Open `http://localhost:8000/talks/deciding-well/cost/` at 1280 px and at 390 px in both themes, and move every control once.

- [ ] **Step 6: Commit**

```bash
git add talks/deciding-well/cost/ verify/check.mjs
git commit -F - <<'EOF'
The talk has a page that prices a team, in English

The page computes every figure it shows from the talk's snapshot and cost.json and places each one in a slot of its own, so the prose around it can be translated without touching a number. It has the verdict, what was built, the two bills, the owner's time, the team, what it actually took, whether the two approaches produce the same result, and how the figures are made. verify holds it to the defaults and to no slot left empty, in either language and after a slider moves, and to saying so when the figures fail to load.

Verified: npm run test:cost and npm run verify pass; the page was read at 1280 and 390 px in both themes.

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>
EOF
```

- [ ] **Step 7: Stop for the owner's review of the English.** Push the branch (`git push -u origin the-talk-prices-a-team`) only if the owner asks to see it on GitHub; otherwise hand over the local URL and the rows of the quality table to read one by one. Task 5 begins only after the owner has approved the English.

---

### Task 5: The German, by the pipeline

**Files:**

- Modify: `talks/deciding-well/cost/index.html` (every `data-de`, and `UI.de`)
- Modify: `verify/check.mjs` (`translates` on the entry)

- [ ] **Step 1: Dispatch the translator** of `conventions/TRANSLATOR.md` over `talks/deciding-well/cost/index.html` with `conventions/GLOSSARY.md` and `conventions/GERMAN.md` open. The brief: every element with English text gets a `data-de`; a slot `<span data-v="…"></span>` inside a translated element is carried into the German value with single-quoted attributes, `<span data-v='…'></span>`, unchanged; guillemets for quotes; "Owner" stays "Owner"; "FTE" stays "FTE"; `UI.de` gets the German title and description.

- [ ] **Step 2: Dispatch the editor** of `conventions/EDITOR.md` on the German alone, then the back-reader of `conventions/BACKREADER.md` once the editor's corrections are in; set the back-reading against the English and send back every value whose meaning moved.

- [ ] **Step 3: Give the owner the flags** the editor could not settle, in German with the alternatives, and apply the picks. A term choice becomes a row of `conventions/GLOSSARY.md` in robertblust/conventions, not here.

- [ ] **Step 4: Add `translates` to the entry**, with a German string from the reviewed page's h2 and one from the quality table:

```js
    translates: { lang: "de", shows: ["<the reviewed German of 'Would both approaches produce the same result?'>", "<the reviewed German of 'Agentic ahead'>"], hides: ["Would both approaches produce the same result?", "Agentic ahead"] },
```

filled with the exact reviewed strings, not the placeholders shown.

- [ ] **Step 5: Run the checks**

Run: `npm run verify && npx design german stale`

Expected: both pass; the new entry's `translates` passes and `slotsFilled` still finds the German forms.

- [ ] **Step 6: Commit** with the subject "The cost page speaks Swiss Standard German", a body naming the pipeline that made it and the owner's picks, and `Verified: npm run verify and design german stale pass.`

---

### Task 6: The page is registered, and the deck links it

**Files:**

- Modify: `build/jsonld.mjs`, `og-recipe.mjs`, `talks/deciding-well/index.html`, `talks/deciding-well/README.md`
- Create (generated): `talks/deciding-well/cost/og.png`, `talks/deciding-well/cost/og.sha`, the two slide 05 clips, both PDFs, `sitemap.xml`

- [ ] **Step 1: Register the page.** In `build/jsonld.mjs` append `"talks/deciding-well/cost/index.html"` to the list that ends with `"talks/deciding-well/index.html"`. In `og-recipe.mjs` add `{ dir: "talks/deciding-well/cost", ...FRAME, hide: HIDE, titleSlide: false },` after the deciding-well entry.

- [ ] **Step 2: Link it from slide 05.** After the slide's `<p class="stamp" …>` add:

```html
    <p class="stamp" data-de="Was dasselbe Ergebnis ein Schweizer Team gekostet hätte: <a href='https://blust.ch/talks/deciding-well/cost/' target='_blank' rel='noopener'>blust.ch/talks/deciding-well/cost</a>">What the same result would have cost a Swiss team: <a href="https://blust.ch/talks/deciding-well/cost/" target="_blank" rel="noopener">blust.ch/talks/deciding-well/cost</a></p>
```

and append to the English note, before its closing quote: ` What the same result would have cost a Swiss team, with my own hours counted, is on the page beside this talk.` and to the German note: ` Was dasselbe Ergebnis ein Schweizer Team gekostet hätte, meine eigenen Stunden eingerechnet, steht auf der Seite neben diesem Vortrag.` The German of both goes through the editor and the back-reader of Task 5 before the clips are made.

- [ ] **Step 3: Add the reading to slide 11.** Give `.reads` `grid-auto-flow:column; grid-template-rows:repeat(3,auto)` in the deck's own `<style>` next to the existing `.reads` rules, reorder its cells by column (argument: values, team; proof: model, timeline, cost; answer: companygraph.io, surfaces) and add, after the timeline cell:

```html
      <div class="cell"><a href="https://blust.ch/talks/deciding-well/cost/" target="_blank" rel="noopener"><b data-de="Was ein Team gekostet hätte">What a team would have cost</b><span class="mono">blust.ch/talks/deciding-well/cost</span></a></div>
```

Update the slide's note from "Six places" to "Seven places" in both languages.

- [ ] **Step 4: Regenerate what the deck feeds.**

```bash
export PATH=/opt/homebrew/bin:$PATH
./tts/generate.py --dry-run --deck deciding-well          # expect: would write 05 and 11, en and de
export ELEVENLABS_API_KEY="$(zsh -ic 'printf %s "$ELEVENLABS_API_KEY"' 2>/dev/null)"
./tts/generate.py --deck deciding-well --only 05
./tts/generate.py --deck deciding-well --only 11
npm run pages && npm run og && npm run pdf && npm run sitemap
```

Expected: the dry run lists exactly slides 05 and 11 in both languages; afterwards `./tts/generate.py --dry-run` writes nothing.

- [ ] **Step 5: Describe the page in the talk's README.** Under "The figures", add a paragraph: the cost page at `/talks/deciding-well/cost/` computes its figures from `stats.json`, `decisions.json` and `cost.json`; `cost.json` holds every estimate and the owner's figures, dated, and `test_cost.py` and `npm run test:cost` hold it together; `./stats.py --extend` adds lines of code and active days to an existing snapshot.

- [ ] **Step 6: Run everything the spec names as done**

Run: `npm run verify && npm run og:check && npm run pages:check && npm run sitemap:check && npm run design:check && npm run test:cost && python3 -m unittest discover -s talks/deciding-well -p 'test_*.py' && ./tts/generate.py --dry-run && sh conventions/conventions-check`

Expected: every command exits 0; check each exit code on its own, not through a pipe.

- [ ] **Step 7: Commit** with the subject "The talk links the page that prices a team", a body naming the slide 05 line and note, the slide 11 reading, the registrations and the regenerated clips, cards and PDFs, and a `Verified:` line naming the commands of step 6.

- [ ] **Step 8: Open the pull request and stop.** `git push -u origin the-talk-prices-a-team`, then `gh pr create` with a title "The talk prices a team" and a body that is the commits reread for a reviewer, in the git register, ending with the attribution line. Report the check and stop; merging is the owner's word. The References row in robertblust/mental-model is its own pull request after this one merges.
