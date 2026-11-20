export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function unwrapApiData(value: unknown): unknown {
  let current = value;
  for (let depth = 0; depth < 4 && isRecord(current) && 'data' in current; depth += 1) {
    current = current.data;
  }
  return current;
}

export function findApiList(value: unknown, keys: string[]): unknown[] | null {
  if (Array.isArray(value)) return value;
  if (!isRecord(value)) return null;

  for (const key of keys) {
    if (Array.isArray(value[key])) return value[key];
  }
  return findApiList(value.data, keys);
}

export function getText(value: unknown, keys: string[]): string {
  if (!isRecord(value)) return '';
  for (const key of keys) {
    const item = value[key];
    if (typeof item === 'string' || typeof item === 'number') return String(item);
  }
  return '';
}
