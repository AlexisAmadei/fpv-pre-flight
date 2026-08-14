import React from 'react';
import { View } from 'react-native';

// SpotMapView is a thin native-view wrapper with no logic of its own (not
// unit-tested per its own contract). Tests assert against the props passed
// to this stub rather than a real native map.
export function SpotMapView(props: Record<string, unknown>) {
  return <View {...props} />;
}
