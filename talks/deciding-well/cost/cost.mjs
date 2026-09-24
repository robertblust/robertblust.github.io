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
  const convTools = teamPm * cost.licenceChfPerPersonMonth + cost.tools.hosting.chf;
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

  const listAg = ag - subscription + stats.tokens.listPriceUsd * cost.usdChf;
  const gaps = cost.gaps.reduce((a, g) => a + g.chf, 0);
  return {
    months: sc.months, factor: sc.factor, roles, team, teamPm, teamFte: teamPm / sc.months,
    ownerHourly, convOwnerHours, convOwner, convTools, conv,
    agHours, agEarly, agPeak, agOwner, subscription, voice, chatApi, hosting, domains, agTools, ag,
    ratio: conv / ag, saved: conv - ag, faster: sc.months / cost.agenticMonths,
    listAg, listRatio: conv / listAg, gaps, gapAg: ag + gaps, gapRatio: conv / (ag + gaps),
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

export function money(n, lang) {
  return "CHF " + num(Math.round(n), lang);
}
