export type StatKey = 'bear' | 'criminal';
export type BearStatus = 'active' | 'betrayed' | 'lost-it';

export interface Bear {
  id: string;
  name: string;
  // 1-based row indices into the user-supplied tables; null means not rolled yet.
  descriptor: number | null;
  role: number | null;
  bearType: number | null;
  hat: number | null;
  stats: { bear: number; criminal: number };
  status: BearStatus;
  notes: string;
}

// Element kinds for non-bear tokens placed on the map.
export const ELEMENT_KINDS = [
  'guard',
  'civilian',
  'crowd',
  'honey',
  'bees',
  'door',
  'camera',
  'vault',
  'vehicle',
  'loot',
  'hazard',
  'marker',
] as const;
export type ElementKind = (typeof ELEMENT_KINDS)[number];

// Tokens that live on the map.
export interface BearToken {
  id: string; // same as bear.id
  kind: 'bear';
  x: number; // normalized 0..1
  y: number;
}

export interface ElementToken {
  id: string;
  kind: 'element';
  elementKind: ElementKind;
  label: string;
  x: number;
  y: number;
}

export type Token = BearToken | ElementToken;

export interface Scenario {
  organizer: number | null;
  locationAdjective: number | null;
  locationNoun: number | null;
  prize: number | null;
  security: [number | null, number | null];
  twist: number | null;
  notes: string;
}

export interface MapConfig {
  // Absolute path to the GM's chosen map image; empty string means none chosen.
  imagePath: string;
}

export interface GameState {
  bears: Bear[];
  tokens: Token[];
  scenario: Scenario;
  map: MapConfig;
}

// --- mutation actions ---
export type Action =
  | { type: 'add-bear'; name?: string }
  | { type: 'remove-bear'; bearId: string }
  | { type: 'rename-bear'; bearId: string; name: string }
  | { type: 'roll-attribute'; bearId: string; field: 'descriptor' | 'role' | 'bearType' | 'hat' }
  | {
      type: 'set-attribute';
      bearId: string;
      field: 'descriptor' | 'role' | 'bearType' | 'hat';
      value: number | null;
    }
  | { type: 'adjust-stat'; bearId: string; stat: StatKey; delta: number }
  | { type: 'set-stat'; bearId: string; stat: StatKey; value: number }
  | { type: 'set-bear-notes'; bearId: string; notes: string }
  | { type: 'set-bear-status'; bearId: string; status: BearStatus }
  | { type: 'reset-bear'; bearId: string }
  | { type: 'add-element'; elementKind: ElementKind; label?: string }
  | { type: 'remove-token'; tokenId: string }
  | { type: 'relabel-token'; tokenId: string; label: string }
  | { type: 'move-token'; tokenId: string; x: number; y: number }
  | {
      type: 'roll-scenario';
      field:
        | 'organizer'
        | 'locationAdjective'
        | 'locationNoun'
        | 'prize'
        | 'security0'
        | 'security1'
        | 'twist'
        | 'all';
    }
  | { type: 'set-scenario-notes'; notes: string }
  | { type: 'set-map-image'; imagePath: string }
  | { type: 'reset-game' };
