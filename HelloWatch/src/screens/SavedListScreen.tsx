import React, {useEffect, useRef, useState} from 'react';
import {FlatList, Pressable, StyleSheet, Text, View} from 'react-native';
import {
  distanceMeters,
  formatCoords,
  formatDistance,
  formatTime,
} from '../geo';
import {useRotary} from '../rotary';
import {colors} from '../theme';
import type {Position, SavedLocation} from '../types';

type Props = {
  locations: SavedLocation[];
  current: Position | null;
  onBack: () => void;
  onOpenOnMap: (id: string) => void;
  onViewAllOnMap: () => void;
  onDelete: (id: string) => void;
};

export default function SavedListScreen({
  locations,
  current,
  onBack,
  onOpenOnMap,
  onViewAllOnMap,
  onDelete,
}: Props) {
  const listRef = useRef<FlatList<SavedLocation>>(null);
  const [highlight, setHighlight] = useState(0);

  useRotary(step => {
    setHighlight(index =>
      Math.min(Math.max(index + step, 0), Math.max(locations.length - 1, 0)),
    );
  });

  useEffect(() => {
    if (locations.length === 0) {
      return;
    }
    listRef.current?.scrollToIndex({
      index: Math.min(highlight, locations.length - 1),
      animated: true,
      viewPosition: 0.5,
    });
  }, [highlight, locations.length]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          onPress={onBack}
          style={({pressed}) => [styles.iconButton, pressed && styles.pressed]}>
          <Text style={styles.iconText}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Saved ({locations.length})</Text>
        {locations.length > 0 ? (
          <Pressable
            onPress={onViewAllOnMap}
            style={({pressed}) => [styles.mapButton, pressed && styles.pressed]}>
            <Text style={styles.mapText}>Map</Text>
          </Pressable>
        ) : (
          <View style={styles.iconButton} />
        )}
      </View>

      <FlatList
        ref={listRef}
        data={locations}
        keyExtractor={item => item.id}
        contentContainerStyle={
          locations.length === 0 ? styles.emptyContent : styles.listContent
        }
        onScrollToIndexFailed={info => {
          listRef.current?.scrollToOffset({
            offset: info.averageItemLength * info.index,
            animated: true,
          });
        }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            No saved locations yet.{'\n'}Tap “Save location” on the home screen.
          </Text>
        }
        renderItem={({item, index}) => (
          <View style={[styles.row, index === highlight && styles.rowHighlight]}>
            <Pressable
              onPress={() => {
                setHighlight(index);
                onOpenOnMap(item.id);
              }}
              style={({pressed}) => [styles.rowMain, pressed && styles.pressed]}>
              <Text style={styles.rowLabel} numberOfLines={1}>
                {item.label}
              </Text>
              <Text style={styles.rowMeta} numberOfLines={1}>
                {formatTime(item.createdAt)}
                {item.precise ? '  GPS' : ''}
              </Text>
              <Text style={styles.rowCoords} numberOfLines={1}>
                {formatCoords(item)}
              </Text>
              {current ? (
                <Text style={styles.rowDistance} numberOfLines={1}>
                  {formatDistance(distanceMeters(current, item))} away
                </Text>
              ) : null}
            </Pressable>
            <Pressable
              onPress={() => onDelete(item.id)}
              style={({pressed}) => [
                styles.deleteButton,
                pressed && styles.deletePressed,
              ]}>
              <Text style={styles.deleteText}>✕</Text>
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 18,
    paddingTop: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  iconButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    color: colors.text,
    fontSize: 22,
    lineHeight: 24,
  },
  mapButton: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 14,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  mapText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.6,
  },
  listContent: {
    paddingBottom: 40,
  },
  emptyContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: colors.muted,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  rowHighlight: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceAlt,
  },
  rowMain: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  rowLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  rowMeta: {
    color: colors.muted,
    fontSize: 10,
    marginTop: 1,
  },
  rowCoords: {
    color: colors.muted,
    fontSize: 10,
    marginTop: 1,
    fontVariant: ['tabular-nums'],
  },
  rowDistance: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 1,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  deletePressed: {
    backgroundColor: colors.surfaceAlt,
  },
  deleteText: {
    color: colors.danger,
    fontSize: 15,
    fontWeight: '700',
  },
});
