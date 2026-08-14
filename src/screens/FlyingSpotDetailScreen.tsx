import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { getDroneProfile } from '../droneProfiles/droneProfileRepository';
import { getDeviceRegion } from '../region';
import {
  computeVerdict,
  currentDaylightHours,
  currentHourPoint,
  firstDaylightHourOnDay,
  formatWindSpeed,
  getWeather,
} from '../weather';
import type { WeatherSnapshot } from '../weather';
import type { DroneProfile, FlyingSpot, VerdictLevel } from '../weather/types';
import { sharedStyles } from './sharedStyles';
import { SpotMapView } from './SpotMapView';

type WeatherState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; snapshot: WeatherSnapshot };

function formatHour(isoTime: string): string {
  return isoTime.split('T')[1] ?? isoTime;
}

interface Props {
  spot: FlyingSpot;
  onCreateDroneProfile: () => void;
}

export function FlyingSpotDetailScreen({ spot, onCreateDroneProfile }: Props) {
  const [droneProfile, setDroneProfile] = useState<
    DroneProfile | null | undefined
  >(undefined);
  const [weatherState, setWeatherState] = useState<WeatherState>({
    status: 'loading',
  });
  const [previewDayIndex, setPreviewDayIndex] = useState<number | null>(null);
  const region = useMemo(() => getDeviceRegion(), []);

  const loadWeather = useCallback(async () => {
    setWeatherState({ status: 'loading' });
    try {
      const snapshot = await getWeather(spot.id, spot.coordinates);
      setWeatherState({ status: 'ready', snapshot });
    } catch {
      setWeatherState({ status: 'error' });
    }
  }, [spot.id, spot.coordinates]);

  useEffect(() => {
    getDroneProfile()
      .then(setDroneProfile)
      .catch(() => setDroneProfile(null));
    loadWeather();
  }, [loadWeather]);

  if (droneProfile === undefined || weatherState.status === 'loading') {
    return <ActivityIndicator style={styles.loading} testID="detail-loading" />;
  }

  if (droneProfile === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>
          Create a drone profile to see a Verdict for this spot.
        </Text>
        <Pressable
          style={sharedStyles.primaryButton}
          onPress={onCreateDroneProfile}
          testID="prompt-create-drone-profile"
        >
          <Text style={sharedStyles.primaryButtonText}>
            Create drone profile
          </Text>
        </Pressable>
      </View>
    );
  }

  if (weatherState.status === 'error') {
    return (
      <View style={styles.container}>
        <Text style={styles.message} testID="weather-error">
          Couldn't fetch weather for this spot.
        </Text>
        <Pressable
          style={sharedStyles.primaryButton}
          onPress={loadWeather}
          testID="retry-weather"
        >
          <Text style={sharedStyles.primaryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  const { forecast, stale } = weatherState.snapshot;
  const currentPoint = currentHourPoint(forecast);
  const verdict = currentPoint
    ? computeVerdict(currentPoint, droneProfile.thresholds)
    : null;
  const daylightHours = currentDaylightHours(forecast);
  const upcomingDays = forecast.daily.slice(1, 4);

  const previewPoint =
    previewDayIndex !== null
      ? firstDaylightHourOnDay(forecast, previewDayIndex)
      : undefined;
  const previewVerdict = previewPoint
    ? computeVerdict(previewPoint, droneProfile.thresholds)
    : null;

  return (
    <ScrollView style={styles.container} testID="flying-spot-detail-screen">
      <Text style={styles.title}>{spot.name}</Text>
      <SpotMapView coordinates={spot.coordinates} testID="spot-map" />
      {stale && (
        <Text style={styles.staleLabel} testID="stale-label">
          Showing last known conditions (stale)
        </Text>
      )}

      {verdict && currentPoint && (
        <View style={styles.badgeSection}>
          <View
            style={[styles.badge, badgeStyleFor(verdict.level)]}
            testID="verdict-badge"
          >
            <Text style={styles.badgeText}>{verdict.level.toUpperCase()}</Text>
          </View>
          <Text testID="wind-speed">
            Wind: {formatWindSpeed(currentPoint.windSpeed, region)}
          </Text>
          <Text testID="cloud-cover">
            Cloud cover: {currentPoint.cloudCover}%
          </Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>Today (daylight hours)</Text>
      <FlatList
        data={daylightHours}
        keyExtractor={point => point.time}
        horizontal
        testID="daylight-hours-list"
        renderItem={({ item }) => (
          <View style={styles.hourCard}>
            <Text style={styles.hourTime}>{formatHour(item.time)}</Text>
            <Text>{formatWindSpeed(item.windSpeed, region)}</Text>
            <Text>{item.precipitationProbability}% rain</Text>
          </View>
        )}
      />

      <Text style={styles.sectionTitle}>Next 3 days</Text>
      {upcomingDays.map((day, index) => {
        const dayIndex = index + 1;
        return (
          <View key={day.date} style={styles.dayRow}>
            <Text style={styles.dayDate}>{day.date}</Text>
            <Text>{formatWindSpeed(day.windSpeedMax, region)} max</Text>
            <Text>{day.precipitationProbabilityMax}% rain</Text>
            <Pressable
              onPress={() => setPreviewDayIndex(dayIndex)}
              testID={`preview-day-${dayIndex}`}
            >
              <Text style={styles.link}>Preview</Text>
            </Pressable>
          </View>
        );
      })}

      {previewVerdict && (
        <View style={styles.badgeSection} testID="preview-verdict">
          <Text style={styles.sectionTitle}>Preview: first daylight hour</Text>
          <View style={[styles.badge, badgeStyleFor(previewVerdict.level)]}>
            <Text style={styles.badgeText}>
              {previewVerdict.level.toUpperCase()}
            </Text>
          </View>
          <Pressable
            onPress={() => setPreviewDayIndex(null)}
            testID="close-preview"
          >
            <Text style={styles.link}>Close preview</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

function badgeStyleFor(level: VerdictLevel) {
  return level === 'green'
    ? styles.badge_green
    : level === 'yellow'
    ? styles.badge_yellow
    : styles.badge_red;
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  loading: { flex: 1 },
  message: { fontSize: 16, marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  staleLabel: { color: '#a06a00', fontWeight: '600', marginBottom: 8 },
  badgeSection: { marginBottom: 16 },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  badge_green: { backgroundColor: '#2e9e44' },
  badge_yellow: { backgroundColor: '#d99a00' },
  badge_red: { backgroundColor: '#d33' },
  badgeText: { color: '#fff', fontWeight: '700' },
  sectionTitle: { fontWeight: '600', marginTop: 16, marginBottom: 8 },
  hourCard: {
    marginRight: 12,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#f2f2f2',
    minWidth: 80,
  },
  hourTime: { fontWeight: '600', marginBottom: 4 },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dayDate: { fontWeight: '600' },
  link: { color: '#2f6fed', fontWeight: '600' },
});
