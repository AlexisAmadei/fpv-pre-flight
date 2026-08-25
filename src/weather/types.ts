export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface FlyingSpot {
  id: string;
  name: string;
  coordinates: Coordinates;
}

export interface HourlyWeatherPoint {
  time: string; // ISO8601, local to the spot's timezone
  windSpeed: number; // km/h
  windGusts: number; // km/h
  precipitationProbability: number; // %
  cloudCover: number; // %
  uvIndex: number;
  /**
   * Temperature and dew point in °C, and low-cloud cover in %, backing the
   * EstimatedCloudBase. Optional because a forecast cached before these were
   * fetched still deserializes — the cloud base is simply withheld for it.
   */
  temperature?: number;
  dewPoint?: number;
  lowCloudCover?: number;
}

export interface DailyWeatherPoint {
  date: string; // ISO8601 date
  windSpeedMax: number; // km/h
  windGustsMax: number; // km/h
  precipitationProbabilityMax: number; // %
  uvIndexMax: number;
  cloudCoverMean: number; // %
  sunrise: string; // ISO8601
  sunset: string; // ISO8601
}

export interface WeatherForecast {
  /** Data is always fetched and computed in this canonical unit system; convert only at display time. */
  unitSystem: 'metric';
  /** Today's hourly points; use currentDaylightHours() to trim to sunrise-sunset. */
  hourly: HourlyWeatherPoint[];
  /** Today plus the next 3 days. */
  daily: DailyWeatherPoint[];
}

export type WeightClass =
  | 'tiny-whoop'
  | '3-inch'
  | '5-inch'
  | '7-inch-plus'
  | 'long-range';

export interface VerdictThresholds {
  windSpeedMax: number; // km/h
  windGustsMax: number; // km/h
  precipitationProbabilityMax: number; // %
  uvIndexMax: number;
}

export interface DroneProfile {
  id: string;
  name: string;
  weightClass: WeightClass;
  /** Defaults to the weight class's thresholds; individually overridable. */
  thresholds: VerdictThresholds;
}

export type VerdictLevel = 'green' | 'yellow' | 'red';

export interface MetricVerdict {
  level: VerdictLevel;
  value: number;
}

export interface Verdict {
  level: VerdictLevel;
  metrics: {
    wind: MetricVerdict;
    gusts: MetricVerdict;
    precipitationProbability: MetricVerdict;
    uvIndex: MetricVerdict;
  };
  /** Displayed alongside the verdict but never weighted into it. */
  cloudCover: number;
}

/** One preflight item, either from the GenericChecklist or added to a DroneProfile. */
export interface ChecklistItem {
  id: string;
  label: string;
}

/**
 * A DroneProfile's Checklist as shown to the pilot: the GenericChecklist plus
 * that profile's own additions, each carrying whether it is currently ticked.
 */
export interface ChecklistEntry extends ChecklistItem {
  done: boolean;
  /** Generic items are shared across profiles and cannot be deleted. */
  generic: boolean;
}
