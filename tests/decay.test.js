const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const {
  hoursSince, caffeineDecay, DECAY, eventsNear, scoreAt, interpret, categoryCosts, topContributors,
} = require('../js/decay.js');

const t0 = new Date('2026-01-01T00:00:00.000Z');
const hoursAfter = (h) => new Date(t0.getTime() + h * 3600 * 1000);

describe('hoursSince', () => {
  test('is 0 at the event time and positive after', () => {
    assert.equal(hoursSince(t0, t0), 0);
    assert.equal(hoursSince(t0, hoursAfter(3)), 3);
  });

  test('is negative before the event', () => {
    assert.equal(hoursSince(t0, hoursAfter(-2)), -2);
  });
});

describe('caffeineDecay', () => {
  test('is 0 before the event happens', () => {
    assert.equal(caffeineDecay(135, -1), 0);
  });

  test('halves the effective remaining mg every 5 hours', () => {
    const at0 = caffeineDecay(200, 0);
    const at5 = caffeineDecay(200, 5);
    // remainingMg halves exactly; penalty is linear in remainingMg above the
    // 20mg floor, so this only holds while both samples are above the floor.
    assert.ok(at0 > at5);
    assert.equal(Math.round((200 - 20) * 0.4), Math.round(at0));
  });

  test('floors out at 0 once remaining mg drops below the 20mg floor', () => {
    assert.equal(caffeineDecay(15, 0), 0);
    assert.equal(caffeineDecay(135, 100), 0);
  });
});

describe('DECAY curves', () => {
  test('coffee and plain caffeine share the caffeine curve', () => {
    const coffee = DECAY.coffee({ amount: 135, time: t0 }, hoursAfter(2));
    const caffeine = DECAY.caffeine({ amount: 135, time: t0 }, hoursAfter(2));
    assert.equal(coffee, caffeine);
    assert.equal(coffee, caffeineDecay(135, 2));
  });

  test('energy_drink looks up mg by variant, defaulting to 160 for unknown values', () => {
    const celsius = DECAY.energy_drink({ amount: 'celsius', time: t0 }, hoursAfter(1));
    const redBull = DECAY.energy_drink({ amount: 'red_bull', time: t0 }, hoursAfter(1));
    const unknown = DECAY.energy_drink({ amount: 'not_a_real_brand', time: t0 }, hoursAfter(1));
    assert.equal(celsius, caffeineDecay(200, 1));
    assert.equal(redBull, caffeineDecay(80, 1));
    assert.equal(unknown, caffeineDecay(160, 1));
    assert.ok(celsius > redBull, 'celsius (200mg) should carry a bigger penalty than red bull (80mg)');
  });

  test('soda looks up mg by variant', () => {
    assert.equal(DECAY.soda({ amount: 'diet', time: t0 }, hoursAfter(1)), caffeineDecay(46, 1));
    assert.equal(DECAY.soda({ amount: 'regular', time: t0 }, hoursAfter(1)), caffeineDecay(34, 1));
  });

  test('marijuana scales linearly with mg and decays with a 7h half-life', () => {
    const p0 = DECAY.marijuana({ amount: 10, time: t0 }, t0);
    const p7 = DECAY.marijuana({ amount: 10, time: t0 }, hoursAfter(7));
    assert.equal(p0, 200); // 10 * 20
    assert.ok(Math.abs(p7 - p0 / 2) < 1e-9);
  });

  test('marijuana is 0 before the event', () => {
    assert.equal(DECAY.marijuana({ amount: 10, time: t0 }, hoursAfter(-1)), 0);
  });

  describe('alcohol', () => {
    test('every standard-drink variant (beer/wine/shot) shares one curve', () => {
      const beer = DECAY.alcohol({ amount: 'beer', time: t0 }, hoursAfter(0.5));
      const wine = DECAY.alcohol({ amount: 'wine', time: t0 }, hoursAfter(0.5));
      const shot = DECAY.alcohol({ amount: 'shot', time: t0 }, hoursAfter(0.5));
      assert.equal(beer, wine);
      assert.equal(wine, shot);
    });

    test('has an active phase and a separate rebound phase', () => {
      const active = DECAY.alcohol({ amount: 'beer', time: t0 }, hoursAfter(0.5));
      const rebound = DECAY.alcohol({ amount: 'beer', time: t0 }, hoursAfter(3));
      const goneByH8 = DECAY.alcohol({ amount: 'beer', time: t0 }, hoursAfter(8));
      assert.ok(active > 0);
      assert.ok(rebound > 0);
      assert.equal(goneByH8, 0);
    });

    test('multiple drinks in one session overlap and add up', () => {
      const events = [
        { type: 'alcohol', amount: 'beer', time: t0 },
        { type: 'alcohol', amount: 'beer', time: hoursAfter(0.25) },
        { type: 'alcohol', amount: 'beer', time: hoursAfter(0.5) },
      ];
      const single = scoreAt([events[0]], hoursAfter(1)).totalPenalty;
      const triple = scoreAt(events, hoursAfter(1)).totalPenalty;
      assert.ok(triple > single * 2, 'three overlapping drinks should cost noticeably more than one');
    });
  });

  describe('nicotine', () => {
    test('defaults to 3mg for an unrecognized delivery method', () => {
      const known = DECAY.nicotine({ amount: 'pouch_3', time: t0 }, hoursAfter(0.1));
      const unknown = DECAY.nicotine({ amount: 'unknown_method', time: t0 }, hoursAfter(0.1));
      assert.equal(known, unknown);
    });

    test('acute phase gives way to a separate withdrawal rebound', () => {
      const acute = DECAY.nicotine({ amount: 'pouch_6', time: t0 }, hoursAfter(0.5));
      const rebound = DECAY.nicotine({ amount: 'pouch_6', time: t0 }, hoursAfter(3));
      assert.ok(acute > 0);
      assert.ok(rebound > 0);
    });

    test('is 0 before the event', () => {
      assert.equal(DECAY.nicotine({ amount: 'pouch_6', time: t0 }, hoursAfter(-0.5)), 0);
    });
  });

  describe('nap', () => {
    test('a power nap (<=25min) carries no penalty', () => {
      const event = { amount: 20, time: new Date('2026-01-01T10:00:00') };
      assert.equal(DECAY.nap(event, new Date(event.time.getTime() + 30 * 60 * 1000)), 0);
    });

    test('penalty grows with nap length past 25 minutes', () => {
      const shortNap = { amount: 40, time: new Date('2026-01-01T10:00:00') };
      const longNap = { amount: 80, time: new Date('2026-01-01T10:00:00') };
      const shortP = DECAY.nap(shortNap, new Date(shortNap.time.getTime() + 5 * 60 * 1000));
      const longP = DECAY.nap(longNap, new Date(longNap.time.getTime() + 5 * 60 * 1000));
      assert.ok(longP > shortP);
    });

    test('late-afternoon naps are penalized more than the same nap at midday', () => {
      const midday = { amount: 60, time: new Date('2026-01-01T12:00:00') };
      const late = { amount: 60, time: new Date('2026-01-01T17:00:00') };
      const middayP = DECAY.nap(midday, new Date(midday.time.getTime() + 5 * 60 * 1000));
      const lateP = DECAY.nap(late, new Date(late.time.getTime() + 5 * 60 * 1000));
      assert.ok(lateP > middayP);
    });

    test('fades to 0 after 10 hours', () => {
      const event = { amount: 90, time: new Date('2026-01-01T12:00:00') };
      assert.equal(DECAY.nap(event, new Date(event.time.getTime() + 11 * 3600 * 1000)), 0);
    });
  });
});

describe('eventsNear', () => {
  test('drops events older than the cutoff (default 72h)', () => {
    const events = [
      { type: 'coffee', amount: 100, time: hoursAfter(-100) },
      { type: 'coffee', amount: 100, time: hoursAfter(-1) },
    ];
    const near = eventsNear(events, t0);
    assert.equal(near.length, 1);
    assert.equal(near[0].time.getTime(), hoursAfter(-1).getTime());
  });

  test('honors a custom window', () => {
    const events = [{ type: 'coffee', amount: 100, time: hoursAfter(-10) }];
    assert.equal(eventsNear(events, t0, 5).length, 0);
    assert.equal(eventsNear(events, t0, 20).length, 1);
  });
});

describe('scoreAt', () => {
  test('is 100 with no events', () => {
    assert.equal(scoreAt([], t0).score, 100);
  });

  test('clamps to [0, 100]', () => {
    const massiveEvent = [{ type: 'marijuana', amount: 1000, time: t0 }];
    assert.equal(scoreAt(massiveEvent, hoursAfter(0.1)).score, 0);
  });

  test('gates on TYPES (active types only) even though DECAY has every curve ever written', () => {
    // "nap" has a real DECAY function but is commented out of TYPES — a
    // logged nap event should not affect the score at all.
    const events = [{ type: 'nap', amount: 90, time: t0 }];
    const result = scoreAt(events, hoursAfter(0.1));
    assert.equal(result.score, 100);
    assert.equal(result.totalPenalty, 0);
    assert.deepEqual(result.byType, {});
  });

  test('sums penalties across multiple active types', () => {
    const events = [
      { type: 'coffee', amount: 135, time: t0 },
      { type: 'alcohol', amount: 'beer', time: t0 },
    ];
    const result = scoreAt(events, hoursAfter(1));
    assert.ok(result.byType.coffee > 0);
    assert.ok(result.byType.alcohol > 0);
    assert.equal(
      Math.round(result.totalPenalty * 1e6),
      Math.round((result.byType.coffee + result.byType.alcohol) * 1e6)
    );
  });
});

describe('interpret', () => {
  test('Clean band has no attribution text even with minor contributors', () => {
    const result = interpret(90, { coffee: 2 });
    assert.equal(result.word, 'Clean');
    assert.ok(!result.feel.includes('—'));
  });

  test('bands are ordered by descending score threshold', () => {
    assert.equal(interpret(100, null).word, 'Clean');
    assert.equal(interpret(85, null).word, 'Clean');
    assert.equal(interpret(84.9, null).word, 'Mostly clear');
    assert.equal(interpret(70, null).word, 'Mostly clear');
    assert.equal(interpret(69.9, null).word, 'Some interference');
    assert.equal(interpret(50, null).word, 'Some interference');
    assert.equal(interpret(49.9, null).word, 'Disrupted');
    assert.equal(interpret(30, null).word, 'Disrupted');
    assert.equal(interpret(29.9, null).word, 'Heavily disrupted');
    assert.equal(interpret(0, null).word, 'Heavily disrupted');
  });

  test('attributes a disrupted score to its single dominant contributor', () => {
    const result = interpret(40, { coffee: 60 });
    assert.equal(result.word, 'Disrupted');
    assert.match(result.feel, /caffeine/);
  });

  test('attributes to two contributors when both are within 60% of the top one', () => {
    const result = interpret(20, { coffee: 40, alcohol: 30 });
    assert.match(result.feel, /caffeine/);
    assert.match(result.feel, /alcohol/);
  });

  test('drops a minor contributor that is well below the dominant one', () => {
    const result = interpret(40, { coffee: 60, nicotine: 1 });
    assert.match(result.feel, /caffeine/);
    assert.doesNotMatch(result.feel, /nicotine/);
  });
});

describe('categoryCosts / topContributors', () => {
  test('categoryCosts sums the caffeine family into one bucket', () => {
    const byType = { coffee: 5, energy_drink: 3, soda: 2, caffeine: 1 };
    const costs = categoryCosts(byType);
    const caffeine = costs.find((c) => c.label === 'Caffeine');
    assert.equal(caffeine.cost, 11);
  });

  test('topContributors ignores trace amounts under 0.5', () => {
    const contributors = topContributors({ coffee: 0.2 });
    assert.equal(contributors.length, 0);
  });
});
