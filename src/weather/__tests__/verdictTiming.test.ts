import { currentHourPoint, firstDaylightHourOnDay } from '../verdictTiming';
import type { WeatherForecast } from '../types';

function hourly(times: string[]) {
  return times.map(time => ({
    time,
    windSpeed: 0,
    windGusts: 0,
    precipitationProbability: 0,
    cloudCover: 0,
    uvIndex: 0,
  }));
}

const forecast: WeatherForecast = {
  unitSystem: 'metric',
  hourly: hourly([
    '2026-08-12T10:00',
    '2026-08-12T11:00',
    '2026-08-12T12:00',
    '2026-08-13T06:00',
    '2026-08-13T07:00',
    '2026-08-14T06:00',
  ]),
  daily: [
    {
      date: '2026-08-12',
      windSpeedMax: 0,
      windGustsMax: 0,
      precipitationProbabilityMax: 0,
      uvIndexMax: 0,
      cloudCoverMean: 0,
      sunrise: '2026-08-12T06:00',
      sunset: '2026-08-12T20:00',
    },
    {
      date: '2026-08-13',
      windSpeedMax: 0,
      windGustsMax: 0,
      precipitationProbabilityMax: 0,
      uvIndexMax: 0,
      cloudCoverMean: 0,
      sunrise: '2026-08-13T06:00',
      sunset: '2026-08-13T20:00',
    },
    {
      date: '2026-08-14',
      windSpeedMax: 0,
      windGustsMax: 0,
      precipitationProbabilityMax: 0,
      uvIndexMax: 0,
      cloudCoverMean: 0,
      sunrise: '2026-08-14T06:00',
      sunset: '2026-08-14T20:00',
    },
  ],
};

describe('currentHourPoint', () => {
  it('picks the point at or just before now', () => {
    expect(currentHourPoint(forecast, new Date('2026-08-12T11:30'))?.time).toBe(
      '2026-08-12T11:00',
    );
  });

  it('picks the exact match when now lands on an hourly point', () => {
    expect(currentHourPoint(forecast, new Date('2026-08-12T12:00'))?.time).toBe(
      '2026-08-12T12:00',
    );
  });

  it('falls back to the first point when now is before all hourly points', () => {
    expect(currentHourPoint(forecast, new Date('2026-08-11T00:00'))?.time).toBe(
      '2026-08-12T10:00',
    );
  });
});

describe('firstDaylightHourOnDay', () => {
  it("returns the first hourly point within tomorrow's daylight window", () => {
    expect(firstDaylightHourOnDay(forecast, 1)?.time).toBe('2026-08-13T06:00');
  });

  it('returns undefined for a day past the forecast range', () => {
    expect(firstDaylightHourOnDay(forecast, 10)).toBeUndefined();
  });
});
