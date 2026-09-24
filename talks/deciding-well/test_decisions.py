import unittest
import decisions

SPECS = {("a/b", "docs/s.md"): "We chose Markdown over YAML.\nThe arrows were declined after a prototype."}

class Decisions(unittest.TestCase):
    def out(self, *ds):
        return [{"specs": [{"repo": "a/b", "spec": "docs/s.md", "decisions": list(ds)}]}]

    def test_counts_by_status(self):
        r = decisions.merge(self.out(
            {"summary": "Markdown", "status": "taken", "evidence": "We chose Markdown over YAML.", "revisesOther": None},
            {"summary": "No arrows", "status": "dropped", "evidence": "arrows were declined", "revisesOther": None}), SPECS)
        self.assertEqual(r["counts"], {"total": 2, "taken": 1, "revised": 0, "dropped": 1})

    def test_evidence_must_be_in_the_spec(self):
        r = decisions.merge(self.out(
            {"summary": "x", "status": "taken", "evidence": "a sentence nobody wrote", "revisesOther": None}), SPECS)
        self.assertEqual(r["counts"]["total"], 0)
        self.assertEqual(len(r["unverified"]), 1)

    def test_evidence_match_ignores_markdown_and_spacing(self):
        specs = {("a/b", "docs/s.md"): "**We chose**\n  Markdown over `YAML`."}
        r = decisions.merge(self.out(
            {"summary": "m", "status": "taken", "evidence": "We chose Markdown over YAML.", "revisesOther": None}), specs)
        self.assertEqual(r["counts"]["total"], 1)

    def test_a_decision_another_spec_revises_counts_as_revised_once(self):
        r = decisions.merge(self.out(
            {"summary": "new", "status": "taken", "evidence": "We chose Markdown over YAML.", "revisesOther": {"spec": "old.md", "gist": "YAML"}},
            {"summary": "again", "status": "taken", "evidence": "arrows were declined", "revisesOther": {"spec": "old.md", "gist": "YAML"}}), SPECS)
        self.assertEqual(r["counts"]["revised"], 1)
        self.assertEqual(r["counts"]["total"], 2)
        self.assertEqual(r["counts"]["taken"], 1)

    def test_unknown_status_is_refused(self):
        with self.assertRaises(ValueError):
            decisions.merge(self.out({"summary": "x", "status": "maybe", "evidence": "We chose", "revisesOther": None}), SPECS)

if __name__ == "__main__":
    unittest.main()
