import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { generateId } from '../ids';
import { addDroneProfile } from '../droneProfiles/droneProfileRepository';
import {
  DEFAULT_THRESHOLDS_BY_WEIGHT_CLASS,
  WEIGHT_CLASSES_BY_KIND,
} from '../weather/weightClasses';
import {
  DJI_DRONE_MODELS,
  findDroneModel,
  thresholdsFromDroneModel,
  weightClassForDroneModel,
  type DroneModel,
  type DroneModelLine,
} from '../weather/droneModels';
import type { DroneKind, VerdictThresholds, WeightClass } from '../weather/types';
import { Button, Card, ChipButton, Field, MetaLabel, SectionTitle } from '../ui/components';
import { WEIGHT_CLASS_LABELS } from '../ui/theme';

const KIND_LABELS: Record<DroneKind, string> = {
  fpv: 'FPV',
  camera: 'Camera',
};

const DRONE_MODEL_LINES: DroneModelLine[] = ['Neo', 'Mini', 'Air', 'Mavic'];

export function CreateDroneProfileScreen({
  onCreated,
}: {
  onCreated: () => void;
}) {
  const [name, setName] = useState('');
  const [kind, setKind] = useState<DroneKind | null>(null);
  const [weightClass, setWeightClass] = useState<WeightClass | null>(null);
  const [droneModelId, setDroneModelId] = useState<string | null>(null);
  // Camera only: whether the pilot has stepped past the model picker into
  // the manual bracket fallback. Irrelevant once a model is chosen.
  const [manualBracket, setManualBracket] = useState(false);

  const droneModel = droneModelId ? findDroneModel(droneModelId) : undefined;
  const showModelPicker = kind === 'camera' && !manualBracket;
  const showBracketPicker = kind === 'fpv' || (kind === 'camera' && manualBracket);
  const weightClassOptions = kind ? WEIGHT_CLASSES_BY_KIND[kind] : [];

  let thresholds: VerdictThresholds | null = null;
  let previewWeightClass: WeightClass | null = null;
  if (droneModel) {
    thresholds = thresholdsFromDroneModel(droneModel);
    previewWeightClass = weightClassForDroneModel(droneModel);
  } else if (weightClass) {
    thresholds = DEFAULT_THRESHOLDS_BY_WEIGHT_CLASS[weightClass];
    previewWeightClass = weightClass;
  }

  const canSave =
    name.trim().length > 0 &&
    kind !== null &&
    (droneModel !== undefined || weightClass !== null);

  function handleChooseKind(nextKind: DroneKind) {
    setKind(nextKind);
    setWeightClass(null);
    setDroneModelId(null);
    setManualBracket(false);
  }

  function handleChooseModel(model: DroneModel) {
    setDroneModelId(model.id);
    setWeightClass(null);
  }

  function handleChooseManualBracket() {
    setManualBracket(true);
    setDroneModelId(null);
  }

  async function handleSave() {
    if (!kind) {
      return;
    }
    if (droneModel) {
      await addDroneProfile({
        id: generateId(),
        name: name.trim(),
        kind,
        weightClass: weightClassForDroneModel(droneModel),
        thresholds: thresholdsFromDroneModel(droneModel),
        droneModelId: droneModel.id,
      });
      onCreated();
      return;
    }
    if (!weightClass) {
      return;
    }
    await addDroneProfile({
      id: generateId(),
      name: name.trim(),
      kind,
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
        <MetaLabel className="mb-1.5">Kind</MetaLabel>
        <View className="flex-row flex-wrap gap-2">
          {(Object.keys(KIND_LABELS) as DroneKind[]).map(option => (
            <ChipButton
              key={option}
              label={KIND_LABELS[option]}
              selected={kind === option}
              onPress={() => handleChooseKind(option)}
              testID={`kind-${option}`}
            />
          ))}
        </View>
      </View>

      {showModelPicker && (
        <View className="gap-3">
          {DRONE_MODEL_LINES.map(line => {
            const models = DJI_DRONE_MODELS.filter(model => model.line === line);
            if (models.length === 0) {
              return null;
            }
            return (
              <View key={line}>
                <MetaLabel className="mb-1.5">{line}</MetaLabel>
                <View className="flex-row flex-wrap gap-2">
                  {models.map(model => (
                    <ChipButton
                      key={model.id}
                      label={model.displayName}
                      selected={droneModelId === model.id}
                      onPress={() => handleChooseModel(model)}
                      testID={`drone-model-${model.id}`}
                    />
                  ))}
                </View>
              </View>
            );
          })}
          <Pressable
            accessibilityRole="button"
            onPress={handleChooseManualBracket}
            testID="choose-weight-class-manually"
            className="items-center py-1"
          >
            <Text className="text-[12.5px] text-foreground underline">
              Choose weight class manually
            </Text>
          </Pressable>
        </View>
      )}

      {showBracketPicker && (
        <View>
          <MetaLabel className="mb-1.5">Weight Class</MetaLabel>
          <View className="flex-row flex-wrap gap-2">
            {weightClassOptions.map(option => {
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
      )}

      {thresholds && previewWeightClass && (
        <Card className="gap-1.5 p-3.5" testID="default-thresholds-preview">
          <SectionTitle className="mb-1">
            {droneModel
              ? `Thresholds — ${droneModel.displayName}`
              : `Default Thresholds — ${WEIGHT_CLASS_LABELS[previewWeightClass]}`}
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
