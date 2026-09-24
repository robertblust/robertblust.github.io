import unittest
import chart

S = {"daily": [{"date": "2026-06-29", "commits": 2}, {"date": "2026-06-30", "commits": 0},
               {"date": "2026-07-01", "commits": 9}, {"date": "2026-07-02", "commits": 40}],
     "births": [{"repo": "a/b", "date": "2026-07-01"}, {"repo": "old/one", "date": "2014-08-29"}],
     "busiestDay": {"date": "2026-07-02"}}

class Chart(unittest.TestCase):
    def test_one_bar_per_day_and_one_mark_per_birth_in_the_period(self):
        svg = chart.render(S)
        self.assertEqual(svg.count('class="col'), 4)
        self.assertEqual(svg.count('class="birth"'), 1)

    def test_the_axis_names_months_not_weeks(self):
        svg = chart.render(S)
        self.assertIn(">Jun<", svg)
        self.assertIn(">Jul<", svg)
        self.assertNotIn(">W2", svg)

    def test_busiest_day_is_marked_and_labeled_with_its_date(self):
        svg = chart.render(S)
        self.assertEqual(svg.count('class="col peak"'), 1)
        self.assertIn("Jul 2 · 40", svg)

    def test_bars_carry_a_hover_title(self):
        self.assertIn(">Jul 1, 2026: 9 commits</title>", chart.render(S))

    def test_labels_carry_their_swiss_german(self):
        svg = chart.render(S)
        self.assertIn('data-de="Juni"', svg)
        self.assertIn('data-de="Juli"', svg)
        self.assertIn('data-de="2. Juli · 40"', svg)
        self.assertIn('data-de-aria="Commits pro Tag, 29. Juni 2026 bis 2. Juli 2026"', svg)
        self.assertIn('data-de="1. Juli 2026: 9 Commits"', svg)

    def test_german_groups_thousands_by_the_typographic_apostrophe(self):
        self.assertEqual(chart.de_number(1503), "1’503")

    def test_a_peak_label_near_the_right_edge_ends_at_its_bar(self):
        import datetime
        days = [{"date": (datetime.date(2026, 6, 1) + datetime.timedelta(d)).isoformat(), "commits": d} for d in range(60)]
        edge = {"daily": days, "births": [], "busiestDay": {"date": days[-1]["date"]}}
        self.assertIn('class="n end"', chart.render(edge))
        self.assertNotIn('class="n end"', chart.render(S))

    def test_write_replaces_only_the_region(self):
        html = "a<!-- chart:begin -->old<!-- chart:end -->b"
        self.assertEqual(chart.write(html, "<svg/>"), "a<!-- chart:begin --><svg/><!-- chart:end -->b")

    def test_write_refuses_a_page_without_markers(self):
        with self.assertRaises(ValueError):
            chart.write("no markers", "<svg/>")

if __name__ == "__main__":
    unittest.main()
