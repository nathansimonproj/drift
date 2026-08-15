const hoursSince = (eventTime, t) => (t - eventTime) / 3600000;

// Shared by every caffeine-containing type (coffee, energy_drink, soda,
// plain caffeine) — checked 2026-08-14 against real pharmacokinetics
// research rather than assumed:
//   - Half-life: multiple sources converge on ~4-6h average in healthy
//     adults (range ~1.5-9.9h across individuals; oral contraceptive use
//     roughly doubles it, ~10.7h — a real source of per-user variance this
//     single global constant can't capture; see ROADMAP.md §5's deferred
//     personalization item). 5h sits in the middle of the sourced range.
//   - Dose-response: a systematic review/meta-analysis (2023, "The effect
//     of caffeine on subsequent sleep") found effects that scale roughly
//     linearly with dose (total-sleep-time loss increased ~0.2 min per 1mg
//     in the meta-regression), and even moderate doses 6h before bed
//     produced significant sleep efficiency/TST reduction (Drake et al.
//     2013 found >1h TST loss from 400mg taken 6h pre-bed) — both support
//     this function's shape (proportional to remaining mg, active for many
//     hours), so it's kept as linear-in-remaining-mg rather than rebuilt.
//   - The 20mg "negligible" floor and 0.4 mg-to-penalty multiplier aren't
//     numbers pulled from a source — they're a modeling choice tuned so a
//     single typical coffee (~135mg) checked hours later reads as mild, not
//     alarming, consistent with the sourced shape above.
function caffeineDecay(mg, h) {
  if (h < 0) return 0;
  const remainingMg = mg * Math.pow(0.5, h / 5);
  return Math.max(0, (remainingMg - 20) * 0.4);
}

const DECAY = {
  coffee(event, t) {
    return caffeineDecay(event.amount, hoursSince(event.time, t));
  },
  energy_drink(event, t) {
    const mgByVariant = {
      red_bull: 80, celsius: 200, monster: 160, alani_nu: 200, rockstar: 160,
      bang: 300, reign: 300, ghost: 200, nos: 160, bloom: 150,
    };
    const mg = mgByVariant[event.amount] ?? 160;
    return caffeineDecay(mg, hoursSince(event.time, t));
  },
  soda(event, t) {
    const mgByVariant = { diet: 46, regular: 34, zero: 34 };
    const mg = mgByVariant[event.amount] ?? 34;
    return caffeineDecay(mg, hoursSince(event.time, t));
  },
  marijuana(event, t) {
    const h = hoursSince(event.time, t);
    if (h < 0) return 0;
    // Models same-night REM-suppression impact, not the multi-day THC
    // clearance half-life (which is about detectability, not sleep effect).
    return event.amount * 20 * Math.pow(0.5, h / 7);
  },
  stimulant(event, t) {
    const h = hoursSince(event.time, t);
    if (h < 0) return 0;
    // Modeled as XR-formulation default (most common student usage).
    // Half-life ~10h; alerting effect can persist 12-14h post-dose.
    const halfLife = 10;
    const peak = { low: 14, medium: 22, high: 32 }[event.amount] ?? 22;
    return peak * Math.pow(0.5, h / halfLife);
  },
  nap(event, t) {
    const h = hoursSince(event.time, t);
    if (h < 0) return 0;
    const napMin = event.amount;
    // Sleep-onset penalty grows with nap length:
    //   <= 25 min  : minimal (the "power nap" sweet spot)
    //   25-90 min  : increasing penalty
    //   > 90 min   : completed REM cycle, large delay risk
    let basePenalty = 0;
    if (napMin > 25 && napMin <= 90) basePenalty = (napMin - 25) * 0.15;
    else if (napMin > 90) basePenalty = (90 - 25) * 0.15 + (napMin - 90) * 0.25;
    // Late naps amplify sleep-onset delay
    const napHour = event.time.getHours();
    const lateMult = napHour >= 16 ? 1.7 : napHour >= 14 ? 1.3 : 1.0;
    // Effect fades over ~10h as sleep pressure rebuilds
    if (h > 10) return 0;
    return basePenalty * lateMult * (1 - h / 10);
  },
  caffeine(event, t) {
    return caffeineDecay(event.amount, hoursSince(event.time, t));
  },
  alcohol(event, t) {
    const h = hoursSince(event.time, t);
    if (h < 0) return 0;
    // Each event is one standard drink — a 12oz beer (~5% ABV), 5oz wine
    // (~12% ABV), and 1.5oz shot of spirits (~40% ABV) are NIAAA's textbook
    // equivalent servings (~14g ethanol each), so all three variants share
    // this curve; only the logged label differs (see types.js).
    //
    // Elimination ~0.015 g/dL/hr average adult rate (BGSU; multiple clinical
    // sources) works out to ~1.3-1.7h to clear one standard drink, matching
    // the commonly cited "4-5h to clear a moderate 2-3 drink dose" (Wikipedia,
    // "Alcohol use and sleep"). 1.5h is used here.
    const clearH = 1.5;

    // Because drinks are logged one at a time (like soda/energy drink — one
    // tap per serving), a real session's "progressively worsens with dose"
    // pattern (Girschik et al. 2024 meta-analysis, "The effect of alcohol
    // on subsequent sleep in healthy adults") has to emerge from multiple
    // drinks' curves overlapping in time as scoreAt() sums every near
    // event, not from an exponent on a single event's amount. The peak
    // values below are picked so that plays out at realistic scale: one
    // drink checked at a normal drink-to-bedtime gap (3-5h later) stays
    // negligible (single digits), while a real binge session (6-8 drinks
    // over a couple hours) lands solidly in the "disrupted" range by
    // bedtime — not sourced numbers themselves, but calibrated against
    // that shape.
    let p = 0;
    // Active phase: this drink still metabolizing — sedating short-term,
    // but suppressing REM the same night.
    if (h < clearH) {
      p += 8 * (1 - 0.4 * (h / clearH));
    }
    // Rebound phase: REM/stage-1 rebound and fragmented awakenings as this
    // drink clears. Window widened past the "4h" seen elsewhere in this
    // file so multiple drinks' rebound windows actually overlap for a
    // multi-drink session — same review: WASO roughly doubled on alcohol
    // nights vs. control in the cited study (66.9 vs. 38.7 min), concentrated
    // in the second half of the night.
    const post = h - clearH;
    if (post >= 0 && post < 6) {
      p += 10 * (1 - post / 6);
    }
    return p;
  },
  workout(event, t) {
    const h = hoursSince(event.time, t);
    if (h < 0) return 0;
    const tau = { low: 0.9, medium: 1.6, high: 2.6 }[event.amount] ?? 1.6;
    const peak = { low: 10, medium: 16, high: 22 }[event.amount] ?? 16;
    return peak * Math.exp(-h / tau);
  },
  meal(event, t) {
    const h = hoursSince(event.time, t);
    if (h < 0) return 0;
    const dur = { light: 1.8, medium: 3.2, heavy: 5 }[event.amount] ?? 3.2;
    const peak = { light: 6, medium: 11, heavy: 16 }[event.amount] ?? 11;
    if (h > dur) return 0;
    return peak * (1 - h / dur);
  },
  nicotine(event, t) {
    const h = hoursSince(event.time, t);
    if (h < 0) return 0;
    // Absorbed-dose defaults by delivery method (see types.js options).
    // Cigarette/vape: ~0.8-1.5mg absorbed per use, PK Tmax ~5-9 min.
    // Pouch: 3mg/6mg label dose, largely absorbed via oral mucosa over
    // 30-60 min (slower Tmax, ~10-20 min) — we don't model onset ramp since
    // it's sub-hourly and the app's granularity doesn't need it.
    // Sources: nicotine population PK reviews (PMC8016787, PMC5681983),
    // e-cig vs. combustible half-life comparison, ZYN/cigarette dosing
    // comparisons (snusline.com, lousquare.com).
    const mgByVariant = { cigarette: 1.2, vape: 1.3, pouch_3: 3, pouch_6: 6 };
    const mg = mgByVariant[event.amount] ?? 3;
    // Half-life ~1-2h (Sleep Medicine Reviews, Jaehne et al.); use 2h.
    const halfLife = 2;
    const remainingMg = mg * Math.pow(0.5, h / halfLife);

    // Two phases, per Jaehne et al.: nicotine is a stimulant, so it can
    // delay sleep onset while circulating (small acute penalty) — but the
    // *primary* disruption they found is withdrawal-driven: short half-life
    // causes fragmentation/awakenings as levels crash, concentrated in the
    // back half of the night, not while nicotine is still present. Mirrors
    // alcohol's active-phase-then-rebound shape below.
    let p = Math.max(0, (remainingMg - 0.5) * 1.5);

    const reboundWindow = 4; // hours over which withdrawal fragmentation fades
    const sinceHalfLife = h - halfLife;
    if (sinceHalfLife >= 0 && sinceHalfLife < reboundWindow) {
      p += mg * 3 * (1 - sinceHalfLife / reboundWindow);
    }

    // The per-mg multipliers (unlike caffeine's) are modeling placeholders,
    // not sourced — nicotine's mg scale (1-6mg) isn't directly comparable to
    // caffeine's (100mg+), so they need real calibration once we have
    // outcome data (see ROADMAP.md §3).
    return p;
  },
  stress(event, t) {
    const h = hoursSince(event.time, t);
    if (h < 0) return 0;
    const tau = { low: 0.8, medium: 1.4, high: 2.2 }[event.amount] ?? 1.4;
    const peak = { low: 6, medium: 11, high: 16 }[event.amount] ?? 11;
    return peak * Math.exp(-h / tau);
  },
  brightlight(event, t) {
    const h = hoursSince(event.time, t);
    if (h < 0) return 0;
    const lifeH = 1.5;
    if (h > lifeH) return 0;
    const minutes = event.amount;
    return (1 - h / lifeH) * (minutes / 60) * 9;
  },
  screen(event, t) {
    const h = hoursSince(event.time, t);
    if (h < 0) return 0;
    const lifeH = 1.0;
    if (h > lifeH) return 0;
    const minutes = event.amount;
    return (1 - h / lifeH) * (minutes / 60) * 6;
  },
};

// Every DECAY curve is at ~0 well within 72h of the event. Now that full
// history is kept (see ROADMAP.md §2), callers should filter through
// this before scoreAt() so cost stays bounded by recent events, not by
// however many months of log a user has accumulated.
function eventsNear(events, t, hours = 72) {
  const cutoff = t.getTime() - hours * 3600 * 1000;
  return events.filter((e) => e.time.getTime() > cutoff);
}

function scoreAt(events, t) {
  let total = 0;
  const byType = {};
  for (const e of events) {
    // TYPES is the source of truth for "does this type currently count" —
    // DECAY keeps every function ever written (including disabled types'),
    // so checking DECAY alone let commented-out types keep silently scoring
    // forever on already-logged events that the UI could no longer show or
    // delete. Gating on TYPES here keeps display and scoring in sync by
    // construction instead of by convention.
    if (!TYPES[e.type]) continue;
    const fn = DECAY[e.type];
    if (!fn) continue;
    const p = fn(e, t);
    if (p > 0) {
      total += p;
      byType[e.type] = (byType[e.type] || 0) + p;
    }
  }
  const score = Math.max(0, Math.min(100, 100 - total));
  return { score, byType, totalPenalty: total };
}

// Named groupings used both for the "in your system" breakdown panel and for
// attributing the score description to specific substances — one place so
// the two stay in sync.
const SUBSTANCE_CATEGORIES = [
  { label: "Caffeine",  keys: ["caffeine", "coffee", "energy_drink", "soda"] },
  { label: "Marijuana", keys: ["marijuana"] },
  { label: "Alcohol",   keys: ["alcohol"] },
  { label: "Nap",       keys: ["nap"] },
  { label: "Nicotine",  keys: ["nicotine"] },
];

function categoryCosts(byType) {
  return SUBSTANCE_CATEGORIES.map(({ label, keys }) => ({
    label,
    cost: keys.reduce((sum, k) => sum + (byType[k] || 0), 0),
  }));
}

// Mechanism-specific clause per substance, in the same sleep-process framing
// as the severity leads below (onset difficulty / REM / fragmentation, not
// next-day consequences). Kept for Alcohol/Nap even while those types are
// disabled in TYPES, so the text is ready if they're re-enabled.
const SUBSTANCE_EFFECT = {
  Caffeine: "caffeine is still active and blocking the sleep drive that pulls you under",
  Marijuana: "marijuana tends to suppress REM sleep tonight",
  Nicotine: "nicotine gives a stimulant kick early on, then fragments sleep with withdrawal as it wears off",
  Alcohol: "alcohol sedates you early, then fragments sleep and triggers waking as it metabolizes",
  Nap: "today's nap has lowered your sleep pressure, which can make it harder to drop off",
};

const SEVERITY_BANDS = [
  { min: 85, word: "Clean", klass: "good",
    lead: "Falling asleep should be easy tonight, and your sleep should run its normal course." },
  { min: 70, word: "Mostly clear", klass: "ok",
    lead: "Sleep onset might take a few extra minutes tonight" },
  { min: 50, word: "Some interference", klass: "warn",
    lead: "Expect a longer time to fall asleep tonight" },
  { min: 30, word: "Disrupted", klass: "bad",
    lead: "Falling asleep will be a real struggle tonight" },
  { min: -Infinity, word: "Heavily disrupted", klass: "bad",
    lead: "This is shaping up to be a rough night for actually sleeping" },
];

function topContributors(byType) {
  const sorted = categoryCosts(byType)
    .filter((c) => c.cost > 0.5)
    .sort((a, b) => b.cost - a.cost);
  if (sorted.length === 0) return [];
  const contributors = [sorted[0]];
  if (sorted[1] && sorted[1].cost >= sorted[0].cost * 0.6) contributors.push(sorted[1]);
  return contributors;
}

function interpret(score, byType) {
  const band = SEVERITY_BANDS.find((b) => score >= b.min);

  // Clean band skips attribution — trace-level contributors at this band
  // aren't meaningfully "responsible" for anything.
  if (band.word === "Clean" || !byType) {
    return { word: band.word, klass: band.klass, feel: band.lead };
  }

  const contributors = topContributors(byType);
  if (contributors.length === 0) {
    return { word: band.word, klass: band.klass, feel: `${band.lead}.` };
  }

  const clauses = contributors.map((c) => SUBSTANCE_EFFECT[c.label]);
  const attribution = clauses.length === 1
    ? clauses[0]
    : `${clauses[0]}, and ${clauses[1]}`;

  return { word: band.word, klass: band.klass, feel: `${band.lead} — ${attribution}.` };
}
