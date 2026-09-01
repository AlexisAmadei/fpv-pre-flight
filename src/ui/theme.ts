import { Appearance } from 'react-native';
import type { VerdictLevel } from '../weather/types';

/**
 * Dark mode is an explicit in-app toggle, never a follow-the-OS setting: the
 * use case is preserving night vision on pre-dawn and dusk checks (ADR-0009).
 */
export type ThemeMode = 'light' | 'dark';

export function applyThemeMode(mode: ThemeMode): void {
  Appearance.setColorScheme(mode);
}

/**
 * Verdict colours as semantic classes rather than per-screen hex values, so the
 * go/no-go scale reads identically everywhere it appears.
 */
export const VERDICT_STYLES: Record<
  VerdictLevel,
  { label: string; surface: string; text: string; dot: string }
> = {
  green: {
    label: 'GO',
    surface: 'bg-go',
    text: 'text-go-foreground',
    dot: 'bg-go',
  },
  yellow: {
    label: 'CAUTION',
    surface: 'bg-caution',
    text: 'text-caution-foreground',
    dot: 'bg-caution',
  },
  red: {
    label: 'NO-GO',
    surface: 'bg-nogo',
    text: 'text-nogo-foreground',
    dot: 'bg-nogo',
  },
};

export const WEIGHT_CLASS_LABELS = {
  'tiny-whoop': 'Tiny Whoop',
  '3-inch': '3" Micro',
  '5-inch': '5" Freestyle',
  '7-inch-plus': '7"+ Freestyle',
  'long-range': 'Long-Range',
  'sub-250g': 'Sub-250g',
  '250g-900g': '250g–900g',
  '900g-plus': '900g+',
} as const;
