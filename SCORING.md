# Sleep-effect literature behind the decay model

What [`js/decay.js`](js/decay.js) assumes for every substance currently loggable in the app —
caffeine, marijuana, alcohol, and nicotine — the peer-reviewed studies that speak to it, and where
the two agree or diverge. Compiled for the calibration pass described in
[ROADMAP.md §3](ROADMAP.md#3-calibration-priority-depth-over-breadth) — a web-search literature
scan, not a formal systematic review. (`js/types.js` also has decay functions for stimulants, naps,
workouts, meals, stress, bright light, and screens, but those are commented out of `TYPES` and
aren't loggable yet, so they're out of scope here until they ship.)

Originally compiled 2026-07-30 covering caffeine/marijuana/nicotine only; alcohol added and
nicotine's model updated below to reflect what actually shipped 2026-08-14 (nicotine's two-phase
recalibration was a direct response to the gap this doc originally flagged — see "vs. current
model" in that section).

- [Caffeine](#caffeine)
- [Marijuana](#marijuana)
- [Alcohol](#alcohol)
- [Nicotine](#nicotine)

---

## Caffeine

*Covers coffee, energy drinks, soda — same decay curve, different mg.*

**Current model**

```
half-life = 5h
remainingMg = dose * 0.5^(h / 5)
penalty = max(0, (remainingMg - 20) * 0.4)
```

**Key findings**

- Population half-life ranges 2–10h, commonly cited around 4–6h — wide inter-individual variation
  from genetics, smoking status, hormones.
- Meta-analysis (24 studies): sleep onset latency +9 min, wake-after-sleep-onset +12 min, total
  sleep time −45 min, sleep efficiency −7%.
- Light sleep (N1) duration +6.1 min, deep sleep (N3/N4) duration −11.4 min.
- Notably: the sleep-onset-latency increase was **not significantly moderated by dose or timing**
  of the final dose in the pooled analysis — effects showed up even at lower doses and earlier
  timings than expected.

**Studies**

- *The effect of caffeine on subsequent sleep: a systematic review and meta-analysis* — Gardiner C,
  Weakley J, Burke LM, Roach GD, et al., Sleep Medicine Reviews, 2023;69:101764.
  [sciencedirect.com/S1087079223000205](https://www.sciencedirect.com/science/article/pii/S1087079223000205)
- *Dose and timing effects of caffeine on subsequent sleep: a randomized clinical crossover trial* —
  SLEEP, Oxford Academic, 2025;48(4):zsae230.
  [academic.oup.com/sleep/48/4/zsae230](https://academic.oup.com/sleep/article/48/4/zsae230/7815486)

> **vs. current model** — The 5h half-life sits mid-range and is defensible. The bigger gap: the
> model applies a hard 20mg-residual cutoff below which nothing counts, but the meta-analysis found
> onset-latency effects that weren't reliably dose- or timing-dependent — meaning a late, low-dose
> soda might matter more than the flat threshold assumes.

---

## Marijuana

*Active in `TYPES` · recalibrated once already.*

**Current model**

```
penalty = amount * 20 * 0.5^(h / 7)
```

**Key findings**

- Landmark 1975 study: THC suppressed REM eye-movement activity and, to a lesser extent, total REM
  duration; deep sleep (stage 4) rose slightly on-drug; both showed a rebound above baseline on
  withdrawal.
- 2024 cohort study (177 adults): frequent near-bedtime use associated with **more**
  wake-after-sleep-onset, longer REM latency, lower sleep efficiency.
- 2025 meta-analysis: REM suppression is concentrated in **high-dose studies (≥10mg THC)** —
  lower "therapeutic" doses show mixed or no REM effect.
- Withdrawal consistently produces reduced total sleep time, longer sleep onset, and REM rebound.

**Studies**

- *Effects of high dosage delta-9-tetrahydrocannabinol on sleep patterns in man* — Feinberg I, et
  al., Clinical Pharmacology & Therapeutics, 1975;17(4):458.
  [ascpt.onlinelibrary.wiley.com/cpt1975174458](https://ascpt.onlinelibrary.wiley.com/doi/abs/10.1002/cpt1975174458)
- *Cannabis and sleep architecture: a systematic review and meta-analysis* — Sleep Medicine
  Reviews, 2025.
  [sciencedirect.com/S1087079225001170](https://www.sciencedirect.com/science/article/pii/S1087079225001170)

> **vs. current model** — The ~7h decay constant is a reasonable proxy for same-night
> subjective/REM effect (the code already correctly avoids conflating it with THC's multi-day
> elimination half-life). The real gap: the model scales linearly from any amount > 0, with no
> low-dose floor, while the 2025 meta-analysis says REM suppression is a high-dose (≥10mg)
> phenomenon — small amounts may currently be penalized more than the literature supports.

---

## Alcohol

*Active in `TYPES` · logged as standard drinks (beer/wine/shot), recalibrated 2026-08-14.*

**Current model**

```
one event = one standard drink (12oz beer / 5oz wine / 1.5oz shot, all ≈14g ethanol — NIAAA)
elimination clears one drink in ~1.5h

active phase (h < 1.5h):    penalty = 8 * (1 - 0.4 * (h / 1.5))
rebound phase (0 <= h - 1.5 < 6h): penalty += 10 * (1 - (h - 1.5) / 6)
```

A multi-drink session isn't modeled with an exponent on total amount — each drink is logged (and
scored) separately, so a real session's severity emerges from several drinks' active/rebound curves
overlapping near bedtime.

**Key findings**

- Systematic review (27 studies, mostly polysomnography): alcohol delays REM onset and reduces REM
  duration; effect on total sleep time was non-significant overall (−10.1 min pooled).
- High doses can shorten sleep-onset latency short-term, but this appears to *worsen* subsequent
  REM disruption rather than offset it — alcohol's reputation as a sleep aid doesn't hold up
  structurally even when it feels like it helps falling asleep.
- Wake-after-sleep-onset roughly doubles on alcohol nights vs. control in the source data behind
  this model (66.9 vs. 38.7 min), concentrated in the second half of the night — the basis for this
  model's wide 6h rebound window.
- Average elimination rate ≈0.015 g/dL/hr, consistent with clearing one standard drink in roughly
  1.5–2h and a moderate 2–3 drink dose in 4–5h.

**Studies**

- *The effect of alcohol on subsequent sleep in healthy adults: a systematic review and
  meta-analysis* — Gardiner CL, Weakley J, Burke LM, Roach GD, Sargent C, Maniar N, Huynh M, Miller
  DJ, Townshend A, Halson SL, Sleep Medicine Reviews, 2025;80:102030.
  [sciencedirect.com/S1087079224001345](https://www.sciencedirect.com/science/article/pii/S1087079224001345)
- *Alcohol Metabolism* — Bowling Green State University, Alcohol Education (elimination-rate
  reference).
  [bgsu.edu/.../alcohol-metabolism](https://www.bgsu.edu/recwell/wellness-connection/alcohol-education/alcohol-metabolism.html)

> **vs. current model** — Well aligned. This is the same research group and journal as the caffeine
> meta-analysis above; note the model's *elimination-rate* source (BGSU) is a straightforward
> physiological constant, not the sleep-effect finding itself — the sleep-effect shape (active
> sedation → rebound fragmentation, WASO roughly doubling) is what the model's active/rebound
> structure is built to reproduce. One naming correction: `decay.js`'s comments and ROADMAP.md
> attribute this meta-analysis to "Girschik et al." — that appears to be a citation error; the
> actual lead author is Gardiner (same group as the caffeine paper above). Worth fixing in those
> comments too.

---

## Nicotine

*Active in `TYPES`.*

**Current model** — two-phase, shipped 2026-08-14 (acute + withdrawal rebound, see below)

```
mg by delivery method: cigarette 1.2, vape 1.3, pouch (3mg) 3, pouch (6mg) 6
half-life = 2h
remainingMg = mg * 0.5^(h / 2)

acute phase:   penalty = max(0, (remainingMg - 0.5) * 1.5)
rebound phase: starting at h = half-life, over a 4h window:
               penalty += mg * 3 * (1 - hoursSinceHalfLife / 4)
```

**Key findings**

- During consumption: increased sleep latency, sleep fragmentation, reduced slow-wave sleep,
  reduced sleep efficiency, **REM suppression**.
- Half-life of 1–2h is explicitly proposed as the mechanism for fragmentation — levels crash
  mid-sleep, producing a mini-withdrawal.
- Use within 2–3h of bedtime called out as particularly disruptive.
- Withdrawal insomnia reported in up to 39% of quit attempts.

**Studies**

- *Effects of nicotine on sleep during consumption, withdrawal and replacement therapy* — Jaehne
  A, Loessl B, Bárkai Z, Riemann D, Hornyak M, Sleep Medicine Reviews, 2009;13(5):363–377,
  doi:10.1016/j.smrv.2008.12.003, PMID 19345124.
  [pubmed.ncbi.nlm.nih.gov/19345124](https://pubmed.ncbi.nlm.nih.gov/19345124/)

> **vs. current model** — This was originally the clearest mismatch of the three: the model was a
> single decaying-penalty curve, while the Jaehne review's actual mechanism is the opposite
> emphasis — it's the *crash* after the short half-life that drives fragmentation, not the presence
> of nicotine itself. A model with only an acute-phase term had no way to represent that
> withdrawal-driven second hit. Fixed 2026-08-14 with the two-phase model above: a small acute
> penalty while nicotine is circulating, plus a larger withdrawal/rebound penalty as levels crash,
> mirroring alcohol's active-then-rebound shape. Per-mg multipliers in both phases are still
> modeling placeholders, not sourced numbers — nicotine's mg scale (1–6mg) isn't directly
> comparable to caffeine's (100mg+), so they need real calibration once there's outcome data (see
> [ROADMAP.md §5](ROADMAP.md#5-deferred--not-core-not-scheduled)).

---

Compiled via web search for the calibration pass in [ROADMAP.md §3](ROADMAP.md#3-calibration-priority-depth-over-breadth) —
not a formal systematic review. Covers every substance currently loggable in the app (caffeine,
marijuana, alcohol, nicotine); stimulants, naps, workouts, meals, stress, bright light, and screens
are built in `decay.js` but commented out of `TYPES` and not yet loggable.
