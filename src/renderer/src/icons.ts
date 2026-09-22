import { bearTypeEntry, type GameTables } from '@shared/tables';
import type { ElementKind } from '@shared/types';

export const ELEMENT_ICON: Record<ElementKind, string> = {
  guard: '👮',
  civilian: '🧍',
  crowd: '👥',
  honey: '🍯',
  bees: '🐝',
  door: '🚪',
  camera: '📷',
  vault: '🔒',
  vehicle: '🚗',
  loot: '💰',
  hazard: '⚠️',
  marker: '📍',
};

const DEFAULT_BEAR_ICON = '🐻';

// Icon for a bear's type, taken from the user's tables.json when provided.
export function bearIcon(tables: GameTables, bearType: number | null): string {
  return bearTypeEntry(tables, bearType)?.icon || DEFAULT_BEAR_ICON;
}
