# Drift — Plan to 200 Users

Companion to [ROADMAP.md](ROADMAP.md). That doc governs what gets built; this one governs how Drift gets its first 200 users, concentrated at UW. Written Aug 10, 2026 — UW fall quarter starts late September, which is the single biggest distribution window of the year and the deadline this whole plan works backward from.

---

## 0. What counts as a user

200 accounts is easy and meaningless. **A user = an account that has logged ≥3 events** — someone who actually tried the core loop.

Before any promotion, add minimal instrumentation (plain SQL against the existing Postgres tables is fine, no analytics product needed):

- signups per day
- events logged per user
- % of accounts that return the next day
- distinct signup URLs / QR codes per channel, so each channel's yield is knowable

The plan cannot be run without knowing which channel is working.

---

## 1. Phase 0 — Make the front door work (now → Sep 1)

These are acquisition blockers, not product polish. Most are already in ROADMAP.md §4:

1. **Onboarding card** — every acquired user arrives at the empty state. If the first 60 seconds don't explain the score, the flyer QR scan is wasted.
2. **Privacy promise on landing + login** — students are being asked to log alcohol, weed, and Adderall. "Never shared, sold, or reported" is the difference between signup and bounce, especially from a stranger's flyer.
3. **Alcohol calibration check** — one student seeing a visibly wrong alcohol curve during Dawg Daze week kills word-of-mouth on their whole floor.
4. **Mobile polish pass** — essentially 100% of these users will be on phones.
5. **A shareable moment** — a "share my forecast" button that renders the score + curve as an image. This is the referral engine; every other channel feeds it.

**Skip everything else** (day-boundary bug, .edu tier infra, calendar view) until after 200.

---

## 2. Phase 1 — Seed cohort of 20 (Sep 1 → Sep 25)

Recruit ~20 friends and friends-of-friends personally, one at a time. Watch several of them onboard over your shoulder.

Goals:

- shake out the onboarding funnel
- verify the seven core substance curves feel right to real users
- find the two or three sentences that make people say "oh, I want that" — reuse those words on every flyer and post

**Do not go wide with a funnel no stranger has been watched getting through.**

---

## 3. Phase 2 — Fall quarter launch at UW (Sep 25 → Nov 15)

Channels in rough order of expected yield:

| Channel | When | Target | Notes |
|---|---|---|---|
| Dawg Daze / week 1 | late Sep | ~50 | Table via RSO fair or partner with a club (pre-health, psych, HCDE). Hook: *"Will that 8pm Celsius wreck your sleep? Find out before you drink it."* Lead with What-if — it's a decision tool, not a wellness lecture. |
| Group chats & Discords | weeks 1–3 | ~50 | Dorm floor chats, major Discords, class GroupMes. Each seed user posts once in one chat they're actually in. Warm intros convert far better than posters. |
| One r/udub post | week 2–3 | 30–60 | Honest "I'm a UW student, I built this because my sleep was wrecked" with a real forecast screenshot. Personal, not marketed-sounding. |
| Flyers: Odegaard, dorms, coffee shops | ongoing | ~30 | QR codes with distinct URLs per location. Low yield per flyer, nearly free. |
| Midterms wave | late Oct | ~30 | Sleep pain peaks, caffeine spikes. Re-post and re-flyer with midterm copy: *"All-nighter tonight? See what tomorrow costs."* |
| TikTok / IG | only if fun | lottery | Screen-recorded What-if experiments (9pm espresso dropped on the timeline, score tanks) are good short-form content — but don't let it displace the reliable campus channels. |

That totals ~200 with margin, concentrated on one campus — density creates word-of-mouth, which is the same argument ROADMAP.md §6 already makes for UW-only.

---

## 4. Phase 3 — Keep them (ongoing)

Acquisition leaks without retention, and the "≥3 events" bar means retention *is* acquisition.

- **Talk to 10 users** in weeks 2–4 — literally buy them coffee. Ask what the score got wrong. Wrong curves are the churn engine, and this doubles as the calibration feedback loop ROADMAP.md §3 wants.
- **Watch one number weekly:** % of signups still logging 7 days later. If it drops under ~20%, **pause promotion and fix the product** — pouring users into a leaky funnel burns the campus, and each dorm gives one first impression per year.

---

## 5. Timeline at a glance

| When | What |
|---|---|
| Aug 10 – Sep 1 | Onboarding card, privacy line, alcohol calibration, mobile pass, share image |
| Sep 1 – 25 | 20 seed users, watched onboardings, refined pitch copy |
| Late Sep | Dawg Daze push + group chats (~100 users) |
| Early–mid Oct | r/udub post, flyers (~150) |
| Late Oct | Midterms wave (~200) |

---

## 6. The one rule

**Resist starting Phase 2 early.** There is exactly one clean shot at the UW freshman/dorm network per year, and it opens in ~7 weeks. Spending August on the onboarding-and-trust items is what makes that shot count.
