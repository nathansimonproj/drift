# Drift — Roadmap

A working plan for the sleep forecast app, built from the v0.1 single-file HTML MVP.

The doc is organized in three layers: **the full feature map** (everything the app could eventually do, scaffolded out so you can see the shape), **a phased roadmap** (when to build what), and **this week's queue** (the specific ordered work to do next).

---

## 0. Where we are right now

A working `index.html` with two screens: a Log screen with quick-add buttons and a custom-entry form, and a Forecast screen with a hero score, a per-contributor breakdown, and a Chart.js decay timeline. State persists in localStorage. The decay engine is a deterministic rule set — believable directionally, not yet calibrated.

What this can already do: let one person log their day, see a live forecast number that responds to their inputs, and watch a chart of how the score evolves toward bedtime. What it can't do: sync across devices, learn from outcomes, recommend interventions, run on mobile natively, or onboard a new user gracefully.

---

## 1. Feature map (the full scaffold)

This is the surface area, organized by app area. Not everything here gets built — but seeing the whole map makes prioritization easier.

### A. Event logging

The act of getting data into the system. Everything else depends on this being frictionless.

- **Quick-add buttons** for the most common events. *(✓ shipped)*
- **Custom entry form** with type, amount, time. *(✓ shipped)*
- **Edit existing events** — currently you can only delete and re-add.
- **Backdated logging** — log something from yesterday after the fact.
- **"Same as yesterday"** — one-tap recreation of a day you've already lived.
- **Recurring patterns** — "I have coffee every weekday at 8am" creates events automatically.
- **Natural-language logging** — type "just had a beer and a slice of pizza" and an LLM parses it into structured events. Killer feature for friction reduction.
- **Voice / Siri logging** — mobile-only, "Hey Siri, log coffee." Requires native iOS app.
- **Photo logging** — snap your meal, LLM estimates carb/fat/protein and meal size. Speculative.
- **Auto-detect from wearables** — pull workouts and sleep from Apple Health / Oura / Whoop instead of manual logging.

### B. Forecast engine

The IP. Where the score comes from.

- **Deterministic decay models** for caffeine, alcohol, workout, meal, nicotine, stress, light, screen. *(✓ shipped, rough)*
- **Calibration constants exposed as sliders** in a hidden debug panel — lets you (and eventually the user) tune sensitivity to each input.
- **Confidence intervals** on the forecast — show 70 ± 8, not just 70.
- **Time-of-day adjustments** — caffeine half-life is longer in the evening; cortisol decay slower under sleep deprivation.
- **Personalization layer** — per-user multipliers on each parameter, learned from outcome data.
- **Hierarchical Bayesian model** (long-term) — pool across users with priors so cold-start works while letting power users diverge.
- **Model versioning** — when the engine changes, old forecasts don't retroactively shift.

### C. Forecast visualization

Making the number understandable and actionable.

- **Hero score** at target bedtime, color-coded. *(✓ shipped)*
- **Per-contributor breakdown** showing what's costing you points. *(✓ shipped)*
- **Decay timeline** showing forecast curve from now to bedtime+2h. *(✓ shipped)*
- **Stacked contribution chart** — show each obstacle as a colored band so you can see *what* is dragging the score down at each moment.
- **"Best bedtime tonight"** — the time at which forecast peaks; sometimes 11:30 is meaningfully better than 11:00.
- **Historical view** — yesterday's forecast, last 7 days, your typical day.
- **Predicted vs. actual** — once we collect sleep outcome data, show a calibration plot ("we said 72, you slept a 68"). Builds trust in the model.
- **Glanceable widget / Live Activity** — current forecast on the lock screen / home screen. Mobile-only.

### D. Recommendations & remediation (the third screen)

The forward-looking, prescriptive layer. This is what turns a tracker into a coach.

- **"What if?" mode** — drag a hypothetical event onto the timeline ("if I have a beer at 9pm…") and watch the forecast change in real time. Highest-value single feature on the entire roadmap.
- **Rescue plan** — if score is below threshold, suggest specific actions ranked by expected score gain ("dim lights at 9 → +6", "drink 16oz water → +3", "skip the IPA → +14").
- **Protect plan** — if score is good, what *not* to do to keep it good.
- **Time-stamped action queue** — a wind-down checklist with timestamps generated for tonight specifically.
- **Last-coffee deadline** — for tomorrow, given today's sleep debt and your target bedtime.
- **Workout window** — when to exercise today so cortisol clears before bed.
- **Pre-event check** — about to do something? Tap "Will this hurt my sleep?" and get a yes/no with cost.

### E. Onboarding

How a brand-new user gets value in their first 60 seconds.

- **Sample day loader** — already exists as an empty-state link, but should be smarter (load a "good" day vs. "bad" day for contrast).
- **Personalization wizard** — caffeine sensitivity, typical bedtime, wearable connection. 30 seconds, optional.
- **Annotated forecast** — first time someone sees the chart, walk them through what the line/bands/marker mean.
- **First-week journey** — daily nudges that introduce one feature at a time.

### F. Outcome tracking & validation loop

The feedback the engine learns from. This is the moat.

- **Manual sleep score entry** — wake up, type in how you slept (1–10).
- **Apple Health import** — pull HealthKit sleep data automatically. Web has limited HealthKit access; this is realistically a mobile feature.
- **Direct Oura API** — OAuth2, pull last night's sleep score, stages, HRV.
- **Direct Whoop API** — OAuth2 + webhooks, pull recovery score and sleep performance.
- **Calibration dashboard** — predicted vs. actual scatter; users see their personal model improve over time.
- **Auto-tuning** — model parameters update nightly based on observed (input → outcome) pairs.

### G. Accounts, sync, persistence

Moving beyond "one browser, one device."

- **localStorage** for anonymous use. *(✓ shipped)*
- **Magic-link auth** — email + one-click sign-in. No passwords.
- **Sign in with Apple** — when we go mobile.
- **Cross-device sync** — log on phone, see on laptop.
- **Data export** (CSV/JSON) — table stakes for trust + GDPR/CCPA.
- **Account deletion** — actually deletes everything.

### H. Notifications & passive prompts

Keeping the loop alive without being annoying.

- **Wind-down reminder** — N minutes before target bedtime, given your current forecast.
- **Score-drop alert** — if a HealthKit-detected workout pushes your score down meaningfully, push a notification.
- **Morning recap** — "you predicted 74, you scored 71. Here's why."
- **Last-call nudge** — "one more coffee before X:XXpm or you'll feel it tonight."

### I. Personalization & intelligence layer

The reasons users will keep coming back six months in.

- **Per-user decay parameters** learned from outcome data.
- **Anomaly detection** — "your sleep was unusually bad given your inputs, anything else going on?"
- **Pattern surfacing** — "you sleep ~8 points worse on days you train after 7pm."
- **LLM explanation layer** — natural language description of why your forecast is what it is.
- **Conversational Q&A** — "why did I sleep badly Tuesday?" → engine queries data and explains.

### J. Platforms

Where the app lives.

- **Web (this MVP)** — primary surface for v0.1–0.3.
- **iOS app (SwiftUI)** — the real product. Live Activity, Widget, App Intents/Siri, HealthKit.
- **Android app** — only after iOS has product-market fit.
- **Apple Watch complication** — bedtime forecast on your wrist.

### K. Business / surrounding work

Adjacent to the product but necessary for it to matter.

- **Landing page** — short pitch, screenshot/video, email signup.
- **Waitlist** — gather names before public launch.
- **Privacy policy + terms** — minimal but real.
- **Analytics** (PostHog) — what features actually get used.
- **Pricing experiments** — when there's enough product to charge for.
- **Acquisition-readiness** — clean codebase, documented APIs, exportable IP. Build with this in mind from day one even if it never happens.

---

## 2. Phased roadmap

Time-ordered. Each phase ends at a real artifact you'd be willing to show someone.

### Phase 1 — This week: a v0.1 you'd actually demo

Goal: make the current MVP feel intentional. You should be able to send the URL to a friend and have them get the point in 60 seconds without explanation.

The work:
1. **Deploy to Vercel** — get a real URL.
2. **Stacked contribution chart** — replace the single-line forecast with a stacked area chart so you can see what's dragging the score down at every moment.
3. **Edit existing events** — click an event in the list, edit time/amount, save.
4. **Onboarding card** — a dismissible "what is this?" card on first visit, with a "load a sample day" button right inside it.
5. **Polish pass** — logo wordmark, page title/favicon, refined empty states, mobile responsive sweep.
6. **Set up GitHub repo** — so you have version history and can iterate without fear.

End state: a deployed URL you'd put in a tweet.

### Phase 2 — Weeks 2–4: the killer features

Goal: build the things that make people say "oh, this is different from RISE/Oura/Whoop." Two features matter most.

The work:
1. **"What if?" mode** — the single most differentiated interaction. Drop a hypothetical event onto the timeline and watch the forecast change live before committing. This is the wedge that makes Drift unlike any other sleep app.
2. **Recommendations screen v1 (rule-based)** — given today's events, output a ranked list of interventions with score impact. No LLM needed; literally just `if score < 70: suggest("dim lights at 9 → +6 points")`.
3. **Best bedtime tonight** — show the time at which forecast peaks. Often it's 15–30 minutes off from the user's stated target.
4. **Natural-language logging** (Claude Haiku or GPT-4o-mini) — "had two beers and pizza at 8" parses into events. Major friction reduction.
5. **Calibration sliders** in a debug panel — tune the engine as you use it, find the constants that match your experience.

End state: a tool you actually use every day yourself.

### Phase 3 — Months 2–3: real users, real outcomes

Goal: stop being a single-player toy. Get 20 people using it daily and start collecting outcome data.

The work:
1. **Magic-link accounts + cross-device sync** — minimal backend (FastAPI + Postgres on Fly.io). No passwords.
2. **Manual sleep score entry** in the morning — required for the calibration loop.
3. **Predicted vs. actual dashboard** — show users their personal model accuracy over time. Trust-builder.
4. **Apple Health import (web)** — limited but possible via shortcuts/CSV export. Not great UX but unblocks the data collection.
5. **Landing page + waitlist** — short pitch, screenshots, "request early access" form.
6. **PostHog analytics** — start measuring activation, retention, feature usage.
7. **Twenty closed-beta users** — quantified-self crowd, biohacker subreddits, your own network.

End state: weekly active users, a spreadsheet of feedback, calibration data starting to accumulate.

### Phase 4 — Months 4–6: native iOS, real depth

Goal: leave the web behind for the experiences that need a phone. Start the personalization moat.

The work:
1. **iOS app** (SwiftUI) — feature parity with web, plus HealthKit, App Intents, Live Activity, Widget.
2. **Direct Oura + Whoop OAuth integrations** — better data than HealthKit alone gives.
3. **Per-user Bayesian personalization v1** — start simple: per-user multipliers on each decay constant, updated nightly.
4. **Notification system** — wind-down reminder, score-drop alert, morning recap.

End state: an iOS app you'd put on the App Store, even if just as a TestFlight beta.

### Phase 5 — Months 7–12: moat, monetization, optionality

Goal: durable product that's worth charging for or selling.

The work:
1. **Hierarchical Bayesian personalization v2** — pool across users with priors. Cold-start solved, power users get genuinely personal.
2. **Subscription / pricing experiments** — likely $7–10/mo, ad-free, freemium gates around personalization and history.
3. **Conversational explainer layer** — LLM that answers "why did I sleep badly?" in plain English using the user's data.
4. **Public API / researcher tier** — sleep researchers can pull anonymized aggregate data. Optional, helps with credibility.
5. **Acquisition-readiness polish** — clean APIs, SOC 2 prep, documentation. Even if it never gets acquired, this hygiene makes the product better.

End state: a product with paying users, a defensible engine, and optionality on what comes next.

---

## 3. This week — concrete ordered queue

If you sat down this week and worked through this list in order, by Friday you'd have a deployable v0.2.

| # | Task | Why now | Estimated effort |
|---|------|---------|------------------|
| 1 | Push current code to a GitHub repo | Version control, no fear of breaking things | 15 min |
| 2 | Deploy to Vercel from the repo | Real URL, easy redeploys | 15 min |
| 3 | Stacked area chart for forecast | Single biggest visual upgrade | 2–3 hours |
| 4 | Edit-event flow (click event → edit → save) | Removes a real annoyance | 1 hour |
| 5 | Onboarding card on first visit | Better than empty-state link | 1 hour |
| 6 | Logo wordmark + favicon + page title | Makes it feel intentional | 30 min |
| 7 | Mobile responsive sweep | A lot of testing happens on phones | 1 hour |
| 8 | Add a `README.md` to the repo | Onboard a future collaborator | 30 min |

Total: ~7–9 hours of focused work spread across the week.

---

## 4. Open decisions you should be making

These are the choices that shape the next 3–6 months. Worth thinking about now, even if not deciding yet.

**Who is this for in the very first user cohort?** Quantified-self/biohacker crowd is the easiest to reach (Twitter, Reddit r/QuantifiedSelf, Hacker News) and most tolerant of rough edges. Shift workers and parents of newborns are higher pain but harder to reach. Athletes overlap with biohackers. Probably start QS, expand outward.

**How much does this lean on existing wearables vs. trying to be standalone?** Standalone-with-manual-logging is the fastest path to a working product. Wearable-augmented is the better long-term product. The right answer is "manual-first, wearables come in Phase 3" — but worth being intentional about it.

**Free, freemium, or paid from day one?** Free until Phase 5. Charge once you have outcome data showing real lift. Premature monetization will starve you of the feedback you need.

**Solo-build or recruit a cofounder?** If you're staying solo, the iOS native phase becomes the hard wall — that's where having a Swift-fluent engineer matters. If recruitable, start now even if part-time. If not, plan to lean on TestFlight + React Native or hire freelance for the iOS phase.

**Acquisition vs. independence?** You don't need to decide this for two years. But your code and data hygiene should keep both options open. Concretely: clean API boundaries, no weird data partnerships, all user data exportable.

---

## 5. The single most important thing to build next

If you only do one thing in the next two weeks, do **"What if?" mode**. It's the feature that demos in 10 seconds, separates Drift from every other sleep app, and gets quoted on Twitter. Everything else on this list is incremental — that one is the wedge.
