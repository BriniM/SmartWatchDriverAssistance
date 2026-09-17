import AsyncStorage from '@react-native-async-storage/async-storage';
import {DEFAULT_DECELERATION} from './drive';

export type VibrationMode = 'repeat' | 'once';

export type DriveSettings = {
  deceleration: number;
  vibrationMode: VibrationMode;
};

export const DEFAULT_DRIVE_SETTINGS: DriveSettings = {
  deceleration: DEFAULT_DECELERATION,
  vibrationMode: 'repeat',
};

const STORAGE_KEY = '@hellowatch/drive-settings';

export async function loadDriveSettings(): Promise<DriveSettings> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return DEFAULT_DRIVE_SETTINGS;
  }

  try {
    const parsed = JSON.parse(raw);
    return {
      deceleration:
        typeof parsed?.deceleration === 'number'
          ? parsed.deceleration
          : DEFAULT_DRIVE_SETTINGS.deceleration,
      vibrationMode:
        parsed?.vibrationMode === 'once' ||
        parsed?.vibrationMode === 'repeat'
          ? parsed.vibrationMode
          : DEFAULT_DRIVE_SETTINGS.vibrationMode,
    };
  } catch {
    return DEFAULT_DRIVE_SETTINGS;
  }
}

export async function saveDriveSettings(
  settings: DriveSettings,
): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
