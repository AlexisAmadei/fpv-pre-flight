import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  deleteFlyingSpot,
  listFlyingSpots,
} from '../flyingSpots/flyingSpotRepository';
import { getDroneProfile } from '../droneProfiles/droneProfileRepository';
import { evictWeather, refreshAll } from '../weather/weatherCache';
import type { DroneProfile, FlyingSpot } from '../weather/types';

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
  const [droneProfile, setDroneProfile] = useState<DroneProfile | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const reload = useCallback(() => {
    listFlyingSpots().then(setSpots);
    getDroneProfile()
      .then(setDroneProfile)
      .catch(() => setDroneProfile(null));
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

  return (
    <View style={styles.container} testID="flying-spot-list-screen">
      <View style={styles.header}>
        <Pressable onPress={onManageDroneProfile} testID="manage-drone-profile">
          <Text style={styles.link}>
            {droneProfile ? droneProfile.name : 'Create drone profile'}
          </Text>
        </Pressable>
        <Pressable
          onPress={handleRefreshAll}
          disabled={refreshing || spots.length === 0}
          testID="refresh-all"
        >
          <Text
            style={[
              styles.link,
              (refreshing || spots.length === 0) && styles.linkDisabled,
            ]}
          >
            {refreshing ? 'Refreshing…' : 'Refresh all'}
          </Text>
        </Pressable>
      </View>

      <FlatList
        data={spots}
        keyExtractor={spot => spot.id}
        ListEmptyComponent={
          <Text style={styles.empty}>No flying spots yet.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Pressable
              style={styles.rowMain}
              onPress={() => onOpenSpot(item)}
              testID={`open-spot-${item.id}`}
            >
              <Text style={styles.rowTitle}>{item.name}</Text>
            </Pressable>
            <Pressable
              onPress={() => handleDelete(item)}
              testID={`delete-spot-${item.id}`}
            >
              <Text style={styles.deleteText}>Delete</Text>
            </Pressable>
          </View>
        )}
      />

      <Pressable
        style={styles.addButton}
        onPress={onAddSpot}
        testID="add-flying-spot"
      >
        <Text style={styles.addButtonText}>+ Add flying spot</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  link: { color: '#2f6fed', fontWeight: '600' },
  linkDisabled: { opacity: 0.4 },
  empty: { color: '#666', marginTop: 24, textAlign: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  rowMain: { flex: 1 },
  rowTitle: { fontSize: 16 },
  deleteText: { color: '#d33' },
  addButton: {
    marginTop: 16,
    backgroundColor: '#2f6fed',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  addButtonText: { color: '#fff', fontWeight: '600' },
});
