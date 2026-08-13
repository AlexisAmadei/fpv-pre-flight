import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { generateId } from '../ids';
import { saveDroneProfile } from '../droneProfiles/droneProfileRepository';
import { DEFAULT_THRESHOLDS_BY_WEIGHT_CLASS } from '../weather/weightClasses';
import type { WeightClass } from '../weather/types';
import { sharedStyles } from './sharedStyles';

const WEIGHT_CLASSES: { value: WeightClass; label: string }[] = [
  { value: 'tiny-whoop', label: 'Tiny whoop' },
  { value: '3-inch', label: '3"' },
  { value: '5-inch', label: '5"' },
  { value: '7-inch-plus', label: '7"+ freestyle' },
  { value: 'long-range', label: 'Long-range' },
];

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
    await saveDroneProfile({
      id: generateId(),
      name: name.trim(),
      weightClass,
      thresholds: DEFAULT_THRESHOLDS_BY_WEIGHT_CLASS[weightClass],
    });
    onCreated();
  }

  return (
    <ScrollView style={styles.container} testID="create-drone-profile-screen">
      <Text style={styles.label}>Drone name</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="e.g. My Freestyle Quad"
        testID="drone-name-input"
      />

      <Text style={styles.label}>Weight class</Text>
      <View style={styles.chipRow}>
        {WEIGHT_CLASSES.map(option => (
          <Pressable
            key={option.value}
            testID={`weight-class-${option.value}`}
            onPress={() => setWeightClass(option.value)}
            style={[
              styles.chip,
              weightClass === option.value && styles.chipSelected,
            ]}
          >
            <Text
              style={
                weightClass === option.value
                  ? styles.chipTextSelected
                  : styles.chipText
              }
            >
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {thresholds && (
        <View style={styles.thresholds} testID="default-thresholds-preview">
          <Text style={styles.sectionTitle}>Default thresholds</Text>
          <Text>Wind: {thresholds.windSpeedMax} km/h</Text>
          <Text>Gusts: {thresholds.windGustsMax} km/h</Text>
          <Text>
            Rain probability: {thresholds.precipitationProbabilityMax}%
          </Text>
          <Text>UV index: {thresholds.uvIndexMax}</Text>
        </View>
      )}

      <Pressable
        testID="save-drone-profile"
        disabled={!canSave}
        onPress={handleSave}
        style={[
          sharedStyles.primaryButton,
          styles.saveButton,
          !canSave && sharedStyles.primaryButtonDisabled,
        ]}
      >
        <Text style={sharedStyles.primaryButtonText}>Save drone profile</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  label: { fontSize: 14, fontWeight: '600', marginTop: 16, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  chipSelected: { backgroundColor: '#2f6fed', borderColor: '#2f6fed' },
  chipText: { color: '#222' },
  chipTextSelected: { color: '#fff' },
  thresholds: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f2f2f2',
  },
  sectionTitle: { fontWeight: '600', marginBottom: 4 },
  saveButton: { marginTop: 24, marginBottom: 32 },
});
