import {useCallback, useEffect, useRef, useState} from 'react';
import {Vibration} from 'react-native';
import {driveGuidance, nearestUnvisited} from './drive';
import type {DriveGuidance, DrivePhase} from './drive';
import type {DriveSettings} from './driveSettings';
import type {Position, SavedLocation} from './types';

const LIFTOFF_PATTERN = [0, 600, 250, 600];
const BRAKE_PATTERN = [0, 300, 120, 300, 120, 300];
const ARRIVED_PATTERN = [0, 150, 100, 150];

export type DriveSnapshot = {
  guidance: DriveGuidance | null;
  target: SavedLocation | null;
  distance: number;
};

const EMPTY: DriveSnapshot = {guidance: null, target: null, distance: 0};

type Base = {
  targetId: string;
  position: Position;
  time: number;
  distance: number;
  speedMs: number;
};

export function useDriveAlert(
  position: Position | null,
  locations: SavedLocation[],
  visitedIds: string[],
  settings: DriveSettings,
  muted: boolean,
  onArrive: (id: string) => void,
): DriveSnapshot {
  const [snapshot, setSnapshot] = useState<DriveSnapshot>(EMPTY);
  const base = useRef<Base | null>(null);
  const phase = useRef<DrivePhase>('cruise');
  const vibrating = useRef(false);
  const arrived = useRef<string[]>([]);

  const latest = useRef({
    position,
    locations,
    visitedIds,
    settings,
    muted,
    onArrive,
  });
  latest.current = {position, locations, visitedIds, settings, muted, onArrive};

  const stopVibration = useCallback(() => {
    if (vibrating.current) {
      Vibration.cancel();
      vibrating.current = false;
    }
  }, []);

  const updateVibration = useCallback(
    (next: DrivePhase) => {
      const {settings: current, muted: isMuted} = latest.current;
      const active = next === 'liftoff' || next === 'braking';

      if (!active || isMuted) {
        stopVibration();
        phase.current = next;
        return;
      }

      const pattern = next === 'braking' ? BRAKE_PATTERN : LIFTOFF_PATTERN;

      if (current.vibrationMode === 'once') {
        if (phase.current !== next) {
          Vibration.vibrate(pattern);
        }
        phase.current = next;
        return;
      }

      if (phase.current !== next || !vibrating.current) {
        if (vibrating.current) {
          Vibration.cancel();
        }
        Vibration.vibrate(pattern, true);
        vibrating.current = true;
      }
      phase.current = next;
    },
    [stopVibration],
  );

  const tick = useCallback(() => {
    const current = latest.current;

    if (!current.position) {
      base.current = null;
      stopVibration();
      setSnapshot(EMPTY);
      return;
    }

    const nearest = nearestUnvisited(
      current.position,
      current.locations,
      current.visitedIds,
    );

    if (!nearest) {
      base.current = null;
      stopVibration();
      setSnapshot(EMPTY);
      return;
    }

    const now = Date.now();
    const speedMs = current.position.speed ?? 0;
    const previous = base.current;
    const isNewFix =
      !previous ||
      previous.position !== current.position ||
      previous.targetId !== nearest.location.id;

    let distance: number;
    if (isNewFix) {
      distance = nearest.distance;
      base.current = {
        targetId: nearest.location.id,
        position: current.position,
        time: now,
        distance,
        speedMs,
      };
    } else {
      const elapsed = (now - previous.time) / 1000;
      distance = Math.max(0, previous.distance - previous.speedMs * elapsed);
    }

    const guidance = driveGuidance({
      distance,
      speedMs,
      deceleration: current.settings.deceleration,
    });

    setSnapshot({guidance, target: nearest.location, distance});
    updateVibration(guidance.phase);

    if (
      guidance.phase === 'arrived' &&
      !arrived.current.includes(nearest.location.id)
    ) {
      arrived.current.push(nearest.location.id);
      stopVibration();
      Vibration.vibrate(ARRIVED_PATTERN);
      base.current = null;
      current.onArrive(nearest.location.id);
    }
  }, [stopVibration, updateVibration]);

  useEffect(() => {
    tick();
  }, [position, visitedIds, locations, settings.deceleration, tick]);

  useEffect(() => {
    const id = setInterval(tick, 1000);
    return () => {
      clearInterval(id);
      Vibration.cancel();
    };
  }, [tick]);

  return snapshot;
}
