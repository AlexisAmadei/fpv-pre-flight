import { computeVerdict } from '../verdict';
import { DEFAULT_THRESHOLDS_BY_WEIGHT_CLASS } from '../weightClasses';
import type { HourlyWeatherPoint } from '../types';

const thresholds = DEFAULT_THRESHOLDS_BY_WEIGHT_CLASS['5-inch'];

function point(overrides: Partial<HourlyWeatherPoint>): HourlyWeatherPoint {
  return {
    time: '2026-08-12T12:00',
    windSpeed: 5,
    windGusts: 8,
    precipitationProbability: 0,
    cloudCover: 10,
    uvIndex: 2,
    ...overrides,
  };
}

describe('computeVerdict', () => {
  it('is green when every metric is well under threshold', () => {
    const verdict = computeVerdict(point({}), thresholds);
    expect(verdict.level).toBe('green');
  });

  it('is red when wind alone exceeds its threshold, regardless of everything else', () => {
    const verdict = computeVerdict(point({ windSpeed: thresholds.windSpeedMax + 5 }), thresholds);
    expect(verdict.level).toBe('red');
    expect(verdict.metrics.wind.level).toBe('red');
  });

  it('is red when gusts alone exceed their threshold', () => {
    const verdict = computeVerdict(point({ windGusts: thresholds.windGustsMax + 5 }), thresholds);
    expect(verdict.level).toBe('red');
  });

  it('is red when rain probability alone exceeds its threshold', () => {
    const verdict = computeVerdict(
      point({ precipitationProbability: thresholds.precipitationProbabilityMax + 10 }),
      thresholds,
    );
    expect(verdict.level).toBe('red');
  });

  it('does not go red on UV alone, even far past its threshold', () => {
    const verdict = computeVerdict(point({ uvIndex: thresholds.uvIndexMax + 5 }), thresholds);
    expect(verdict.level).not.toBe('red');
  });

  it('turns yellow when primary metrics sit in the borderline band together', () => {
    const verdict = computeVerdict(
      point({
        windSpeed: thresholds.windSpeedMax * 0.75,
        windGusts: thresholds.windGustsMax * 0.75,
        precipitationProbability: thresholds.precipitationProbabilityMax * 0.75,
      }),
      thresholds,
    );
    expect(verdict.level).toBe('yellow');
  });

  it('reports cloud cover as informational without affecting the level', () => {
    const clear = computeVerdict(point({ cloudCover: 0 }), thresholds);
    const overcast = computeVerdict(point({ cloudCover: 100 }), thresholds);
    expect(clear.level).toBe(overcast.level);
    expect(overcast.cloudCover).toBe(100);
  });
});
