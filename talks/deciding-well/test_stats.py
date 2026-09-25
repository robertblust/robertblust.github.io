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

    def test_daily_series_fills_every_day_from_start_to_cutoff(self):
        d = stats.daily_series({"2026-06-10": 3}, "2026-06-09", "2026-06-11T23:59:59+02:00")
        self.assertEqual(d, [{"date": "2026-06-09", "commits": 0}, {"date": "2026-06-10", "commits": 3},
                             {"date": "2026-06-11", "commits": 0}])

    def test_commits_merged_after_the_cutoff_are_not_counted(self):
        import subprocess
        def git(d, *a, date):
            env = dict(os.environ, GIT_AUTHOR_DATE=date, GIT_COMMITTER_DATE=date,
                       GIT_AUTHOR_NAME="t", GIT_AUTHOR_EMAIL="t@t", GIT_COMMITTER_NAME="t", GIT_COMMITTER_EMAIL="t@t")
            subprocess.run(["git", "-C", d, *a], check=True, capture_output=True, env=env)
        with tempfile.TemporaryDirectory() as d:
            git(d, "init", "-q", "-b", "main", date="2026-09-01T10:00:00+02:00")
            git(d, "commit", "-q", "--allow-empty", "-m", "on main", date="2026-09-01T10:00:00+02:00")
            git(d, "checkout", "-q", "-b", "side", date="2026-09-01T10:00:00+02:00")
            git(d, "commit", "-q", "--allow-empty", "-m", "authored before, merged after", date="2026-09-24T20:00:00+02:00")
            git(d, "checkout", "-q", "main", date="2026-09-25T09:00:00+02:00")
            git(d, "merge", "-q", "--no-ff", "side", "-m", "merge after the cutoff", date="2026-09-25T09:00:00+02:00")
            cs = stats.commits(os.path.join(d, ".git"), CUT)
        self.assertEqual(len(cs), 1)

    def test_price_uses_cache_multipliers(self):
        per = {"claude-sonnet-5": {"input": 0, "output": 0, "cacheRead": 1_000_000, "write5m": 1_000_000, "write1h": 1_000_000}}
        usd, _ = stats.price(per)
        # read 0.1 x 2 + write5m 1.25 x 2 + write1h 2 x 2 = 0.2 + 2.5 + 4.0
        self.assertAlmostEqual(usd, 6.7)

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

    def test_tree_texts_reads_a_path_git_would_quote(self):
        import subprocess
        with tempfile.TemporaryDirectory() as d:
            env = dict(os.environ, GIT_AUTHOR_NAME="t", GIT_AUTHOR_EMAIL="t@t", GIT_COMMITTER_NAME="t", GIT_COMMITTER_EMAIL="t@t")
            run = lambda *a: subprocess.run(["git", "-C", d, *a], check=True, capture_output=True, env=env)
            run("init", "-q", "-b", "main")
            with open(os.path.join(d, "Übersicht.md"), "w") as f:
                f.write("# Titel\n\nText\n")
            with open(os.path.join(d, "a.py"), "w") as f:
                f.write("x = 1\n")
            run("add", "-A"); run("commit", "-q", "-m", "c")
            counts = stats.line_counts(stats.tree_texts(os.path.join(d, ".git"), "HEAD"))
        self.assertEqual(counts, {"code": 1, "test": 0, "markdown": 2})

if __name__ == "__main__":
    unittest.main()
