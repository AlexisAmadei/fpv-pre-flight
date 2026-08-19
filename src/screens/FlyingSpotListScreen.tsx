import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, Text, View } from 'react-native';
import {
  deleteFlyingSpot,
  listFlyingSpots,
} from '../flyingSpots/flyingSpotRepository';
import { listDroneProfiles } from '../droneProfiles/droneProfileRepository';
import { evictWeather, refreshAll } from '../weather/weatherCache';
import type { FlyingSpot } from '../weather/types';
import { Button, Card, Divider, MetaLabel, Mono } from '../ui/components';

interface Props {
  onAddSpot: () => void;
  onOpenSpot: (spot: FlyingSpot) => void;
  onManageDroneProfile: () => void;
}

export function FlyingSpotListScreen({
  onAddSpot,
  onOpenSpot,
  onManageDroneProfile,
}: Props) {
  const [spots, setSpots] = useState<FlyingSpot[]>([]);
  const [hasProfile, setHasProfile] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const reload = useCallback(() => {
    listFlyingSpots().then(setSpots);
    listDroneProfiles()
      .then(profiles => setHasProfile(profiles.length > 0))
      .catch(() => setHasProfile(false));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  function handleDelete(spot: FlyingSpot) {
    Alert.alert('Delete flying spot', `Delete "${spot.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteFlyingSpot(spot.id);
          evictWeather(spot.id);
          reload();
        },
      },
    ]);
  }

  async function handleRefreshAll() {
    setRefreshing(true);
    try {
      await refreshAll(
        spots.map(spot => ({ id: spot.id, coordinates: spot.coordinates })),
      );
    } finally {
      setRefreshing(false);
    }
  }

  const refreshDisabled = refreshing || spots.length === 0;

  return (
    <View className="flex-1 bg-background" testID="flying-spot-list-screen">
      <View className="flex-row items-start justify-between px-5 pb-3">
        <View>
          <Text className="text-[24px] font-bold uppercase tracking-[0.5px] text-foreground">
            Pre-Flight
          </Text>
          <MetaLabel className="mt-1">
            {spots.length === 1 ? '1 spot saved' : `${spots.length} spots saved`}
          </MetaLabel>
        </View>

        <View className="flex-row gap-2">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Refresh all"
            accessibilityState={{ disabled: refreshDisabled }}
            onPress={handleRefreshAll}
            disabled={refreshDisabled}
            testID="refresh-all"
            className={`h-9 items-center justify-center border border-border bg-background px-3 ${
              refreshDisabled ? 'opacity-40' : ''
            }`}
          >
            <Text className="font-mono text-[10px] uppercase tracking-[1px] text-foreground">
              {refreshing ? 'Syncing' : 'Refresh'}
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={onManageDroneProfile}
            testID="manage-drone-profile"
            className="h-9 items-center justify-center border border-border bg-background px-3"
          >
            <Text className="font-mono text-[10px] uppercase tracking-[1px] text-foreground">
              Drones
            </Text>
            {!hasProfile && (
              <View className="absolute -right-1 -top-1 h-2 w-2 bg-destructive" />
            )}
          </Pressable>
        </View>
      </View>

      <Divider className="mx-5 mb-3.5" />

      <FlatList
        data={spots}
        keyExtractor={spot => spot.id}
        contentContainerClassName="px-5 gap-2.5"
        ListEmptyComponent={
          <View className="items-center gap-3.5 px-8 py-14">
            <Text className="max-w-[240px] text-center text-[13px] leading-5 text-muted-foreground">
              No flying spots yet. Add the place you fly to check conditions
              before heading out.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Card className="flex-row items-center gap-3 p-3.5">
            <Pressable
              accessibilityRole="button"
              className="min-w-0 flex-1"
              onPress={() => onOpenSpot(item)}
              testID={`open-spot-${item.id}`}
            >
              <Text className="text-[15px] font-semibold text-foreground">
                {item.name}
              </Text>
              <Mono className="mt-0.5 text-muted-foreground">
                {item.coordinates.latitude.toFixed(4)},{' '}
                {item.coordinates.longitude.toFixed(4)}
              </Mono>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Delete ${item.name}`}
              onPress={() => handleDelete(item)}
              testID={`delete-spot-${item.id}`}
              className="px-1 py-1"
            >
              <Text className="font-mono text-[10px] uppercase tracking-[1px] text-destructive">
                Delete
              </Text>
            </Pressable>
          </Card>
        )}
      />

      <View className="px-5 pb-7 pt-4">
        <Button
          label="+ New Flying Spot"
          onPress={onAddSpot}
          testID="add-flying-spot"
        />
      </View>
    </View>
  );
}
