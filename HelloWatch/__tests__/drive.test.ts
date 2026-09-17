import {
  ARRIVAL_RADIUS_M,
  TARGET_SPEED_MS,
  brakingDistance,
  driveGuidance,
  estimatedArrivalSeconds,
  nearestUnvisited,
  timeToLiftoff,
} from '../src/drive';
import type {SavedLocation} from '../src/types';

const SPEED_50_KMH = 50 / 3.6;

describe('brakingDistance', () => {
  test('computes the distance to shed speed down to the target', () => {
    expect(brakingDistance(SPEED_50_KMH)).toBeCloseTo(162.04, 1);
  });

  test('is zero when already at or below the target speed', () => {
    expect(brakingDistance(4)).toBe(0);
    expect(brakingDistance(TARGET_SPEED_MS)).toBe(0);
  });
});

describe('timeToLiftoff', () => {
  test('counts the cruise time before the braking point', () => {
    expect(timeToLiftoff(262.04, SPEED_50_KMH)).toBeCloseTo(7.2, 1);
  });

  test('is zero once inside the braking distance', () => {
    expect(timeToLiftoff(100, SPEED_50_KMH)).toBe(0);
  });

  test('is zero when stopped', () => {
    expect(timeToLiftoff(500, 0)).toBe(0);
  });
});

describe('estimatedArrivalSeconds', () => {
  test('adds cruise and braking time', () => {
    expect(estimatedArrivalSeconds(262.04, SPEED_50_KMH)).toBeCloseTo(23.87, 1);
  });
});

describe('driveGuidance phases', () => {
  test('arrives within the arrival radius', () => {
    expect(driveGuidance({distance: 20, speedMs: SPEED_50_KMH}).phase).toBe(
      'arrived',
    );
    expect(
      driveGuidance({distance: ARRIVAL_RADIUS_M - 1, speedMs: SPEED_50_KMH})
        .phase,
    ).toBe('arrived');
  });

  test('clears when already below target speed', () => {
    expect(driveGuidance({distance: 500, speedMs: 4}).phase).toBe('clear');
  });

  test('cruises while still outside the braking distance', () => {
    expect(driveGuidance({distance: 300, speedMs: SPEED_50_KMH}).phase).toBe(
      'cruise',
    );
  });

  test('signals lift-off just past the braking point', () => {
    const guidance = driveGuidance({distance: 140, speedMs: SPEED_50_KMH});
    expect(guidance.phase).toBe('liftoff');
    expect(guidance.requiredDeceleration).toBeLessThanOrEqual(0.75);
  });

  test('escalates to braking when too late', () => {
    const guidance = driveGuidance({distance: 100, speedMs: SPEED_50_KMH});
    expect(guidance.phase).toBe('braking');
    expect(guidance.requiredDeceleration).toBeGreaterThan(0.75);
  });

  test('respects a custom deceleration setting', () => {
    const gentle = driveGuidance({
      distance: 140,
      speedMs: SPEED_50_KMH,
      deceleration: 0.5,
    });
    const firm = driveGuidance({
      distance: 140,
      speedMs: SPEED_50_KMH,
      deceleration: 1.5,
    });
    expect(gentle.phase).toBe('liftoff');
    expect(firm.phase).toBe('cruise');
  });
});

describe('nearestUnvisited', () => {
  const locations: SavedLocation[] = [
    {
      id: 'a',
      latitude: 0.01,
      longitude: 0,
      accuracy: 5,
      precise: true,
      createdAt: 0,
      label: 'A',
    },
    {
      id: 'b',
      latitude: 0.002,
      longitude: 0,
      accuracy: 5,
      precise: true,
      createdAt: 0,
      label: 'B',
    },
  ];

  test('picks the closest saved location', () => {
    const result = nearestUnvisited({latitude: 0, longitude: 0}, locations, []);
    expect(result?.location.id).toBe('b');
  });

  test('skips visited locations', () => {
    const result = nearestUnvisited({latitude: 0, longitude: 0}, locations, [
      'b',
    ]);
    expect(result?.location.id).toBe('a');
  });

  test('returns null when everything is visited', () => {
    expect(
      nearestUnvisited({latitude: 0, longitude: 0}, locations, ['a', 'b']),
    ).toBeNull();
  });
});
