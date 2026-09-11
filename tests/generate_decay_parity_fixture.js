// Generates a golden-master fixture from the real js/decay.js engine, so the
// Swift DecayEngine port can be asserted numerically identical to it without
// hand-copying magic numbers into the Swift test file. Re-run this whenever
// js/decay.js's math legitimately changes:
//
//   node tests/generate_decay_parity_fixture.js
//
// Output: ios/DriftTests/Fixtures/DecayParityCases.json (checked into git).
const fs = require('fs');
const path = require('path');
const { scoreAt } = require('../js/decay.js');

const T0 = Date.UTC(2026, 0, 1, 0, 0, 0); // 2026-01-01T00:00:00Z
const at = (hours) => new Date(T0 + hours * 3600 * 1000).toISOString();

// Each case is a list of {type, amount, atHour} events (atHour relative to
// T0) plus the hour (relative to T0) to score at. `amount` is always sent as
// the JSON-native value the web client would send (number or string) —
// exactly what EventResponseDTO/EventRequestDTO round-trip as a string on
// the Swift side.
const cases = [
  { name: 'no_events', events: [], scoreAtHour: 0 },

  { name: 'single_coffee_6h', events: [{ type: 'coffee', amount: 135, atHour: 0 }], scoreAtHour: 6 },
  { name: 'single_coffee_0h', events: [{ type: 'coffee', amount: 135, atHour: 0 }], scoreAtHour: 0 },
  { name: 'single_coffee_before_event', events: [{ type: 'coffee', amount: 135, atHour: 2 }], scoreAtHour: 0 },
  { name: 'single_coffee_far_future', events: [{ type: 'coffee', amount: 135, atHour: 0 }], scoreAtHour: 20 },

  { name: 'plain_caffeine_100mg_3h', events: [{ type: 'caffeine', amount: 100, atHour: 0 }], scoreAtHour: 3 },

  {
    name: 'energy_drink_celsius_4h',
    events: [{ type: 'energy_drink', amount: 'celsius', atHour: 0 }],
    scoreAtHour: 4,
  },
  {
    name: 'energy_drink_red_bull_1h',
    events: [{ type: 'energy_drink', amount: 'red_bull', atHour: 0 }],
    scoreAtHour: 1,
  },
  {
    name: 'energy_drink_unknown_variant_defaults_160mg',
    events: [{ type: 'energy_drink', amount: 'totally_made_up_brand', atHour: 0 }],
    scoreAtHour: 1,
  },

  { name: 'soda_diet_2h', events: [{ type: 'soda', amount: 'diet', atHour: 0 }], scoreAtHour: 2 },
  { name: 'soda_regular_2h', events: [{ type: 'soda', amount: 'regular', atHour: 0 }], scoreAtHour: 2 },

  { name: 'marijuana_10mg_3h', events: [{ type: 'marijuana', amount: 10, atHour: 0 }], scoreAtHour: 3 },
  { name: 'marijuana_50mg_1h', events: [{ type: 'marijuana', amount: 50, atHour: 0 }], scoreAtHour: 1 },

  { name: 'alcohol_beer_solo_0_5h', events: [{ type: 'alcohol', amount: 'beer', atHour: 0 }], scoreAtHour: 0.5 },
  { name: 'alcohol_beer_solo_rebound_3h', events: [{ type: 'alcohol', amount: 'beer', atHour: 0 }], scoreAtHour: 3 },
  { name: 'alcohol_beer_solo_gone_8h', events: [{ type: 'alcohol', amount: 'beer', atHour: 0 }], scoreAtHour: 8 },
  { name: 'alcohol_wine_and_shot_1h', events: [
    { type: 'alcohol', amount: 'wine', atHour: 0 },
    { type: 'alcohol', amount: 'shot', atHour: 0.25 },
  ], scoreAtHour: 1 },
  { name: 'alcohol_binge_session_6drinks', events: [
    { type: 'alcohol', amount: 'beer', atHour: 0 },
    { type: 'alcohol', amount: 'beer', atHour: 0.3 },
    { type: 'alcohol', amount: 'beer', atHour: 0.6 },
    { type: 'alcohol', amount: 'beer', atHour: 0.9 },
    { type: 'alcohol', amount: 'beer', atHour: 1.2 },
    { type: 'alcohol', amount: 'beer', atHour: 1.5 },
  ], scoreAtHour: 4 },

  { name: 'nicotine_pouch6_acute_0_5h', events: [{ type: 'nicotine', amount: 'pouch_6', atHour: 0 }], scoreAtHour: 0.5 },
  { name: 'nicotine_pouch6_rebound_3h', events: [{ type: 'nicotine', amount: 'pouch_6', atHour: 0 }], scoreAtHour: 3 },
  { name: 'nicotine_cigarette_1h', events: [{ type: 'nicotine', amount: 'cigarette', atHour: 0 }], scoreAtHour: 1 },
  { name: 'nicotine_vape_2h', events: [{ type: 'nicotine', amount: 'vape', atHour: 0 }], scoreAtHour: 2 },
  {
    name: 'nicotine_unknown_variant_defaults_3mg',
    events: [{ type: 'nicotine', amount: 'unknown_delivery', atHour: 0 }],
    scoreAtHour: 0.5,
  },

  // nap is DORMANT (commented out of TYPES) — must score as if absent.
  { name: 'nap_is_inactive_type', events: [{ type: 'nap', amount: 90, atHour: 0 }], scoreAtHour: 1 },

  {
    name: 'mixed_coffee_and_alcohol_8h',
    events: [
      { type: 'coffee', amount: 135, atHour: 0 },
      { type: 'coffee', amount: 135, atHour: 1 },
      { type: 'alcohol', amount: 'beer', atHour: 2 },
      { type: 'alcohol', amount: 'beer', atHour: 2.25 },
      { type: 'alcohol', amount: 'beer', atHour: 2.5 },
    ],
    scoreAtHour: 8,
  },
  {
    name: 'kitchen_sink_all_active_types',
    events: [
      { type: 'coffee', amount: 135, atHour: 0 },
      { type: 'energy_drink', amount: 'bang', atHour: 1 },
      { type: 'soda', amount: 'regular', atHour: 2 },
      { type: 'marijuana', amount: 15, atHour: 3 },
      { type: 'alcohol', amount: 'shot', atHour: 4 },
      { type: 'nicotine', amount: 'pouch_3', atHour: 5 },
    ],
    scoreAtHour: 6,
  },
  {
    name: 'many_events_72h_cutoff_boundary',
    events: [
      { type: 'coffee', amount: 135, atHour: -71 },
      { type: 'coffee', amount: 135, atHour: -73 },
    ],
    scoreAtHour: 0,
  },
];

const fixture = cases.map(({ name, events, scoreAtHour }) => {
  const jsEvents = events.map((e) => ({ type: e.type, amount: e.amount, time: new Date(T0 + e.atHour * 3600 * 1000) }));
  const scoreAtDate = new Date(T0 + scoreAtHour * 3600 * 1000);
  const result = scoreAt(jsEvents, scoreAtDate);
  return {
    name,
    events: events.map((e) => ({ type: e.type, amount: String(e.amount), atHour: e.atHour })),
    scoreAtHour,
    expectedScore: result.score,
    expectedByType: result.byType,
    expectedTotalPenalty: result.totalPenalty,
  };
});

const outPath = path.join(__dirname, '..', 'ios', 'DriftTests', 'Fixtures', 'DecayParityCases.json');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(fixture, null, 2) + '\n');
console.log(`Wrote ${fixture.length} parity cases to ${outPath}`);
