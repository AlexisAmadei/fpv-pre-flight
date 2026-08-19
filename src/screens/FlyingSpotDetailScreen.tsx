import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import {
  listDroneProfiles,
  getActiveDroneProfileId,
  setActiveDroneProfile,
} from '../droneProfiles/droneProfileRepository';
import { getDeviceRegion } from '../region';
import {
  computeVerdict,
  currentDaylightHours,
  currentHourPoint,
  firstDaylightHourOnDay,
  formatWindSpeed,
  getWeather,
  refreshSpot,
} from '../weather';
import type { WeatherSnapshot } from '../weather';
import type { DroneProfile, FlyingSpot, Verdict } from '../weather/types';
import { Button, Card, Mono, SectionTitle } from '../ui/components';
import { VERDICT_STYLES, WEIGHT_CLASS_LABELS } from '../ui/theme';
import { SpotMapView } from './SpotMapView';

type WeatherState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; snapshot: WeatherSnapshot };

function formatHour(isoTime: string): string {
  return isoTime.split('T')[1] ?? isoTime;
}

/**
 * Whether `now` falls inside today's daylight window, comparing time-of-day
 * only so a stale forecast from a previous day still answers sensibly — the
 * same rule weatherStore applies (ADR-0007).
 */
function isWithinDaylight(
  daily: { sunrise: string; sunset: string }[],
  now: Date,
): boolean {
  const today = daily[0];
  if (!today) {
    return false;
  }
  const minutes = (iso: string) => {
    const [h, m] = iso.split('T')[1].split(':').map(Number);
    return h * 60 + m;
  };
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  return (
    nowMinutes >= minutes(today.sunrise) && nowMinutes <= minutes(today.sunset)
  );
}

interface Props {
  spot: FlyingSpot;
  onCreateDroneProfile: () => void;
  onManageDrones?: () => void;
  onOpenChecklist?: () => void;
  /** Injectable clock: keeps daylight gating deterministic under test. */
  now?: Date;
}

export function FlyingSpotDetailScreen({
  spot,
  onCreateDroneProfile,
  onManageDrones,
  onOpenChecklist,
  now: nowProp,
}: Props) {
  const [profiles, setProfiles] = useState<DroneProfile[] | undefined>(
    undefined,
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  const [weatherState, setWeatherState] = useState<WeatherState>({
    status: 'loading',
  });
  const [previewDayIndex, setPreviewDayIndex] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
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
    listDroneProfiles()
      .then(setProfiles)
      .catch(() => setProfiles([]));
    getActiveDroneProfileId().then(setActiveId);
    loadWeather();
  }, [loadWeather]);

  async function handleSelectDrone(id: string) {
    await setActiveDroneProfile(id);
    setActiveId(id);
    // Thresholds changed, so any open future-day preview no longer applies.
    setPreviewDayIndex(null);
  }

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await refreshSpot(spot);
      await loadWeather();
    } finally {
      setRefreshing(false);
    }
  }

  if (profiles === undefined || weatherState.status === 'loading') {
    return <ActivityIndicator className="flex-1" testID="detail-loading" />;
  }

  const droneProfile =
    profiles.find(profile => profile.id === activeId) ?? profiles[0] ?? null;

  if (droneProfile === null) {
    return (
      <View className="flex-1 items-center gap-3 bg-background px-8 py-14">
        <Text className="text-center text-[13px] leading-5 text-muted-foreground">
          Create a drone profile to see a Verdict for this spot.
        </Text>
        <Button
          label="Create drone profile"
          size="sm"
          onPress={onCreateDroneProfile}
          testID="prompt-create-drone-profile"
        />
      </View>
    );
  }

  if (weatherState.status === 'error') {
    return (
      <View className="flex-1 items-center gap-3 bg-background px-8 py-14">
        <Text
          className="text-center text-[13px] leading-5 text-muted-foreground"
          testID="weather-error"
        >
          Couldn't fetch weather for this spot.
        </Text>
        <Button
          label="Retry"
          size="sm"
          variant="outline"
          onPress={loadWeather}
          testID="retry-weather"
        />
      </View>
    );
  }

  const { forecast, stale } = weatherState.snapshot;
  const now = nowProp ?? new Date();
  const withinDaylight = isWithinDaylight(forecast.daily, now);
  const currentPoint = withinDaylight
    ? currentHourPoint(forecast, now)
    : undefined;
  const verdict: Verdict | null = currentPoint
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

  const today = forecast.daily[0];

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="pb-8"
      testID="flying-spot-detail-screen"
    >
      <View className="flex-row items-center gap-2.5 px-5 pb-2.5">
        <View className="min-w-0 flex-1">
          <Text
            className="text-[17px] font-bold text-foreground"
            numberOfLines={1}
          >
            {spot.name}
          </Text>
          <Mono className="text-muted-foreground">
            {spot.coordinates.latitude.toFixed(4)},{' '}
            {spot.coordinates.longitude.toFixed(4)}
          </Mono>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Refresh this spot"
          accessibilityState={{ disabled: refreshing }}
          onPress={handleRefresh}
          disabled={refreshing}
          testID="refresh-spot"
          className={`border border-border bg-background px-2.5 py-1.5 ${
            refreshing ? 'opacity-40' : ''
          }`}
        >
          <Text className="font-mono text-[10px] uppercase tracking-[1px] text-foreground">
            {refreshing ? 'Syncing' : 'Refresh'}
          </Text>
        </Pressable>
      </View>

      <View className="mx-5 border border-border">
        <SpotMapView coordinates={spot.coordinates} testID="spot-map" />
      </View>

      {profiles.length > 0 && (
        <View className="px-5 pt-4">
          <View className="mb-2 flex-row items-center justify-between">
            <SectionTitle>Flying Today</SectionTitle>
            {onManageDrones && (
              <Pressable
                accessibilityRole="button"
                onPress={onManageDrones}
                testID="manage-drones"
              >
                <Text className="font-mono text-[10px] uppercase tracking-[1px] text-muted-foreground">
                  Manage
                </Text>
              </Pressable>
            )}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              {profiles.map(profile => {
                const selected = profile.id === droneProfile.id;
                return (
                  <Pressable
                    key={profile.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => handleSelectDrone(profile.id)}
                    testID={`select-drone-${profile.id}`}
                    className={`min-w-[104px] border px-3 py-2 ${
                      selected
                        ? 'border-primary bg-primary'
                        : 'border-border bg-card'
                    }`}
                  >
                    <Text
                      className={`text-[12.5px] font-semibold ${
                        selected ? 'text-primary-foreground' : 'text-foreground'
                      }`}
                    >
                      {profile.name}
                    </Text>
                    <Text
                      className={`mt-0.5 font-mono text-[9.5px] ${
                        selected
                          ? 'text-primary-foreground opacity-75'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {WEIGHT_CLASS_LABELS[profile.weightClass]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>
      )}

      <View className="px-5 pt-4">
        {verdict && currentPoint ? (
          <View
            className={`p-5 ${VERDICT_STYLES[verdict.level].surface}`}
            testID="verdict-badge"
          >
            <View className="flex-row items-baseline justify-between">
              <Text
                className={`text-[26px] font-extrabold tracking-[0.5px] ${
                  VERDICT_STYLES[verdict.level].text
                }`}
                testID="verdict-label"
              >
                {VERDICT_STYLES[verdict.level].label}
              </Text>
              {stale && (
                <View className="border border-border bg-background px-1.5 py-1">
                  <Text
                    className="font-mono text-[9.5px] uppercase tracking-[1px] text-foreground"
                    testID="stale-label"
                  >
                    Stale
                  </Text>
                </View>
              )}
            </View>
            <View className="mt-3.5 flex-row gap-5">
              <View>
                <Text
                  className={`font-mono text-[10px] uppercase tracking-[1px] opacity-70 ${
                    VERDICT_STYLES[verdict.level].text
                  }`}
                >
                  Wind
                </Text>
                <Text
                  className={`text-[15px] font-bold tabular-nums ${
                    VERDICT_STYLES[verdict.level].text
                  }`}
                  testID="wind-speed"
                >
                  {formatWindSpeed(currentPoint.windSpeed, region)}
                </Text>
              </View>
              <View>
                <Text
                  className={`font-mono text-[10px] uppercase tracking-[1px] opacity-70 ${
                    VERDICT_STYLES[verdict.level].text
                  }`}
                >
                  Cloud Cover
                </Text>
                <Text
                  className={`text-[15px] font-bold tabular-nums ${
                    VERDICT_STYLES[verdict.level].text
                  }`}
                  testID="cloud-cover"
                >
                  {currentPoint.cloudCover}%
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <Card className="items-center gap-2 p-5">
            <Text
              className="text-center text-[13px] leading-5 text-muted-foreground"
              testID="outside-daylight"
            >
              Outside today's flying hours ({formatHour(today.sunrise)}–
              {formatHour(today.sunset)}). No verdict for an hour nobody would
              fly.
            </Text>
          </Card>
        )}
      </View>

      <View className="px-5 pt-5">
        <SectionTitle className="mb-2.5">Today's Daylight Hours</SectionTitle>
        <FlatList
          data={daylightHours}
          keyExtractor={point => point.time}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2"
          testID="daylight-hours-list"
          renderItem={({ item }) => (
            <Card className="min-w-[64px] items-center p-2.5">
              <Mono className="text-muted-foreground">
                {formatHour(item.time)}
              </Mono>
              <Text className="mt-1.5 text-[13px] font-semibold tabular-nums text-foreground">
                {formatWindSpeed(item.windSpeed, region)}
              </Text>
              <Mono className="mt-0.5 text-muted-foreground">
                {item.precipitationProbability}% rain
              </Mono>
            </Card>
          )}
        />
      </View>

      <View className="px-5 pt-5">
        <SectionTitle className="mb-2.5">Next 3 Days</SectionTitle>
        <View className="gap-2">
          {upcomingDays.map((day, index) => {
            const dayIndex = index + 1;
            const showing = previewDayIndex === dayIndex;
            return (
              <Card key={day.date}>
                <View className="flex-row items-center gap-3 p-3.5">
                  <Text className="w-[74px] text-[13px] font-semibold text-foreground">
                    {day.date}
                  </Text>
                  <View className="flex-1 flex-row gap-4">
                    <Mono className="text-muted-foreground">
                      ↑{formatWindSpeed(day.windSpeedMax, region)}
                    </Mono>
                    <Mono className="text-muted-foreground">
                      ☂{day.precipitationProbabilityMax}%
                    </Mono>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() =>
                      setPreviewDayIndex(showing ? null : dayIndex)
                    }
                    testID={
                      showing ? 'close-preview' : `preview-day-${dayIndex}`
                    }
                    className="border border-border bg-background px-2 py-1.5"
                  >
                    <Text className="font-mono text-[10px] uppercase tracking-[1px] text-foreground">
                      {showing ? 'Hide' : 'Preview'}
                    </Text>
                  </Pressable>
                </View>

                {showing && previewVerdict && (
                  <View
                    className="flex-row items-center gap-2 px-3.5 pb-3"
                    testID="preview-verdict"
                  >
                    <View
                      className={`h-2 w-2 ${
                        VERDICT_STYLES[previewVerdict.level].dot
                      }`}
                    />
                    <Text className="text-[11.5px] text-muted-foreground">
                      {VERDICT_STYLES[previewVerdict.level].label} at first
                      daylight hour
                    </Text>
                  </View>
                )}
              </Card>
            );
          })}
        </View>
      </View>

      {onOpenChecklist && (
        <View className="px-5 pt-5">
          <Pressable
            accessibilityRole="button"
            onPress={onOpenChecklist}
            testID="open-checklist"
          >
            <Card className="flex-row items-center gap-3 p-3.5">
              <Text className="flex-1 text-[13.5px] font-semibold text-foreground">
                Preflight Checklist
              </Text>
              <Text className="font-mono text-[11px] text-muted-foreground">
                ›
              </Text>
            </Card>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}
