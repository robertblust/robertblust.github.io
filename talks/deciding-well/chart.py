#!/usr/bin/env python3
"""Draws slide 04's chart from stats.json into the deck, between its markers.

One bar per day, from the first commit to the cutoff, with the months named on the axis: a
room reads dates, not week numbers. One series, so no legend; the slide's line names it. Only
the busiest day carries a number, every bar carries its count as a hover title, and a tick
under the axis marks the day each repository was born. Bars are the interactive tone, the peak
the resolved one, and text wears the text token, never the bar's.

  ./chart.py        # rewrites the region in index.html
"""
import datetime, pathlib, re
from stats import load_stats

HERE = pathlib.Path(__file__).resolve().parent
REGION = re.compile(r"(<!-- chart:begin -->)(.*?)(<!-- chart:end -->)", re.S)
W, H, L, B = 1200, 400, 24, 64   # frame, left inset, bottom band for month labels and birth ticks
MONTHS = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split()
# The Swiss abbreviations WRITING.md sets: a month carries its period where German abbreviates it.
MONATE = "Jan. Febr. März Apr. Mai Juni Juli Aug. Sept. Okt. Nov. Dez.".split()

def de_number(n):
    return f"{n:,}".replace(",", "’")

def de_label(d, year=False):
    return f"{d.day}. {MONATE[d.month - 1]}" + (f" {d.year}" if year else "")

def label(d, year=False):
    return f"{MONTHS[d.month - 1]} {d.day}" + (f", {d.year}" if year else "")

def render(s):
    days = s["daily"]
    top = max(d["commits"] for d in days) or 1
    peak = s["busiestDay"]["date"]
    step = (W - 2 * L) / len(days)
    base = H - B
    first = datetime.date.fromisoformat(days[0]["date"])
    last = datetime.date.fromisoformat(days[-1]["date"])
    out = [f'<svg class="chart" viewBox="0 0 {W} {H}" role="img" aria-label="Commits per day, '
           f'{label(first, True)} to {label(last, True)}" '
           f'data-de-aria="Commits pro Tag, {de_label(first, True)} bis {de_label(last, True)}">']
    out.append(f'<line class="axis" x1="{L}" x2="{W - L}" y1="{base}" y2="{base}"></line>')
    for i, d in enumerate(days):
        day = datetime.date.fromisoformat(d["date"])
        h = max((base - 36) * d["commits"] / top, 0)
        x = L + i * step
        cls = "col peak" if d["date"] == peak else "col"
        out.append(f'<rect class="{cls}" x="{x + step * .12:.1f}" y="{base - h:.1f}" width="{step * .76:.1f}" '
                   f'height="{h:.1f}" rx="1.5"><title data-de="{de_label(day, True)}: {de_number(d["commits"])} Commits">{label(day, True)}: {d["commits"]:,} commits</title></rect>')
        if day.day == 1 or i == 0:
            out.append(f'<text class="mo" x="{x:.1f}" y="{base + 24}" data-de="{MONATE[day.month - 1]}">{MONTHS[day.month - 1]}</text>')
        if d["date"] == peak:
            near = x + step / 2 > W - 160
            anchor = f'class="n end" x="{x + step:.1f}"' if near else f'class="n" x="{x + step / 2:.1f}"'
            out.append(f'<text {anchor} y="{base - h - 10:.1f}" data-de="{de_label(day)} · {de_number(d["commits"])}">{label(day)} · {d["commits"]:,}</text>')
    for b in s["births"]:
        d = datetime.date.fromisoformat(b["date"])
        if d < first:
            continue
        x = L + ((d - first).days + .5) * step
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
