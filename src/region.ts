// Best-effort region code from the device locale, for formatWindSpeed's
// regional km/h vs mph choice. Falls back to a metric-first default region
// when Intl can't resolve one (older Hermes builds without full ICU data).
export function getDeviceRegion(): string {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale;
    const region = new Intl.Locale(locale).region;
    return region ?? 'GB';
  } catch {
    return 'GB';
  }
}
