import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  addLocation,
  createSavedLocation,
  deleteLocation,
  loadLocations,
  updateLocation,
} from '../src/storage';
import type {Position} from '../src/types';

const position: Position = {
  latitude: 37.4219983,
  longitude: -122.084,
  accuracy: 12,
  precise: true,
  speed: 1.5,
};

beforeEach(async () => {
  await AsyncStorage.clear();
});

test('returns an empty list when nothing is stored', async () => {
  expect(await loadLocations()).toEqual([]);
});

test('adds a location and persists it', async () => {
  const saved = createSavedLocation(position, 'Home');
  const list = await addLocation(saved);

  expect(list).toHaveLength(1);
  expect(await loadLocations()).toEqual([saved]);
});

test('creates a location from a position', () => {
  const saved = createSavedLocation(position, 'Home');

  expect(saved).toMatchObject({
    latitude: position.latitude,
    longitude: position.longitude,
    precise: true,
    label: 'Home',
  });
  expect(saved.id).toEqual(expect.any(String));
  expect(saved.createdAt).toEqual(expect.any(Number));
});

test('updates a location', async () => {
  const saved = createSavedLocation(position, 'Home');
  await addLocation(saved);

  const list = await updateLocation(saved.id, {latitude: 1, longitude: 2});

  expect(list[0]).toMatchObject({id: saved.id, latitude: 1, longitude: 2});
  expect(await loadLocations()).toEqual(list);
});

test('deletes a location', async () => {
  const saved = createSavedLocation(position, 'Home');
  await addLocation(saved);

  expect(await deleteLocation(saved.id)).toEqual([]);
  expect(await loadLocations()).toEqual([]);
});

test('ignores malformed payloads', async () => {
  await AsyncStorage.setItem(
    '@hellowatch/locations',
    JSON.stringify([{foo: 'bar'}]),
  );

  expect(await loadLocations()).toEqual([]);
});
