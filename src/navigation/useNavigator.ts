import { useState } from 'react';
import type { Screen } from './Screen';

// Hand-rolled stack instead of a navigation library: the app is a handful of
// screens with no deep-linking or native-gesture needs, so a plain state
// stack avoids pulling in react-native-screens/gesture-handler native deps.
export function useNavigator(initial: Screen) {
  const [stack, setStack] = useState<Screen[]>([initial]);

  return {
    current: stack[stack.length - 1],
    canGoBack: stack.length > 1,
    push: (screen: Screen) => setStack(s => [...s, screen]),
    pop: () => setStack(s => (s.length > 1 ? s.slice(0, -1) : s)),
    reset: (screen: Screen) => setStack([screen]),
  };
}
