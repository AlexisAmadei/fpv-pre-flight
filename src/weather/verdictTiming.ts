import type { HourlyWeatherPoint, WeatherForecast } from './types';

/** The hourly point at or just before `now` — the default point-in-time Verdict target (ADR-0006). */
export function currentHourPoint(
  forecast: WeatherForecast,
  now: Date = new Date(),
): HourlyWeatherPoint | undefined {
  const upToNow = forecast.hourly.filter(
    point => new Date(point.time).getTime() <= now.getTime(),
  );
  return upToNow.length > 0 ? upToNow[upToNow.length - 1] : forecast.hourly[0];
}

/** The first daylight hourly point on a future day (dayIndex 1-3 = next 3 days), for the explicit preview CTA (ADR-0006). */
export function firstDaylightHourOnDay(
  forecast: WeatherForecast,
  dayIndex: number,
): HourlyWeatherPoint | undefined {
  const day = forecast.daily[dayIndex];
  if (!day) {
    return undefined;
  }
  const sunrise = new Date(day.sunrise).getTime();
  const sunset = new Date(day.sunset).getTime();
  return forecast.hourly.find(point => {
    const time = new Date(point.time).getTime();
    return time >= sunrise && time <= sunset;
  });
}
