import unittest
import chart

S = {"weekly": [{"week": "2026-W24", "monday": "2026-06-08", "commits": 8},
                {"week": "2026-W25", "monday": "2026-06-15", "commits": 40}],
     "births": [{"repo": "a/b", "date": "2026-06-16"}], "busiestDay": {"date": "2026-06-17"}}

class Chart(unittest.TestCase):
    def test_one_bar_per_week_and_one_mark_per_birth(self):
        svg = chart.render(S)
        self.assertEqual(svg.count('class="col'), 2)
        self.assertEqual(svg.count('class="birth"'), 1)

    def test_busiest_week_is_marked(self):
        self.assertIn('class="col peak"', chart.render(S))

    def test_write_replaces_only_the_region(self):
        html = "a<!-- chart:begin -->old<!-- chart:end -->b"
        self.assertEqual(chart.write(html, "<svg/>"), "a<!-- chart:begin --><svg/><!-- chart:end -->b")

    def test_bars_carry_a_hover_title_and_labels_are_selective(self):
        svg = chart.render(S)
        self.assertEqual(svg.count("<title>"), 2)
        self.assertEqual(svg.count('class="n"'), 2)

    def test_write_refuses_a_page_without_markers(self):
        with self.assertRaises(ValueError):
            chart.write("no markers", "<svg/>")

if __name__ == "__main__":
    unittest.main()
