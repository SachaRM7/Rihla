export const LOCAL_LIBRARY_SCHEMA_VERSION = 2 as const;

type RecordValue = Record<string, unknown>;

function isRecord(value: unknown): value is RecordValue {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

/**
 * Converts every supported persisted shape to the current envelope. Unknown
 * future versions are rejected instead of being silently downgraded.
 */
export function migrateLocalLibraryPayload(value: unknown): RecordValue | null {
  if (!isRecord(value)) return null;
  const candidate = isRecord(value.data) && typeof value.version === "number" ? value.data : value;
  const version = typeof candidate.version === "number" ? candidate.version : 0;

  if (version === LOCAL_LIBRARY_SCHEMA_VERSION) return candidate;
  if (version === 0 || version === 1) return { ...candidate, version: LOCAL_LIBRARY_SCHEMA_VERSION };
  return null;
}

export function describeMigration(value: unknown) {
  if (!isRecord(value)) return { supported: false, fromVersion: null, migrated: false };
  const candidate = isRecord(value.data) && typeof value.version === "number" ? value.data : value;
  const fromVersion = typeof candidate.version === "number" ? candidate.version : 0;
  const migrated = fromVersion !== LOCAL_LIBRARY_SCHEMA_VERSION;
  return { supported: migrateLocalLibraryPayload(value) !== null, fromVersion, migrated };
}
