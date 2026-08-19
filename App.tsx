/**
 * Pre-Flight
 * A weather-conditions and equipment-checklist companion for FPV drone pilots.
 *
 * @format
 */

import './global.css';

import React, { useState } from 'react';
import { Pressable, StatusBar, Text, View } from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { useNavigator } from './src/navigation/useNavigator';
import { FlyingSpotListScreen } from './src/screens/FlyingSpotListScreen';
import { AddFlyingSpotScreen } from './src/screens/AddFlyingSpotScreen';
import { FlyingSpotDetailScreen } from './src/screens/FlyingSpotDetailScreen';
import { DroneFleetScreen } from './src/screens/DroneFleetScreen';
import { CreateDroneProfileScreen } from './src/screens/CreateDroneProfileScreen';
import { EditThresholdsScreen } from './src/screens/EditThresholdsScreen';
import { ChecklistScreen } from './src/screens/ChecklistScreen';
import { listDroneProfiles } from './src/droneProfiles/droneProfileRepository';
import { applyThemeMode } from './src/ui/theme';
import type { ThemeMode } from './src/ui/theme';

const SCREEN_TITLES: Record<string, string> = {
  addFlyingSpot: 'New Flying Spot',
  flyingSpotDetail: 'Flying Spot',
  droneFleet: 'My Drones',
  createDroneProfile: 'Add Drone',
  editThresholds: 'Drone Limits',
  checklist: 'Checklist',
};

function App() {
  // Explicit in-app toggle rather than following the OS: the point is night
  // vision on pre-dawn and dusk checks (ADR-0009).
  const [mode, setMode] = useState<ThemeMode>('light');

  function toggleMode() {
    const next: ThemeMode = mode === 'dark' ? 'light' : 'dark';
    setMode(next);
    applyThemeMode(next);
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} />
      <View className={mode === 'dark' ? 'dark flex-1' : 'flex-1'}>
        <AppContent mode={mode} onToggleMode={toggleMode} />
      </View>
    </SafeAreaProvider>
  );
}

function AppContent({
  mode,
  onToggleMode,
}: {
  mode: ThemeMode;
  onToggleMode: () => void;
}) {
  const safeAreaInsets = useSafeAreaInsets();
  const navigator = useNavigator({ name: 'flyingSpots' });
  const { current } = navigator;

  // The fleet screen is only worth showing once a drone exists; before that,
  // the shortcut goes straight to creating one.
  async function manageDroneProfile() {
    const profiles = await listDroneProfiles().catch(() => []);
    navigator.push(
      profiles.length > 0 ? { name: 'droneFleet' } : { name: 'createDroneProfile' },
    );
  }

  return (
    <View
      className="flex-1 bg-background"
      style={{
        paddingTop: safeAreaInsets.top,
        // Android's gesture pill / navigation buttons overlay the window, so
        // the bottom inset has to be reserved or the last row is unreachable.
        paddingBottom: safeAreaInsets.bottom,
      }}
    >
      <View className="flex-row items-center justify-between px-5 py-3">
        {navigator.canGoBack ? (
          <Pressable
            accessibilityRole="button"
            onPress={navigator.pop}
            testID="nav-back"
            className="flex-row items-center gap-2"
          >
            <Text className="text-[16px] text-foreground">‹</Text>
            <Text className="font-mono text-[11px] uppercase tracking-[1.5px] text-foreground">
              {SCREEN_TITLES[current.name] ?? 'Back'}
            </Text>
          </Pressable>
        ) : (
          <View />
        )}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Toggle dark mode"
          onPress={onToggleMode}
          testID="toggle-theme"
          className="border border-border bg-background px-2 py-1.5"
        >
          <Text className="font-mono text-[10px] uppercase tracking-[1px] text-foreground">
            {mode === 'dark' ? 'Light' : 'Dark'}
          </Text>
        </Pressable>
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
          onManageDrones={manageDroneProfile}
          onOpenChecklist={() => navigator.push({ name: 'checklist' })}
        />
      )}

      {current.name === 'droneFleet' && (
        <DroneFleetScreen
          onAddDrone={() => navigator.push({ name: 'createDroneProfile' })}
          onEditDrone={profile =>
            navigator.push({ name: 'editThresholds', profile })
          }
        />
      )}

      {current.name === 'createDroneProfile' && (
        <CreateDroneProfileScreen onCreated={navigator.pop} />
      )}

      {current.name === 'editThresholds' && (
        <EditThresholdsScreen profile={current.profile} onDone={navigator.pop} />
      )}

      {current.name === 'checklist' && (
        <ChecklistScreen
          onCreateDroneProfile={() =>
            navigator.push({ name: 'createDroneProfile' })
          }
        />
      )}
    </View>
  );
}

export default App;
