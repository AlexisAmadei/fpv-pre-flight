import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  getDroneProfile,
  saveDroneProfile,
} from '../droneProfiles/droneProfileRepository';
import { DEFAULT_THRESHOLDS_BY_WEIGHT_CLASS } from '../weather/weightClasses';
import type { DroneProfile, VerdictThresholds } from '../weather/types';
import { sharedStyles } from './sharedStyles';

const METRICS: { key: keyof VerdictThresholds; label: string; unit: string }[] =
  [
    { key: 'windSpeedMax', label: 'Max wind speed', unit: 'km/h' },
    { key: 'windGustsMax', label: 'Max gusts', unit: 'km/h' },
    {
      key: 'precipitationProbabilityMax',
      label: 'Max rain probability',
      unit: '%',
    },
    { key: 'uvIndexMax', label: 'Max UV index', unit: '' },
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

export function EditThresholdsScreen({ onDone }: { onDone: () => void }) {
  // undefined = still loading, null = no profile saved (or failed to load)
  const [profile, setProfile] = useState<DroneProfile | null | undefined>(
    undefined,
  );
  // Text is edited freely (so clearing a field doesn't snap to 0); only
  // parsed into the numeric thresholds on save.
  const [text, setText] = useState<ThresholdText | null>(null);

  useEffect(() => {
    getDroneProfile()
      .then(loaded => {
        setProfile(loaded);
        setText(loaded ? textFromThresholds(loaded.thresholds) : null);
      })
      .catch(() => {
        setProfile(null);
        setText(null);
      });
  }, []);

  if (profile === undefined) {
    return (
      <ActivityIndicator style={styles.loading} testID="thresholds-loading" />
    );
  }

  if (profile === null || text === null) {
    return (
      <View style={styles.container}>
        <Text testID="no-profile-message">Create a drone profile first.</Text>
      </View>
    );
  }

  function resetMetric(key: keyof VerdictThresholds) {
    const defaults = DEFAULT_THRESHOLDS_BY_WEIGHT_CLASS[profile!.weightClass];
    setText(current =>
      current ? { ...current, [key]: String(defaults[key]) } : current,
    );
  }

  async function handleSave() {
    const thresholds = { ...profile!.thresholds };
    for (const metric of METRICS) {
      const parsed = Number(text![metric.key]);
      if (text![metric.key].trim() !== '' && !Number.isNaN(parsed)) {
        thresholds[metric.key] = parsed;
      }
    }
    await saveDroneProfile({ ...profile!, thresholds });
    onDone();
  }

  const defaults = DEFAULT_THRESHOLDS_BY_WEIGHT_CLASS[profile.weightClass];

  return (
    <ScrollView style={styles.container} testID="edit-thresholds-screen">
      <Text style={styles.title}>{profile.name}</Text>
      {METRICS.map(metric => {
        const isDefault = Number(text[metric.key]) === defaults[metric.key];
        return (
          <View key={metric.key} style={styles.row}>
            <Text style={styles.label}>
              {metric.label} {metric.unit ? `(${metric.unit})` : ''}
            </Text>
            <View style={styles.rowInputs}>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={text[metric.key]}
                onChangeText={value =>
                  setText(current =>
                    current ? { ...current, [metric.key]: value } : current,
                  )
                }
                testID={`threshold-input-${metric.key}`}
              />
              <Pressable
                disabled={isDefault}
                onPress={() => resetMetric(metric.key)}
                testID={`threshold-reset-${metric.key}`}
                style={[
                  styles.resetButton,
                  isDefault && styles.resetButtonDisabled,
                ]}
              >
                <Text style={styles.resetButtonText}>Reset</Text>
              </Pressable>
            </View>
          </View>
        );
      })}
      <Pressable
        style={[sharedStyles.primaryButton, styles.saveButton]}
        onPress={handleSave}
        testID="save-thresholds"
      >
        <Text style={sharedStyles.primaryButtonText}>Save</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  loading: { flex: 1 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  row: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 6 },
  rowInputs: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
  },
  resetButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  resetButtonDisabled: { opacity: 0.3 },
  resetButtonText: { color: '#222' },
  saveButton: { marginTop: 8, marginBottom: 32 },
});
