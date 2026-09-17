import React, {useEffect, useMemo, useState} from 'react';
import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {DECELERATION_OPTIONS} from '../drive';
import type {DrivePhase} from '../drive';
import {
  DEFAULT_DRIVE_SETTINGS,
  DriveSettings,
  VibrationMode,
  loadDriveSettings,
  saveDriveSettings,
} from '../driveSettings';
import {formatDistance} from '../geo';
import {useKeepAwake} from '../keepAwake';
import {colors} from '../theme';
import type {Position, SavedLocation} from '../types';
import {useDriveAlert} from '../useDriveAlert';
import {useRotorScroll} from '../useRotorScroll';

type Props = {
  position: Position | null;
  locations: SavedLocation[];
  onExit: () => void;
};

function phaseLabel(phase: DrivePhase | undefined): string {
  switch (phase) {
    case 'liftoff':
      return 'LIFT OFF NOW';
    case 'braking':
      return 'BRAKE NOW';
    case 'arrived':
      return 'Arrived';
    case 'clear':
      return 'No lift-off needed';
    default:
      return 'Keep going';
  }
}

function phaseColor(phase: DrivePhase | undefined): string {
  switch (phase) {
    case 'liftoff':
      return colors.saved;
    case 'braking':
      return colors.danger;
    case 'arrived':
      return colors.precise;
    case 'clear':
      return colors.muted;
    default:
      return colors.primary;
  }
}

export default function DriveScreen({position, locations, onExit}: Props) {
  const [settings, setSettings] = useState<DriveSettings>(
    DEFAULT_DRIVE_SETTINGS,
  );
  const [muted, setMuted] = useState(false);
  const [visited, setVisited] = useState<string[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const scroll = useRotorScroll();

  useKeepAwake(true);

  useEffect(() => {
    loadDriveSettings().then(setSettings);
  }, []);

  const snapshot = useDriveAlert(
    position,
    locations,
    visited,
    settings,
    muted,
    id => setVisited(previous => [...previous, id]),
  );

  const allReached =
    locations.length > 0 && visited.length >= locations.length;

  const speedKmh = useMemo(() => {
    const guidance = snapshot.guidance;
    return guidance ? Math.round(guidance.speedKmh) : 0;
  }, [snapshot.guidance]);

  function updateSettings(next: DriveSettings) {
    setSettings(next);
    saveDriveSettings(next);
  }

  if (showSettings) {
    return (
      <ScrollView
        ref={scroll.ref}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={scroll.onScroll}
        onContentSizeChange={scroll.onContentSizeChange}
        onLayout={scroll.onLayout}>
        <View style={styles.header}>
          <Pressable
            onPress={() => setShowSettings(false)}
            style={({pressed}) => [
              styles.iconButton,
              pressed && styles.pressed,
            ]}>
            <Text style={styles.iconText}>‹</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Drive settings</Text>
          <View style={styles.iconButton} />
        </View>

        <Text style={styles.sectionLabel}>Deceleration (m/s²)</Text>
        <View style={styles.optionsRow}>
          {DECELERATION_OPTIONS.map(option => (
            <Pressable
              key={option}
              onPress={() => updateSettings({...settings, deceleration: option})}
              style={({pressed}) => [
                styles.option,
                option === settings.deceleration && styles.optionActive,
                pressed && styles.pressed,
              ]}>
              <Text style={styles.optionText}>{option.toFixed(1)}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Lift-off alert</Text>
        <View style={styles.optionsRow}>
          {(['repeat', 'once'] as VibrationMode[]).map(mode => (
            <Pressable
              key={mode}
              onPress={() =>
                updateSettings({...settings, vibrationMode: mode})
              }
              style={({pressed}) => [
                styles.option,
                styles.optionWide,
                mode === settings.vibrationMode && styles.optionActive,
                pressed && styles.pressed,
              ]}>
              <Text style={styles.optionText}>
                {mode === 'repeat' ? 'Repeat' : 'Once'}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    );
  }

  const phase = snapshot.guidance?.phase;
  const accent = phaseColor(phase);

  return (
    <ScrollView
      ref={scroll.ref}
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      scrollEventThrottle={16}
      onScroll={scroll.onScroll}
      onContentSizeChange={scroll.onContentSizeChange}
      onLayout={scroll.onLayout}>
      <View style={styles.header}>
        <Pressable
          onPress={onExit}
          style={({pressed}) => [styles.iconButton, pressed && styles.pressed]}>
          <Text style={styles.iconText}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Drive</Text>
        <Pressable
          onPress={() => setShowSettings(true)}
          style={({pressed}) => [styles.iconButton, pressed && styles.pressed]}>
          <Text style={styles.iconText}>⚙</Text>
        </Pressable>
      </View>

      <View style={styles.speedBox}>
        <Text style={styles.speedValue}>{speedKmh}</Text>
        <Text style={styles.speedUnit}>km/h</Text>
      </View>

      <View style={[styles.banner, {borderColor: accent}]}>
        <Text style={[styles.bannerText, {color: accent}]}>
          {allReached ? 'All points reached' : phaseLabel(phase)}
        </Text>
        {!allReached && phase === 'cruise' && snapshot.guidance ? (
          <Text style={styles.bannerSub}>
            Lift off in {Math.ceil(snapshot.guidance.timeToLiftoff)}s
          </Text>
        ) : null}
        {!allReached && snapshot.target && snapshot.guidance ? (
          <Text style={styles.bannerSub}>
            {formatDistance(snapshot.distance)} · {snapshot.target.label}
          </Text>
        ) : null}
        {!allReached && !snapshot.target ? (
          <Text style={styles.bannerSub}>No saved points yet</Text>
        ) : null}
      </View>

      <View style={styles.footer}>
        {snapshot.guidance && !allReached ? (
          <Text style={styles.eta}>
            ETA {Math.ceil(snapshot.guidance.arrivalSeconds)}s ·{' '}
            {Math.round(snapshot.guidance.targetSpeedKmh)} km/h
          </Text>
        ) : null}
        <Pressable
          onPress={() => setMuted(value => !value)}
          style={({pressed}) => [
            styles.muteButton,
            muted && styles.muteActive,
            pressed && styles.pressed,
          ]}>
          <Text style={styles.muteText}>{muted ? 'Muted' : 'Mute'}</Text>
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 26,
    paddingTop: 38,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    color: colors.text,
    fontSize: 20,
    lineHeight: 22,
  },
  pressed: {
    opacity: 0.6,
  },
  speedBox: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginTop: 8,
  },
  speedValue: {
    color: colors.text,
    fontSize: 52,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  speedUnit: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
    marginLeft: 6,
  },
  banner: {
    marginTop: 8,
    borderWidth: 2,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  bannerText: {
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  bannerSub: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 3,
    textAlign: 'center',
  },
  footer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  eta: {
    color: colors.muted,
    fontSize: 12,
    marginBottom: 8,
    fontVariant: ['tabular-nums'],
  },
  muteButton: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 22,
  },
  muteActive: {
    backgroundColor: colors.primary,
  },
  muteText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  sectionLabel: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 18,
    marginBottom: 8,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  option: {
    minWidth: 52,
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    marginRight: 6,
  },
  optionWide: {
    minWidth: 96,
  },
  optionActive: {
    backgroundColor: colors.primary,
  },
  optionText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
});
