import { fetchForecast } from '../openMeteoClient';
import { clearWeatherCache } from '../weatherCache';
import { getVerdictForDay, getVerdictStatus, refreshAll, refreshSpot } from '../weatherStore';
import { DEFAULT_THRESHOLDS_BY_WEIGHT_CLASS } from '../weightClasses';
import type { FlyingSpot, WeatherForecast } from '../types';

jest.mock('../openMeteoClient', () => ({ fetchForecast: jest.fn() }));

const mockFetchForecast = fetchForecast as jest.MockedFunction<typeof fetchForecast>;

const thresholds = DEFAULT_THRESHOLDS_BY_WEIGHT_CLASS['5-inch'];

const spot: FlyingSpot = {
  id: 'spot-1',
  name: 'Test Field',
  coordinates: { latitude: 51.5, longitude: -0.1 },
};

function forecast(windSpeed: number): WeatherForecast {
  return {
    unitSystem: 'metric',
    hourly: [
      {
        time: '2026-08-12T11:00',
        windSpeed,
        windGusts: windSpeed,
        precipitationProbability: 0,
        cloudCover: 10,
        uvIndex: 2,
      },
      {
        time: '2026-08-13T07:00',
        windSpeed,
        windGusts: windSpeed,
        precipitationProbability: 0,
        cloudCover: 10,
        uvIndex: 2,
      },
    ],
    daily: [
      {
        date: '2026-08-12',
        windSpeedMax: windSpeed,
        windGustsMax: windSpeed,
        precipitationProbabilityMax: 0,
        uvIndexMax: 2,
        cloudCoverMean: 10,
        sunrise: '2026-08-12T06:00',
        sunset: '2026-08-12T20:00',
      },
      {
        date: '2026-08-13',
        windSpeedMax: windSpeed,
        windGustsMax: windSpeed,
        precipitationProbabilityMax: 0,
        uvIndexMax: 2,
        cloudCoverMean: 10,
        sunrise: '2026-08-13T06:00',
        sunset: '2026-08-13T20:00',
      },
    ],
  };
}

const noon = new Date('2026-08-12T11:30');
const midnight = new Date('2026-08-12T23:00');

beforeEach(() => {
  clearWeatherCache();
  mockFetchForecast.mockReset();
});

describe('getVerdictStatus', () => {
  it('is fresh on first load, computing the Verdict for the current hour', async () => {
    mockFetchForecast.mockResolvedValue(forecast(5));
    const result = await getVerdictStatus(spot, thresholds, noon);
    expect(result.status).toBe('fresh');
    if (result.status === 'fresh' || result.status === 'stale') {
      expect(result.verdict.metrics.wind.value).toBe(5);
    }
  });

  it('reuses the cached forecast within the freshness window without refetching', async () => {
    mockFetchForecast.mockResolvedValue(forecast(5));
    await getVerdictStatus(spot, thresholds, noon);
    const result = await getVerdictStatus(
      spot,
      thresholds,
      new Date(noon.getTime() + 5 * 60 * 1000),
    );
    expect(result.status).toBe('fresh');
    expect(mockFetchForecast).toHaveBeenCalledTimes(1);
  });

  it('falls back to a stale cached Verdict when a refetch fails', async () => {
    mockFetchForecast
      .mockResolvedValueOnce(forecast(5))
      .mockRejectedValueOnce(new Error('offline'));
    await getVerdictStatus(spot, thresholds, noon);
    const result = await getVerdictStatus(
      spot,
      thresholds,
      new Date(noon.getTime() + 21 * 60 * 1000),
    );
    expect(result.status).toBe('stale');
  });

  it('is unavailable when there is no prior cache and the fetch fails', async () => {
    mockFetchForecast.mockRejectedValue(new Error('offline'));
    const result = await getVerdictStatus(spot, thresholds, noon);
    expect(result).toEqual({ status: 'unavailable' });
  });

  it('is outside-daylight when now falls outside today\'s sunrise-sunset window', async () => {
    mockFetchForecast.mockResolvedValue(forecast(5));
    const result = await getVerdictStatus(spot, thresholds, midnight);
    expect(result).toEqual({ status: 'outside-daylight' });
  });

  it('resolves a stale Verdict by time-of-day even when the cached forecast is from a prior day', async () => {
    mockFetchForecast
      .mockResolvedValueOnce(forecast(5))
      .mockRejectedValueOnce(new Error('offline'));
    await getVerdictStatus(spot, thresholds, noon);

    const sameTimeNextDay = new Date('2026-08-13T11:30');
    const result = await getVerdictStatus(spot, thresholds, sameTimeNextDay);

    expect(result.status).toBe('stale');
  });
});

describe('getVerdictForDay', () => {
  it("resolves today's first daylight hour", async () => {
    mockFetchForecast.mockResolvedValue(forecast(5));
    const result = await getVerdictForDay(spot, thresholds, '2026-08-12');
    expect(result.status).toBe('fresh');
    if (result.status === 'fresh' || result.status === 'stale') {
      expect(result.verdict.metrics.wind.value).toBe(5);
    }
  });

  it("resolves a future day's first daylight hour", async () => {
    mockFetchForecast.mockResolvedValue(forecast(5));
    const result = await getVerdictForDay(spot, thresholds, '2026-08-13');
    expect(result.status).toBe('fresh');
  });

  it('honors the same freshness/staleness rules as the current Verdict', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-08-12T00:00:00'));
    mockFetchForecast
      .mockResolvedValueOnce(forecast(5))
      .mockRejectedValueOnce(new Error('offline'));

    await getVerdictForDay(spot, thresholds, '2026-08-13');
    jest.setSystemTime(new Date('2026-08-12T00:21:00'));
    const result = await getVerdictForDay(spot, thresholds, '2026-08-13');

    jest.useRealTimers();
    expect(result.status).toBe('stale');
  });
});

describe('refreshSpot', () => {
  it('replaces the cache entry on success', async () => {
    mockFetchForecast
      .mockResolvedValueOnce(forecast(5))
      .mockResolvedValueOnce(forecast(9));
    await getVerdictStatus(spot, thresholds, noon);
    await refreshSpot(spot);
    const result = await getVerdictStatus(spot, thresholds, noon);
    if (result.status === 'fresh' || result.status === 'stale') {
      expect(result.verdict.metrics.wind.value).toBe(9);
    } else {
      throw new Error(`expected a verdict, got ${result.status}`);
    }
  });

  it('does not reject when there is no prior cache and the fetch fails', async () => {
    mockFetchForecast.mockRejectedValue(new Error('offline'));
    await expect(refreshSpot(spot)).resolves.toBeUndefined();
  });
});

describe('refreshAll', () => {
  it("isolates one spot's fetch failure from the others' success", async () => {
    const otherSpot: FlyingSpot = { ...spot, id: 'spot-2' };
    mockFetchForecast.mockResolvedValue(forecast(5));
    await getVerdictStatus(spot, thresholds, noon);
    await getVerdictStatus(otherSpot, thresholds, noon);

    mockFetchForecast.mockReset();
    mockFetchForecast
      .mockResolvedValueOnce(forecast(9))
      .mockRejectedValueOnce(new Error('offline'));

    await expect(refreshAll([spot, otherSpot])).resolves.toBeUndefined();

    const refreshedSpot = await getVerdictStatus(spot, thresholds, noon);
    if (refreshedSpot.status === 'fresh' || refreshedSpot.status === 'stale') {
      expect(refreshedSpot.verdict.metrics.wind.value).toBe(9);
    } else {
      throw new Error(`expected a verdict, got ${refreshedSpot.status}`);
    }

    const failedSpot = await getVerdictStatus(otherSpot, thresholds, noon);
    if (failedSpot.status === 'fresh' || failedSpot.status === 'stale') {
      expect(failedSpot.verdict.metrics.wind.value).toBe(5);
    } else {
      throw new Error(`expected a verdict, got ${failedSpot.status}`);
    }
  });
});
