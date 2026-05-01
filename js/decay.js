const hoursSince = (eventTime, t) => (t - eventTime) / 3600000;

const DECAY = {
  coffee(event, t) {
    const h = hoursSince(event.time, t);
    if (h < 0) return 0;
    const remainingMg = event.amount * Math.pow(0.5, h / 5);
    return Math.max(0, (remainingMg - 20) * 0.4);
  },
  energy_drink(event, t) {
    const h = hoursSince(event.time, t);
    if (h < 0) return 0;
    const remainingMg = event.amount * Math.pow(0.5, h / 5);
    return Math.max(0, (remainingMg - 20) * 0.4);
  },
  marijuana(event, t) {
    const h = hoursSince(event.time, t);
    if (h < 0) return 0;
    return event.amount * 20 * Math.pow(0.5, h / 3);
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
    const h = hoursSince(event.time, t);
    if (h < 0) return 0;
    const halfLife = 5;
    const remainingMg = event.amount * Math.pow(0.5, h / halfLife);
    // Below ~20mg residual, no meaningful sleep impact.
    return Math.max(0, (remainingMg - 20) * 0.4);
  },
  alcohol(event, t) {
    const h = hoursSince(event.time, t);
    if (h < 0) return 0;
    const drinks = event.amount;
    const clearH = drinks * 1.5;
    let p = 0;
    if (h < clearH) {
      p += drinks * 12 * (1 - 0.4 * (h / clearH));
    }
    const post = h - clearH;
    if (post >= 0 && post < 4) {
      p += drinks * 7 * (1 - post / 4);
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
    const halfLife = 2;
    const remaining = event.amount * Math.pow(0.5, h / halfLife);
    return Math.max(0, remaining * 1.2);
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

function scoreAt(events, t) {
  let total = 0;
  const byType = {};
  for (const e of events) {
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

function interpret(score) {
  if (score >= 85) return { word: "Clean", klass: "good" };
  if (score >= 70) return { word: "Mostly clear", klass: "ok" };
  if (score >= 50) return { word: "Some interference", klass: "warn" };
  if (score >= 30) return { word: "Disrupted", klass: "bad" };
  return { word: "Heavily disrupted", klass: "bad" };
}
