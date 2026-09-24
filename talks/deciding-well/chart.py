#!/usr/bin/env python3
"""Draws slide 04's chart from stats.json into the deck, between its markers.

One series, so no legend: the slide's line names it. Values are labeled only where the story
turns, the first week past a tenth of the peak and the peak itself, and every bar carries its
count as a hover title. Bars are the interactive tone, the peak the resolved one, and text
wears the text token, never the bar's.

  ./chart.py        # rewrites the region in index.html
"""
import datetime, pathlib, re
from stats import load_stats, iso_week

HERE = pathlib.Path(__file__).resolve().parent
REGION = re.compile(r"(<!-- chart:begin -->)(.*?)(<!-- chart:end -->)", re.S)
W, H, L, B = 1200, 400, 24, 64   # frame, left inset, bottom band for week labels and birth ticks

def render(s):
    weeks = s["weekly"]
    top = max(w["commits"] for w in weeks) or 1
    peak = iso_week(s["busiestDay"]["date"])
    turn = next((w["week"] for w in weeks if w["commits"] >= top / 10), None)
    step = (W - 2 * L) / len(weeks)
    base = H - B
    out = [f'<svg class="chart" viewBox="0 0 {W} {H}" role="img" aria-label="Commits per week, '
           f'{weeks[0]["monday"]} to {weeks[-1]["monday"]}">']
    out.append(f'<line class="axis" x1="{L}" x2="{W - L}" y1="{base}" y2="{base}"></line>')
    for i, w in enumerate(weeks):
        h = max((base - 36) * w["commits"] / top, 0)
        x = L + i * step
        cls = "col peak" if w["week"] == peak else "col"
        out.append(f'<rect class="{cls}" x="{x + step * .18:.1f}" y="{base - h:.1f}" width="{step * .64:.1f}" '
                   f'height="{h:.1f}" rx="4"><title>{w["week"]}: {w["commits"]:,} commits</title></rect>')
        out.append(f'<text class="wk" x="{x + step / 2:.1f}" y="{base + 24}">{w["week"][-3:]}</text>')
        if w["week"] in (turn, peak):
            out.append(f'<text class="n" x="{x + step / 2:.1f}" y="{base - h - 10:.1f}">{w["commits"]:,}</text>')
    first = datetime.date.fromisoformat(weeks[0]["monday"])
    for b in s["births"]:
        d = datetime.date.fromisoformat(b["date"])
        if d < first:
            continue
        x = L + (d - first).days / 7 * step
        out.append(f'<line class="birth" x1="{x:.1f}" x2="{x:.1f}" y1="{base + 38}" y2="{base + 52}"></line>')
    out.append("</svg>")
    return "".join(out)

def write(html, svg):
    if not REGION.search(html):
        raise ValueError("the deck carries no chart:begin / chart:end markers")
    return REGION.sub(lambda m: m.group(1) + svg + m.group(3), html, count=1)

if __name__ == "__main__":
    page = HERE / "index.html"
    page.write_text(write(page.read_text(), render(load_stats())))
