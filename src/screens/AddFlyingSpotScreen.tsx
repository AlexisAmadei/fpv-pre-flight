import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { generateId } from '../ids';
import { addFlyingSpot } from '../flyingSpots/flyingSpotRepository';
import {
  getCurrentPosition,
  LocationPermissionDeniedError,
} from '../location/deviceLocation';
import type { Coordinates } from '../weather/types';
import { SpotMapView } from './SpotMapView';
import { sharedStyles } from './sharedStyles';

type LocationState =
  | { status: 'loading' }
  | { status: 'permission-denied' }
  | { status: 'error' }
  | { status: 'ready'; coordinates: Coordinates };

export function AddFlyingSpotScreen({ onAdded }: { onAdded: () => void }) {
  const [name, setName] = useState('');
  const [locationState, setLocationState] = useState<LocationState>({
    status: 'loading',
  });

  const fetchLocation = useCallback(async () => {
    setLocationState({ status: 'loading' });
    try {
      const coordinates = await getCurrentPosition();
      setLocationState({ status: 'ready', coordinates });
    } catch (error) {
      if (error instanceof LocationPermissionDeniedError) {
        setLocationState({ status: 'permission-denied' });
      } else {
        setLocationState({ status: 'error' });
      }
    }
  }, []);

  useEffect(() => {
    fetchLocation();
  }, [fetchLocation]);

  // Denying permission sends the pilot to the OS settings screen (below);
  // re-check automatically when they come back instead of leaving them
  // stuck on this screen after granting it.
  useEffect(() => {
    if (locationState.status !== 'permission-denied') {
      return;
    }
    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') {
        fetchLocation();
      }
    });
    return () => subscription.remove();
  }, [locationState.status, fetchLocation]);

  function handleCoordinatesChange(coordinates: Coordinates) {
    setLocationState({ status: 'ready', coordinates });
  }

  const canSave = locationState.status === 'ready' && name.trim().length > 0;

  async function handleSave() {
    if (locationState.status !== 'ready' || !canSave) {
      return;
    }
    await addFlyingSpot({
      id: generateId(),
      name: name.trim(),
      coordinates: locationState.coordinates,
    });
    onAdded();
  }

  if (locationState.status === 'loading') {
    return (
      <ActivityIndicator style={styles.loading} testID="location-loading" />
    );
  }

  if (locationState.status === 'permission-denied') {
    return (
      <View style={styles.container} testID="location-permission-denied">
        <Text style={styles.message}>
          Location access is needed to add a flying spot. Grant permission in
          your device settings.
        </Text>
        <Pressable
          style={sharedStyles.primaryButton}
          onPress={() => Linking.openSettings()}
          testID="open-location-settings"
        >
          <Text style={sharedStyles.primaryButtonText}>Open Settings</Text>
        </Pressable>
      </View>
    );
  }

  if (locationState.status === 'error') {
    return (
      <View style={styles.container} testID="location-error">
        <Text style={styles.message}>
          Couldn't determine your location.
        </Text>
        <Pressable
          style={sharedStyles.primaryButton}
          onPress={fetchLocation}
          testID="retry-location"
        >
          <Text style={sharedStyles.primaryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
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

      <SpotMapView
        coordinates={locationState.coordinates}
        onCoordinatesChange={handleCoordinatesChange}
        testID="spot-map"
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
  loading: { flex: 1 },
  message: { fontSize: 16, marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', marginTop: 16, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10 },
  saveButton: { marginTop: 24, marginBottom: 32 },
});
