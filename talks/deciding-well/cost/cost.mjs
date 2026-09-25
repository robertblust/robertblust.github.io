// The cost page's arithmetic. Pure: it reads cost.json and stats.json as given and returns
// numbers, so node --test holds it and the page only formats and places what it returns.

export function compute(cost, stats, { lens, scenario, peakHours, share }) {
  const sc = cost.scenarios[scenario];
  const hourly = (salary, rate) => lens === "inhouse" ? salary * cost.employerLoad / cost.yearHours : rate;
  const H = cost.hoursPerMonth;
  const roles = cost.roles.map(r => {
    const pm = r.pm * sc.factor, h = hourly(r.salary, r.rate);
    return { id: r.id, pm, fte: pm / sc.months, hourly: h, cost: pm * H * h };
  });
  const team = roles.reduce((a, r) => a + r.cost, 0);
  const teamPm = roles.reduce((a, r) => a + r.pm, 0);
  const ownerHourly = hourly(cost.owner.salary, cost.owner.rate);
  const convOwnerHours = share * sc.months * H;
  const convOwner = convOwnerHours * ownerHourly;
  const convTools = teamPm * cost.licenseChfPerPersonMonth + cost.tools.hosting.chf;
  const conv = team + convOwner + convTools;

  const d = stats.activeDays;
  const agEarly = d.early * cost.owner.earlyHours, agPeak = d.peak * peakHours;
  const agHours = agEarly + agPeak;
  const agOwner = agHours * ownerHourly;
  const chf = t => t.usd * (t.vat ? 1 + cost.vat : 1) * cost.usdChf;
  const subscription = chf(cost.tools.subscription), voice = chf(cost.tools.voice), chatApi = chf(cost.tools.chatApi);
  const hosting = cost.tools.hosting.chf, domains = cost.tools.domains.chf;
  const agTools = subscription + voice + chatApi + hosting + domains;
  const ag = agOwner + agTools;

  // The list price is billed by the same company as the subscription, so it carries the same VAT.
  const listAg = ag - subscription + stats.tokens.listPriceUsd * (1 + cost.vat) * cost.usdChf;
  const gaps = cost.gaps.reduce((a, g) => a + g.chf, 0);
  // What the conservative case asks of each person-month, over the code and tests measured.
  const basePm = cost.roles.reduce((a, r) => a + r.pm, 0);
  const locPerPm = (stats.code.totals.code + stats.code.totals.test) / (basePm * cost.scenarios.conservative.factor);
  return {
    months: sc.months, factor: sc.factor, roles, team, teamPm, teamFte: teamPm / sc.months,
    ownerHourly, convOwnerHours, convOwner, convTools, conv,
    agHours, agEarly, agPeak, agOwner, subscription, voice, chatApi, hosting, domains, agTools, ag,
    ratio: conv / ag, saved: conv - ag, faster: sc.months / cost.agenticMonths,
    listAg, listRatio: conv / listAg, locPerPm, gaps, gapAg: ag + gaps, gapRatio: conv / (ag + gaps),
    workstreams: cost.workstreams.map(w => ({ id: w.id, pm: w.pm * sc.factor })),
  };
}

const LOCALE = { en: "en-US", de: "de-CH" };

export function num(n, lang, digits = 0) {
  const s = new Intl.NumberFormat(LOCALE[lang], { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n);
  if (lang !== "de") return s;
  // de-CH groups by U+2019 in current engines and by an ASCII apostrophe in older ones; the
  // page writes the typographic one everywhere, as WRITING.md sets. Intl also gives de-CH a
  // decimal point, which Swiss German keeps for franc amounts; every decimal this page prints
  // is a count of months, people or a rate, and running German text writes those with a comma.
  return s.replace(/'/g, "’").replace(".", ",");
}

// Months as WRITING.md abbreviates them: three letters without a period in English, and the
// German forms with their period where German abbreviates, none where it writes the word out.
const MONTHS = {
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  de: ["Jan.", "Febr.", "März", "Apr.", "Mai", "Juni", "Juli", "Aug.", "Sept.", "Okt.", "Nov.", "Dez."],
};

// The calendar day an ISO date names, read from its own digits so no time zone can move it.
export function day(iso, lang, withYear = false) {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  const mon = MONTHS[lang][m - 1];
  if (lang === "de") return `${d}. ${mon}` + (withYear ? ` ${y}` : "");
  return `${mon} ${d}` + (withYear ? `, ${y}` : "");
}

export function money(n, lang) {
  return "CHF " + num(Math.round(n), lang);
}

const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

export function render(state, data, lang) {
  const c = compute(data.cost, data.stats, state);
  const t = data.stats.totals, code = data.stats.code.totals;
  const m = n => money(n, lang), n0 = n => num(n, lang), n1 = n => num(n, lang, 1);
  // German sets a percent sign apart by a no-break space, as the deck does; English closes it up.
  const pct = x => x + (lang === "de" ? "\u00a0%" : "%");
  const v = {
    conv: m(Math.round(c.conv / 1000) * 1000), convFte: n1(c.teamFte), convMonths: n0(c.months),
    ag: m(Math.round(c.ag / 1000) * 1000), agMonths: n1(data.cost.agenticMonths), agHours: n0(c.agHours),
    ratio: n0(c.ratio), saved: m(Math.round(c.saved / 1000) * 1000), faster: n1(c.faster),
    fRepos: n0(t.repos), fCommits: n0(t.commits), fMerged: n0(t.merged), fReleases: n0(t.releases),
    fClaude: pct(n0(100 * t.claude / t.nonMerge)), fCode: n0(code.code), fTest: n0(code.test),
    fMarkdown: n0(code.markdown), fSpecs: n0(t.specs), fDecisions: n0(data.decisions.counts.total),
    bConvOwner: m(c.convOwner), bConvOwnerH: n0(c.convOwnerHours), bTeam: m(c.team), bTeamPm: n1(c.teamPm),
    bConvTools: m(c.convTools), bConvTotal: m(c.conv), bAgOwner: m(c.agOwner), bAgOwnerH: n0(c.agHours),
    bAgTools: m(c.agTools), bAgTotal: m(c.ag), oConvH: n0(c.convOwnerHours), oAgH: n0(c.agHours),
    rTeamFte: n1(c.teamFte), rTeamPm: n1(c.teamPm), rTeamCost: m(c.team),
    rOwnerShare: n1(state.share), rOwnerPm: n1(state.share * c.months), rOwnerRate: n0(c.ownerHourly), rOwnerCost: m(c.convOwner),
    aPeakDays: n0(data.stats.activeDays.peak), aPeakH: n0(state.peakHours), aPeak: m(c.agPeak * c.ownerHourly),
    aEarlyDays: n0(data.stats.activeDays.early), aEarlyH: n0(data.cost.owner.earlyHours), aEarly: m(c.agEarly * c.ownerHourly),
    aSub: m(c.subscription), aVoice: m(c.voice), aChat: m(c.chatApi), aHosting: m(c.hosting), aDomains: m(c.domains),
    aTotal: m(c.ag), listUsd: n0(data.stats.tokens.listPriceUsd), listAg: m(c.listAg), listRatio: n0(c.listRatio),
    dPeak: day(data.stats.activeDays.peakFrom, lang), dStart: day(data.stats.start, lang),
    dEnd: day(data.stats.cutoff, lang), dCutoff: day(data.stats.cutoff, lang, true),
    toolsShare: pct(n1(100 * c.agTools / c.ag)), gapAg: m(c.gapAg), gapRatio: n0(c.gapRatio), gaps: m(c.gaps),
    qSpecs: n0(t.specs), qPlans: n0(t.plans), qDecisions: n0(data.decisions.counts.total),
    qRevised: n0(data.decisions.counts.revised), qDropped: n0(data.decisions.counts.dropped),
    qReverts: n0(t.reverts), qCommits: n0(t.commits), qClosed: n0(t.closedUnmerged),
    qTestShare: n0(10 * code.test / code.code),
    uSub: n0(data.cost.tools.subscription.usd), uVoice: n0(data.cost.tools.voice.usd), uChat: n0(data.cost.tools.chatApi.usd),
    vat: pct(n1(100 * data.cost.vat)), mLoad: num(data.cost.employerLoad, lang, 2), mYearH: n0(data.cost.yearHours),
    mSenior: m(data.cost.roles.find(r => r.id === "backend").salary),
    mRateLo: n0(Math.min(...data.cost.roles.map(r => r.rate))), mRateHi: n0(Math.max(...data.cost.roles.map(r => r.rate))),
    mOwnerSalary: m(data.cost.owner.salary), mOwnerRate: n0(data.cost.owner.rate), mFx: num(data.cost.usdChf, lang, 2),
    locPerPm: n0(c.locPerPm),
  };
  for (const el of $$("[data-v]")) if (el.dataset.v in v) el.textContent = v[el.dataset.v];
  for (const r of c.roles) for (const el of $$(`[data-role="${r.id}"]`)) {
    el.textContent = { fte: n1(r.fte), pm: n1(r.pm), rate: n0(r.hourly), cost: m(r.cost) }[el.dataset.c];
  }
  const width = (el, x, max) => { el.style.width = (100 * x / max).toFixed(3) + "%"; };
  for (const el of $$("#bills [data-w]")) width(el, c[el.dataset.w], c.conv);
  for (const el of $$("#owner [data-w]")) width(el, c[el.dataset.w], Math.max(c.convOwnerHours, c.agHours));
  const wsMax = Math.max(...c.workstreams.map(w => w.pm));
  for (const w of c.workstreams) {
    const row = document.querySelector(`[data-ws="${w.id}"]`);
    width(row.querySelector("i"), w.pm, wsMax);
    row.querySelector("b").textContent = n1(w.pm);
  }
  document.getElementById("peakOut").textContent = n0(state.peakHours) + " h";
  document.getElementById("shareOut").textContent = pct(n0(100 * state.share));
  // A slider announces what the reader sees beside it, not the fraction the input holds.
  document.getElementById("peak").setAttribute("aria-valuetext", n0(state.peakHours) + " h");
  document.getElementById("share").setAttribute("aria-valuetext", pct(n0(100 * state.share)));
}

async function boot() {
  const state = { lens: "inhouse", scenario: "expected", peakHours: 8, share: 0.6 };
  let data;
  try {
    const get = u => fetch(u).then(r => { if (!r.ok) throw new Error(u); return r.json(); });
    const [cost, stats, decisions] = await Promise.all([get("../cost.json"), get("../stats.json"), get("../decisions.json")]);
    // A browser can hold a snapshot from before this page existed for a while after a deploy:
    // readable, and without the figures below. That is a failed load, said as one.
    if (!stats.activeDays || !stats.code || !stats.code.totals || !stats.tokens || !stats.totals.commits
        || !cost.scenarios || !cost.tools || !decisions.counts) throw new Error("a file lacks the page's figures");
    data = { cost, stats, decisions };
    state.scenario = cost.scenarios.default;
    state.peakHours = cost.owner.peakHours;
    state.share = cost.owner.share;
  } catch (e) {
    document.getElementById("costerr").hidden = false;
    return;
  }
  const lang = () => document.documentElement.lang === "de" ? "de" : "en";
  const draw = () => render(state, data, lang());
  const seg = (id, key, attr) => document.getElementById(id).addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    state[key] = b.getAttribute(attr);
    for (const x of document.querySelectorAll(`#${id} button`)) x.setAttribute("aria-pressed", String(x === b));
    draw();
  });
  // The pressed buttons follow the state cost.json set, so a changed default needs no edit here.
  for (const b of document.querySelectorAll("#lens button")) b.setAttribute("aria-pressed", String(b.getAttribute("data-v-lens") === state.lens));
  for (const b of document.querySelectorAll("#scen button")) b.setAttribute("aria-pressed", String(b.getAttribute("data-v-scen") === state.scenario));
  seg("lens", "lens", "data-v-lens");
  seg("scen", "scenario", "data-v-scen");
  const peak = document.getElementById("peak"), share = document.getElementById("share");
  peak.value = state.peakHours; share.value = state.share;
  peak.addEventListener("input", () => { state.peakHours = +peak.value; draw(); });
  share.addEventListener("input", () => { state.share = +share.value; draw(); });
  window.rbCost = { render: () => draw() };
  draw();
}

if (typeof document !== "undefined") boot();
