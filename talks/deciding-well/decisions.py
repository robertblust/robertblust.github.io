#!/usr/bin/env python3
"""The decisions the specs record, read out by agents and checked here, into decisions.json.

The model has no decision type, so no query returns a count of decisions. Agents read every
spec at the cutoff and listed each decision it records, with a status and a quote from the
spec as evidence. This script keeps only a decision whose quote is found in its spec, word for
word once Markdown marks and spacing are set aside, and counts what is left. A decision a
later spec says it replaces is counted as revised: the later spec names it, and the earlier
spec's own entry cannot be matched to that pointer reliably, so the pointer is what is counted.

  ./decisions.py OUT_DIR SPECS_DIR   # OUT_DIR holds out*.json, SPECS_DIR the batch*.json files
"""
import glob, json, os, pathlib, re, sys

HERE = pathlib.Path(__file__).resolve().parent
STATUSES = ("taken", "revised", "dropped")

def norm(text):
    text = re.sub(r"[*_`>#]|\[|\]\([^)]*\)", " ", text)
    text = text.replace("’", "'").replace("“", '"').replace("”", '"').replace("—", "-").replace("–", "-")
    return re.sub(r"\s+", " ", text).strip().lower()

def merge(outs, specs):
    kept, unverified, pointers = [], [], set()
    bodies = {k: norm(v) for k, v in specs.items()}
    for out in outs:
        for s in out["specs"]:
            for d in s["decisions"]:
                if d["status"] not in STATUSES:
                    raise ValueError(f"unknown status {d['status']!r} in {s['spec']}")
                row = {"repo": s["repo"], "spec": s["spec"], **d}
                quote = norm(d["evidence"]).rstrip(".")
                if quote and quote in bodies.get((s["repo"], s["spec"]), ""):
                    kept.append(row)
                    if d.get("revisesOther"):
                        pointers.add((d["revisesOther"]["spec"], d["revisesOther"]["gist"]))
                else:
                    unverified.append(row)
    revised = sum(d["status"] == "revised" for d in kept) + len(pointers)
    dropped = sum(d["status"] == "dropped" for d in kept)
    counts = {"total": len(kept), "taken": len(kept) - revised - dropped, "revised": revised, "dropped": dropped}
    return {"counts": counts, "decisions": kept, "unverified": unverified,
            "revisedByLaterSpecs": sorted([{"spec": a, "gist": b} for a, b in pointers], key=lambda p: p["spec"])}

def main(out_dir, specs_dir):
    specs = {}
    for b in glob.glob(os.path.join(specs_dir, "batch*.json")):
        for item in json.load(open(b)):
            specs[(item["repo"], item["spec"])] = open(item["path"]).read()
    outs = [json.load(open(f)) for f in sorted(glob.glob(os.path.join(out_dir, "out*.json")))]
    r = merge(outs, specs)
    r = {"cutoff": "2026-09-24T23:59:59+02:00", "specsRead": len(specs), **r}
    (HERE / "decisions.json").write_text(json.dumps(r, indent=1, ensure_ascii=False) + "\n")
    print(r["counts"], "unverified", len(r["unverified"]), "pointers", len(r["revisedByLaterSpecs"]))

if __name__ == "__main__":
    main(*sys.argv[1:3])
