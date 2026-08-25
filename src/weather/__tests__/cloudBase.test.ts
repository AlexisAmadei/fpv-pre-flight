import { estimateCloudBase } from '../cloudBase';
import type { HourlyWeatherPoint } from '../types';

function point(
  overrides: Partial<HourlyWeatherPoint> = {},
): HourlyWeatherPoint {
  return {
    time: '2026-08-24T14:00',
    windSpeed: 18,
    windGusts: 24,
    precipitationProbability: 10,
    cloudCover: 40,
    uvIndex: 6,
    temperature: 20,
    dewPoint: 12,
    lowCloudCover: 40,
    ...overrides,
  };
}

describe('estimateCloudBase', () => {
  it('derives the base from the temperature/dew-point spread', () => {
    // 8 °C spread * 125 m = 1000 m.
    expect(estimateCloudBase(point())?.heightAgl).toBe(1000);
  });

  it('brackets the estimate with a range so it cannot read as a measurement', () => {
    const estimate = estimateCloudBase(point())!;
    expect(estimate.rangeLow).toBeLessThan(estimate.heightAgl);
    expect(estimate.rangeHigh).toBeGreaterThan(estimate.heightAgl);
  });

  it('rounds to the nearest 50 m rather than overstating precision', () => {
    // 3.7 °C spread * 125 m = 462.5 m.
    const estimate = estimateCloudBase(
      point({ temperature: 15.7, dewPoint: 12 }),
    )!;
    expect(estimate.heightAgl % 50).toBe(0);
    expect(estimate.heightAgl).toBe(450);
  });

  it('clamps saturated air to ground rather than reporting a base underground', () => {
    const estimate = estimateCloudBase(
      point({ temperature: 8, dewPoint: 11 }),
    )!;
    expect(estimate.heightAgl).toBe(0);
    expect(estimate.rangeLow).toBe(0);
  });

  it('withholds the estimate when the point carries no dew point', () => {
    expect(
      estimateCloudBase(point({ temperature: undefined, dewPoint: undefined })),
    ).toBeUndefined();
  });

  it('falls back to total cloud cover when low cloud is absent', () => {
    const estimate = estimateCloudBase(
      point({ lowCloudCover: undefined, cloudCover: 70 }),
    )!;
    expect(estimate.lowCloudCover).toBe(70);
  });
});
