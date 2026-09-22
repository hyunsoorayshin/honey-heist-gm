import type { Action, Bear, ElementKind, ElementToken, GameState, Scenario, Token } from './types.js';
import { checkBearEndState, clampStat, newBear, newGameState, newId, rollD, STAT_START } from './rules.js';
import { attributeTableSize, type GameTables } from './tables.js';

function updateBear(state: GameState, bearId: string, fn: (b: Bear) => Bear): GameState {
  let touched = false;
  const bears = state.bears.map((b) => {
    if (b.id !== bearId) return b;
    touched = true;
    return checkBearEndState(fn(b));
  });
  if (!touched) return state;
  return { ...state, bears };
}

function updateToken(state: GameState, tokenId: string, fn: (t: Token) => Token | null): GameState {
  let touched = false;
  const tokens: Token[] = [];
  for (const t of state.tokens) {
    if (t.id !== tokenId) {
      tokens.push(t);
      continue;
    }
    touched = true;
    const next = fn(t);
    if (next) tokens.push(next);
  }
  if (!touched) return state;
  return { ...state, tokens };
}

type ScenarioRollField = Extract<Action, { type: 'roll-scenario' }>['field'];

function rollScenarioField(scenario: Scenario, field: ScenarioRollField, t: GameTables): Scenario {
  const next: Scenario = { ...scenario, security: [...scenario.security] as [number | null, number | null] };
  switch (field) {
    case 'organizer':
      next.organizer = rollD(t.organizerTraits.length);
      break;
    case 'locationAdjective':
      next.locationAdjective = rollD(t.locationAdjectives.length);
      break;
    case 'locationNoun':
      next.locationNoun = rollD(t.locationNouns.length);
      break;
    case 'prize':
      next.prize = rollD(t.prizes.length);
      break;
    case 'security0':
      next.security[0] = rollD(t.securityFeatures.length);
      break;
    case 'security1':
      next.security[1] = rollD(t.securityFeatures.length);
      break;
    case 'twist':
      next.twist = rollD(t.twists.length);
      break;
    case 'all':
      next.organizer = rollD(t.organizerTraits.length);
      next.locationAdjective = rollD(t.locationAdjectives.length);
      next.locationNoun = rollD(t.locationNouns.length);
      next.prize = rollD(t.prizes.length);
      next.security = [rollD(t.securityFeatures.length), rollD(t.securityFeatures.length)];
      next.twist = rollD(t.twists.length);
      break;
  }
  return next;
}

const ELEMENT_DEFAULT_LABELS: Record<ElementKind, string> = {
  guard: 'Guard',
  civilian: 'Civilian',
  crowd: 'Crowd',
  honey: 'Honey',
  bees: 'Bees',
  door: 'Door',
  camera: 'Camera',
  vault: 'Vault',
  vehicle: 'Vehicle',
  loot: 'Loot',
  hazard: 'Hazard',
  marker: 'Marker',
};

export function defaultLabel(kind: ElementKind): string {
  return ELEMENT_DEFAULT_LABELS[kind];
}

export function applyAction(state: GameState, action: Action, tables: GameTables): GameState {
  switch (action.type) {
    case 'add-bear': {
      const bear = newBear(action.name?.trim() || 'Unnamed Bear');
      const token: Token = { id: bear.id, kind: 'bear', x: 0.5, y: 0.5 };
      return { ...state, bears: [...state.bears, bear], tokens: [...state.tokens, token] };
    }
    case 'remove-bear':
      return {
        ...state,
        bears: state.bears.filter((b) => b.id !== action.bearId),
        tokens: state.tokens.filter((t) => t.id !== action.bearId),
      };
    case 'rename-bear':
      return updateBear(state, action.bearId, (b) => ({ ...b, name: action.name }));
    case 'roll-attribute': {
      const value = rollD(attributeTableSize(tables, action.field));
      return updateBear(state, action.bearId, (b) => ({ ...b, [action.field]: value }));
    }
    case 'set-attribute':
      return updateBear(state, action.bearId, (b) => ({ ...b, [action.field]: action.value }));
    case 'adjust-stat':
      return updateBear(state, action.bearId, (b) => ({
        ...b,
        stats: { ...b.stats, [action.stat]: clampStat(b.stats[action.stat] + action.delta) },
      }));
    case 'set-stat':
      return updateBear(state, action.bearId, (b) => ({
        ...b,
        stats: { ...b.stats, [action.stat]: clampStat(action.value) },
      }));
    case 'set-bear-notes':
      return updateBear(state, action.bearId, (b) => ({ ...b, notes: action.notes }));
    case 'set-bear-status':
      return updateBear(state, action.bearId, (b) => ({ ...b, status: action.status }));
    case 'reset-bear':
      return updateBear(state, action.bearId, (b) => ({
        ...b,
        descriptor: null,
        role: null,
        bearType: null,
        hat: null,
        stats: { bear: STAT_START, criminal: STAT_START },
        status: 'active',
        notes: '',
      }));
    case 'add-element': {
      const tok: ElementToken = {
        id: newId(),
        kind: 'element',
        elementKind: action.elementKind,
        label: action.label?.trim() || defaultLabel(action.elementKind),
        x: 0.5,
        y: 0.5,
      };
      return { ...state, tokens: [...state.tokens, tok] };
    }
    case 'remove-token':
      return { ...state, tokens: state.tokens.filter((t) => t.id !== action.tokenId) };
    case 'relabel-token':
      return updateToken(state, action.tokenId, (t) =>
        t.kind === 'element' ? { ...t, label: action.label } : t,
      );
    case 'move-token':
      return updateToken(state, action.tokenId, (t) => ({
        ...t,
        x: clamp01(action.x),
        y: clamp01(action.y),
      }));
    case 'roll-scenario':
      return { ...state, scenario: rollScenarioField(state.scenario, action.field, tables) };
    case 'set-scenario-notes':
      return { ...state, scenario: { ...state.scenario, notes: action.notes } };
    case 'set-map-image':
      return { ...state, map: { imagePath: action.imagePath } };
    case 'reset-game':
      return newGameState();
  }
}

function clamp01(v: number): number {
  if (Number.isNaN(v)) return 0;
  return Math.max(0, Math.min(1, v));
}
