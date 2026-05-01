# Drift — Roadmap

A working plan for the sleep forecast app, now targeting **college students** as the first user cohort.

The doc is organized in five layers: **target cohort** (who this is for and why), **the full feature map** (everything the app could eventually do), **a phased roadmap** (when to build what), **this week's queue** (the concrete ordered work to do next), and **open decisions** (the choices still on the table).

---

## 0. Target cohort: college students

College students have the worst sleep of any large adult cohort — average ~6.5 hours, wildly irregular, with daily mismatches between what they want (focus, performance, fun) and what their bodies are doing. The pain is real, daily, self-aware, and currently underserved by every existing sleep app: Oura and Whoop are too expensive, RISE is for adults, and Apple Watch is too generic.

What makes this cohort right for Drift:

- **Daily, painful sleep problem** — caffeine timing, weekend drinking, exam stress, all-nighters, Adderall, naps gone wrong. Drift has something to say about every input.
- **Concentrated audience** — campus = a built-in distribution channel. One pilot school can produce hundreds of users in weeks.
- **TikTok-native** — the "what if?" interaction is screenshot-bait. Demos virally.
- **Cheaper to acquire** than any other cohort. No paid ads needed for v1.
- **Long lifetime value** — get them in college, keep them through grad school and early career.
- **Iterating with them is easy** — campus visits, study breaks, surveys, friend-of-a-friend introductions.

What makes it hard:

- **Price-sensitive** — no $30/mo subscription works here. Free-with-`.edu` and ~$4/mo paid tier.
- **Privacy stakes** — alcohol, weed, unprescribed Adderall in the data. Cannot leak, cannot sell, cannot share with schools.
- **App fatigue** — must be sticky and actually useful, not another wellness app gathering dust.
- **Behavioral honesty** — can't lecture about not partying. Harm-reduction posture, not wellness posture.

This means the product is shaped as **a non-judgmental, harm-reduction tool that helps you survive your week**, not a wellness app that helps you optimize your sleep. The distinction matters in every copy decision.

---

## 1. Where we are right now

The app has grown beyond a single HTML file into a real multi-page structure.

**Frontend.** Three pages — Log, Forecast, and Login — at `/pages/*.html`, with shared CSS at `/css/app.css` and modular JS at `/js/*.js` (types, decay, state, render-log, render-forecast, time, nav, page entry points). State persists per-user via localStorage (and now sessions on the server).

**Backend.** Express server at `/server/server.js` with SQLite (`drift.db`) for accounts and an SQLite-backed session store. `bcrypt` for password hashing. Three routes: `auth`, `profile`, and the static frontend.

**Decay engine.** Eleven event types, all with deterministic decay functions: `coffee`, `energy_drink`, `marijuana`, `stimulant` (Adderall), `nap`, `alcohol`, `nicotine`, `caffeine` (legacy alias), `workout`, `meal`, `stress`, `brightlight`, `screen`. Default target bedtime is 1:00 AM. The breakdown card collapses caffeine sources into one row and surfaces Adderall, marijuana, alcohol, nap, nicotine separately.

**What this can do today.** A student can sign in, log their day with student-relevant inputs (Celsius at 4pm, 90-min nap at 5pm, Adderall this morning), and see a live forecast at 1am with a Chart.js decay timeline.

**What it still can't do.** Sync across devices in real time, recommend interventions, learn from sleep outcomes, run on mobile natively, onboard a new user gracefully, or do anything especially viral.

---

## 2. Feature map (the full scaffold)

The surface area, organized by app area. College-specific items are tagged **[student]**.

### A. Event logging

- **Quick-add buttons** for the most common events. *(✓ shipped)*
- **Custom entry form** with type, amount, time. *(✓ shipped)*
- **Student-relevant types** — coffee, energy drink, Adderall, marijuana, nap, alcohol. *(✓ shipped)*
- **Brand presets** **[student]** — tap to log Celsius (200mg), Red Bull (80mg), Bang (300mg), Monster (160mg) with one click.
- **Edit existing events** — currently you can only delete and re-add.
- **Backdated logging** — log yesterday's events after the fact.
- **"Same as yesterday"** **[student]** — one-tap recreation. Students live in patterns (8am coffee, 4pm nap, 9pm cram).
- **Schedule-aware logging** **[student]** — paste your class schedule, app pre-suggests events around it.
- **Natural-language logging** — "had a celsius and pizza" → parsed by LLM into structured events. Major friction killer.
- **Voice / Siri logging** — mobile-only. "Hey Siri, log coffee."
- **Auto-detect from wearables** — pull workouts and sleep from Apple Health.

### B. Forecast engine

- **Deterministic decay models** for all 11 event types. *(✓ shipped, rough)*
- **Calibration constants in a hidden debug panel** — tune the engine while you use it.
- **Sleep debt state** **[student]** — log last night's hours; affects today's forecast magnitude.
- **All-nighter mode** **[student]** — when total sleep in last 24h is < 4h, switch to "survive tomorrow" forecast instead of "clean sleep tonight."
- **Time-of-day adjustments** — caffeine half-life longer in the evening; cortisol decay slower under sleep deprivation.
- **Confidence intervals** — show 70 ± 8, not just 70.
- **Personalization layer** — per-user multipliers on each parameter, learned from outcomes.
- **Hierarchical Bayesian model** — pool across users with priors so cold-start works.

### C. Forecast visualization

- **Hero score** at target bedtime, color-coded. *(✓ shipped)*
- **Per-contributor breakdown** with student-relevant categories. *(✓ shipped)*
- **Decay timeline** with bedtime marker. *(✓ shipped)*
- **Stacked contribution chart** — colored bands per obstacle, see *what* drags the score at each moment.
- **"Best bedtime tonight"** — the time at which forecast peaks.
- **Tomorrow's energy forecast** **[student]** — separate score predicting how rough tomorrow will feel given tonight's setup.
- **Historical view** — yesterday's forecast, last 7 days, your typical day.
- **Predicted vs. actual** — once we collect sleep outcomes, show a calibration plot.

### D. Recommendations & remediation (the third screen)

- **"What if?" mode** — drag a hypothetical event onto the timeline, watch forecast change live. Highest-leverage feature, screenshot-bait.
- **"Pull This Off?" mode** **[student]** — input the constraint ("4 hours of work left, 9am class") and get a survival plan. Most college-coded version of "what if?".
- **Hangover Forecast** **[student]** — log last night's drinking, get a realistic timeline of when you'll feel human again.
- **Exam-Week Mode** **[student]** — multi-day plan to protect performance for a known-future event.
- **Rescue plan** — given current state, suggest specific interventions ranked by score impact.
- **Time-stamped action queue** — wind-down checklist with timestamps, generated for tonight.
- **Last-coffee deadline** — for tomorrow, given today's debt and target bedtime.

### E. Onboarding **[student]**

- **Sample day loader** — already exists, now student-shaped (Adderall, Celsius, late nap, late dinner). *(✓ shipped)*
- **First-run wizard** — caffeine sensitivity, typical bedtime, .edu connection.
- **Annotated forecast** — first time you see the chart, walk through what the line/bands/marker mean.
- **First-week journey** — daily nudges that introduce one feature at a time.

### F. Outcome tracking & validation loop

- **Manual sleep score entry** — wake up, type how you slept (1–10).
- **Apple Health import** — pull HealthKit sleep data automatically.
- **Direct Oura / Whoop integrations** — for the small number of students who have wearables.
- **Calibration dashboard** — predicted vs. actual scatter; users see their personal model improve.
- **Auto-tuning** — model parameters update nightly from observed (input → outcome) pairs.

### G. Accounts, sync, persistence

- **Email/password accounts** with bcrypt + SQLite sessions. *(✓ shipped)*
- **`.edu` validation** **[student]** — verified-student tier with free 90-day access.
- **Magic-link or OAuth** — replace passwords; less friction.
- **Cross-device sync** — log on phone, see on laptop.
- **Data export** (CSV/JSON).
- **Account deletion** — actually deletes everything.

### H. Notifications & passive prompts

- **Wind-down reminder** — N minutes before bedtime, given current forecast.
- **Score-drop alert** — if a logged workout pushes your score down, push a notification.
- **Morning recap** — "predicted 74, you scored 71. Here's why."
- **Last-call nudge** **[student]** — "stop caffeine before X:XXpm or you'll feel it tonight."

### I. Personalization & intelligence layer

- **Per-user decay parameters** learned from outcome data.
- **Pattern surfacing** — "you sleep ~8 points worse on days you train after 7pm."
- **LLM explanation layer** — natural language description of why the forecast is what it is.
- **Conversational Q&A** — "why did I sleep badly Tuesday?" → engine answers using your data.

### J. Platforms

- **Web (current)** — primary surface for v0.1–0.3.
- **iOS app (SwiftUI)** — the eventual product. Live Activity, Widget, App Intents/Siri, HealthKit.
- **Android** — only after iOS PMF.
- **TikTok-shareable share-cards** **[student]** — exportable score images for the timeline.

### K. Business / GTM

- **Landing page** — short pitch, screenshot/video, `.edu` email signup.
- **UW pilot** **[student]** — first 100 users from one school.
- **Campus ambassador program** **[student]** — Greek life, athletic teams, RAs, study groups.
- **TikTok content calendar** **[student]** — 30-second demos of "what if?" / "pull this off?".
- **Privacy posture** — front-and-center "we never share, sell, or report your data."
- **Pricing experiments** — `.edu` free for 90 days → $4/mo or $24/year student tier.
- **Institutional pilot** **[student]** — student health centers, athletic departments at $5–15/student/year.
- **Acquisition-readiness** — clean APIs, no weird data partnerships, exportable IP.

---

## 3. Phased roadmap

Time-ordered. Each phase ends at a real artifact you'd be willing to show someone.

### Phase 1 — This week: ready to share with one student

Goal: send the URL to one UW student you trust and have them get the point in 60 seconds without explanation.

The work:
1. **Deploy to Vercel/Render** — get a public URL with the backend running.
2. **Stacked contribution chart** — replace single-line forecast with a stacked area chart.
3. **First-run experience** — the empty-state link is too hidden. A real onboarding card explaining the score and a "load a sample day" button.
4. **Brand presets for energy drinks** — Celsius / Red Bull / Bang / Monster as one-tap quick adds. Highest-leverage UX upgrade for this cohort.
5. **`.edu` email validation on signup** — sets up the free-student tier later.
6. **Privacy promise** front-and-center on login: "We will never share, sell, or report your data."

End state: a deployed URL you'd send to your roommate or a friend in your major.

### Phase 2 — Weeks 2–4: the killer student features

Goal: build the things that make a student say "wait, this is actually useful." Three features matter most.

The work:
1. **"Pull This Off?" mode** — a third screen that takes student-coded constraints and outputs a survival plan. Demo of this on TikTok is the wedge.
2. **Hangover Forecast** — given last night's drinking, show a clearance + recovery timeline. Sunday-morning-saver.
3. **Tomorrow's energy forecast** — separate score predicting how rough tomorrow will feel. Connects today's choices to next-day pain, which is the actual loss function for students.
4. **Sleep debt + last-night sleep tracking** — log how you slept, debt state modifies all penalties.
5. **Edit existing events** — basic UX hygiene.
6. **Polish pass** — logo wordmark, favicon, mobile responsive sweep, refined empty states.

End state: a product that's actually useful to you every day, plus three demos worth posting.

### Phase 3 — Months 2–3: UW pilot

Goal: get 100 UW students using it weekly. Start the validation loop.

The work:
1. **`.edu` free tier with 90-day window** — gate non-premium features on .edu auth.
2. **Manual sleep score entry every morning** — required for the calibration loop.
3. **Predicted vs. actual dashboard** — show users their model accuracy improving.
4. **Landing page + UW-themed waitlist** — purple-and-gold splash, "Built for UW. Free for any `.edu`."
5. **Recruit 10 ambassadors at UW** — Greek life, athletic teams, study groups, pre-med/CS cohorts. Free year for sharing.
6. **TikTok content calendar** — 3 videos a week, "what if?" demos with relatable scenarios (Celsius before a final, all-nighter with Adderall, weekend hangover).
7. **PostHog analytics** — measure activation, retention, feature usage.
8. **Weekly user interviews** — five students per week for the whole phase. Patterns will emerge.

End state: 100 UW users, weekly active rate, qualitative feedback library, calibration data starting to accumulate.

### Phase 4 — Months 4–6: more schools, iOS app

Goal: expand to 5 schools. Start the native iOS migration. Build the moat.

The work:
1. **iOS app** (SwiftUI) — feature parity with web, plus HealthKit, App Intents (Hey Siri, log coffee), Live Activity (current forecast on lock screen), Widget.
2. **HealthKit integration** — pull sleep data automatically; massive UX upgrade for the calibration loop.
3. **Per-user Bayesian personalization v1** — per-user multipliers on each decay constant, updated nightly.
4. **Notification system** — wind-down reminder, score-drop alert, morning recap.
5. **Expansion to 4 more schools** — pick schools where you have personal connections. Replicate the ambassador playbook.
6. **Direct Oura/Whoop OAuth** — for the ~10% of users with wearables.

End state: an iOS app on TestFlight, 1,000 students across 5 schools, real outcome-based personalization shipping.

### Phase 5 — Months 7–12: paid tier, institutional, optionality

Goal: revenue, institutional adoption, defensible engine.

The work:
1. **Premium tier ($4/mo or $24/year)** — gate behind: history beyond 30 days, personalization, recommendations, advanced charts. Free tier stays useful.
2. **Hierarchical Bayesian personalization v2** — pool across users with priors. Cold-start solved, power users get genuinely personal.
3. **Institutional pilot** — partner with one student health center or athletic department. Outcome-data-driven case study.
4. **Conversational explainer layer** — LLM that answers "why did I sleep badly?" in plain English using user data.
5. **Public API / researcher tier** — sleep researchers can pull anonymized aggregate data. Helps with credibility.
6. **Acquisition-readiness polish** — clean APIs, SOC 2 prep, documentation.

End state: paying users, an institutional contract or two, a product that someone — Oura, Whoop, RISE, a student wellness platform, a university — would consider acquiring.

---

## 4. This week — concrete ordered queue

If you sat down this week and worked through this list in order, by Sunday you'd have a deployable v0.3 ready for the first student to try.

| # | Task | Why now | Effort |
|---|------|---------|--------|
| 1 | Initial commit + push to a private GitHub repo | Version control beyond local | 20 min |
| 2 | Deploy backend + frontend to Render or Fly.io | Public URL with auth working | 1 hr |
| 3 | Stacked area chart for forecast | Biggest visual upgrade | 2–3 hrs |
| 4 | Brand presets for energy drinks (Celsius, Red Bull, Bang, Monster) | Most college-coded UX win | 1 hr |
| 5 | Onboarding card on first visit (replace empty-state link) | New users actually grok the app | 1 hr |
| 6 | Privacy promise on login + landing | Sets posture before they sign up | 30 min |
| 7 | `.edu` email check on signup (warn but allow) | Sets up student tier infrastructure | 45 min |
| 8 | `README.md` + screenshot in the repo | Onboard future collaborator / contractor | 30 min |

Total: ~7–8 hours of focused work spread across the week.

---

## 5. Open decisions still worth thinking about

Most of the strategic decisions are now made. The remaining ones:

**One school or several?** UW-only for the first 100 users is the right call — concentration creates social proof and makes feedback loops tight. Expand to second/third schools at the 200-user mark, not before.

**Manual-first or wearable-augmented from day one?** Manual-first. Most students don't own Oura/Whoop, and Apple Watch sleep data is mediocre anyway. The web product is manual-first by necessity, and the iOS Phase 4 work is the right time to add wearable integration.

**Do you build the iOS app yourself or hire?** This is the actual constraint on Phase 4. If you're solo and not Swift-fluent, you'll need a Swift contractor or a part-time cofounder for the iOS work. If you decide to stay web-only longer, Phase 4 just shifts to "make the web app feel native on mobile" — possible but harder to compete with eventual iOS-native sleep apps.

**Free + premium, or free + institutional, or both?** Both — they don't compete. Premium fund individual users, institutional funds bulk. But if you have to pick one to push first in Phase 5, **institutional** has higher ceiling and less marketing burden, since one signed contract = hundreds of users at once.

**When does this stop being a side project?** Not for the next 6 months either way. After Phase 3 — if you have 100 weekly active UW users and outcome data showing measurable lift — it's worth thinking about whether to fundraise, accelerator (Y Combinator's college student angle is real), or apprentice with a wellness company.

---

## 6. The single most important thing to build next

If you only do one thing in the next two weeks, build **"Pull This Off?" mode**. Take a constraint a student would actually type ("I have 4 hours of work left, 9am class, three coffees today already, took a 90-min nap") and output a personalized survival plan. It's the feature that demos in 10 seconds, screenshots well, and is the single thing students will share with their group chats. It's also genuinely useful — most other features on the roadmap are valuable but incremental. This one is the wedge.
