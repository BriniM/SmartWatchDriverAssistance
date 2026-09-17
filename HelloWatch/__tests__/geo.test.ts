import {
  distanceMeters,
  formatDistance,
  formatSpeed,
  speedKmh,
  toPosition,
} from '../src/geo';

describe('distanceMeters', () => {
  test('is zero for the same point', () => {
    expect(distanceMeters({latitude: 48.85, longitude: 2.29}, {latitude: 48.85, longitude: 2.29})).toBe(0);
  });

  test('measures one degree of longitude at the equator', () => {
    const meters = distanceMeters(
      {latitude: 0, longitude: 0},
      {latitude: 0, longitude: 1},
    );
    expect(meters).toBeCloseTo(111194.9, 0);
  });

  test('measures the distance between Paris and London', () => {
    const meters = distanceMeters(
      {latitude: 48.8566, longitude: 2.3522},
      {latitude: 51.5074, longitude: -0.1278},
    );
    expect(meters).toBeGreaterThan(340000);
    expect(meters).toBeLessThan(345000);
  });
});

describe('formatDistance', () => {
  test('uses meters below one kilometer', () => {
    expect(formatDistance(0)).toBe('0 m');
    expect(formatDistance(540.4)).toBe('540 m');
  });

  test('uses two decimals for short distances', () => {
    expect(formatDistance(1500)).toBe('1.50 km');
  });

  test('uses one decimal for long distances', () => {
    expect(formatDistance(15234)).toBe('15.2 km');
  });
});

describe('speed', () => {
  test('converts meters per second to km/h', () => {
    expect(speedKmh(10)).toBeCloseTo(36);
    expect(speedKmh(null)).toBeNull();
  });

  test('formats speed for display', () => {
    expect(formatSpeed(2.5)).toBe('9.0 km/h');
    expect(formatSpeed(null)).toBe('—');
  });
});

describe('toPosition', () => {
  test('marks precise fixes and keeps speed', () => {
    const position = toPosition({
      latitude: 1,
      longitude: 2,
      accuracy: 12,
      speed: 3,
    });

    expect(position).toMatchObject({
      latitude: 1,
      longitude: 2,
      precise: true,
      speed: 3,
    });
  });

  test('drops negative speed and marks approximate fixes', () => {
    const position = toPosition({
      latitude: 1,
      longitude: 2,
      accuracy: null,
      speed: -1,
    });

    expect(position.precise).toBe(false);
    expect(position.speed).toBeNull();
  });
});
