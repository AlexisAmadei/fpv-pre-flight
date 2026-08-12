import type { HourlyWeatherPoint, MetricVerdict, Verdict, VerdictLevel, VerdictThresholds } from './types';

// Relative influence of each metric on the composite score below.
// Wind/gusts/rain drive go-no-go; UV is a lighter modifier (battery/FC
// overheat risk, not a hard stop) per the confirmed design.
const METRIC_WEIGHTS = {
  wind: 0.32,
  gusts: 0.32,
  precipitationProbability: 0.26,
  uvIndex: 0.1,
} as const;

const LEVEL_SCORE: Record<VerdictLevel, number> = { green: 0, yellow: 0.5, red: 1 };

// A metric within 70% of its threshold is green, up to 100% is yellow,
// past it is red.
function levelForRatio(ratio: number): VerdictLevel {
  if (ratio >= 1) return 'red';
  if (ratio >= 0.7) return 'yellow';
  return 'green';
}

function metricVerdict(value: number, threshold: number): MetricVerdict {
  const ratio = threshold > 0 ? value / threshold : 0;
  return { level: levelForRatio(ratio), value };
}

export function computeVerdict(point: HourlyWeatherPoint, thresholds: VerdictThresholds): Verdict {
  const wind = metricVerdict(point.windSpeed, thresholds.windSpeedMax);
  const gusts = metricVerdict(point.windGusts, thresholds.windGustsMax);
  const precipitationProbability = metricVerdict(
    point.precipitationProbability,
    thresholds.precipitationProbabilityMax,
  );
  const uvIndex = metricVerdict(point.uvIndex, thresholds.uvIndexMax);

  // Any primary metric past its hard threshold is a decisive no-go,
  // regardless of how the others weigh in.
  const primaryExceeded = wind.level === 'red' || gusts.level === 'red' || precipitationProbability.level === 'red';

  let level: VerdictLevel;
  if (primaryExceeded) {
    level = 'red';
  } else {
    const compositeScore =
      LEVEL_SCORE[wind.level] * METRIC_WEIGHTS.wind +
      LEVEL_SCORE[gusts.level] * METRIC_WEIGHTS.gusts +
      LEVEL_SCORE[precipitationProbability.level] * METRIC_WEIGHTS.precipitationProbability +
      LEVEL_SCORE[uvIndex.level] * METRIC_WEIGHTS.uvIndex;
    level = compositeScore >= 0.35 ? 'yellow' : 'green';
  }

  return {
    level,
    metrics: { wind, gusts, precipitationProbability, uvIndex },
    cloudCover: point.cloudCover,
  };
}
