import React, {useMemo, useRef, useState} from 'react';
import {Image, PanResponder, StyleSheet, Text, View} from 'react-native';
import {
  TILE_SIZE,
  latToWorldY,
  lngToWorldX,
  tileUrl,
  worldXToLng,
  worldYToLat,
} from '../mercator';
import type {LatLng} from '../types';

export type MapMarker = {
  id: string;
  latitude: number;
  longitude: number;
  kind: 'saved' | 'current';
};

type Props = {
  center: LatLng;
  zoom: number;
  markers: MapMarker[];
  width: number;
  height: number;
  selectedId?: string | null;
  markersDraggable?: boolean;
  onCenterChange: (center: LatLng) => void;
  onMarkerPress?: (id: string) => void;
  onMarkerDragEnd?: (id: string, coords: LatLng) => void;
};

const USER_AGENT = 'HelloWatch/1.0 (React Native; Wear OS)';
const MARKER_HIT_SLOP = 40;
const MARKER_RADIUS = 9;

export default function OsmMap({
  center,
  zoom,
  markers,
  width,
  height,
  selectedId,
  markersDraggable = true,
  onCenterChange,
  onMarkerPress,
  onMarkerDragEnd,
}: Props) {
  const [drag, setDrag] = useState<{id: string; x: number; y: number} | null>(
    null,
  );
  const dragRef = useRef<{id: string; x: number; y: number} | null>(null);

  const centerX = lngToWorldX(center.longitude, zoom);
  const centerY = latToWorldY(center.latitude, zoom);
  const left = centerX - width / 2;
  const top = centerY - height / 2;

  const latest = useRef({
    left,
    top,
    zoom,
    markers,
    width,
    height,
    markersDraggable,
    onCenterChange,
    onMarkerPress,
    onMarkerDragEnd,
  });
  latest.current = {
    left,
    top,
    zoom,
    markers,
    width,
    height,
    markersDraggable,
    onCenterChange,
    onMarkerPress,
    onMarkerDragEnd,
  };

  const gesture = useRef<{
    startLeft: number;
    startTop: number;
    markerId: string | null;
    markerStartX: number;
    markerStartY: number;
  } | null>(null);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: evt => {
        const {locationX, locationY} = evt.nativeEvent;
        const current = latest.current;
        let hit: MapMarker | null = null;

        if (current.markersDraggable) {
          for (const marker of current.markers) {
            if (marker.kind !== 'saved') {
              continue;
            }
            const sx =
              lngToWorldX(marker.longitude, current.zoom) - current.left;
            const sy =
              latToWorldY(marker.latitude, current.zoom) - current.top;
            if (Math.hypot(sx - locationX, sy - locationY) <= MARKER_HIT_SLOP) {
              hit = marker;
              break;
            }
          }
        }

        if (hit) {
          const sx = lngToWorldX(hit.longitude, current.zoom) - current.left;
          const sy = latToWorldY(hit.latitude, current.zoom) - current.top;
          gesture.current = {
            startLeft: current.left,
            startTop: current.top,
            markerId: hit.id,
            markerStartX: sx,
            markerStartY: sy,
          };
          current.onMarkerPress?.(hit.id);
        } else {
          gesture.current = {
            startLeft: current.left,
            startTop: current.top,
            markerId: null,
            markerStartX: 0,
            markerStartY: 0,
          };
        }
      },
      onPanResponderMove: (_evt, state) => {
        const active = gesture.current;
        if (!active) {
          return;
        }

        if (active.markerId) {
          const next = {
            id: active.markerId,
            x: active.markerStartX + state.dx,
            y: active.markerStartY + state.dy,
          };
          dragRef.current = next;
          setDrag(next);
        } else {
          const current = latest.current;
          const newLeft = active.startLeft - state.dx;
          const newTop = active.startTop - state.dy;
          current.onCenterChange({
            latitude: worldYToLat(newTop + current.height / 2, current.zoom),
            longitude: worldXToLng(newLeft + current.width / 2, current.zoom),
          });
        }
      },
      onPanResponderRelease: () => {
        const active = gesture.current;
        const dragged = dragRef.current;
        if (active?.markerId && dragged) {
          const current = latest.current;
          current.onMarkerDragEnd?.(active.markerId, {
            latitude: worldYToLat(current.top + dragged.y, current.zoom),
            longitude: worldXToLng(current.left + dragged.x, current.zoom),
          });
        }
        gesture.current = null;
        dragRef.current = null;
        setDrag(null);
      },
      onPanResponderTerminate: () => {
        gesture.current = null;
        dragRef.current = null;
        setDrag(null);
      },
    }),
  ).current;

  const tiles = useMemo(() => {
    const maxTileIndex = 2 ** zoom - 1;
    const minX = Math.floor(left / TILE_SIZE);
    const maxX = Math.floor((left + width) / TILE_SIZE);
    const minY = Math.max(0, Math.floor(top / TILE_SIZE));
    const maxY = Math.min(maxTileIndex, Math.floor((top + height) / TILE_SIZE));
    const result: {key: string; x: number; y: number}[] = [];

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        result.push({key: `${zoom}/${x}/${y}`, x, y});
      }
    }

    return result;
  }, [left, top, width, height, zoom]);

  return (
    <View
      style={[styles.container, {width, height}]}
      {...panResponder.panHandlers}>
      {tiles.map(tile => (
        <Image
          key={tile.key}
          source={{
            uri: tileUrl(zoom, tile.x, tile.y),
            headers: {'User-Agent': USER_AGENT},
          }}
          style={[
            styles.tile,
            {
              left: tile.x * TILE_SIZE - left,
              top: tile.y * TILE_SIZE - top,
            },
          ]}
        />
      ))}

      {markers.map(marker => {
        const dragging = drag?.id === marker.id;
        const x = dragging
          ? drag.x
          : lngToWorldX(marker.longitude, zoom) - left;
        const y = dragging ? drag.y : latToWorldY(marker.latitude, zoom) - top;

        if (x < -40 || x > width + 40 || y < -40 || y > height + 40) {
          return null;
        }

        const selected = marker.id === selectedId;
        const isCurrent = marker.kind === 'current';

        return (
          <View
            key={marker.id}
            pointerEvents="none"
            style={[
              styles.marker,
              {left: x - MARKER_RADIUS, top: y - MARKER_RADIUS},
              isCurrent
                ? styles.markerCurrent
                : selected
                ? styles.markerSelected
                : styles.markerSaved,
              dragging && styles.markerDragging,
            ]}
          />
        );
      })}

      <Text style={styles.attribution}>© OpenStreetMap</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },
  tile: {
    position: 'absolute',
    width: TILE_SIZE,
    height: TILE_SIZE,
  },
  marker: {
    position: 'absolute',
    width: MARKER_RADIUS * 2,
    height: MARKER_RADIUS * 2,
    borderRadius: MARKER_RADIUS,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  markerSaved: {
    backgroundColor: '#f59e0b',
  },
  markerSelected: {
    backgroundColor: '#ef4444',
    width: MARKER_RADIUS * 2 + 6,
    height: MARKER_RADIUS * 2 + 6,
    borderRadius: MARKER_RADIUS + 3,
    marginLeft: -3,
    marginTop: -3,
  },
  markerCurrent: {
    backgroundColor: '#4f7dff',
    borderColor: '#ffffff',
  },
  markerDragging: {
    backgroundColor: '#ef4444',
    borderColor: '#ffffff',
    transform: [{scale: 1.3}],
  },
  attribution: {
    position: 'absolute',
    bottom: 2,
    right: 6,
    color: '#e5e5e5',
    fontSize: 9,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 4,
    borderRadius: 4,
  },
});
