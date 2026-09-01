import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import {
  listDroneProfiles,
  getActiveDroneProfileId,
  setActiveDroneProfile,
} from '../droneProfiles/droneProfileRepository';
import type { DroneProfile } from '../weather/types';
import { findDroneModel } from '../weather/droneModels';
import { formatWindSpeed } from '../weather/units';
import { getDeviceRegion } from '../region';
import { Button, Card, MetaLabel, Mono } from '../ui/components';
import { WEIGHT_CLASS_LABELS } from '../ui/theme';

interface Props {
  onAddDrone: () => void;
  onEditDrone: (profile: DroneProfile) => void;
}

/**
 * The fleet: every saved DroneProfile, which one is currently being flown, and
 * the way into adding or editing one. Verdicts are always computed against the
 * flying profile, so switching here changes what every spot reports.
 */
export function DroneFleetScreen({ onAddDrone, onEditDrone }: Props) {
  const [profiles, setProfiles] = useState<DroneProfile[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const region = getDeviceRegion();

  const reload = useCallback(() => {
    listDroneProfiles().then(setProfiles);
    getActiveDroneProfileId().then(setActiveId);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  async function handleSelect(id: string) {
    await setActiveDroneProfile(id);
    setActiveId(id);
  }

  return (
    <View className="flex-1 bg-background" testID="drone-fleet-screen">
      <MetaLabel className="px-5 pb-2">Tap a drone to edit its limits</MetaLabel>

      <FlatList
        data={profiles}
        keyExtractor={profile => profile.id}
        contentContainerClassName="px-5 gap-2.5"
        ListEmptyComponent={
          <View className="items-center gap-3.5 px-8 py-14">
            <Text className="max-w-[240px] text-center text-[13px] leading-5 text-muted-foreground">
              No drones yet. Add one to get a go/no-go verdict for your spots.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const isActive = item.id === activeId;
          const droneModel = item.droneModelId
            ? findDroneModel(item.droneModelId)
            : undefined;
          return (
            <Card
              className={`flex-row items-center gap-3 p-3.5 ${
                isActive ? 'border-primary' : ''
              }`}
            >
              <Pressable
                accessibilityRole="button"
                className="min-w-0 flex-1"
                onPress={() => onEditDrone(item)}
                testID={`edit-drone-${item.id}`}
              >
                <View className="flex-row items-center gap-2">
                  <Text className="text-[15px] font-semibold text-foreground">
                    {item.name}
                  </Text>
                  {isActive && (
                    <View className="bg-primary px-1.5 py-0.5">
                      <Text className="font-mono text-[9px] uppercase tracking-[1px] text-primary-foreground">
                        Flying
                      </Text>
                    </View>
                  )}
                </View>
                <Mono className="mt-0.5 text-muted-foreground">
                  {droneModel ? droneModel.displayName : WEIGHT_CLASS_LABELS[item.weightClass]}{' '}
                  · {formatWindSpeed(item.thresholds.windSpeedMax, region)} wind
                </Mono>
              </Pressable>

              {!isActive && (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => handleSelect(item.id)}
                  testID={`fly-drone-${item.id}`}
                  className="border border-border bg-background px-2 py-1.5"
                >
                  <Text className="font-mono text-[9px] uppercase tracking-[1px] text-foreground">
                    Fly this
                  </Text>
                </Pressable>
              )}
            </Card>
          );
        }}
      />

      <View className="px-5 pb-7 pt-4">
        <Button label="+ Add Drone" onPress={onAddDrone} testID="add-drone" />
      </View>
    </View>
  );
}
