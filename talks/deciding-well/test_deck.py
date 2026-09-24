"""The figures the slides show are the snapshot's, in both languages.

A slide whose number drifted from stats.json or decisions.json renders fine and passes every
check that reads the page, so this reads the deck's source instead: each figure must appear
in its English form and, inside a data-de value, in its Swiss form.
"""
import json, pathlib, re, unittest

HERE = pathlib.Path(__file__).resolve().parent
HTML = (HERE / "index.html").read_text()
STATS = json.loads((HERE / "stats.json").read_text())
DECISIONS = json.loads((HERE / "decisions.json").read_text())
GERMAN = re.findall(r'data-de="([^"]*)"', HTML)
NOTES = " ".join(re.findall(r'data-notes="([^"]*)"', HTML))

def en(n):
    return f"{n:,}"

def de(n):
    return f"{n:,}".replace(",", "’")

class Figures(unittest.TestCase):
    def figures(self):
        t, c = STATS["totals"], DECISIONS["counts"]
        return {"repositories": t["repos"], "commits": t["commits"], "merged": t["merged"],
                "releases": t["releases"], "decisions": c["total"], "standing": c["taken"], "revised": c["revised"],
                "dropped": c["dropped"], "specs": t["specs"], "plans": t["plans"]}

    def test_every_figure_is_on_a_slide_in_english(self):
        for name, n in self.figures().items():
            with self.subTest(name):
                self.assertRegex(HTML, rf"<b[^>]*>{re.escape(en(n))}</b>")

    def test_every_figure_is_on_a_slide_in_german(self):
        for name, n in self.figures().items():
            with self.subTest(name):
                self.assertIn(de(n), GERMAN, "a German cell must hold the figure as its whole value")

    def test_the_share_of_commits_written_with_claude(self):
        share = round(100 * STATS["totals"]["claude"] / STATS["totals"]["nonMerge"])
        self.assertRegex(HTML, rf"<b[^>]*>{share}%</b>")
        self.assertIn(f"{share}\u00a0%", GERMAN)

    def test_the_revert_line_names_the_commit_count(self):
        self.assertIn(f"revert in {en(STATS['totals']['commits'])} commits", HTML)
        self.assertIn(f"Revert in {de(STATS['totals']['commits'])} Commits", GERMAN)
        self.assertRegex(HTML, rf"<b[^>]*>{STATS['totals']['reverts']}</b><span[^>]*>revert in")

    def test_the_cost_slide_rounds_the_snapshot(self):
        t = STATS["tokens"]
        self.assertEqual(t["unpriced"], {}, "a model with no price would make the list price too low")
        usd = f"about ${round(t['listPriceUsd'], -3):,}"
        billions = f"about {round(t['total'] / 1e9)} billion"
        for text in (usd, billions):
            with self.subTest(text):
                self.assertRegex(HTML, rf"<b[^>]*>{re.escape(text)}</b>")
        self.assertIn(f"rund {de(round(t['listPriceUsd'], -3))} Dollar", GERMAN)
        self.assertIn(f"rund {round(t['total'] / 1e9)} Milliarden", GERMAN)

    def test_the_organizations(self):
        self.assertIn(f"public repositories in {STATS['totals']['owners']} organizations", HTML)

    def test_the_busiest_day_in_the_note(self):
        day = STATS["busiestDay"]
        self.assertEqual(day["date"], "2026-09-21")
        self.assertIn("September 21", NOTES)
        self.assertIn("six hundred and ninety-five commits and two hundred and fourteen merged pull requests", NOTES)
        self.assertEqual((day["commits"], day["merged"]), (695, 214))

if __name__ == "__main__":
    unittest.main()
