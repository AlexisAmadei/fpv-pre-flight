jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);

// @react-native-community/geolocation constructs a NativeEventEmitter at
// import time (not just on use), which throws immediately under Jest since
// no native module is linked. Stub it globally so merely importing anything
// that pulls in src/location/deviceLocation.ts doesn't crash; individual
// tests still mock deviceLocation.ts itself to control fetch behavior.
jest.mock('@react-native-community/geolocation', () => ({
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
  clearWatch: jest.fn(),
  stopObserving: jest.fn(),
  requestAuthorization: jest.fn(),
  setRNConfiguration: jest.fn(),
}));

// @maplibre/maplibre-react-native's Fabric native components can't load
// under Jest (no native codegen backing). Stub the pieces SpotMapView uses
// so merely importing it doesn't crash; screens that need to assert on
// SpotMapView's own props mock '../SpotMapView' directly instead.
jest.mock('@maplibre/maplibre-react-native', () => {
  const React = require('react');
  const { View } = require('react-native');
  const passthrough = name => {
    const Component = props => React.createElement(View, props, props.children);
    Component.displayName = name;
    return Component;
  };
  return {
    Map: passthrough('Map'),
    Camera: passthrough('Camera'),
    ViewAnnotation: passthrough('ViewAnnotation'),
  };
});
