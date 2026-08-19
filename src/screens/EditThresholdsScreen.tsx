import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  deleteDroneProfile,
  getActiveDroneProfile,
  getActiveDroneProfileId,
  setActiveDroneProfile,
  updateDroneProfile,
} from '../droneProfiles/droneProfileRepository';
import { evictChecklist } from '../checklists/checklistRepository';
import { DEFAULT_THRESHOLDS_BY_WEIGHT_CLASS } from '../weather/weightClasses';
import type { DroneProfile, VerdictThresholds } from '../weather/types';
import { Button, Card, MetaLabel, Mono } from '../ui/components';
import { WEIGHT_CLASS_LABELS } from '../ui/theme';

const METRICS: { key: keyof VerdictThresholds; label: string; unit: string }[] =
  [
    { key: 'windSpeedMax', label: 'Wind speed', unit: 'km/h' },
    { key: 'windGustsMax', label: 'Gust speed', unit: 'km/h' },
    {
      key: 'precipitationProbabilityMax',
      label: 'Rain probability',
      unit: '%',
    },
    { key: 'uvIndexMax', label: 'UV index', unit: 'index' },
  ];

type ThresholdText = Record<keyof VerdictThresholds, string>;

function textFromThresholds(thresholds: VerdictThresholds): ThresholdText {
  return {
    windSpeedMax: String(thresholds.windSpeedMax),
    windGustsMax: String(thresholds.windGustsMax),
    precipitationProbabilityMax: String(thresholds.precipitationProbabilityMax),
    uvIndexMax: String(thresholds.uvIndexMax),
  };
}

/**
 * Edits one DroneProfile's Thresholds. `profile` is passed in when arriving
 * from the fleet screen; without one it falls back to whichever drone is
 * currently flying, which is how the spot list's shortcut reaches this screen.
 */
export function EditThresholdsScreen({
  profile: initialProfile,
  onDone,
}: {
  profile?: DroneProfile;
  onDone: () => void;
}) {
  // undefined = still loading, null = no profile saved (or failed to load)
  const [profile, setProfile] = useState<DroneProfile | null | undefined>(
    initialProfile ?? undefined,
  );
  // Text is edited freely (so clearing a field doesn't snap to 0); only
  // parsed into the numeric thresholds on save.
  const [text, setText] = useState<ThresholdText | null>(
    initialProfile ? textFromThresholds(initialProfile.thresholds) : null,
  );
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    getActiveDroneProfileId().then(setActiveId);
  }, []);

  useEffect(() => {
    if (initialProfile) {
      return;
    }
    getActiveDroneProfile()
      .then(loaded => {
        setProfile(loaded);
        setText(loaded ? textFromThresholds(loaded.thresholds) : null);
      })
      .catch(() => {
        setProfile(null);
        setText(null);
      });
  }, [initialProfile]);

  if (profile === undefined) {
    return <ActivityIndicator className="flex-1" testID="thresholds-loading" />;
  }

  if (profile === null || text === null) {
    return (
      <View className="flex-1 bg-background px-5">
        <Text className="text-[13px] text-muted-foreground" testID="no-profile-message">
          Create a drone profile first.
        </Text>
      </View>
    );
  }

  const saved = profile;

  function resetMetric(key: keyof VerdictThresholds) {
    const defaults = DEFAULT_THRESHOLDS_BY_WEIGHT_CLASS[saved.weightClass];
    setText(current =>
      current ? { ...current, [key]: String(defaults[key]) } : current,
    );
  }

  async function handleSave() {
    const thresholds = { ...saved.thresholds };
    for (const metric of METRICS) {
      const parsed = Number(text![metric.key]);
      if (text![metric.key].trim() !== '' && !Number.isNaN(parsed)) {
        thresholds[metric.key] = parsed;
      }
    }
    await updateDroneProfile({ ...saved, thresholds });
    onDone();
  }

  function handleDelete() {
    Alert.alert('Delete drone', `Delete "${saved.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteDroneProfile(saved.id);
          await evictChecklist(saved.id);
          onDone();
        },
      },
    ]);
  }

  async function handleFlyThis() {
    await setActiveDroneProfile(saved.id);
    setActiveId(saved.id);
  }

  const defaults = DEFAULT_THRESHOLDS_BY_WEIGHT_CLASS[profile.weightClass];
  const isActive = profile.id === activeId;

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="px-5 pb-8 gap-4"
      testID="edit-thresholds-screen"
    >
      <Card className="flex-row items-center justify-between gap-3 p-3.5">
        <View className="min-w-0">
          <Text className="text-[15px] font-bold text-foreground">
            {profile.name}
          </Text>
          <Mono className="mt-0.5 text-muted-foreground">
            {WEIGHT_CLASS_LABELS[profile.weightClass]}
          </Mono>
        </View>
        {isActive ? (
          <View className="bg-primary px-1.5 py-1">
            <Text className="font-mono text-[9px] uppercase tracking-[1px] text-primary-foreground">
              Flying
            </Text>
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            onPress={handleFlyThis}
            testID="fly-this-drone"
            className="border border-border bg-background px-2 py-1.5"
          >
            <Text className="font-mono text-[9px] uppercase tracking-[1px] text-foreground">
              Fly this
            </Text>
          </Pressable>
        )}
      </Card>

      <MetaLabel>Thresholds — override any value</MetaLabel>

      {METRICS.map(metric => {
        const isDefault = Number(text[metric.key]) === defaults[metric.key];
        return (
          <Card key={metric.key} className="p-3.5">
            <View className="mb-2 flex-row items-center justify-between">
              <Text className="text-[13px] font-semibold text-foreground">
                {metric.label}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: isDefault }}
                disabled={isDefault}
                onPress={() => resetMetric(metric.key)}
                testID={`threshold-reset-${metric.key}`}
                className={isDefault ? 'opacity-30' : ''}
              >
                <Text className="font-mono text-[10px] uppercase tracking-[1px] text-muted-foreground">
                  Reset
                </Text>
              </Pressable>
            </View>
            <View className="flex-row items-center gap-2">
              <TextInput
                className="flex-1 border border-input bg-background px-3 py-2 text-[14px] text-foreground"
                keyboardType="numeric"
                value={text[metric.key]}
                onChangeText={value =>
                  setText(current =>
                    current ? { ...current, [metric.key]: value } : current,
                  )
                }
                testID={`threshold-input-${metric.key}`}
              />
              <Mono className="text-muted-foreground">{metric.unit}</Mono>
            </View>
          </Card>
        );
      })}

      <Button label="Save Thresholds" onPress={handleSave} testID="save-thresholds" />

      <Pressable
        accessibilityRole="button"
        onPress={handleDelete}
        testID="delete-drone"
        className="items-center py-1"
      >
        <Text className="text-[12.5px] text-destructive underline">
          Delete this drone
        </Text>
      </Pressable>
    </ScrollView>
  );
}
