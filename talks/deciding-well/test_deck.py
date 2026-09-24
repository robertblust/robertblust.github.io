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
GERMAN = " ".join(re.findall(r'data-de="([^"]*)"', HTML))

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
                self.assertIn(de(n), GERMAN)

    def test_the_share_of_commits_written_with_claude(self):
        share = round(100 * STATS["totals"]["claude"] / STATS["totals"]["nonMerge"])
        self.assertRegex(HTML, rf"<b[^>]*>{share}%</b>")
        self.assertRegex(GERMAN, rf"{share}[\u00a0\u202f ]%")

    def test_the_revert_line_names_the_commit_count(self):
        self.assertIn(f"revert in {en(STATS['totals']['commits'])} commits", HTML)
        self.assertIn(f"Revert in {de(STATS['totals']['commits'])} Commits", GERMAN)

    def test_the_busiest_day_in_the_note(self):
        self.assertEqual(STATS["busiestDay"]["date"], "2026-09-21")

if __name__ == "__main__":
    unittest.main()
