import React, {useEffect, useRef, useState} from 'react';
import {PermissionsAndroid, Platform, Vibration} from 'react-native';
import notifee, {AndroidImportance} from '@notifee/react-native';
import Geolocation from '@react-native-community/geolocation';
import HomeScreen from './src/screens/HomeScreen';
import SavedListScreen from './src/screens/SavedListScreen';
import MapScreen from './src/screens/MapScreen';
import DriveScreen from './src/screens/DriveScreen';
import {
  distanceMeters,
  getCurrentPosition,
  toPosition,
} from './src/geo';
import {
  addLocation,
  createSavedLocation,
  deleteLocation,
  loadLocations,
  updateLocation,
} from './src/storage';
import type {LatLng, Position, SavedLocation} from './src/types';

const TRACKING_CHANNEL_ID = 'location-tracking';
const TRACKING_NOTIFICATION_ID = 'location-tracking';
const PRESS_HAPTIC_PATTERN = [0, 400, 200, 400, 200, 450];

type Screen =
  | {name: 'home'}
  | {name: 'list'}
  | {name: 'drive'}
  | {name: 'map'; focusId?: string | null; fitAll?: boolean};

async function startTrackingService() {
  await notifee.requestPermission();

  const channelId = await notifee.createChannel({
    id: TRACKING_CHANNEL_ID,
    name: 'Location tracking',
    importance: AndroidImportance.LOW,
  });

  await notifee.displayNotification({
    id: TRACKING_NOTIFICATION_ID,
    title: 'Tracking location',
    body: 'Your GPS position is updating.',
    android: {
      channelId,
      asForegroundService: true,
      ongoing: true,
      onlyAlertOnce: true,
      pressAction: {id: 'default'},
    },
  });
}

async function requestLocationPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    const fine = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Location access',
        message: 'This app needs your location to display your GPS position.',
        buttonPositive: 'Allow',
      },
    );
    return fine === PermissionsAndroid.RESULTS.GRANTED;
  }

  return new Promise(resolve => {
    Geolocation.requestAuthorization(() => resolve(true), () => resolve(false));
  });
}

async function requestBackgroundLocation() {
  if (Platform.OS !== 'android' || Number(Platform.Version) < 29) {
    return;
  }

  const permission = PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION;
  if (!permission || (await PermissionsAndroid.check(permission))) {
    return;
  }

  await PermissionsAndroid.request(permission, {
    title: 'Background location',
    message:
      'Allow location all the time so your position keeps updating while the app is in the background.',
    buttonPositive: 'Allow',
  });
}

function App() {
  const [position, setPosition] = useState<Position | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [locations, setLocations] = useState<SavedLocation[]>([]);
  const [screen, setScreen] = useState<Screen>({name: 'home'});
  const [trackingReady, setTrackingReady] = useState(false);
  const lastFix = useRef<{latitude: number; longitude: number; time: number} | null>(
    null,
  );
  const driveActive = screen.name === 'drive';

  useEffect(() => {
    loadLocations().then(setLocations);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function setup() {
      Geolocation.setRNConfiguration({
        locationProvider: 'playServices',
        skipPermissionRequests: true,
        authorizationLevel: 'always',
        enableBackgroundLocationUpdates: true,
      });

      const allowed = await requestLocationPermission();
      if (!allowed) {
        if (!cancelled) {
          setGpsError('Location permission denied');
        }
        return;
      }

      await requestBackgroundLocation();

      try {
        const seed = await getCurrentPosition({
          enableHighAccuracy: false,
          maximumAge: 600000,
          timeout: 8000,
        });
        if (!cancelled) {
          setPosition(seed);
        }
      } catch {
        // The live watch below may still get a fix.
      }

      if (cancelled) {
        return;
      }

      await startTrackingService();

      if (!cancelled) {
        setTrackingReady(true);
      }
    }

    setup();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!trackingReady) {
      return;
    }

    const watchId = Geolocation.watchPosition(
      next => {
        const nextPosition = toPosition(next.coords);
        const now = Date.now();
        const previous = lastFix.current;
        if (nextPosition.speed == null && previous) {
          const seconds = (now - previous.time) / 1000;
          if (seconds > 0.5) {
            nextPosition.speed =
              distanceMeters(previous, nextPosition) / seconds;
          }
        }
        lastFix.current = {
          latitude: nextPosition.latitude,
          longitude: nextPosition.longitude,
          time: now,
        };
        setGpsError(null);
        setPosition(nextPosition);
      },
      () => {
        setGpsError(current => current ?? 'Waiting for GPS signal...');
      },
      driveActive
        ? {
            enableHighAccuracy: true,
            interval: 1000,
            fastestInterval: 500,
            distanceFilter: 1,
          }
        : {
            enableHighAccuracy: true,
            interval: 2000,
            fastestInterval: 1000,
            distanceFilter: 5,
          },
    );

    return () => {
      Geolocation.clearWatch(watchId);
    };
  }, [trackingReady, driveActive]);

  async function handleSave() {
    if (!position) {
      return;
    }
    Vibration.vibrate(PRESS_HAPTIC_PATTERN);
    const next = await addLocation(createSavedLocation(position));
    setLocations(next);
  }

  async function handleDelete(id: string) {
    setLocations(await deleteLocation(id));
  }

  async function handleMove(id: string, coords: LatLng) {
    setLocations(
      await updateLocation(id, {
        latitude: coords.latitude,
        longitude: coords.longitude,
      }),
    );
  }

  if (screen.name === 'list') {
    return (
      <SavedListScreen
        locations={locations}
        current={position}
        onBack={() => setScreen({name: 'home'})}
        onOpenOnMap={id => setScreen({name: 'map', focusId: id})}
        onViewAllOnMap={() => setScreen({name: 'map', fitAll: true})}
        onDelete={handleDelete}
      />
    );
  }

  if (screen.name === 'drive') {
    return (
      <DriveScreen
        position={position}
        locations={locations}
        onExit={() => setScreen({name: 'home'})}
      />
    );
  }

  if (screen.name === 'map') {
    return (
      <MapScreen
        locations={locations}
        current={position}
        focusId={screen.focusId}
        fitAll={screen.fitAll}
        onBack={() =>
          setScreen(
            screen.focusId || screen.fitAll ? {name: 'list'} : {name: 'home'},
          )
        }
        onMove={handleMove}
        onDelete={handleDelete}
      />
    );
  }

  return (
    <HomeScreen
      position={position}
      gpsError={gpsError}
      savedCount={locations.length}
      onSave={handleSave}
      onOpenSaved={() => setScreen({name: 'list'})}
      onOpenMap={() => setScreen({name: 'map', fitAll: true})}
      onOpenDrive={() => setScreen({name: 'drive'})}
    />
  );
}

export default App;
