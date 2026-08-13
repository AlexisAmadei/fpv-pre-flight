import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from 'react-native';
import { generateId } from '../ids';
import { addFlyingSpot } from '../flyingSpots/flyingSpotRepository';
import { sharedStyles } from './sharedStyles';

export function AddFlyingSpotScreen({ onAdded }: { onAdded: () => void }) {
  const [name, setName] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

  const parsedLatitude = Number(latitude);
  const parsedLongitude = Number(longitude);
  const canSave =
    name.trim().length > 0 &&
    latitude.trim().length > 0 &&
    longitude.trim().length > 0 &&
    !Number.isNaN(parsedLatitude) &&
    !Number.isNaN(parsedLongitude) &&
    parsedLatitude >= -90 &&
    parsedLatitude <= 90 &&
    parsedLongitude >= -180 &&
    parsedLongitude <= 180;

  async function handleSave() {
    if (!canSave) {
      return;
    }
    await addFlyingSpot({
      id: generateId(),
      name: name.trim(),
      coordinates: { latitude: parsedLatitude, longitude: parsedLongitude },
    });
    onAdded();
  }

  return (
    <ScrollView style={styles.container} testID="add-flying-spot-screen">
      <Text style={styles.label}>Name</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="e.g. Ridge Launch"
        testID="spot-name-input"
      />

      <Text style={styles.label}>Latitude</Text>
      <TextInput
        style={styles.input}
        value={latitude}
        onChangeText={setLatitude}
        keyboardType="numeric"
        placeholder="51.5074"
        testID="spot-latitude-input"
      />

      <Text style={styles.label}>Longitude</Text>
      <TextInput
        style={styles.input}
        value={longitude}
        onChangeText={setLongitude}
        keyboardType="numeric"
        placeholder="-0.1278"
        testID="spot-longitude-input"
      />

      <Pressable
        testID="save-flying-spot"
        disabled={!canSave}
        onPress={handleSave}
        style={[
          sharedStyles.primaryButton,
          styles.saveButton,
          !canSave && sharedStyles.primaryButtonDisabled,
        ]}
      >
        <Text style={sharedStyles.primaryButtonText}>Save flying spot</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  label: { fontSize: 14, fontWeight: '600', marginTop: 16, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10 },
  saveButton: { marginTop: 24, marginBottom: 32 },
});
