# Drift — Roadmap

A working plan for the sleep forecast app, targeting **college students** as the first user cohort.

This version is deliberately narrow. Earlier drafts tried to scope the whole eventual product at once; this one pins down the core loop, states what's explicitly cut or deferred, and gives a short queue of what's next. Expansion ideas live in §5 as a backlog, not a promise.

---

## 0. Target cohort: college students

College students have the worst sleep of any large adult cohort — average ~6.5 hours, wildly irregular, with daily mismatches between what they want (focus, performance, fun) and what their bodies are doing. Oura and Whoop are too expensive, RISE is for adults, Apple Watch is too generic. Nobody's building for this cohort specifically.

Why this cohort: a daily, self-aware, painful problem; a concentrated distribution channel (one campus = hundreds of users); cheap to acquire; long lifetime value if kept through grad school and early career.

Why it's hard: price-sensitive (free-with-`.edu`, ~$4/mo tier, not a $30 subscription); high privacy stakes (alcohol, weed, unprescribed Adderall in the data — cannot leak, sell, or share with schools); can't lecture about partying.

This means Drift is **a non-judgmental, harm-reduction tool that helps you survive your week**, not a wellness app that helps you optimize your sleep. That distinction governs every product and copy decision below.

---

## 1. The core loop — this is the whole product

Everything Drift does reduces to four steps. Nothing else is core.

1. **Log** — a student records what they did (coffee, drink, nap, workout, stress, etc.) and when.
2. **Decay** — a deterministic engine converts each event into a time-varying penalty on tonight's sleep.
3. **Score** — the penalties sum into one number at target bedtime, translated into something felt ("groggy but functional"), not just a stat.
4. **What if?** — the same engine, run interactively: drag a hypothetical event onto the timeline and watch the score change live, before you've actually done the thing.

That's it. Log → compute → see → explore. A student opens the app, understands in one glance what tonight looks like, and can test a decision before making it. Everything else — notifications, personalization, institutional pilots, iOS — only matters once this loop is trusted and habitual.

**Cut: "Pull This Off?" mode.** An earlier draft treated a separate "input your constraints, get a survival plan" screen as the single most important feature to build. On reflection it's redundant with What if? — same computation, dressed as prescriptive advice — and "survival plan" output cuts against the harm-reduction posture in §0 (advice-giving, not a mirror). It's cut as a distinct mode. If natural-language input is still wanted later, it's a parser sitting in front of What if?, not a new feature.

---

## 2. Where we are

**Shipped.** Live web app, deployed on Render with a Postgres backend (Neon) — accounts, sessions, profiles, and events all sync across devices. Unified logging + forecast page (`/pages/home.html`); a student logs an event and the forecast updates live, no navigation. Quick-add buttons, a custom entry form, edit-in-place on existing events, and real brand presets for energy drinks and soda (Celsius, Red Bull, Bang, Monster + more; Coke variants). Decay engine covers 11 event types with a Chart.js timeline and a per-substance breakdown on hover.

**Trust gap.** The decay engine is "shipped, rough" — 11 event types, unevenly calibrated. Marijuana's constant was already corrected once after being unrealistically fast. This is the actual risk to the product: a harm-reduction app that gets a student's Adderall or alcohol curve visibly wrong loses their trust in one session, and there's no recovering that. Breadth of event types has outpaced depth of calibration.

**Still missing.** Real onboarding (currently a buried empty-state link — the first 60 seconds are core product, not GTM), outcome tracking (no way to check predicted vs. actual yet), and What if?'s interactive drag-and-drop hasn't shipped as a dedicated surface — it exists implicitly (add/edit an event, see the score move) but not as the explicit "try before you do it" interaction described in §1.

---

## 3. Calibration priority: depth over breadth

Rather than maintain 11 roughly-calibrated event types, narrow near-term calibration effort to what students actually log most, by prevalence (NSDUH 2023, ACHA, and campus survey data):

| Substance | College past-month/weekly use | Current status |
|---|---|---|
| Caffeine (coffee) | ~92% use daily; ~159mg/day avg | shipped, needs calibration check |
| Alcohol | ~50% past month; ~40% binge | shipped |
| Energy drinks | ~68% past month | shipped, brand presets done |
| Marijuana | ~42–44% past year | shipped, recalibrated once already |
| Nicotine/vaping | ~33% past month | shipped |
| Prescription stimulants (Adderall, off-label) | ~7–10% past year | shipped |
| Naps | not a substance stat, but functionally central to student sleep behavior | shipped |

These seven cover the substances a student is actually likely to log. `workout`, `meal`, `stress`, `brightlight`, `screen` are secondary — plausible contributors, lower priority to re-derive from research right now. The near-term task isn't adding event types; it's re-checking these seven against real decay/half-life research and fixing whichever ones are furthest from physiologically plausible (marijuana was one; alcohol and nicotine haven't had the same scrutiny).

---

## 4. Next up

Ordered, small enough to actually finish:

1. **Onboarding card on first visit** — replace the bare "No events logged yet" empty state with a real explanation of the score. (The old "load a sample day" demo button was removed — it kept going stale against the active `TYPES` list; onboarding should explain the real, empty state, not fake data.)
2. **Make What if? an explicit interaction** *(mostly shipped)* — What If mode now forks today's real events into an independent sandbox; freely add/edit/delete anything there and it's discarded on re-entry, never touching the real log. Still not the literal drag-and-drop the original phrasing wanted, but "discard without saving" is real now.
3. **Calibration pass on the seven core substances** (§3) — nicotine re-derived: two-phase model (small acute penalty, larger withdrawal/rebound penalty as levels crash — Jaehne et al.), half-life tightened to the sourced 1-2h range. Alcohol still hasn't been re-checked.
4. **Privacy promise** front-and-center on login and landing: "we will never share, sell, or report your data."
5. **`.edu` email check on signup** (warn but allow) — infrastructure for a student tier later, not urgent on its own.
6. **Day-boundary bug + calendar/history view** — "Today" is actually a rolling 24h window (`event.time > now - 24h`), not a calendar-day boundary, so nothing resets when a new day actually starts: events from late last night keep counting as "today" until they age out of the window on their own, and there's no way to look back at a past day once it rolls off (30h server-side prune deletes it for good). Needs a real day concept — a boundary the Today view resets against (midnight, or a subjective "wake time") — plus a calendar/history UI to navigate back and review previous days' logs and forecasts. Not urgent alone, but any future predicted-vs-actual/calibration validation work (§5) needs real day boundaries to mean anything.

---

## 5. Deferred — not core, not scheduled

Ideas worth keeping but explicitly not being built next. Revisit once the core loop (§1) is trusted and used daily.

- Sleep debt state, all-nighter mode, tomorrow's-energy forecast, hangover forecast, exam-week mode
- Manual sleep score entry + predicted-vs-actual calibration dashboard
- Notifications (wind-down reminder, score-drop alert, morning recap)
- Personalization / per-user decay parameters / Bayesian pooling
- iOS app, HealthKit, Oura/Whoop integrations
- .edu free tier, premium tier, institutional pilots, UW ambassador program, TikTok content calendar
- Shared header/nav partial cleanup, migration framework for the `events` table

None of these are wrong ideas — several were previously scoped in detail (UW pilot, phased iOS rollout, pricing). They're parked because building them before the core loop is right just adds surface area to a product that hasn't yet proven the thing it's supposed to prove: that a student opens this daily and trusts the number.

---

## 6. Open decisions

**Manual-first or wearable-augmented?** Manual-first, staying that way until there's a real iOS app — most students don't own Oura/Whoop and Apple Watch sleep data is mediocre.

**One school or several, when it's time for a pilot?** UW-only first. Concentration creates social proof and tight feedback loops. Not urgent until the core loop and calibration (§3) are solid.

**Free + premium vs. institutional, eventually?** Not a near-term decision — both are downstream of having a product worth paying for.
