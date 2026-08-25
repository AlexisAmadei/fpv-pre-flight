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
  estimateCloudBase,
  firstDaylightHourOnDay,
  formatWindSpeed,
  getWeather,
  refreshSpot,
} from '../weather';
import type { WeatherSnapshot } from '../weather';
import type {
  DailyWeatherPoint,
  DroneProfile,
  FlyingSpot,
  HourlyWeatherPoint,
  Verdict,
  VerdictLevel,
} from '../weather/types';
import { Button, Caption, Card, Mono, SectionTitle } from '../ui/components';
import { VERDICT_STYLES, WEIGHT_CLASS_LABELS } from '../ui/theme';
import { SpotMapView } from './SpotMapView';

type WeatherState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; snapshot: WeatherSnapshot };

function formatHour(isoTime: string): string {
  return isoTime.split('T')[1] ?? isoTime;
}

/** Just the hour digits, for the compact daylight strip. */
function formatHourShort(isoTime: string): string {
  return formatHour(isoTime).split(':')[0] ?? '';
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

/**
 * One hard-limit metric in the verdict panel: the reading over its threshold.
 * Wind, gusts and rain each alone force a no-go, so they are given identical
 * weight and identical treatment.
 */
function HardLimitMetric({
  label,
  value,
  threshold,
  unit,
  level,
  testID,
}: {
  label: string;
  value: string;
  threshold: number;
  unit: string;
  level: VerdictLevel;
  testID?: string;
}) {
  const text = VERDICT_STYLES[level].text;
  return (
    <View className="flex-1 pr-3">
      <Text
        className={`text-[9px] font-bold uppercase tracking-[1.4px] ${text}`}
      >
        {label}
      </Text>
      <View className="mt-1 flex-row items-baseline gap-1">
        <Text
          className={`font-mono text-[22px] font-bold tabular-nums ${text}`}
          testID={testID}
        >
          {value}
        </Text>
        <Text
          className={`font-mono text-[11px] tabular-nums ${text} opacity-60`}
        >
          / {threshold}
        </Text>
      </View>
      <Text
        className={`mt-0.5 text-[9px] uppercase tracking-[1.2px] ${text} opacity-70`}
      >
        {unit}
      </Text>
    </View>
  );
}

/**
 * An advisory reading shown beside the hard limits but visibly demoted — UV
 * never forces a no-go on its own and cloud cover never counts at all, so both
 * say so inline rather than relying on position to carry the distinction.
 */
function AdvisoryMetric({
  label,
  value,
  note,
  level,
  testID,
}: {
  label: string;
  value: string;
  note: string;
  level: VerdictLevel;
  testID?: string;
}) {
  const text = VERDICT_STYLES[level].text;
  return (
    <View className="flex-row items-baseline gap-2">
      <Text
        className={`text-[9px] uppercase tracking-[1.4px] ${text} opacity-80`}
      >
        {label}
      </Text>
      <Text
        className={`font-mono text-[14px] font-bold tabular-nums ${text}`}
        testID={testID}
      >
        {value}
      </Text>
      <Text
        className={`text-[8px] uppercase tracking-[1.2px] ${text} opacity-65`}
      >
        {note}
      </Text>
    </View>
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
  const verdict: Verdict | null =
    currentPoint && droneProfile
      ? computeVerdict(currentPoint, droneProfile.thresholds)
      : null;
  const daylightHours = currentDaylightHours(forecast);
  const upcomingDays = forecast.daily.slice(1, 4);

  const previewPoint =
    previewDayIndex !== null
      ? firstDaylightHourOnDay(forecast, previewDayIndex)
      : undefined;
  const previewVerdict =
    previewPoint && droneProfile
      ? computeVerdict(previewPoint, droneProfile.thresholds)
      : null;

  // Optional: the screen now renders past the verdict even with no drone
  // profile, so an empty forecast must not take the daylight sections down.
  const today: DailyWeatherPoint | undefined = forecast.daily[0];
  const cloudBase = currentPoint ? estimateCloudBase(currentPoint) : undefined;

  /**
   * The per-hour tick in the daylight strip. Colouring each hour by its own
   * verdict turns the strip into a window-finder: the pilot scans for the
   * green run rather than reading eight sets of numbers.
   */
  function hourLevel(point: HourlyWeatherPoint): VerdictLevel | null {
    return droneProfile
      ? computeVerdict(point, droneProfile.thresholds).level
      : null;
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="pb-8"
      testID="flying-spot-detail-screen"
    >
      <View className="flex-row items-start justify-between gap-3 border-b border-border px-5 pb-3.5 pt-4">
        <View className="min-w-0 flex-1">
          <Text
            className="text-[17px] font-bold tracking-[-0.2px] text-foreground"
            numberOfLines={1}
          >
            {spot.name}
          </Text>
          <Mono className="mt-0.5 text-muted-foreground">
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

      {/*
        Stale is announced above the verdict, not tucked inside it: a cached
        reading is a caveat on everything below, not a property of the badge
        (ADR-0007 — held data is shown, never silently treated as current).
      */}
      {stale && (
        <View
          className="flex-row items-center justify-between gap-3 bg-foreground px-5 py-2"
          testID="stale-banner"
        >
          <Text
            className="text-[10px] font-extrabold uppercase tracking-[1.6px] text-background"
            testID="stale-label"
          >
            Stale · last good fetch
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Retry the forecast fetch"
            onPress={handleRefresh}
            disabled={refreshing}
            testID="retry-stale"
            className={`border border-background px-2 py-1 ${
              refreshing ? 'opacity-40' : ''
            }`}
          >
            <Text className="font-mono text-[10px] uppercase tracking-[1px] text-background">
              Retry
            </Text>
          </Pressable>
        </View>
      )}

      <View className="mx-5 mt-4 border border-border">
        <SpotMapView coordinates={spot.coordinates} testID="spot-map" />
      </View>

      {profiles.length > 0 && (
        <View className="px-5 pt-5">
          <View className="mb-2 flex-row items-center justify-between">
            <SectionTitle>Flying Today</SectionTitle>
            {onManageDrones && (
              <Pressable
                accessibilityRole="button"
                onPress={onManageDrones}
                testID="manage-drones"
              >
                <Text className="border-b border-primary pb-px font-mono text-[10px] uppercase tracking-[1px] text-foreground">
                  Manage
                </Text>
              </Pressable>
            )}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              {profiles.map(profile => {
                const selected = profile.id === droneProfile?.id;
                return (
                  <Pressable
                    key={profile.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => handleSelectDrone(profile.id)}
                    testID={`select-drone-${profile.id}`}
                    className={`min-w-[104px] border px-3.5 py-2.5 ${
                      selected
                        ? 'border-primary bg-primary'
                        : 'border-border bg-card'
                    }`}
                  >
                    <Text
                      className={`text-[13px] font-bold ${
                        selected ? 'text-primary-foreground' : 'text-foreground'
                      }`}
                    >
                      {profile.name}
                    </Text>
                    <Text
                      className={`mt-0.5 text-[9px] uppercase tracking-[1.3px] ${
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

      {/*
        The verdict panel. Three withholding cases share one shape — no drone,
        outside daylight, and a genuine verdict — because each must be equally
        legible; a withheld verdict is an answer, not a degraded state.
      */}
      <View className="pt-5">
        {droneProfile === null ? (
          <View
            className="mx-5 border-b border-t-[3px] border-b-border border-t-foreground bg-card p-4"
            testID="no-drone-verdict"
          >
            <Text className="text-[22px] font-extrabold tracking-[-0.3px] text-muted-foreground">
              NO VERDICT
            </Text>
            <Text className="mt-2 text-[12px] font-semibold text-foreground">
              Nothing to compute against
            </Text>
            <Caption className="mt-2">
              Limits are per drone — wind, gusts and rain thresholds come from
              the aircraft you fly. Add one and this becomes a verdict.
            </Caption>
            <Button
              label="Add a drone"
              onPress={onCreateDroneProfile}
              testID="prompt-create-drone-profile"
              className="mt-3.5"
            />
            <Caption className="mt-3">
              Weather for this spot is still fetched and shown below — only the
              go / no-go is withheld.
            </Caption>
          </View>
        ) : verdict && currentPoint ? (
          <View
            className={VERDICT_STYLES[verdict.level].surface}
            testID="verdict-badge"
          >
            <View className="flex-row items-start justify-between gap-3 px-5 pb-2.5 pt-3.5">
              <View className="min-w-0 flex-1">
                <Text
                  className={`text-[26px] font-extrabold tracking-[-0.5px] ${
                    VERDICT_STYLES[verdict.level].text
                  }`}
                  testID="verdict-label"
                >
                  {VERDICT_STYLES[verdict.level].label}
                </Text>
                <Text
                  className={`mt-1.5 text-[11px] font-semibold ${
                    VERDICT_STYLES[verdict.level].text
                  }`}
                >
                  {verdict.level === 'green'
                    ? `Within every hard limit for ${droneProfile.name}`
                    : verdict.level === 'yellow'
                    ? `Close to a limit for ${droneProfile.name}`
                    : `Past a hard limit for ${droneProfile.name}`}
                </Text>
              </View>
              <View className="flex-none items-end">
                <Text
                  className={`text-[9px] uppercase tracking-[1.3px] ${
                    VERDICT_STYLES[verdict.level].text
                  } opacity-70`}
                >
                  Computed for
                </Text>
                <Text
                  className={`mt-0.5 text-[11px] font-bold ${
                    VERDICT_STYLES[verdict.level].text
                  }`}
                >
                  {droneProfile.name}
                </Text>
                <Text
                  className={`mt-1 font-mono text-[10px] tabular-nums ${
                    VERDICT_STYLES[verdict.level].text
                  } opacity-75`}
                  testID="verdict-hour"
                >
                  {formatHour(currentPoint.time)}
                </Text>
              </View>
            </View>

            <View className="mt-1 flex-row px-5">
              <HardLimitMetric
                label="Wind"
                value={String(Math.round(currentPoint.windSpeed))}
                threshold={droneProfile.thresholds.windSpeedMax}
                unit={formatWindSpeed(currentPoint.windSpeed, region)
                  .split(' ')
                  .slice(1)
                  .join(' ')}
                level={verdict.level}
                testID="wind-speed"
              />
              <HardLimitMetric
                label="Gusts"
                value={String(Math.round(currentPoint.windGusts))}
                threshold={droneProfile.thresholds.windGustsMax}
                unit={formatWindSpeed(currentPoint.windGusts, region)
                  .split(' ')
                  .slice(1)
                  .join(' ')}
                level={verdict.level}
                testID="wind-gusts"
              />
              <HardLimitMetric
                label="Rain"
                value={String(currentPoint.precipitationProbability)}
                threshold={droneProfile.thresholds.precipitationProbabilityMax}
                unit="%"
                level={verdict.level}
                testID="precipitation"
              />
            </View>

            <Text
              className={`px-5 pt-2.5 text-[9px] uppercase tracking-[1.4px] ${
                VERDICT_STYLES[verdict.level].text
              } opacity-70`}
            >
              Hard limits · any one alone forces no-go
            </Text>

            <View className="mx-5 mt-3 flex-row items-center gap-5 border-t border-black/20 pb-3.5 pt-2.5">
              <AdvisoryMetric
                label="UV"
                value={`${Math.round(currentPoint.uvIndex)} / ${
                  droneProfile.thresholds.uvIndexMax
                }`}
                note="Advisory only"
                level={verdict.level}
                testID="uv-index"
              />
              <AdvisoryMetric
                label="Cloud"
                value={`${currentPoint.cloudCover}%`}
                note="Info · no effect"
                level={verdict.level}
                testID="cloud-cover"
              />
            </View>
          </View>
        ) : (
          <View
            className="mx-5 border-b border-t-[3px] border-b-border border-t-foreground bg-card p-4"
            testID="outside-daylight"
          >
            <Text className="text-[22px] font-extrabold tracking-[-0.3px] text-muted-foreground">
              NO VERDICT
            </Text>
            <Text className="mt-2 text-[12px] font-semibold text-foreground">
              Outside today's daylight window
            </Text>
            {today && (
              <View className="mt-3 flex-row items-baseline gap-2 border-t border-border pt-2.5">
                <Text className="text-[9px] uppercase tracking-[1.4px] text-muted-foreground">
                  Window
                </Text>
                <Text className="font-mono text-[16px] font-bold tabular-nums text-foreground">
                  {formatHour(today.sunrise)} – {formatHour(today.sunset)}
                </Text>
              </View>
            )}
            <Caption className="mt-2.5">
              Verdicts are only computed inside the sunrise-sunset window.
              Rather than fabricate one for the dark, Pre-Flight shows none.
            </Caption>
          </View>
        )}
      </View>

      {/*
        EstimatedCloudBase — dashed throughout, because the border is the
        cheapest way to say "derived, not measured" before the caption does.
      */}
      {cloudBase && (
        <View className="px-5 pt-5">
          <View className="flex-row items-baseline justify-between pb-2">
            <SectionTitle>Estimated Cloud Base</SectionTitle>
            <Text className="border border-dashed border-border px-1.5 py-0.5 text-[9px] uppercase tracking-[1.4px] text-muted-foreground">
              Estimate
            </Text>
          </View>
          <View
            className="border border-dashed border-border p-3.5"
            testID="cloud-base"
          >
            <View className="flex-row items-end justify-between gap-4">
              <View>
                <View className="flex-row items-baseline">
                  <Text
                    className="font-mono text-[22px] font-semibold tabular-nums text-foreground opacity-75"
                    testID="cloud-base-height"
                  >
                    ~ {cloudBase.heightAgl}
                  </Text>
                  <Text className="font-mono text-[11px] tracking-[1px] text-muted-foreground">
                    {' '}
                    M AGL
                  </Text>
                </View>
                <Mono className="mt-0.5 text-muted-foreground">
                  range {cloudBase.rangeLow} – {cloudBase.rangeHigh} m
                </Mono>
              </View>
              <View className="items-end">
                <Text className="text-[9px] uppercase tracking-[1.4px] text-muted-foreground">
                  Low cloud
                </Text>
                <Mono className="mt-0.5 text-[14px] text-foreground">
                  {cloudBase.lowCloudCover}%
                </Mono>
              </View>
            </View>
            <Caption className="mt-2.5">
              Derived from the temperature / dew-point spread, never measured.
              Least reliable in fog and stratus — exactly the conditions where a
              low base matters. Not a limit.
            </Caption>
          </View>
        </View>
      )}

      {today && daylightHours.length > 0 && (
        <View className="pt-5">
          <View className="flex-row items-baseline justify-between px-5 pb-2">
            <SectionTitle>Today's Daylight Hours</SectionTitle>
            <Mono className="text-muted-foreground">
              {formatHour(today.sunrise)} – {formatHour(today.sunset)}
            </Mono>
          </View>
          <FlatList
            data={daylightHours}
            keyExtractor={point => point.time}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-1.5 px-5"
            testID="daylight-hours-list"
            renderItem={({ item }) => {
              const level = hourLevel(item);
              const isCurrent = item.time === currentPoint?.time;
              return (
                <View
                  className={`w-[52px] border bg-card ${
                    isCurrent ? 'border-primary' : 'border-border'
                  }`}
                >
                  {/* The verdict for this hour, as a colour bar rather than a repeated badge. */}
                  <View
                    className={`h-[3px] ${
                      level ? VERDICT_STYLES[level].dot : 'bg-border'
                    }`}
                  />
                  <View className="items-center py-2">
                    <Text className="font-mono text-[12px] font-bold tabular-nums text-foreground">
                      {formatHourShort(item.time)}
                    </Text>
                    <Text className="mt-1 font-mono text-[11px] tabular-nums text-foreground">
                      {Math.round(item.windSpeed)}
                    </Text>
                    <Text className="mt-0.5 font-mono text-[10px] tabular-nums text-muted-foreground">
                      {item.precipitationProbability}%
                    </Text>
                  </View>
                </View>
              );
            }}
          />
        </View>
      )}

      <View className="px-5 pt-5">
        <SectionTitle className="mb-2">Next 3 Days</SectionTitle>
        <Card>
          {upcomingDays.map((day, index) => {
            const dayIndex = index + 1;
            const showing = previewDayIndex === dayIndex;
            return (
              <View
                key={day.date}
                className={index > 0 ? 'border-t border-border' : ''}
              >
                <View className="flex-row items-center gap-3 px-3.5 py-2.5">
                  <Text className="w-[64px] text-[12px] font-semibold text-foreground">
                    {day.date}
                  </Text>
                  <View className="flex-1 flex-row gap-3.5">
                    <Text className="font-mono text-[12px] tabular-nums text-foreground">
                      {Math.round(day.windSpeedMax)}{' '}
                      <Text className="text-[9px] tracking-[1px] text-muted-foreground">
                        {formatWindSpeed(day.windSpeedMax, region)
                          .split(' ')
                          .slice(1)
                          .join(' ')
                          .toUpperCase()}
                      </Text>
                    </Text>
                    <Text className="font-mono text-[12px] tabular-nums text-foreground">
                      {day.precipitationProbabilityMax}{' '}
                      <Text className="text-[9px] tracking-[1px] text-muted-foreground">
                        %
                      </Text>
                    </Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() =>
                      setPreviewDayIndex(showing ? null : dayIndex)
                    }
                    testID={
                      showing ? 'close-preview' : `preview-day-${dayIndex}`
                    }
                  >
                    <Text className="border-b border-primary pb-px text-[9px] uppercase tracking-[1.4px] text-foreground">
                      {showing ? 'Hide' : 'Preview'}
                    </Text>
                  </Pressable>
                </View>

                {showing && previewVerdict && previewPoint && (
                  <View
                    className="flex-row items-center gap-2 border-t border-border py-2 pl-3.5 pr-3.5"
                    testID="preview-verdict"
                  >
                    <View
                      className={`h-2.5 w-2.5 ${
                        VERDICT_STYLES[previewVerdict.level].dot
                      }`}
                    />
                    <Text className="flex-1 text-[11px] text-muted-foreground">
                      First daylight hour {formatHour(previewPoint.time)} —{' '}
                      <Text className="font-semibold text-foreground">
                        {VERDICT_STYLES[previewVerdict.level].label}
                      </Text>{' '}
                      for {droneProfile?.name}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </Card>
      </View>

      {onOpenChecklist && (
        <View className="px-5 pt-5">
          <Pressable
            accessibilityRole="button"
            onPress={onOpenChecklist}
            testID="open-checklist"
          >
            <Card className="flex-row items-center justify-between gap-3 p-3.5">
              <Text className="text-[11px] font-bold uppercase tracking-[1.4px] text-foreground">
                Preflight Checklist
              </Text>
              <Text className="text-[9px] uppercase tracking-[1.4px] text-muted-foreground">
                Open
              </Text>
            </Card>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}
