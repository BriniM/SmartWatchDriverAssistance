import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DEFAULT_DRIVE_SETTINGS,
  loadDriveSettings,
  saveDriveSettings,
} from '../src/driveSettings';

beforeEach(async () => {
  await AsyncStorage.clear();
});

test('returns defaults when nothing is stored', async () => {
  expect(await loadDriveSettings()).toEqual(DEFAULT_DRIVE_SETTINGS);
});

test('round-trips saved settings', async () => {
  await saveDriveSettings({deceleration: 1.5, vibrationMode: 'once'});
  expect(await loadDriveSettings()).toEqual({
    deceleration: 1.5,
    vibrationMode: 'once',
  });
});

test('falls back to defaults for invalid values', async () => {
  await AsyncStorage.setItem(
    '@hellowatch/drive-settings',
    JSON.stringify({deceleration: 'fast', vibrationMode: 'screaming'}),
  );

  expect(await loadDriveSettings()).toEqual(DEFAULT_DRIVE_SETTINGS);
});

test('recovers from malformed payloads', async () => {
  await AsyncStorage.setItem('@hellowatch/drive-settings', 'not json');

  expect(await loadDriveSettings()).toEqual(DEFAULT_DRIVE_SETTINGS);
});
