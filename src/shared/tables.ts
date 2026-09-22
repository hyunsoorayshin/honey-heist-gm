// Runtime-loaded game tables.
//
// This app ships NO game text. The tables (descriptors, roles, bear types, hats,
// and the GM scenario tables) are read at startup from a user-provided
// `tables.json`. `tables.example.json` documents the shape with placeholder
// entries only. Indices stored in game state are 1-based, matching the
// "roll a d6 and look up row N" convention, so every list must have at least
// one entry and the lengths decide which die is rolled.

import type { BearStatus, StatKey } from './types.js';

export interface BearTypeEntry {
  name: string;
  skill: string;
  // Optional emoji shown on the roster and map token for this type.
  icon?: string;
}

export interface GameTables {
  // Display title shown in the window and the scenario bar.
  title: string;
  statLabels: Record<StatKey, string>;
  statusLabels: Record<BearStatus, string>;
  descriptors: string[];
  roles: string[];
  bearTypes: BearTypeEntry[];
  hats: string[];
  organizerTraits: string[];
  locationAdjectives: string[];
  locationNouns: string[];
  prizes: string[];
  securityFeatures: string[];
  twists: string[];
}

export type BearAttributeField = 'descriptor' | 'role' | 'bearType' | 'hat';

// What the main process hands the renderer after looking for tables.json.
export interface TablesLoadResult {
  tables: GameTables;
  // 'user' when tables.json in the user-data dir was loaded; 'example' when
  // falling back to the bundled placeholder file.
  source: 'user' | 'example';
  userPath: string;
  // Set when a user file exists but could not be used.
  error?: string;
}

export const STRING_LIST_KEYS = [
  'descriptors',
  'roles',
  'hats',
  'organizerTraits',
  'locationAdjectives',
  'locationNouns',
  'prizes',
  'securityFeatures',
  'twists',
] as const satisfies readonly (keyof GameTables)[];

const STAT_KEYS: readonly StatKey[] = ['bear', 'criminal'];
const STATUS_KEYS: readonly BearStatus[] = ['active', 'betrayed', 'lost-it'];

export class TablesValidationError extends Error {}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function readString(obj: Record<string, unknown>, key: string, where: string): string {
  const v = obj[key];
  if (typeof v !== 'string' || v.trim() === '') {
    throw new TablesValidationError(`${where}.${key} must be a non-empty string`);
  }
  return v;
}

function readStringList(obj: Record<string, unknown>, key: string): string[] {
  const v = obj[key];
  if (!Array.isArray(v) || v.length === 0) {
    throw new TablesValidationError(`"${key}" must be a non-empty array of strings`);
  }
  return v.map((item, i) => {
    if (typeof item !== 'string' || item.trim() === '') {
      throw new TablesValidationError(`"${key}[${i}]" must be a non-empty string`);
    }
    return item;
  });
}

function readLabelMap<K extends string>(
  obj: Record<string, unknown>,
  key: string,
  keys: readonly K[],
): Record<K, string> {
  const v = obj[key];
  if (!isRecord(v)) throw new TablesValidationError(`"${key}" must be an object`);
  const out = {} as Record<K, string>;
  for (const k of keys) out[k] = readString(v, k, key);
  return out;
}

// Validates untrusted JSON into a GameTables value, throwing TablesValidationError
// with a human-readable message on the first problem found.
export function parseTables(raw: unknown): GameTables {
  if (!isRecord(raw)) throw new TablesValidationError('tables.json must contain a JSON object');

  const bearTypesRaw = raw.bearTypes;
  if (!Array.isArray(bearTypesRaw) || bearTypesRaw.length === 0) {
    throw new TablesValidationError('"bearTypes" must be a non-empty array');
  }
  const bearTypes: BearTypeEntry[] = bearTypesRaw.map((entry, i) => {
    if (!isRecord(entry)) throw new TablesValidationError(`"bearTypes[${i}]" must be an object`);
    const where = `bearTypes[${i}]`;
    const icon = entry.icon;
    if (icon !== undefined && typeof icon !== 'string') {
      throw new TablesValidationError(`${where}.icon must be a string when present`);
    }
    return {
      name: readString(entry, 'name', where),
      skill: readString(entry, 'skill', where),
      ...(icon ? { icon } : {}),
    };
  });

  const lists = Object.fromEntries(
    STRING_LIST_KEYS.map((k) => [k, readStringList(raw, k)]),
  ) as Pick<GameTables, (typeof STRING_LIST_KEYS)[number]>;

  return {
    title: readString(raw, 'title', 'tables'),
    statLabels: readLabelMap(raw, 'statLabels', STAT_KEYS),
    statusLabels: readLabelMap(raw, 'statusLabels', STATUS_KEYS),
    bearTypes,
    ...lists,
  };
}

// Number of rows in the table backing a bear attribute.
export function attributeTableSize(tables: GameTables, field: BearAttributeField): number {
  switch (field) {
    case 'descriptor':
      return tables.descriptors.length;
    case 'role':
      return tables.roles.length;
    case 'bearType':
      return tables.bearTypes.length;
    case 'hat':
      return tables.hats.length;
  }
}

// Look up a 1-based row, tolerating saved state that outlives a shorter table.
export function rowLabel(list: readonly string[], index: number | null): string | null {
  if (index == null) return null;
  return list[index - 1] ?? `#${index}`;
}

export function bearTypeEntry(tables: GameTables, index: number | null): BearTypeEntry | null {
  if (index == null) return null;
  return tables.bearTypes[index - 1] ?? null;
}

export function bearTypeLabel(entry: BearTypeEntry): string {
  return `${entry.name} (${entry.skill})`;
}

// Placeholder used before the real tables are loaded. Nothing renders against
// it, but it keeps the store's type simple.
export function emptyTables(): GameTables {
  return {
    title: '',
    statLabels: { bear: '', criminal: '' },
    statusLabels: { active: '', betrayed: '', 'lost-it': '' },
    descriptors: [],
    roles: [],
    bearTypes: [],
    hats: [],
    organizerTraits: [],
    locationAdjectives: [],
    locationNouns: [],
    prizes: [],
    securityFeatures: [],
    twists: [],
  };
}
