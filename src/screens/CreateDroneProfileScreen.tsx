import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { generateId } from '../ids';
import { addDroneProfile } from '../droneProfiles/droneProfileRepository';
import { DEFAULT_THRESHOLDS_BY_WEIGHT_CLASS } from '../weather/weightClasses';
import type { WeightClass } from '../weather/types';
import { Button, Card, Field, MetaLabel, SectionTitle } from '../ui/components';
import { WEIGHT_CLASS_LABELS } from '../ui/theme';

const WEIGHT_CLASSES = Object.keys(WEIGHT_CLASS_LABELS) as WeightClass[];

export function CreateDroneProfileScreen({
  onCreated,
}: {
  onCreated: () => void;
}) {
  const [name, setName] = useState('');
  const [weightClass, setWeightClass] = useState<WeightClass | null>(null);

  const thresholds = weightClass
    ? DEFAULT_THRESHOLDS_BY_WEIGHT_CLASS[weightClass]
    : null;
  const canSave = name.trim().length > 0 && weightClass !== null;

  async function handleSave() {
    if (!weightClass) {
      return;
    }
    await addDroneProfile({
      id: generateId(),
      name: name.trim(),
      weightClass,
      thresholds: DEFAULT_THRESHOLDS_BY_WEIGHT_CLASS[weightClass],
    });
    onCreated();
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="px-5 pb-8 gap-4"
      testID="create-drone-profile-screen"
    >
      <Field
        label="Name"
        value={name}
        onChangeText={setName}
        placeholder="e.g. My Freestyle Quad"
        testID="drone-name-input"
      />

      <View>
        <MetaLabel className="mb-1.5">Weight Class</MetaLabel>
        <View className="flex-row flex-wrap gap-2">
          {WEIGHT_CLASSES.map(option => {
            const selected = weightClass === option;
            return (
              <Pressable
                key={option}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                testID={`weight-class-${option}`}
                onPress={() => setWeightClass(option)}
                className={`border px-3 py-2 ${
                  selected
                    ? 'border-primary bg-primary'
                    : 'border-border bg-background'
                }`}
              >
                <Text
                  className={`text-[12px] font-semibold ${
                    selected ? 'text-primary-foreground' : 'text-foreground'
                  }`}
                >
                  {WEIGHT_CLASS_LABELS[option]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {thresholds && (
        <Card className="gap-1.5 p-3.5" testID="default-thresholds-preview">
          <SectionTitle className="mb-1">
            Default Thresholds — {WEIGHT_CLASS_LABELS[weightClass!]}
          </SectionTitle>
          <ThresholdRow
            label="Wind speed"
            value={`${thresholds.windSpeedMax} km/h`}
          />
          <ThresholdRow
            label="Gust speed"
            value={`${thresholds.windGustsMax} km/h`}
          />
          <ThresholdRow
            label="Rain probability"
            value={`${thresholds.precipitationProbabilityMax}%`}
          />
          <ThresholdRow label="UV index" value={`${thresholds.uvIndexMax}`} />
        </Card>
      )}

      <Button
        label="Save Drone"
        onPress={handleSave}
        disabled={!canSave}
        testID="save-drone-profile"
      />
    </ScrollView>
  );
}

function ThresholdRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between">
      <Text className="text-[12.5px] text-foreground">{label}</Text>
      <Text className="text-[12.5px] font-semibold tabular-nums text-foreground">
        {value}
      </Text>
    </View>
  );
}
