import {distanceMeters} from './geo';
import type {LatLng, SavedLocation} from './types';

export const TARGET_SPEED_KMH = 20;
export const TARGET_SPEED_MS = TARGET_SPEED_KMH / 3.6;
export const ARRIVAL_RADIUS_M = 20;
export const DEFAULT_DECELERATION = 0.5;
export const DECELERATION_OPTIONS = [0.3, 0.5, 1, 1.5];

export type DrivePhase =
  | 'cruise'
  | 'liftoff'
  | 'braking'
  | 'arrived'
  | 'clear';

export type DriveGuidance = {
  phase: DrivePhase;
  distance: number;
  speedMs: number;
  speedKmh: number;
  targetSpeedKmh: number;
  brakingDistance: number;
  timeToLiftoff: number;
  arrivalSeconds: number;
  requiredDeceleration: number;
};

export type DriveInput = {
  distance: number;
  speedMs: number;
  deceleration?: number;
  targetSpeedMs?: number;
  arrivalRadius?: number;
};

export function brakingDistance(
  speedMs: number,
  targetSpeedMs: number = TARGET_SPEED_MS,
  deceleration: number = DEFAULT_DECELERATION,
): number {
  if (deceleration <= 0) {
    return 0;
  }
  const delta = speedMs * speedMs - targetSpeedMs * targetSpeedMs;
  return delta <= 0 ? 0 : delta / (2 * deceleration);
}

export function timeToLiftoff(
  distance: number,
  speedMs: number,
  targetSpeedMs: number = TARGET_SPEED_MS,
  deceleration: number = DEFAULT_DECELERATION,
): number {
  const brake = brakingDistance(speedMs, targetSpeedMs, deceleration);
  const cruise = Math.max(distance - brake, 0);
  if (speedMs <= 0) {
    return 0;
  }
  return cruise / speedMs;
}

export function estimatedArrivalSeconds(
  distance: number,
  speedMs: number,
  targetSpeedMs: number = TARGET_SPEED_MS,
  deceleration: number = DEFAULT_DECELERATION,
): number {
  const brake = brakingDistance(speedMs, targetSpeedMs, deceleration);
  const cruise = Math.max(distance - brake, 0);
  const cruiseSeconds = speedMs > 0 ? cruise / speedMs : 0;
  const brakeSeconds =
    speedMs > targetSpeedMs && deceleration > 0
      ? (speedMs - targetSpeedMs) / deceleration
      : 0;
  return cruiseSeconds + brakeSeconds;
}

export function driveGuidance({
  distance,
  speedMs,
  deceleration = DEFAULT_DECELERATION,
  targetSpeedMs = TARGET_SPEED_MS,
  arrivalRadius = ARRIVAL_RADIUS_M,
}: DriveInput): DriveGuidance {
  const brake = brakingDistance(speedMs, targetSpeedMs, deceleration);
  const requiredDeceleration =
    distance > 0 && speedMs > targetSpeedMs
      ? (speedMs * speedMs - targetSpeedMs * targetSpeedMs) / (2 * distance)
      : 0;

  let phase: DrivePhase;
  if (distance <= arrivalRadius) {
    phase = 'arrived';
  } else if (speedMs <= targetSpeedMs) {
    phase = 'clear';
  } else if (distance > brake) {
    phase = 'cruise';
  } else if (requiredDeceleration <= deceleration * 1.5) {
    phase = 'liftoff';
  } else {
    phase = 'braking';
  }

  return {
    phase,
    distance,
    speedMs,
    speedKmh: speedMs * 3.6,
    targetSpeedKmh: targetSpeedMs * 3.6,
    brakingDistance: brake,
    timeToLiftoff: timeToLiftoff(distance, speedMs, targetSpeedMs, deceleration),
    arrivalSeconds: estimatedArrivalSeconds(
      distance,
      speedMs,
      targetSpeedMs,
      deceleration,
    ),
    requiredDeceleration,
  };
}

export function nearestUnvisited(
  current: LatLng,
  locations: SavedLocation[],
  visitedIds: string[],
): {location: SavedLocation; distance: number} | null {
  let best: {location: SavedLocation; distance: number} | null = null;

  for (const location of locations) {
    if (visitedIds.includes(location.id)) {
      continue;
    }
    const distance = distanceMeters(current, location);
    if (!best || distance < best.distance) {
      best = {location, distance};
    }
  }

  return best;
}
