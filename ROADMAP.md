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

**Shipped (2026-08-14).** Accounts moved from username to email as the identity field (`users.email`, unique) — a prerequisite for both `.edu` gating (§4) and password recovery. Forgot/reset password flow shipped end-to-end: `/auth/forgot-password` issues a single-use, 1-hour-expiry token (`password_reset_tokens` table) and emails a reset link; `/auth/reset-password` consumes it. The forgot-password response is identical whether or not the email is registered, so the endpoint can't be used to enumerate accounts. Locally, with no email credentials set, the reset link is logged to the server console instead of emailed — convenient for dev, but not for real users.

Email sending went through two providers before landing: first wired to Resend, but Resend's free tier requires a *verified domain* to send to arbitrary recipients — its shared test domain only delivers to the email the Resend account itself is registered with, a dead end since this project isn't buying a domain yet. Switched to **SendGrid's Single Sender Verification** instead, which verifies one email address (not a domain) and can then send to anyone — free up to 100/day. `server/mailer.js` now wraps `@sendgrid/mail`. **Before real users hit this, verify a sender address at SendGrid → Settings → Sender Authentication → Single Sender Verification, then set `SENDGRID_API_KEY`, `EMAIL_FROM` (must exactly match the verified address), and `APP_URL` on Render.**

**Shipped (2026-08-14).** The day-boundary bug and calendar/history view are done — real calendar-day buckets (`dayKey()`, local midnight to midnight) replace the old rolling 24h window, and a calendar modal (`js/history.js`) lets you page back through past days and see that day's forecast, events, and breakdown. Two bugs found and fixed while verifying it against a real account, both committed and pushed to `main`:
- **Midnight-bedtime scoring bug:** `bedtimeForDayKey()` anchored an early-hour target bedtime (e.g. `00:00`) to the *start* of the selected day instead of its *end*, so every event read as `hoursSince < 0` (not happened yet) and the calendar showed a false 100 for any day — not just for midnight bedtimes specifically, but for anyone with a bedtime before noon. Fixed by mirroring `targetBedtimeDate()`'s day-rollover logic, generalized from "today" to an arbitrary calendar day.
- **Data loss, more serious:** the server was still running a 30-hour retention prune (`DELETE FROM events WHERE ... occurred_at < now() - interval '30 hours'`) on every `GET /events` — i.e. every page load — despite the rolling-window design it mirrored being replaced by real day boundaries. This had been live since Jul 28 and is why past days showed no data: it wasn't a display bug, the events were actually deleted. **Anything older than ~30h before the fix shipped is unrecoverable — no backup existed.** The prune is removed and the fix is live.

**Shipped (2026-08-14).** Alcohol enabled (it was fully built in `decay.js` but commented out in `types.js`, so it never appeared in the app at all) and recalibrated against a 2024 systematic review/meta-analysis (Girschik et al., "The effect of alcohol on subsequent sleep in healthy adults") and elimination-rate sources. Logging changed from a typed-number "drinks" field to a dropdown of **Beer (12oz) / Glass of Wine (5oz) / Shot (1.5oz)** — NIAAA's standard-drink definition, all three ≈14g ethanol — matching the one-tap-per-serving pattern soda/energy-drink/nicotine already use.
- That input change mattered for the model, not just the UI: `alcohol()` now scores one event = one drink, so a multi-drink session's severity has to come from several drinks' curves overlapping near bedtime (as `scoreAt()` sums every near event), not from an exponent on a single event's total. Calibrated so one drink checked at a normal drink-to-bedtime gap (3-5h later) stays negligible — matching the research that ~1 standard drink is sleep-neutral to mildly sleep-promoting, not disruptive — while a real binge session (6-8 drinks over a couple hours) lands solidly in the "disrupted" range by bedtime. Verified both ends numerically and in a live browser.
- The rebound/fragmentation window (after a drink clears) is wider than the "4h" used elsewhere in this file, specifically so multiple drinks' rebound windows overlap for a real session — motivated by the same review's finding that wake-after-sleep-onset roughly doubles on alcohol nights (66.9 vs. 38.7 min in the cited study), concentrated in the second half of the night.
- The elimination-rate constant (1.5h per drink) turned out to already be well-grounded (~0.015 g/dL/hr average adult rate ⇒ ~4-5h to clear a moderate 2-3 drink dose) and didn't need to change. The peak-penalty values themselves are a modeling choice calibrated to that negligible-single-drink / disrupted-real-binge shape, not sourced numbers.

**Shipped (2026-08-14).** Privacy promise ("We will never share, sell, or report your data") added front-and-center on the login page, which — since there's no separate marketing landing page — is also the first thing every unauthenticated visitor sees.

**Shipped (2026-08-14).** Onboarding card — replaces the bare "No events logged yet" empty state with a real explanation of the score and the What If sandbox, shown only while the real log (`STATE.events`, not the What If fork) has never had anything logged. Disappears for good the moment a first real event lands, in whichever mode you're in when you log it, and stays hidden on reload since it's checking real history, not a session flag.

**Shipped (2026-08-14).** Caffeine calibration checked against real pharmacokinetics research — unlike alcohol, it held up. Half-life (5h) sits in the middle of the ~4-6h range multiple sources converge on; dose-response is close to linear per a 2023 systematic review/meta-analysis (~0.2 min of total-sleep-time loss per 1mg in their meta-regression), matching this model's proportional-to-remaining-mg shape; and the well-known Drake et al. 2013 finding (400mg 6h before bed → >1h TST loss) lines up with what the model already predicted for that exact case. No rebuild needed — but while checking, found `coffee`, `energy_drink`, `soda`, and the still-disabled `caffeine` type were four copies of the identical formula with zero comments, a real risk since updating the threshold/multiplier meant remembering to touch all four. Consolidated into one documented `caffeineDecay()` helper; verified numerically that output is unchanged (400mg/6h still gives the same 61.6 penalty as before the refactor). Also surfaced a real limitation worth knowing about: oral contraceptive use roughly doubles caffeine's half-life (~10.7h vs. ~6.2h) in the same research — a genuine per-user difference this single global half-life can't capture, filed under the existing personalization deferral (§5) rather than solved now.

**Shipped (2026-08-14).** Mobile pass — audited every page at real iPhone viewport width (Playwright + device emulation, not a resized desktop window) since the pilot (GROWTH.md) is entirely QR-code/flyer driven and nothing had been checked on an actual phone screen. Found and fixed two real bugs:
- **Profile page overflow:** `.profile-field`'s height/weight inputs forced the page to scroll horizontally on a phone. Grid items default to `min-width: auto`, so a number input's own intrinsic minimum size overrode the grid's attempt to shrink it to fit — added `min-width: 0` plus a mobile breakpoint that stacks label above input for better touch targets.
- **Quick-add popover bleed-through:** the alcohol/nicotine dropdown popovers are only as wide as their own grid column (half the card on the 2-column mobile quick-add grid), but extend down far enough to overlap the custom-entry card below — since they weren't wide enough to fully cover that row, part of it peeked out beside them. Fixed by computing the popover's position and width from its enclosing card at open-time (`positionQuickAddPopover()` in `js/render-log.js`) instead of anchoring to just the trigger tile, so it works correctly regardless of which grid column triggered it — verified both left- and right-column cases on-device.
- **False alarm, ruled out:** the calendar modal looked cut off in a static screenshot, but it already has `overflow-y: auto` and scrolls correctly — confirmed by actually scrolling it, not just eyeballing a screenshot.

**Trust gap.** The decay engine is "shipped, rough" — 11 event types, unevenly calibrated. Marijuana's constant was already corrected once after being unrealistically fast; nicotine, alcohol, and caffeine have since had the same scrutiny (caffeine held up as-is). Adderall/stimulants are the one substance in §3 that hasn't. This is the actual risk to the product: a harm-reduction app that gets a student's curve visibly wrong loses their trust in one session, and there's no recovering that.

**Still missing.** Outcome tracking (no way to check predicted vs. actual yet), and What if?'s interactive drag-and-drop hasn't shipped as a dedicated surface — it exists implicitly (add/edit an event, see the score move) but not as the explicit "try before you do it" interaction described in §1.

---

## 3. Calibration priority: depth over breadth

Rather than maintain 11 roughly-calibrated event types, narrow near-term calibration effort to what students actually log most, by prevalence (NSDUH 2023, ACHA, and campus survey data):

| Substance | College past-month/weekly use | Current status |
|---|---|---|
| Caffeine (coffee) | ~92% use daily; ~159mg/day avg | shipped, checked 2026-08-14 (held up, no change needed) |
| Alcohol | ~50% past month; ~40% binge | shipped, recalibrated 2026-08-14 |
| Energy drinks | ~68% past month | shipped, brand presets done |
| Marijuana | ~42–44% past year | shipped, recalibrated once already |
| Nicotine/vaping | ~33% past month | shipped, recalibrated |
| Prescription stimulants (Adderall, off-label) | ~7–10% past year | shipped, needs calibration check |
| Naps | not a substance stat, but functionally central to student sleep behavior | shipped |

These seven cover the substances a student is actually likely to log. `workout`, `meal`, `stress`, `brightlight`, `screen` are secondary — plausible contributors, lower priority to re-derive from research right now. The near-term task isn't adding event types; it's re-checking these seven against real decay/half-life research and fixing whichever ones are furthest from physiologically plausible. Marijuana, nicotine, alcohol, and caffeine have had that pass (caffeine's held up as-is); stimulants (Adderall) haven't yet.

---

## 4. Next up

Ordered, small enough to actually finish:

1. **Make What if? an explicit interaction** *(mostly shipped)* — What If mode now forks today's real events into an independent sandbox; freely add/edit/delete anything there and it's discarded on re-entry, never touching the real log. Still not the literal drag-and-drop the original phrasing wanted, but "discard without saving" is real now.
2. **Calibration pass on the seven core substances** (§3) — nicotine re-derived: two-phase model (small acute penalty, larger withdrawal/rebound penalty as levels crash — Jaehne et al.), half-life tightened to the sourced 1-2h range. Alcohol re-derived and caffeine checked 2026-08-14 (§2). Stimulants (Adderall) are the one substance in §3 still unchecked — named alongside alcohol in the Trust gap note (§2) as the highest-risk substance to get visibly wrong.
3. **`.edu` email check on signup** (warn but allow) — infrastructure for a student tier later, not urgent on its own. Easier now that email *is* the account identity (§2).
4. **Verify a SendGrid single sender before launch** — reset-password emails currently only log to the console (no credentials set). Verify one email address in SendGrid (no domain purchase needed), then set `SENDGRID_API_KEY`, `EMAIL_FROM`, and `APP_URL` in Render's environment. Blocking for real users; §2 has the detail.

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
