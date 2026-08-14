import React from 'react';
import type { NativeSyntheticEvent } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { Camera, Map, ViewAnnotation } from '@maplibre/maplibre-react-native';
import type {
  LngLat,
  StyleSpecification,
  ViewAnnotationEvent,
} from '@maplibre/maplibre-react-native';
import type { Coordinates } from '../weather/types';

// Plain OpenStreetMap raster tiles, per ADR 0008: no vector style server or
// API key required, keeping the app F-Droid-eligible (ADR 0004).
const OSM_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
    },
  },
  layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
};

const DEFAULT_ZOOM = 15;

interface Props {
  coordinates: Coordinates;
  /** Omit for a non-interactive, static map (e.g. the spot detail screen). */
  onCoordinatesChange?: (coordinates: Coordinates) => void;
  testID?: string;
}

export function SpotMapView({ coordinates, onCoordinatesChange, testID }: Props) {
  const lngLat: LngLat = [coordinates.longitude, coordinates.latitude];
  const draggable = onCoordinatesChange !== undefined;

  function handleDragEnd(
    event: NativeSyntheticEvent<ViewAnnotationEvent>,
  ) {
    const [longitude, latitude] = event.nativeEvent.lngLat;
    onCoordinatesChange?.({ latitude, longitude });
  }

  return (
    <View style={styles.container} testID={testID}>
      <Map mapStyle={OSM_STYLE} attribution logo={false}>
        <Camera initialViewState={{ center: lngLat, zoom: DEFAULT_ZOOM }} />
        {/* ViewAnnotation, not Marker: Marker has no draggable/onDragEnd
            support in this library version. */}
        <ViewAnnotation
          lngLat={lngLat}
          draggable={draggable}
          onDragEnd={draggable ? handleDragEnd : undefined}
        >
          <View style={styles.pin} />
        </ViewAnnotation>
      </Map>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { height: 220, borderRadius: 8, overflow: 'hidden' },
  pin: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#d33',
    borderWidth: 2,
    borderColor: '#fff',
  },
});
