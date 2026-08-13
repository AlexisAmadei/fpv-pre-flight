import { fetchForecast } from '../openMeteoClient';
import {
  clearWeatherCache,
  getWeather,
  refreshAll,
  refreshWeather,
} from '../weatherCache';
import type { WeatherForecast } from '../types';

jest.mock('../openMeteoClient', () => ({
  fetchForecast: jest.fn(),
}));

const mockFetchForecast = fetchForecast as jest.MockedFunction<
  typeof fetchForecast
>;

const coordinates = { latitude: 51.5, longitude: -0.1 };

function forecast(seed: number): WeatherForecast {
  return {
    unitSystem: 'metric',
    hourly: [
      {
        time: '2026-08-12T12:00',
        windSpeed: seed,
        windGusts: seed,
        precipitationProbability: 0,
        cloudCover: 0,
        uvIndex: 1,
      },
    ],
    daily: [],
  };
}

beforeEach(() => {
  clearWeatherCache();
  mockFetchForecast.mockReset();
});

describe('getWeather', () => {
  it('fetches on first open and reports not stale', async () => {
    mockFetchForecast.mockResolvedValue(forecast(1));
    const snapshot = await getWeather('spot-1', coordinates, 0);
    expect(snapshot).toEqual({ forecast: forecast(1), stale: false });
    expect(mockFetchForecast).toHaveBeenCalledTimes(1);
  });

  it('does not re-fetch when reopened within the freshness window', async () => {
    mockFetchForecast.mockResolvedValue(forecast(1));
    await getWeather('spot-1', coordinates, 0);
    await getWeather('spot-1', coordinates, 5 * 60 * 1000);
    expect(mockFetchForecast).toHaveBeenCalledTimes(1);
  });

  it('re-fetches once the freshness window has elapsed', async () => {
    mockFetchForecast
      .mockResolvedValueOnce(forecast(1))
      .mockResolvedValueOnce(forecast(2));
    await getWeather('spot-1', coordinates, 0);
    const snapshot = await getWeather('spot-1', coordinates, 21 * 60 * 1000);
    expect(snapshot).toEqual({ forecast: forecast(2), stale: false });
    expect(mockFetchForecast).toHaveBeenCalledTimes(2);
  });

  it('falls back to the last cached forecast, labeled stale, on fetch failure', async () => {
    mockFetchForecast
      .mockResolvedValueOnce(forecast(1))
      .mockRejectedValueOnce(new Error('offline'));
    await getWeather('spot-1', coordinates, 0);
    const snapshot = await getWeather('spot-1', coordinates, 21 * 60 * 1000);
    expect(snapshot).toEqual({ forecast: forecast(1), stale: true });
  });

  it('throws when there is no cached forecast at all and the fetch fails', async () => {
    mockFetchForecast.mockRejectedValue(new Error('offline'));
    await expect(getWeather('spot-1', coordinates, 0)).rejects.toThrow(
      'offline',
    );
  });
});

describe('refreshWeather', () => {
  it('re-fetches even within the freshness window', async () => {
    mockFetchForecast
      .mockResolvedValueOnce(forecast(1))
      .mockResolvedValueOnce(forecast(2));
    await getWeather('spot-1', coordinates, 0);
    const snapshot = await refreshWeather('spot-1', coordinates, 60 * 1000);
    expect(snapshot).toEqual({ forecast: forecast(2), stale: false });
    expect(mockFetchForecast).toHaveBeenCalledTimes(2);
  });
});

describe('refreshAll', () => {
  it('refreshes every spot, leaving a failed one on its stale cached forecast', async () => {
    mockFetchForecast
      .mockResolvedValueOnce(forecast(1))
      .mockResolvedValueOnce(forecast(2));
    await getWeather('spot-1', coordinates, 0);
    await getWeather('spot-2', coordinates, 0);

    mockFetchForecast.mockReset();
    mockFetchForecast
      .mockResolvedValueOnce(forecast(3))
      .mockRejectedValueOnce(new Error('offline'));

    await refreshAll([
      { id: 'spot-1', coordinates },
      { id: 'spot-2', coordinates },
    ]);

    expect(await getWeather('spot-1', coordinates, 0)).toEqual({
      forecast: forecast(3),
      stale: false,
    });
  });
});
