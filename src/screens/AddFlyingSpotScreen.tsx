import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  Linking,
  ScrollView,
  Text,
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
import { Button, Field, MetaLabel, Mono } from '../ui/components';

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
      <View className="flex-1 items-center justify-center gap-4 bg-background">
        <ActivityIndicator testID="location-loading" />
        <Text className="text-[13px] text-muted-foreground">
          Getting your location…
        </Text>
      </View>
    );
  }

  if (locationState.status === 'permission-denied') {
    return (
      <View
        className="flex-1 items-center gap-3.5 bg-background px-8 py-14"
        testID="location-permission-denied"
      >
        <Text className="text-[14px] font-semibold text-foreground">
          Location access denied
        </Text>
        <Text className="text-center text-[13px] leading-5 text-muted-foreground">
          Pre-Flight needs your location to create a spot here. Enable it in
          Settings, then come back — we'll retry automatically.
        </Text>
        <Button
          label="Open Settings"
          size="sm"
          onPress={() => Linking.openSettings()}
          testID="open-location-settings"
        />
      </View>
    );
  }

  if (locationState.status === 'error') {
    return (
      <View
        className="flex-1 items-center gap-3.5 bg-background px-8 py-14"
        testID="location-error"
      >
        <Text className="text-[14px] font-semibold text-foreground">
          Couldn't get a location fix
        </Text>
        <Text className="text-center text-[13px] leading-5 text-muted-foreground">
          GPS signal may be weak indoors. Try again outside or with a clear sky
          view.
        </Text>
        <Button
          label="Retry"
          size="sm"
          onPress={fetchLocation}
          testID="retry-location"
        />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="px-5 pb-8 gap-4"
      testID="add-flying-spot-screen"
    >
      <Field
        label="Name"
        value={name}
        onChangeText={setName}
        placeholder="e.g. Backyard, Riverside Park"
        testID="spot-name-input"
      />

      <View>
        <MetaLabel className="mb-1.5">Position — drag to fine-tune</MetaLabel>
        <View className="border border-border">
          <SpotMapView
            coordinates={locationState.coordinates}
            onCoordinatesChange={handleCoordinatesChange}
            testID="spot-map"
          />
        </View>
        <Mono className="mt-1.5 text-muted-foreground">
          {locationState.coordinates.latitude.toFixed(4)},{' '}
          {locationState.coordinates.longitude.toFixed(4)}
        </Mono>
      </View>

      <Button
        label="Save Flying Spot"
        onPress={handleSave}
        disabled={!canSave}
        testID="save-flying-spot"
      />
    </ScrollView>
  );
}
