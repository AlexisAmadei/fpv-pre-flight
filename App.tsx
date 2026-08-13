/**
 * Pre-Flight
 * A weather-conditions and equipment-checklist companion for FPV drone pilots.
 *
 * @format
 */

import React from 'react';
import {
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { useNavigator } from './src/navigation/useNavigator';
import { FlyingSpotListScreen } from './src/screens/FlyingSpotListScreen';
import { AddFlyingSpotScreen } from './src/screens/AddFlyingSpotScreen';
import { FlyingSpotDetailScreen } from './src/screens/FlyingSpotDetailScreen';
import { CreateDroneProfileScreen } from './src/screens/CreateDroneProfileScreen';
import { EditThresholdsScreen } from './src/screens/EditThresholdsScreen';
import { getDroneProfile } from './src/droneProfiles/droneProfileRepository';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent() {
  const safeAreaInsets = useSafeAreaInsets();
  const navigator = useNavigator({ name: 'flyingSpots' });
  const { current } = navigator;

  async function manageDroneProfile() {
    const profile = await getDroneProfile().catch(() => null);
    navigator.push(
      profile ? { name: 'editThresholds' } : { name: 'createDroneProfile' },
    );
  }

  return (
    <View style={[styles.container, { paddingTop: safeAreaInsets.top }]}>
      <View style={styles.header}>
        {navigator.canGoBack ? (
          <Pressable onPress={navigator.pop} testID="nav-back">
            <Text style={styles.backText}>‹ Back</Text>
          </Pressable>
        ) : (
          <Text style={styles.appTitle}>Pre-Flight</Text>
        )}
      </View>

      {current.name === 'flyingSpots' && (
        <FlyingSpotListScreen
          onAddSpot={() => navigator.push({ name: 'addFlyingSpot' })}
          onOpenSpot={spot =>
            navigator.push({ name: 'flyingSpotDetail', spot })
          }
          onManageDroneProfile={manageDroneProfile}
        />
      )}

      {current.name === 'addFlyingSpot' && (
        <AddFlyingSpotScreen onAdded={navigator.pop} />
      )}

      {current.name === 'flyingSpotDetail' && (
        <FlyingSpotDetailScreen
          spot={current.spot}
          onCreateDroneProfile={() =>
            navigator.push({ name: 'createDroneProfile' })
          }
        />
      )}

      {current.name === 'createDroneProfile' && (
        <CreateDroneProfileScreen
          onCreated={() => navigator.reset({ name: 'flyingSpots' })}
        />
      )}

      {current.name === 'editThresholds' && (
        <EditThresholdsScreen onDone={navigator.pop} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  appTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  backText: {
    fontSize: 16,
    color: '#2f6fed',
  },
});

export default App;
