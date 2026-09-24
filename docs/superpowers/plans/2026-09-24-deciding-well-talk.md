# The deciding-well talk — implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A third talk at `/talks/deciding-well/`, eleven slides in English and Swiss Standard German, narrated, with PDFs and share cards, every figure read from a committed snapshot of 2026-09-24.

**Architecture:** A Python script counts the figures up to a fixed cutoff and writes `stats.json`; a second script draws the weekly chart from it as inline SVG between markers in the deck. The deck is a copy of the mental-model deck's shell with new slides, registered in every list that names a talk. English first, reviewed by the owner; German after, by the pipeline of `conventions/WRITING.md`; narration last, on the owner's word.

**Tech Stack:** Python 3 (stdlib only), `git`, `gh`, the site's existing Node tooling (`npm run verify`, `og`, `pdf`, `pages`, `sitemap`), `@robertblust/design`'s `design german`, `tts/generate.py`.

**Spec:** `docs/superpowers/specs/2026-09-24-deciding-well-talk-design.md`

## Global Constraints

- Snapshot cutoff: `2026-09-24T23:59:59+02:00`; start of the story: `2026-06-09`.
- Owners counted: `robertblust`, `companygraph`, `guestgraph`; public repositories only; `robertblust/xiny` excluded by name.
- rob-cv (`/Users/rob/git/robertblust/rob-cv`): dates and counts only. No subject line, file name or content of it enters `stats.json`, the deck or its notes.
- The employer from October is not named anywhere.
- No decision count appears on a slide or in a note.
- Cost is stated as "about $200 a month" paid and "about $10,000 at API list price", with the window 2026-08-18 to 2026-09-24 and "Claude Code only" in the note.
- Slug `deciding-well`; `<html lang="en">`; notes in `data-notes` / `data-notes-de`; nested quotes single; German quotes guillemets; slides start with the literal `<section class="slide`; stage directions `<em class='cue'>`.
- One hue at four brightnesses; mono only for data; no external asset; no link opens a new tab; no outbound link inside a slide.
- en-US in English, de-CH in every `-de` attribute and `TALK.de` / `UI.de`.
- Commits in the git register of `WRITING.md`, ending `Verified: …` and the `Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>` trailer. Commit only at the plan's commit steps; never push or merge without the owner's word.

## Review Focus

- A re-run on a later day must give the same figures: every count is filtered by the cutoff, never by "now". Pinned by `test_cutoff_filters_later_items`.
- A streamed assistant message appears in the logs several times with one id; counting each line inflates tokens. Pinned by `test_tokens_dedupe_by_message_id`.
- A model the price table does not know must be reported, not priced at zero silently. Pinned by `test_unpriced_model_is_reported`.
- A slide whose figure differs from `stats.json` renders fine and passes every other check. Pinned by the deck's `contains` list in `verify/check.mjs` (Task 6).
- A note edited after its clip was made speaks the old words. Pinned by the narration dry run in CI, already present; Task 7 re-runs it.

---

### Task 1: The snapshot script

**Files:**

- Create: `talks/deciding-well/stats.py`
- Create: `talks/deciding-well/test_stats.py`
- Create: `talks/deciding-well/stats.json` (written by the script)

**Interfaces:**

- Produces: `stats.json` with keys `cutoff`, `start`, `repos` (list of `{repo, created, commits, nonMerge, claude, merged, closedUnmerged, releases}`), `totals` (`repos`, `owners`, `commits`, `nonMerge`, `claude`, `claudeShare`, `merged`, `mergedByBots`, `closedUnmerged`, `releases`, `specs`, `plans`, `decisionSections`, `reverts`), `busiestDay` (`{date, commits, merged}`), `weekly` (list of `{week, monday, commits}` from the start's week to the cutoff's), `births` (list of `{repo, date}` sorted), `robcv` (`{first, commits}`), `tokens` (`{window, messages, input, output, cacheRead, cacheWrite, total, byModel, listPriceUsd, unpriced}`).
- Produces for Task 3: the functions `iso_week(date_str) -> "YYYY-Www"` and `load_stats(path) -> dict`.

- [ ] **Step 1: Write the failing tests**

```python
# talks/deciding-well/test_stats.py
import json, os, tempfile, unittest
import stats

CUT = "2026-09-24T23:59:59+02:00"

class Stats(unittest.TestCase):
    def test_iso_week(self):
        self.assertEqual(stats.iso_week("2026-06-09"), "2026-W24")
        self.assertEqual(stats.iso_week("2026-09-24T10:00:00+02:00"), "2026-W39")

    def test_cutoff_filters_later_items(self):
        items = ["2026-09-24T23:00:00+02:00", "2026-09-25T00:30:00+02:00", "2026-09-24T21:59:59Z"]
        self.assertEqual(stats.before_cutoff(items, CUT), [items[0], items[2]])

    def test_tokens_dedupe_by_message_id(self):
        line = {"timestamp": "2026-09-01T10:00:00Z", "message": {"id": "m1", "role": "assistant",
                "model": "claude-sonnet-5", "usage": {"input_tokens": 10, "output_tokens": 5}}}
        with tempfile.TemporaryDirectory() as d:
            with open(os.path.join(d, "a.jsonl"), "w") as f:
                f.write(json.dumps(line) + "\n" + json.dumps(line) + "\n")
            t = stats.tokens(d, "2026-08-18", CUT)
        self.assertEqual(t["messages"], 1)
        self.assertEqual(t["output"], 5)

    def test_unpriced_model_is_reported(self):
        per = {"claude-unknown-9": {"input": 1_000_000, "output": 0, "cacheRead": 0, "write5m": 0, "write1h": 0}}
        usd, unpriced = stats.price(per)
        self.assertEqual(usd, 0)
        self.assertEqual(unpriced, {"claude-unknown-9": 1_000_000})

    def test_price_uses_cache_multipliers(self):
        per = {"claude-sonnet-5": {"input": 0, "output": 0, "cacheRead": 1_000_000, "write5m": 1_000_000, "write1h": 1_000_000}}
        usd, _ = stats.price(per)
        # read 0.1 x 2 + write5m 1.25 x 2 + write1h 2 x 2 = 0.2 + 2.5 + 4.0
        self.assertAlmostEqual(usd, 6.7)

if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run them to see them fail**

Run: `cd talks/deciding-well && python3 -m unittest test_stats -v` Expected: FAIL with `ModuleNotFoundError: No module named 'stats'`.

- [ ] **Step 3: Write the script**

```python
#!/usr/bin/env python3
"""The figures of the deciding-well talk, counted up to a fixed cutoff.

Run by hand, never in CI: it needs gh signed in, the local rob-cv clone and the Claude Code
logs under ~/.claude/projects. Every count is filtered by CUTOFF, never by the clock, so a run
on a later day gives the same numbers. rob-cv contributes its first date and its commit count
and nothing else, because its content is private.

  ./stats.py            # writes stats.json beside this file
"""
import collections, datetime, glob, json, os, pathlib, re, subprocess

HERE = pathlib.Path(__file__).resolve().parent
START = "2026-06-09"
CUTOFF = "2026-09-24T23:59:59+02:00"
TOKENS_FROM = "2026-08-18"
OWNERS = ["robertblust", "companygraph", "guestgraph"]
EXCLUDE = {"robertblust/xiny"}
ROBCV = pathlib.Path.home() / "git/robertblust/rob-cv"
CACHE = pathlib.Path.home() / ".cache/deciding-well"
# $ per million tokens, input and output, from the Claude API skill's table dated 2026-06-24.
# A cache read is 0.1 x input unless the table names its own rate; a cache write is 1.25 x
# input for a five-minute lifetime and 2 x for an hour.
PRICES = {"claude-opus-5": (5, 25, None), "claude-opus-5-5": (4, 20, 0.20), "claude-opus-4-8": (5, 25, None),
          "claude-sonnet-5": (2, 10, None), "claude-fable-5": (10, 50, None), "claude-fable-5-1": (10, 50, 0.25),
          "claude-haiku-4-5-20251001": (1, 5, None)}
SPEC = re.compile(r"^(docs/superpowers/specs/|docs/specs/)[^/]+\.md$|^specs/[^/]+/spec\.md$")
PLAN = re.compile(r"^docs/superpowers/plans/[^/]+\.md$|^specs/[^/]+/plan\.md$")
DECIDED = re.compile(r"^#+\s.*\b(What was decided|The decision|Decisions taken|Decisions)\b", re.M)
TRAILER = re.compile(r"^Co-Authored-By:\s*Claude", re.M | re.I)

def ts(s):
    s = s.replace("Z", "+00:00")
    if len(s) == 10:
        s += "T00:00:00+00:00"
    return datetime.datetime.fromisoformat(s)

def iso_week(s):
    y, w, _ = ts(s).date().isocalendar()
    return f"{y}-W{w:02d}"

def before_cutoff(items, cutoff, key=lambda x: x, since=None):
    c, lo = ts(cutoff), ts(since) if since else None
    return [i for i in items if key(i) and ts(key(i)) <= c and (lo is None or ts(key(i)) >= lo)]

def run(*args, cwd=None):
    return subprocess.run(args, capture_output=True, text=True, check=True, cwd=cwd).stdout

def gh_json(*args):
    return json.loads(run("gh", *args))

def repos():
    out = []
    for owner in OWNERS:
        for r in gh_json("repo", "list", owner, "--limit", "200", "--json",
                         "nameWithOwner,isArchived,visibility,createdAt"):
            if r["visibility"] == "PUBLIC" and r["nameWithOwner"] not in EXCLUDE:
                out.append(r)
    return sorted(out, key=lambda r: r["createdAt"])

def bare(name):
    d = CACHE / (name.replace("/", "_") + ".git")
    if d.exists():
        run("git", "--git-dir", str(d), "fetch", "-q", "origin", "+refs/heads/*:refs/heads/*")
    else:
        CACHE.mkdir(parents=True, exist_ok=True)
        run("git", "clone", "-q", "--bare", "--filter=blob:none", f"https://github.com/{name}.git", str(d))
    return str(d)

def commits(gitdir):
    fmt = "%H%x1f%aI%x1f%P%x1f%B%x1e"
    out = run("git", "--git-dir", gitdir, "log", "HEAD", f"--format={fmt}")
    cs = []
    for rec in out.split("\x1e"):
        rec = rec.strip("\n")
        if rec:
            sha, date, parents, body = rec.split("\x1f", 3)
            cs.append({"date": date, "merge": len(parents.split()) > 1, "claude": bool(TRAILER.search(body)),
                       "revert": body.startswith("Revert")})
    return before_cutoff(cs, CUTOFF, key=lambda c: c["date"], since=START)

def docs(gitdir):
    ref = run("git", "--git-dir", gitdir, "rev-list", "-1", f"--before={CUTOFF}", "HEAD").strip()
    if not ref:
        return 0, 0, 0
    files = run("git", "--git-dir", gitdir, "ls-tree", "-r", "--name-only", ref).split("\n")
    specs = [f for f in files if SPEC.match(f)]
    plans = [f for f in files if PLAN.match(f)]
    decided = sum(1 for f in specs if DECIDED.search(run("git", "--git-dir", gitdir, "show", f"{ref}:{f}")))
    return len(specs), len(plans), decided

def prs(name):
    ps = gh_json("pr", "list", "-R", name, "--state", "all", "--limit", "3000", "--json", "state,mergedAt,closedAt,author")
    merged = before_cutoff([p for p in ps if p["mergedAt"]], CUTOFF, key=lambda p: p["mergedAt"], since=START)
    closed = before_cutoff([p for p in ps if p["state"] == "CLOSED" and not p["mergedAt"]], CUTOFF, key=lambda p: p["closedAt"], since=START)
    bots = sum(1 for p in merged if (p.get("author") or {}).get("is_bot") or "bot" in ((p.get("author") or {}).get("login") or ""))
    return merged, closed, bots

def releases(name):
    out = run("gh", "api", "--paginate", f"repos/{name}/releases", "--jq", ".[].published_at")
    return before_cutoff([d for d in out.split("\n") if d], CUTOFF, since=START)

def tokens(root, since, cutoff):
    seen = {}
    lo, hi = ts(since), ts(cutoff)
    for f in glob.glob(os.path.join(root, "**", "*.jsonl"), recursive=True):
        with open(f, errors="ignore") as fh:
            for line in fh:
                try:
                    e = json.loads(line)
                except ValueError:
                    continue
                m = e.get("message")
                if not isinstance(m, dict) or m.get("role") != "assistant" or not m.get("usage") or not m.get("id"):
                    continue
                if not e.get("timestamp") or not (lo <= ts(e["timestamp"]) <= hi):
                    continue
                seen[m["id"]] = (m.get("model", "?"), m["usage"])
    per = collections.defaultdict(lambda: collections.Counter())
    for model, u in seen.values():
        if model.startswith("<"):
            continue
        cc = u.get("cache_creation") or {}
        w5, w1 = cc.get("ephemeral_5m_input_tokens"), cc.get("ephemeral_1h_input_tokens")
        if w5 is None and w1 is None:
            w5, w1 = u.get("cache_creation_input_tokens") or 0, 0
        per[model].update({"input": u.get("input_tokens") or 0, "output": u.get("output_tokens") or 0,
                           "cacheRead": u.get("cache_read_input_tokens") or 0, "write5m": w5 or 0, "write1h": w1 or 0})
    usd, unpriced = price(per)
    tot = sum((c for c in per.values()), collections.Counter())
    return {"window": [since, cutoff], "messages": len(seen), "input": tot["input"], "output": tot["output"],
            "cacheRead": tot["cacheRead"], "cacheWrite": tot["write5m"] + tot["write1h"],
            "total": sum(tot.values()), "byModel": {k: sum(v.values()) for k, v in per.items()},
            "listPriceUsd": round(usd), "unpriced": unpriced}

def price(per):
    usd, unpriced = 0.0, {}
    for model, c in per.items():
        if model not in PRICES:
            unpriced[model] = sum(c.values())
            continue
        i, o, cr = PRICES[model]
        cr = cr if cr is not None else 0.1 * i
        usd += (c["input"] * i + c["output"] * o + c["cacheRead"] * cr + c["write5m"] * 1.25 * i + c["write1h"] * 2 * i) / 1e6
    return round(usd, 6), unpriced

def load_stats(path=HERE / "stats.json"):
    return json.loads(pathlib.Path(path).read_text())

def main():
    rows, days, dmerged, weekly = [], collections.Counter(), collections.Counter(), collections.Counter()
    t = collections.Counter()
    for r in repos():
        name = r["nameWithOwner"]
        g = bare(name)
        cs = commits(g)
        merged, closed, bots = prs(name)
        rel = releases(name)
        s, p, d = docs(g)
        for c in cs:
            days[c["date"][:10]] += 1
            weekly[iso_week(c["date"])] += 1
        for m in merged:
            dmerged[m["mergedAt"][:10]] += 1
        nm = [c for c in cs if not c["merge"]]
        rows.append({"repo": name, "created": r["createdAt"][:10], "commits": len(cs), "nonMerge": len(nm),
                     "claude": sum(c["claude"] for c in nm), "merged": len(merged), "closedUnmerged": len(closed),
                     "releases": len(rel)})
        t.update({"commits": len(cs), "nonMerge": len(nm), "claude": sum(c["claude"] for c in nm), "merged": len(merged),
                  "mergedByBots": bots, "closedUnmerged": len(closed), "releases": len(rel), "specs": s, "plans": p,
                  "decisionSections": d, "reverts": sum(c["revert"] for c in cs)})
    robcv = commits(str(ROBCV / ".git"))
    for c in robcv:
        weekly[iso_week(c["date"])] += 1
    first = run("git", "-C", str(ROBCV), "log", "--reverse", "--format=%aI", "HEAD").split("\n")[0]
    weeks, day = [], datetime.date.fromisoformat(START)
    while day <= ts(CUTOFF).date():
        k = iso_week(day.isoformat())
        if not weeks or weeks[-1]["week"] != k:
            weeks.append({"week": k, "monday": (day - datetime.timedelta(days=day.weekday())).isoformat(), "commits": weekly[k]})
        day += datetime.timedelta(days=1)
    busiest = max(days, key=days.get)
    out = {"cutoff": CUTOFF, "start": START, "repos": rows,
           "totals": dict(t, repos=len(rows), owners=len(OWNERS), claudeShare=round(t["claude"] / t["nonMerge"], 3)),
           "busiestDay": {"date": busiest, "commits": days[busiest], "merged": dmerged[busiest]},
           "weekly": weeks, "births": [{"repo": r["repo"], "date": r["created"]} for r in rows],
           "robcv": {"first": first[:10], "commits": len(robcv)},
           "tokens": tokens(str(pathlib.Path.home() / ".claude/projects"), TOKENS_FROM, CUTOFF)}
    (HERE / "stats.json").write_text(json.dumps(out, indent=1) + "\n")
    print(json.dumps(out["totals"], indent=1), out["busiestDay"], out["tokens"]["listPriceUsd"], out["tokens"]["unpriced"])

if __name__ == "__main__":
    main()
```

- [ ] **Step 4: Run the tests to see them pass**

Run: `cd talks/deciding-well && python3 -m unittest test_stats -v` Expected: 5 tests, OK.

- [ ] **Step 5: Run the script and read the figures against the spec**

Run: `export PATH=/opt/homebrew/bin:$PATH && chmod +x talks/deciding-well/stats.py && talks/deciding-well/stats.py` Expected: totals near the spec's §1 table: 23 repos, commits about 5,000, merged about 1,600, releases about 267, specs 95, plans 105, decisionSections 36, reverts 1, listPriceUsd about 9,800, `unpriced` empty. Any figure that differs from the spec is written into the spec's §1 table in the same commit, with the reason if one is known. Read `stats.json` whole: rob-cv appears only as the `robcv` key with `first` and `commits`, and nowhere in `repos`.

- [ ] **Step 6: Commit**

```bash
git add talks/deciding-well/stats.py talks/deciding-well/test_stats.py talks/deciding-well/stats.json docs/superpowers/specs/2026-09-24-deciding-well-talk-design.md
git commit   # subject: "The talk's figures are counted to a fixed cutoff"; Verified: the five unit tests pass and the totals match the spec's table
```

### Task 2: The English deck

**Files:**

- Create: `talks/deciding-well/index.html`
- Create: `talks/deciding-well/README.md`

**Interfaces:**

- Consumes: `stats.json` from Task 1 for every figure on a slide.
- Produces: a deck with eleven `<section class="slide` blocks numbered `00`–`10` in `.kicker[data-n]`, a chart region `<!-- chart:begin -->…<!-- chart:end -->` on slide 04, `TALK.en` title `Deciding well · a talk by Robert Blust` and a description of one sentence.

- [ ] **Step 1: Copy the shell**

Run: `cp talks/mental-model/index.html talks/deciding-well/index.html`. Then, in the copy: replace every `talks/mental-model/` URL (canonical, `og:url`, `og:image`) with `talks/deciding-well/`; set `<title>`, `og:title`, `og:description`, `metadesc`, `og:image:alt` and the JSON-LD `WebPage`/`BreadcrumbList` names from the new `TALK.en`; delete every slide between `<div class="deck" id="deck">` and the transport, keeping the transport, notes and script blocks unchanged apart from `TALK`; delete the `#ah` arrow marker's `<svg>` only if no slide uses it. Keep the `<style>` block whole, since every rule in it is the deck family's.

- [ ] **Step 2: Dispatch the writer for the English**

Dispatch a subagent with `conventions/WRITER.md` as its instructions and this brief: audience a mixed room of leaders and engineers; the one point is the site's line; the facts are `talks/deciding-well/stats.json` and the spec's §3 table, nothing else; the place is `talks/deciding-well/index.html`, one `<section class="slide">` per row of §3, each with `.kicker.mono[data-n]`, one `h1` (slide 00's in two weights, `Building fast is solved.` light and `<em>Deciding well is not.</em>` heavy, as the site's title does), at most one `.sub`, and either a `.grid` of `.cell`s (slide 03's six figures, slide 09's three instances), a `.stamp` or a `.note`; `data-notes` in the spoken register with stage directions in `<em class='cue'>`; `data-say-title="no"` on a slide whose note opens by restating its headline; `data-time` cumulative to about 10:00; no `data-de` yet. Figures as the spec states them: exact counts with the date "as of Sep 24, 2026", the cost as "about $200 a month" and "about $10,000 at API list price". The writer reports every claim it could not trace to the brief.

- [ ] **Step 3: Read the report and the page**

Run: `npm run serve` on a free port (`python3 -m http.server 0 --bind 127.0.0.1` prints it) and open `/talks/deciding-well/` at 1280×720 and at 390 px. Every figure on a slide is compared with `stats.json` by hand; the note of slide 07 carries no decision count; slide 02 names no employer; slide 05 names the window.

- [ ] **Step 4: Write the README**

`talks/deciding-well/README.md` in the form of `talks/mental-model/README.md`: `# Deciding Well`, one paragraph on the talk, the View and Controls sections copied, a Contents list naming `index.html`, the two PDFs, `stats.json` and `stats.py`, and one paragraph saying the figures are a snapshot of 2026-09-24 counted by `stats.py`, which is run by hand. Run `sh conventions/conventions-format check` and `sh conventions/conventions-check`; both pass.

- [ ] **Step 5: Commit**

```bash
git add talks/deciding-well/index.html talks/deciding-well/README.md
git commit   # subject: "The deciding-well talk in English"; Verified: conventions-format and conventions-check pass, the deck read at 1280x720 and 390 px
```

### Task 3: The chart on slide 04

**Files:**

- Create: `talks/deciding-well/chart.py`
- Create: `talks/deciding-well/test_chart.py`
- Modify: `talks/deciding-well/index.html` (between the chart markers)

**Interfaces:**

- Consumes: `load_stats()` and the `weekly`, `births`, `busiestDay` keys from Task 1.
- Produces: `render(stats) -> str`, an `<svg class="chart" viewBox="0 0 1200 480" role="img" aria-label="…">` with one `<rect class="bar">` per week and one `<line class="birth">` per repository; `write(html, svg) -> str` that replaces the marked region.

Before writing it, load the `dataviz` skill and follow its bar-chart and axis guidance within the site's tokens: bars `var(--c-mid)`, the busiest week `var(--c-firm)`, axis text in mono at the deck's label size, no legend, direct labels.

- [ ] **Step 1: Write the failing tests**

```python
# talks/deciding-well/test_chart.py
import unittest
import chart

S = {"weekly": [{"week": "2026-W24", "monday": "2026-06-08", "commits": 8},
                {"week": "2026-W25", "monday": "2026-06-15", "commits": 40}],
     "births": [{"repo": "a/b", "date": "2026-06-16"}], "busiestDay": {"date": "2026-06-17"}}

class Chart(unittest.TestCase):
    def test_one_bar_per_week_and_one_mark_per_birth(self):
        svg = chart.render(S)
        self.assertEqual(svg.count('class="bar'), 2)
        self.assertEqual(svg.count('class="birth"'), 1)

    def test_busiest_week_is_marked(self):
        self.assertIn('class="bar peak"', chart.render(S))

    def test_write_replaces_only_the_region(self):
        html = "a<!-- chart:begin -->old<!-- chart:end -->b"
        self.assertEqual(chart.write(html, "<svg/>"), "a<!-- chart:begin --><svg/><!-- chart:end -->b")

    def test_write_refuses_a_page_without_markers(self):
        with self.assertRaises(ValueError):
            chart.write("no markers", "<svg/>")

if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run them to see them fail**

Run: `cd talks/deciding-well && python3 -m unittest test_chart -v` Expected: FAIL with `ModuleNotFoundError: No module named 'chart'`.

- [ ] **Step 3: Write the script**

```python
#!/usr/bin/env python3
"""Draws slide 04's chart from stats.json into the deck, between its markers.

  ./chart.py        # rewrites the region in index.html
"""
import datetime, pathlib, re
from stats import load_stats, iso_week

HERE = pathlib.Path(__file__).resolve().parent
REGION = re.compile(r"(<!-- chart:begin -->)(.*?)(<!-- chart:end -->)", re.S)
W, H, L, B = 1200, 480, 56, 48   # frame, left gutter for the axis, bottom band for labels

def render(s):
    weeks = s["weekly"]
    top = max(w["commits"] for w in weeks) or 1
    peak = iso_week(s["busiestDay"]["date"])
    step = (W - L) / len(weeks)
    out = [f'<svg class="chart" viewBox="0 0 {W} {H}" role="img" aria-label="Commits per week, '
           f'{weeks[0]["monday"]} to {weeks[-1]["monday"]}">']
    for i, w in enumerate(weeks):
        h = (H - B) * w["commits"] / top
        x = L + i * step
        cls = "bar peak" if w["week"] == peak else "bar"
        out.append(f'<rect class="{cls}" x="{x + step * .15:.1f}" y="{H - B - h:.1f}" width="{step * .7:.1f}" height="{h:.1f}"></rect>')
        out.append(f'<text class="wk" x="{x + step / 2:.1f}" y="{H - B + 22}">{w["week"][-3:]}</text>')
        if w["commits"]:
            out.append(f'<text class="n" x="{x + step / 2:.1f}" y="{H - B - h - 8:.1f}">{w["commits"]:,}</text>')
    first = datetime.date.fromisoformat(weeks[0]["monday"])
    for b in s["births"]:
        d = datetime.date.fromisoformat(b["date"])
        if d < first:
            continue
        x = L + (d - first).days / 7 * step
        out.append(f'<line class="birth" x1="{x:.1f}" x2="{x:.1f}" y1="{H - B + 30}" y2="{H - B + 40}"></line>')
    out.append("</svg>")
    return "".join(out)

def write(html, svg):
    if not REGION.search(html):
        raise ValueError("the deck carries no chart:begin / chart:end markers")
    return REGION.sub(lambda m: m.group(1) + svg + m.group(3), html, count=1)

if __name__ == "__main__":
    page = HERE / "index.html"
    page.write_text(write(page.read_text(), render(load_stats())))
```

Add to the deck's own `<style>`, beside the other slide rules: `.chart .bar{fill:var(--c-mid)} .chart .peak{fill:var(--c-firm)} .chart text{font-family:"Plex Mono",ui-monospace,monospace; font-size:14px; fill:var(--c-mid); text-anchor:middle} .chart .birth{stroke:var(--c-firm); stroke-width:2}`, and put the markers inside slide 04 where the figure goes.

- [ ] **Step 4: Run the tests, then the script, then look**

Run: `cd talks/deciding-well && python3 -m unittest test_chart -v && ./chart.py` Expected: 4 tests OK; slide 04 shows sixteen weekly bars W24–W39 with the peak brighter and a tick for each repository born in the period. Read it in both themes at 1280×720; the chart stays under the `60cqmin` media ceiling.

- [ ] **Step 5: Commit**

```bash
git add talks/deciding-well/chart.py talks/deciding-well/test_chart.py talks/deciding-well/index.html
git commit   # subject: "Slide 04 draws the weeks from the snapshot"; Verified: the four chart tests pass, the slide read in both themes
```

### Task 4: The owner reviews the English

- [ ] **Step 1: Stop and hand over**

Report to the owner: the local URL of the deck, the writer's list of untraced claims, and every figure with its `stats.json` key. Wait. The owner's corrections come back as new commits on the branch, one per review round, each re-running Task 3's `./chart.py` if a figure moved. German does not start until the owner says the English is right.

### Task 5: The German

**Files:**

- Modify: `talks/deciding-well/index.html` (every `data-de`, `data-notes-de`, `TALK.de`, `UI.de`)

- [ ] **Step 1: Extract the values**

Run `npx design german --help` and read how `extract` and `apply` take their arguments, then extract the deck's English values into the session scratchpad.

- [ ] **Step 2: Run the pipeline, one agent per role**

Translator with `conventions/TRANSLATOR.md`, `GLOSSARY.md` and `GERMAN.md` over the whole page; editor with `conventions/EDITOR.md` on the German alone; back-reader with `conventions/BACKREADER.md` on the German alone after the editor's corrections and each flag's first option are in; then set the English against the back-reading and send back every value whose meaning moved. Terms already settled: career break = Auszeit, decision = Entscheid, company = Firma, deck = Präsentation, Release (das), role = Rolle.

- [ ] **Step 3: The owner's picks**

Put the editor's flags and the translator's term doubts in a review artifact with a `picks` collection, as the German pipeline did for the three sites, and wait for the owner. A term choice that generalizes is noted for a later glossary row in conventions, not written there from this branch.

- [ ] **Step 4: Apply and check**

Apply the settled German with `npx design german apply` as its help states. Read the deck in German at 1280×720 and 390 px. After the commit of Step 5, `npx design german stale origin/main HEAD` reports nothing stale.

- [ ] **Step 5: Commit**

```bash
git add talks/deciding-well/index.html
git commit   # subject: "The deciding-well talk in German"; Verified: design german stale reports nothing, the deck read in German
```

### Task 6: The talk is registered everywhere

**Files:**

- Modify: `talks/index.html:251-272` (a third `.talkrow`)
- Modify: `tts/generate.py:31` (`DECKS`)
- Modify: `export-pdf.mjs:20-21` (`decks`)
- Modify: `og-recipe.mjs:61-62` (a card)
- Modify: `build/jsonld.mjs:25-27` (`PAGES`)
- Modify: `verify/check.mjs` (a `PAGES` entry and the talks index's `sameTab` and `contains`)
- Modify: `README.md`, `AGENTS.md` ("two talks" becomes "the talks")
- Modify: `sitemap.xml` (by `npm run sitemap`)

- [ ] **Step 1: Add the deck to the suite first, and see it fail**

In `verify/check.mjs`, copy the `/talks/essential-complexity/` entry to a new one for `/talks/deciding-well/` with `title: /Deciding well/`, `translates: { lang: "de", shows: [<the German kicker of slide 00 in capitals>, <one German word of its h1>], hides: [<the English kicker in capitals>], id: "langDe", backId: "langEn" }`, and `contains: [<every figure string on slides 03 and 05 exactly as rendered, e.g. "4,995">]`. Add `"deciding-well/"` to the talks index's `sameTab` and `"Deciding well"` to its `contains`. Run `npm run verify` against a server on a free port; expected: FAIL, because the talks index does not list the deck yet and the deck has no share card.

- [ ] **Step 2: Register the deck**

Add the third `.talkrow` to `talks/index.html` in the form of the other two, with `href="deciding-well/"`, `<b>10 min</b>`, the description from `TALK.en.desc` and its German, and the PDF pair `deciding-well/deciding-well-en.pdf` / `deciding-well/deciding-well-de.pdf`. Add `"deciding-well"` to `DECKS`, `{ dir: "talks/deciding-well", slug: "deciding-well" }` to `export-pdf.mjs`, `{ dir: "talks/deciding-well", ...FRAME, hide: HIDE, titleSlide: true }` to `og-recipe.mjs`, and `"talks/deciding-well/index.html"` to `build/jsonld.mjs`'s `PAGES`. In `README.md` and `AGENTS.md`, reword every "two talks" so that it names no count. The same words stand in this site's row of `conventions/REPOSITORIES.md`, which is vendored and is not edited here: that row changes in robertblust/conventions, as a follow-up the pull request names. The new row's two German values, the title and the description, go through Task 5's Steps 2–4 on `talks/index.html` before this task's commit.

- [ ] **Step 3: Generate what is derived**

Run: `npm run pages && npm run og && npm run pdf && npm run sitemap` Expected: `build/jsonld.mjs` rewrites the deck's JSON-LD block; a new `talks/deciding-well/og.png` and `og.sha`, a re-rendered `talks/og.png`; `deciding-well-en.pdf` and `deciding-well-de.pdf`; a new sitemap row.

- [ ] **Step 4: Run every check**

Run: `npm run verify && npm run og:check && npm run pages:check && npm run sitemap:check && npm run design:check && npm run test:og && npm run test:build && sh conventions/conventions-check && sh conventions/conventions-format check` Expected: all pass. Read each exit code on its own, never through a pipe.

- [ ] **Step 5: Commit**

```bash
git add talks/index.html tts/generate.py export-pdf.mjs og-recipe.mjs build/jsonld.mjs verify/check.mjs README.md AGENTS.md sitemap.xml talks/og.png talks/og.sha talks/deciding-well/
git commit   # subject: "The talks index lists the deciding-well talk"; Verified: verify, og:check, pages:check, sitemap:check, design:check and the conventions checks pass
```

### Task 7: Narration

- [ ] **Step 1: Price it**

Run: `./tts/generate.py --dry-run --deck deciding-well` Expected: 22 clips would be written, eleven per language, with the characters billed. Report the count and the characters to the owner and wait for the word; the run is billed.

- [ ] **Step 2: Record**

Run: `export ELEVENLABS_API_KEY="$(zsh -ic 'printf %s "$ELEVENLABS_API_KEY"' 2>/dev/null)" && ./tts/generate.py --deck deciding-well`, then `./tts/generate.py --dry-run` again; expected: nothing would be written. Never print the key.

- [ ] **Step 3: Listen and check**

Play slides 00, 05 and 10 in both languages in the deck; the voice reads no stage direction and no headline twice. Run `npm run verify`; it passes.

- [ ] **Step 4: Commit**

```bash
git add talks/deciding-well/audio
git commit   # subject: "The deciding-well talk is narrated"; Verified: the dry run writes nothing and verify passes
```

### Task 8: The pull request

- [ ] **Step 1: Push and open it**

Run: `git push -u origin building-fast-talk` and `gh pr create --title "A talk on deciding well" --body-file <body>`, the body in the git register: the commit bodies reread for a reviewer, ending `Verified: …` and `🤖 Generated with [Claude Code](https://claude.com/claude-code)`.

- [ ] **Step 2: Report and stop**

Report the PR URL and the two checks, `verify` and `conventions / conventions`. Merging is the owner's word; the merge, the branch and worktree cleanup follow only after it.
