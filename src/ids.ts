// Local-only app (ADR-0002): ids only need to be unique on-device, not globally.
export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}
