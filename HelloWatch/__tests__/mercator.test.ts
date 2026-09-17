import {
  clampZoom,
  fitBounds,
  latToWorldY,
  lngToWorldX,
  tileUrl,
  worldXToLng,
  worldYToLat,
} from '../src/mercator';

test('maps the origin at zoom 0 to the middle of the tile world', () => {
  expect(lngToWorldX(0, 0)).toBeCloseTo(128);
  expect(latToWorldY(0, 0)).toBeCloseTo(128);
});

test('round-trips longitude and latitude', () => {
  const zoom = 12;
  const latitude = 48.8584;
  const longitude = 2.2945;

  expect(worldYToLat(latToWorldY(latitude, zoom), zoom)).toBeCloseTo(
    latitude,
    6,
  );
  expect(worldXToLng(lngToWorldX(longitude, zoom), zoom)).toBeCloseTo(
    longitude,
    6,
  );
});

test('clamps zoom to the supported range', () => {
  expect(clampZoom(0)).toBe(3);
  expect(clampZoom(25)).toBe(19);
  expect(clampZoom(14)).toBe(14);
});

test('builds an OSM tile url', () => {
  expect(tileUrl(10, 3, 4)).toBe('https://tile.openstreetmap.org/10/3/4.png');
});

describe('fitBounds', () => {
  test('returns null without points', () => {
    expect(fitBounds([], 400, 400, 40)).toBeNull();
  });

  test('centers a single point at the max zoom', () => {
    const result = fitBounds(
      [{latitude: 48.8584, longitude: 2.2945}],
      400,
      400,
      40,
    );

    expect(result).not.toBeNull();
    expect(result?.zoom).toBe(16);
    expect(result?.center.latitude).toBeCloseTo(48.8584, 6);
    expect(result?.center.longitude).toBeCloseTo(2.2945, 6);
  });

  test('fits multiple points inside the viewport', () => {
    const points = [
      {latitude: 48.8584, longitude: 2.2945},
      {latitude: 48.86, longitude: 2.32},
      {latitude: 48.85, longitude: 2.28},
    ];
    const result = fitBounds(points, 400, 400, 40);

    expect(result).not.toBeNull();
    const {center, zoom} = result!;
    expect(center.latitude).toBeGreaterThan(48.85);
    expect(center.latitude).toBeLessThan(48.86);

    const spanX = lngToWorldX(2.32, zoom) - lngToWorldX(2.28, zoom);
    const spanY = latToWorldY(48.85, zoom) - latToWorldY(48.86, zoom);
    expect(spanX).toBeLessThanOrEqual(400 - 80);
    expect(spanY).toBeLessThanOrEqual(400 - 80);
  });
});
