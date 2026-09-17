import Geolocation, {
  GeolocationOptions,
} from '@react-native-community/geolocation';
import type {Coords, LatLng, Position} from './types';

export const PRECISE_ACCURACY_M = 50;
const EARTH_RADIUS_M = 6371000;

type RawCoords = Coords & {
  speed?: number | null;
};

export function toPosition(coords: RawCoords): Position {
  return {
    latitude: coords.latitude,
    longitude: coords.longitude,
    accuracy: coords.accuracy,
    precise: coords.accuracy != null && coords.accuracy <= PRECISE_ACCURACY_M,
    speed: coords.speed != null && coords.speed >= 0 ? coords.speed : null,
  };
}

export function getCurrentPosition(
  options: GeolocationOptions,
): Promise<Position> {
  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      position => resolve(toPosition(position.coords)),
      error => reject(error),
      options,
    );
  });
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function distanceMeters(from: LatLng, to: LatLng): number {
  const deltaLat = toRadians(to.latitude - from.latitude);
  const deltaLng = toRadians(to.longitude - from.longitude);
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;

  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(Math.sqrt(a), 1));
}

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  if (meters < 10000) {
    return `${(meters / 1000).toFixed(2)} km`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

export function speedKmh(speed: number | null): number | null {
  return speed == null ? null : speed * 3.6;
}

export function formatSpeed(speed: number | null): string {
  const kmh = speedKmh(speed);
  return kmh == null ? '—' : `${kmh.toFixed(1)} km/h`;
}

export function formatCoords(coords: {latitude: number; longitude: number}) {
  return `X ${coords.longitude.toFixed(6)}  Y ${coords.latitude.toFixed(6)}`;
}

export function formatTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}
