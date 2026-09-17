import AsyncStorage from '@react-native-async-storage/async-storage';
import type {Position, SavedLocation} from './types';

const STORAGE_KEY = '@hellowatch/locations';

export async function loadLocations(): Promise<SavedLocation[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(
      (item): item is SavedLocation =>
        item != null &&
        typeof item.id === 'string' &&
        typeof item.latitude === 'number' &&
        typeof item.longitude === 'number',
    );
  } catch {
    return [];
  }
}

async function persist(locations: SavedLocation[]): Promise<SavedLocation[]> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(locations));
  return locations;
}

export function createSavedLocation(
  position: Position,
  label?: string,
): SavedLocation {
  return {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    latitude: position.latitude,
    longitude: position.longitude,
    accuracy: position.accuracy,
    precise: position.precise,
    createdAt: Date.now(),
    label: label ?? formatDefaultLabel(Date.now()),
  };
}

function formatDefaultLabel(timestamp: number): string {
  const date = new Date(timestamp);
  const time = date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `Saved ${time}`;
}

export async function addLocation(
  location: SavedLocation,
): Promise<SavedLocation[]> {
  const locations = await loadLocations();
  return persist([location, ...locations]);
}

export async function updateLocation(
  id: string,
  patch: Partial<SavedLocation>,
): Promise<SavedLocation[]> {
  const locations = await loadLocations();
  return persist(
    locations.map(location =>
      location.id === id ? {...location, ...patch} : location,
    ),
  );
}

export async function deleteLocation(id: string): Promise<SavedLocation[]> {
  const locations = await loadLocations();
  return persist(locations.filter(location => location.id !== id));
}
