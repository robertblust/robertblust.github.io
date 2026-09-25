import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { compute, money, num } from "./cost.mjs";

const cost = JSON.parse(readFileSync(new URL("../cost.json", import.meta.url)));
const stats = JSON.parse(readFileSync(new URL("../stats.json", import.meta.url)));
const DEF = { lens: "inhouse", scenario: "expected", peakHours: 8, share: 0.6 };

test("the defaults give the figures the spec was approved with", () => {
  const c = compute(cost, stats, DEF);
  assert.equal(Math.round(c.team), 1125583);
  assert.equal(Math.round(c.conv), 1235443);
  assert.equal(c.agHours, 434);
  assert.equal(Math.round(c.agTools), 796);
  assert.equal(Math.round(c.ag), 57216);
  assert.equal(Math.round(c.ratio), 22);
  assert.equal(Math.round(c.gapRatio), 12);
});

test("contractor rates and the scenarios move the team, never the agentic hours", () => {
  const a = compute(cost, stats, { ...DEF, lens: "contract" });
  assert.equal(Math.round(a.team), 1768500);
  const lean = compute(cost, stats, { ...DEF, scenario: "lean" });
  const cons = compute(cost, stats, { ...DEF, scenario: "conservative" });
  assert.equal(lean.months, 7);
  assert.equal(cons.months, 12);
  assert.ok(lean.conv < compute(cost, stats, DEF).conv && cons.conv > compute(cost, stats, DEF).conv);
  assert.equal(lean.agHours, cons.agHours);
});

test("the sliders at their ends keep every figure finite and positive", () => {
  for (const peakHours of [6, 14]) for (const share of [0.3, 1]) {
    const c = compute(cost, stats, { ...DEF, peakHours, share });
    for (const k of ["conv", "ag", "ratio", "gapRatio", "listRatio"]) {
      assert.ok(Number.isFinite(c[k]) && c[k] > 0, `${k} at ${peakHours} h, ${share}`);
    }
  }
});

test("the workstreams add up to the roster in every scenario", () => {
  for (const scenario of ["lean", "expected", "conservative"]) {
    const c = compute(cost, stats, { ...DEF, scenario });
    const ws = c.workstreams.reduce((a, w) => a + w.pm, 0);
    assert.ok(Math.abs(ws - c.teamPm) < 1e-9);
  }
});

test("money and numbers group the way each language writes them", () => {
  assert.equal(money(1235443.4, "en"), "CHF 1,235,443");
  assert.equal(money(1235443.4, "de"), "CHF 1’235’443");
  assert.equal(num(8.4, "en", 1), "8.4");
  assert.equal(num(8.4, "de", 1), "8,4");
});

test("the conservative case's lines per person-month follow cost.json's factor", () => {
  const c = compute(cost, stats, DEF);
  const lines = stats.code.totals.code + stats.code.totals.test;
  const basePm = cost.roles.reduce((a, r) => a + r.pm, 0);
  assert.equal(Math.round(c.locPerPm), Math.round(lines / (basePm * cost.scenarios.conservative.factor)));
  const other = { ...cost, scenarios: { ...cost.scenarios, conservative: { factor: 1.4, months: 12 } } };
  assert.equal(Math.round(compute(other, stats, DEF).locPerPm), Math.round(lines / (basePm * 1.4)));
});

test("the list-price alternative carries VAT like every other Anthropic line", () => {
  const c = compute(cost, stats, DEF);
  const want = c.ag - c.subscription + stats.tokens.listPriceUsd * (1 + cost.vat) * cost.usdChf;
  assert.ok(Math.abs(c.listAg - want) < 1e-6, `${c.listAg} vs ${want}`);
});
