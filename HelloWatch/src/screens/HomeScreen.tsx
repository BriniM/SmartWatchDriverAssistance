import React from 'react';
import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {formatSpeed} from '../geo';
import {colors} from '../theme';
import type {Position} from '../types';
import {useRotorScroll} from '../useRotorScroll';

type Props = {
  position: Position | null;
  gpsError: string | null;
  savedCount: number;
  onSave: () => void;
  onOpenSaved: () => void;
  onOpenMap: () => void;
  onOpenDrive: () => void;
};

export default function HomeScreen({
  position,
  gpsError,
  savedCount,
  onSave,
  onOpenSaved,
  onOpenMap,
  onOpenDrive,
}: Props) {
  const scroll = useRotorScroll();

  return (
    <ScrollView
      ref={scroll.ref}
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      scrollEventThrottle={16}
      onScroll={scroll.onScroll}
      onContentSizeChange={scroll.onContentSizeChange}
      onLayout={scroll.onLayout}>
      <Text style={styles.title}>Hello, Galaxy Watch!!</Text>

      <View style={styles.gpsBox}>
        {position ? (
          <>
            <Text style={styles.gpsRow}>
              X {position.longitude.toFixed(6)}
            </Text>
            <Text style={styles.gpsRow}>Y {position.latitude.toFixed(6)}</Text>
            <Text style={styles.gpsMeta}>
              <Text
                style={position.precise ? styles.gpsPrecise : styles.gpsApprox}>
                {position.precise ? 'GPS' : 'approx'}
              </Text>
              {`  ±${Math.round(position.accuracy ?? 0)} m`}
            </Text>
            <Text style={styles.speed}>{formatSpeed(position.speed)}</Text>
          </>
        ) : (
          <Text style={styles.gpsRow}>
            {gpsError ?? 'Acquiring GPS fix...'}
          </Text>
        )}
      </View>

      <Pressable
        disabled={!position}
        onPress={onSave}
        style={({pressed}) => [
          styles.button,
          pressed && styles.buttonPressed,
          !position && styles.buttonDisabled,
        ]}>
        <Text style={styles.buttonText}>Save location</Text>
      </Pressable>

      <Pressable
        disabled={savedCount === 0}
        onPress={onOpenDrive}
        style={({pressed}) => [
          styles.driveButton,
          pressed && styles.drivePressed,
          savedCount === 0 && styles.buttonDisabled,
        ]}>
        <Text style={styles.driveText}>Drive mode</Text>
      </Pressable>
      {savedCount === 0 ? (
        <Text style={styles.driveHint}>Save a location first</Text>
      ) : null}

      <View style={styles.footer}>
        <Pressable
          onPress={onOpenSaved}
          style={({pressed}) => [
            styles.secondaryButton,
            pressed && styles.secondaryPressed,
          ]}>
          <Text style={styles.secondaryText}>Saved ({savedCount})</Text>
        </Pressable>

        <Pressable
          onPress={onOpenMap}
          style={({pressed}) => [
            styles.secondaryButton,
            pressed && styles.secondaryPressed,
          ]}>
          <Text style={styles.secondaryText}>Map</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingTop: 72,
    paddingBottom: 72,
  },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
  },
  gpsBox: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 14,
    minWidth: 220,
  },
  gpsRow: {
    color: colors.text,
    fontSize: 16,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  gpsMeta: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 4,
  },
  gpsPrecise: {
    color: colors.precise,
    fontWeight: '700',
  },
  gpsApprox: {
    color: colors.muted,
    fontWeight: '700',
  },
  speed: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 6,
    fontVariant: ['tabular-nums'],
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 22,
    paddingVertical: 10,
    paddingHorizontal: 26,
    marginBottom: 10,
  },
  buttonPressed: {
    backgroundColor: colors.primaryPressed,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  driveButton: {
    backgroundColor: colors.saved,
    borderRadius: 22,
    paddingVertical: 10,
    paddingHorizontal: 26,
    marginBottom: 4,
  },
  drivePressed: {
    backgroundColor: colors.saved,
    opacity: 0.75,
  },
  driveText: {
    color: colors.background,
    fontSize: 15,
    fontWeight: '800',
  },
  driveHint: {
    color: colors.muted,
    fontSize: 11,
    marginBottom: 6,
  },
  secondaryButton: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 18,
    paddingVertical: 9,
    paddingHorizontal: 20,
    marginHorizontal: 5,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  secondaryPressed: {
    backgroundColor: colors.border,
  },
  secondaryText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
});
