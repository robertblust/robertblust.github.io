#!/usr/bin/env python3
"""The figures of the deciding-well talk, counted up to a fixed cutoff.

Run by hand, never in CI: it needs gh signed in, the local rob-cv clone and the Claude Code
logs under ~/.claude/projects. Every count is filtered by CUTOFF, never by the clock, so a run
on a later day gives the same numbers. rob-cv contributes its first date and its commit count
and nothing else, because its content is private.

  ./stats.py            # writes stats.json beside this file
  ./stats.py --extend   # adds lines of code and active days to the stats.json already there
"""
import collections, datetime, glob, json, os, pathlib, re, subprocess

HERE = pathlib.Path(__file__).resolve().parent
START = "2026-06-09"
CUTOFF = "2026-09-24T22:21:00+02:00"
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

def tip(gitdir, cutoff=CUTOFF):
    """The default branch as it stood at the cutoff. First parents only, because a merge's own
    commit time is when its branch arrived: a commit authored before the cutoff but merged after
    it was not on the branch yet, and a later run must not find it there."""
    return run("git", "--git-dir", gitdir, "rev-list", "-1", "--first-parent", f"--before={cutoff}", "HEAD").strip()

def commits(gitdir, cutoff=CUTOFF):
    ref = tip(gitdir, cutoff)
    if not ref:
        return []
    fmt = "%H%x1f%aI%x1f%P%x1f%B%x1e"
    out = run("git", "--git-dir", gitdir, "log", ref, f"--format={fmt}")
    cs = []
    for rec in out.split("\x1e"):
        rec = rec.strip("\n")
        if rec:
            sha, date, parents, body = rec.split("\x1f", 3)
            cs.append({"date": date, "merge": len(parents.split()) > 1, "claude": bool(TRAILER.search(body)),
                       "revert": body.startswith("Revert")})
    return before_cutoff(cs, cutoff, key=lambda c: c["date"], since=START)

def docs(gitdir):
    ref = tip(gitdir)
    if not ref:
        return 0, 0, 0
    files = run("git", "--git-dir", gitdir, "ls-tree", "-r", "--name-only", ref).split("\n")
    specs = [f for f in files if SPEC.match(f)]
    plans = [f for f in files if PLAN.match(f)]
    decided = sum(1 for f in specs if DECIDED.search(run("git", "--git-dir", gitdir, "show", f"{ref}:{f}")))
    return len(specs), len(plans), decided

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

def prefetch(gitdir, oids):
    """A blobless clone fetches a missing blob on first read, one round trip each, which took
    over ten minutes for one repository. This asks for every missing blob in one fetch."""
    check = subprocess.run(["git", "--git-dir", gitdir, "cat-file", "--batch-check"], input="\n".join(oids).encode(),
                           capture_output=True, check=True, env=dict(os.environ, GIT_NO_LAZY_FETCH="1")).stdout.decode()
    missing = [l.split()[0] for l in check.split("\n") if l.endswith(" missing")]
    if missing:
        subprocess.run(["git", "--git-dir", gitdir, "-c", "fetch.negotiationAlgorithm=noop", "fetch", "-q", "--no-tags",
                        "--no-write-fetch-head", "--filter=blob:none", "--stdin", "origin"],
                       input="\n".join(missing).encode(), capture_output=True, check=True)

def tree_texts(gitdir, ref):
    """Every text file of the tree at ref, read in one cat-file batch. Blobless clones fetch the
    blobs they lack on first read, which is slow once and cached after."""
    # -z, because without it git quotes a path with a non-ASCII character, and a quoted name's
    # extension ends in a quote mark, so the file would drop out of the count without a word.
    tree = [r.split("\t", 1) for r in run("git", "--git-dir", gitdir, "ls-tree", "-r", "-z", ref).split("\0") if r]
    oids = {path: meta.split()[2] for meta, path in tree if meta.split()[1] == "blob"}
    wanted = [f for f in oids if os.path.splitext(f)[1].lower() in CODE | {".md"} and not SKIP.search(f)]
    prefetch(gitdir, [oids[f] for f in wanted])
    batch = "".join(f"{ref}:{f}\n" for f in wanted)
    out = subprocess.run(["git", "--git-dir", gitdir, "cat-file", "--batch"], input=batch.encode(),
                         capture_output=True, check=True).stdout
    texts, i = {}, 0
    for f in wanted:
        header_end = out.index(b"\n", i)
        header = out[i:header_end].split()
        if header[-1] == b"missing":
            raise RuntimeError(f"{gitdir}: {f} is in the tree at {ref} but its content could not be read")
        size = int(header[2])
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

def daily_series(counts, start, cutoff):
    day, end, out = datetime.date.fromisoformat(start), ts(cutoff).date(), []
    while day <= end:
        out.append({"date": day.isoformat(), "commits": counts.get(day.isoformat(), 0)})
        day += datetime.timedelta(days=1)
    return out

def load_stats(path=HERE / "stats.json"):
    return json.loads(pathlib.Path(path).read_text())

def main():
    rows, days, dmerged, weekly = [], collections.Counter(), collections.Counter(), collections.Counter()
    alldays = collections.Counter()
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
            alldays[c["date"][:10]] += 1
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
        alldays[c["date"][:10]] += 1
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
           "weekly": weeks, "daily": daily_series(alldays, START, CUTOFF), "births": [{"repo": r["repo"], "date": r["created"]} for r in rows],
           "robcv": {"first": first[:10], "commits": len(robcv)},
           "tokens": tokens(str(pathlib.Path.home() / ".claude/projects"), TOKENS_FROM, CUTOFF),
           "activeDays": active_days(daily_series(alldays, START, CUTOFF))}
    out["code"] = count_code()
    (HERE / "stats.json").write_text(json.dumps(out, indent=1) + "\n")
    print(json.dumps(out["totals"], indent=1), out["busiestDay"], out["tokens"]["listPriceUsd"], out["tokens"]["unpriced"])

if __name__ == "__main__":
    import sys
    if "--extend" in sys.argv:
        out = extend(load_stats(), count_code())
        (HERE / "stats.json").write_text(json.dumps(out, indent=1) + "\n")
        print(out["code"]["totals"], out["activeDays"])
    else:
        main()
