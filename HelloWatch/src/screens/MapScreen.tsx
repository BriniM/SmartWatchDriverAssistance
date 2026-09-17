import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import OsmMap, {MapMarker} from '../components/OsmMap';
import {distanceMeters, formatDistance} from '../geo';
import {clampZoom, fitBounds} from '../mercator';
import {useRotary} from '../rotary';
import {colors} from '../theme';
import type {LatLng, Position, SavedLocation} from '../types';

type Props = {
  locations: SavedLocation[];
  current: Position | null;
  focusId?: string | null;
  fitAll?: boolean;
  onBack: () => void;
  onMove: (id: string, coords: LatLng) => void;
  onDelete: (id: string) => void;
};

const DEFAULT_CENTER: LatLng = {latitude: 0, longitude: 0};
const FOCUS_ZOOM = 15;
const FIT_PADDING = 60;

export default function MapScreen({
  locations,
  current,
  focusId,
  fitAll,
  onBack,
  onMove,
  onDelete,
}: Props) {
  const {width, height} = useWindowDimensions();
  const [center, setCenter] = useState<LatLng>(DEFAULT_CENTER);
  const [zoom, setZoom] = useState(2);
  const [selectedId, setSelectedId] = useState<string | null>(focusId ?? null);
  const [relocatingId, setRelocatingId] = useState<string | null>(null);
  const initialized = useRef(false);

  useRotary(step => {
    setZoom(value => clampZoom(value + step));
  });

  useEffect(() => {
    if (initialized.current) {
      return;
    }
    if (fitAll && locations.length > 0) {
      const fit = fitBounds(locations, width, height, FIT_PADDING);
      if (fit) {
        setCenter(fit.center);
        setZoom(fit.zoom);
        initialized.current = true;
        return;
      }
    }
    const focus = focusId
      ? locations.find(location => location.id === focusId)
      : undefined;
    const target = focus ?? current ?? locations[0];
    if (target) {
      setCenter({latitude: target.latitude, longitude: target.longitude});
      setZoom(FOCUS_ZOOM);
      initialized.current = true;
    }
  }, [fitAll, focusId, locations, current, width, height]);

  const selected = useMemo(
    () => locations.find(location => location.id === selectedId) ?? null,
    [locations, selectedId],
  );

  const relocating = relocatingId !== null;
  const selectedDistance =
    current && selected ? distanceMeters(current, selected) : null;

  const markers = useMemo(() => {
    const list: MapMarker[] = locations
      .filter(location => location.id !== relocatingId)
      .map(location => ({
        id: location.id,
        latitude: location.latitude,
        longitude: location.longitude,
        kind: 'saved' as const,
      }));
    if (current) {
      list.push({
        id: 'current',
        latitude: current.latitude,
        longitude: current.longitude,
        kind: 'current',
      });
    }
    return list;
  }, [locations, current, relocatingId]);

  function startRelocating() {
    if (!selected) {
      return;
    }
    setCenter({latitude: selected.latitude, longitude: selected.longitude});
    setZoom(value => Math.max(value, FOCUS_ZOOM));
    setRelocatingId(selected.id);
  }

  function showAllLocations() {
    const points: LatLng[] =
      locations.length > 0 ? locations : current ? [current] : [];
    const fit = fitBounds(points, width, height, FIT_PADDING);
    if (fit) {
      setCenter(fit.center);
      setZoom(fit.zoom);
    }
  }

  function confirmRelocating() {
    if (relocatingId) {
      onMove(relocatingId, center);
    }
    setRelocatingId(null);
  }

  return (
    <View style={styles.container}>
      <OsmMap
        center={center}
        zoom={zoom}
        markers={markers}
        width={width}
        height={height}
        selectedId={relocating ? null : selectedId}
        markersDraggable={!relocating}
        onCenterChange={setCenter}
        onMarkerPress={setSelectedId}
        onMarkerDragEnd={onMove}
      />

      {relocating ? (
        <View pointerEvents="none" style={styles.crosshairWrap}>
          <View style={styles.crosshairRing}>
            <View style={styles.crosshairDot} />
          </View>
        </View>
      ) : null}

      <View style={styles.topBar}>
        <Pressable
          onPress={onBack}
          style={({pressed}) => [styles.roundButton, pressed && styles.pressed]}>
          <Text style={styles.roundText}>‹</Text>
        </Pressable>

        <Text style={styles.title} numberOfLines={1}>
          {relocating ? 'Move pin' : selected ? selected.label : 'Map'}
        </Text>

        {selected && !relocating ? (
          <Pressable
            onPress={() => {
              onDelete(selected.id);
              setSelectedId(null);
            }}
            style={({pressed}) => [
              styles.roundButton,
              styles.deleteButton,
              pressed && styles.pressed,
            ]}>
            <Text style={styles.roundText}>✕</Text>
          </Pressable>
        ) : (
          <View style={styles.roundButton} />
        )}
      </View>

      {selected && !relocating ? (
        <View pointerEvents="box-none" style={styles.topOverlay}>
          {selectedDistance != null ? (
            <Text style={styles.distanceText}>
              {formatDistance(selectedDistance)} away
            </Text>
          ) : null}
          <Pressable
            onPress={startRelocating}
            style={({pressed}) => [
              styles.moveButton,
              pressed && styles.pressed,
            ]}>
            <Text style={styles.moveText}>Move pin</Text>
          </Pressable>
        </View>
      ) : null}

      {relocating ? (
        <View pointerEvents="none" style={styles.topOverlay}>
          <Text style={styles.hint}>Pan the map to place the pin</Text>
        </View>
      ) : null}

      <View style={styles.bottomBar}>
        {relocating ? (
          <>
            <Pressable
              onPress={() => setRelocatingId(null)}
              style={({pressed}) => [
                styles.roundButton,
                styles.deleteButton,
                pressed && styles.pressed,
              ]}>
              <Text style={styles.roundText}>✕</Text>
            </Pressable>
            <Pressable
              onPress={() => setZoom(value => clampZoom(value - 1))}
              style={({pressed}) => [
                styles.roundButton,
                pressed && styles.pressed,
              ]}>
              <Text style={styles.roundText}>−</Text>
            </Pressable>
            <Pressable
              onPress={() => setZoom(value => clampZoom(value + 1))}
              style={({pressed}) => [
                styles.roundButton,
                pressed && styles.pressed,
              ]}>
              <Text style={styles.roundText}>+</Text>
            </Pressable>
            <Pressable
              onPress={confirmRelocating}
              style={({pressed}) => [
                styles.roundButton,
                styles.confirmButton,
                pressed && styles.pressed,
              ]}>
              <Text style={styles.roundText}>✓</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Pressable
              onPress={() => setZoom(value => clampZoom(value - 1))}
              style={({pressed}) => [
                styles.roundButton,
                pressed && styles.pressed,
              ]}>
              <Text style={styles.roundText}>−</Text>
            </Pressable>

            {locations.length > 0 ? (
              <Pressable
                onPress={showAllLocations}
                style={({pressed}) => [
                  styles.roundButton,
                  styles.allButton,
                  pressed && styles.pressed,
                ]}>
                <Text style={styles.allText}>All</Text>
              </Pressable>
            ) : (
              <View style={styles.roundButton} />
            )}

            {current ? (
              <Pressable
                onPress={() => {
                  setCenter({
                    latitude: current.latitude,
                    longitude: current.longitude,
                  });
                  setZoom(FOCUS_ZOOM);
                }}
                style={({pressed}) => [
                  styles.roundButton,
                  styles.locateButton,
                  pressed && styles.pressed,
                ]}>
                <Text style={styles.roundText}>◎</Text>
              </Pressable>
            ) : (
              <View style={styles.roundButton} />
            )}

            <Pressable
              onPress={() => setZoom(value => clampZoom(value + 1))}
              style={({pressed}) => [
                styles.roundButton,
                pressed && styles.pressed,
              ]}>
              <Text style={styles.roundText}>+</Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    position: 'absolute',
    top: 38,
    left: 24,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 38,
    left: 24,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  roundButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(16,16,16,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locateButton: {
    backgroundColor: 'rgba(79,125,255,0.9)',
  },
  allButton: {
    backgroundColor: 'rgba(245,158,11,0.9)',
  },
  allText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '700',
  },
  deleteButton: {
    backgroundColor: 'rgba(239,68,68,0.9)',
  },
  confirmButton: {
    backgroundColor: 'rgba(74,222,128,0.9)',
  },
  pressed: {
    opacity: 0.6,
  },
  roundText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  title: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
    maxWidth: 180,
    textAlign: 'center',
  },
  moveButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 18,
  },
  moveText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  topOverlay: {
    position: 'absolute',
    top: 80,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  distanceText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
    backgroundColor: 'rgba(16,16,16,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  hint: {
    color: colors.text,
    fontSize: 10,
    backgroundColor: 'rgba(16,16,16,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  crosshairWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crosshairRing: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: colors.text,
    backgroundColor: 'rgba(239,68,68,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  crosshairDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.danger,
  },
});
