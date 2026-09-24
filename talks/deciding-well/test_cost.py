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
