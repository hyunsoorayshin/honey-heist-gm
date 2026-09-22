import type { Bear, GameState, MapConfig, Scenario } from './types.js';

// Two opposed stats that share a fixed pool: when one reaches STAT_MAX the
// character leaves play (see checkBearEndState).
export const STAT_MAX = 6;
export const STAT_MIN = 0;
export const STAT_START = 3;

export function rollD(n: number): number {
  return 1 + Math.floor(Math.random() * n);
}

export function newId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function newBear(name = 'Unnamed Bear'): Bear {
  return {
    id: newId(),
    name,
    descriptor: null,
    role: null,
    bearType: null,
    hat: null,
    stats: { bear: STAT_START, criminal: STAT_START },
    status: 'active',
    notes: '',
  };
}

export function newScenario(): Scenario {
  return {
    organizer: null,
    locationAdjective: null,
    locationNoun: null,
    prize: null,
    security: [null, null],
    twist: null,
    notes: '',
  };
}

export function newMapConfig(): MapConfig {
  return { imagePath: '' };
}

export function newGameState(): GameState {
  return {
    bears: [],
    tokens: [],
    scenario: newScenario(),
    map: newMapConfig(),
  };
}

export function clampStat(v: number): number {
  return Math.max(STAT_MIN, Math.min(STAT_MAX, v));
}

export function checkBearEndState(bear: Bear): Bear {
  if (bear.status !== 'active') return bear;
  if (bear.stats.criminal >= STAT_MAX) return { ...bear, status: 'betrayed' };
  if (bear.stats.bear >= STAT_MAX) return { ...bear, status: 'lost-it' };
  return bear;
}
