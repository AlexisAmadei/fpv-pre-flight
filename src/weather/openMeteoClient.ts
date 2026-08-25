import type { Coordinates, DailyWeatherPoint, HourlyWeatherPoint, WeatherForecast } from './types';

// See ADR 0003 for why Open-Meteo. forecast_days=4 covers "today" plus the
// next 3 days per the confirmed forecast window. Units are left at
// Open-Meteo's metric defaults (km/h) — display conversion happens in units.ts.
const BASE_URL = 'https://api.open-meteo.com/v1/forecast';
const FORECAST_DAYS = 4;

interface OpenMeteoResponse {
  hourly: {
    time: string[];
    wind_speed_10m: number[];
    wind_gusts_10m: number[];
    precipitation_probability: number[];
    cloud_cover: number[];
    uv_index: number[];
    temperature_2m: number[];
    dew_point_2m: number[];
    cloud_cover_low: number[];
  };
  daily: {
    time: string[];
    wind_speed_10m_max: number[];
    wind_gusts_10m_max: number[];
    precipitation_probability_max: number[];
    uv_index_max: number[];
    cloud_cover_mean: number[];
    sunrise: string[];
    sunset: string[];
  };
}

export async function fetchForecast(coordinates: Coordinates): Promise<WeatherForecast> {
  const params = new URLSearchParams({
    latitude: String(coordinates.latitude),
    longitude: String(coordinates.longitude),
    hourly:
      'wind_speed_10m,wind_gusts_10m,precipitation_probability,cloud_cover,uv_index,temperature_2m,dew_point_2m,cloud_cover_low',
    daily:
      'wind_speed_10m_max,wind_gusts_10m_max,precipitation_probability_max,uv_index_max,cloud_cover_mean,sunrise,sunset',
    forecast_days: String(FORECAST_DAYS),
    timezone: 'auto',
  });

  const response = await fetch(`${BASE_URL}?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Open-Meteo request failed: ${response.status}`);
  }
  const data = (await response.json()) as OpenMeteoResponse;

  const hourly: HourlyWeatherPoint[] = data.hourly.time.map((time, i) => ({
    time,
    windSpeed: data.hourly.wind_speed_10m[i],
    windGusts: data.hourly.wind_gusts_10m[i],
    precipitationProbability: data.hourly.precipitation_probability[i],
    cloudCover: data.hourly.cloud_cover[i],
    uvIndex: data.hourly.uv_index[i],
    temperature: data.hourly.temperature_2m?.[i],
    dewPoint: data.hourly.dew_point_2m?.[i],
    lowCloudCover: data.hourly.cloud_cover_low?.[i],
  }));

  const daily: DailyWeatherPoint[] = data.daily.time.map((date, i) => ({
    date,
    windSpeedMax: data.daily.wind_speed_10m_max[i],
    windGustsMax: data.daily.wind_gusts_10m_max[i],
    precipitationProbabilityMax: data.daily.precipitation_probability_max[i],
    uvIndexMax: data.daily.uv_index_max[i],
    cloudCoverMean: data.daily.cloud_cover_mean[i],
    sunrise: data.daily.sunrise[i],
    sunset: data.daily.sunset[i],
  }));

  return { unitSystem: 'metric', hourly, daily };
}

/** Trims today's hourly points down to the sunrise-sunset window. */
export function currentDaylightHours(forecast: WeatherForecast): HourlyWeatherPoint[] {
  const today = forecast.daily[0];
  if (!today) {
    return [];
  }
  return forecast.hourly.filter(point => point.time >= today.sunrise && point.time <= today.sunset);
}
