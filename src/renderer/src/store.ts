import { create } from 'zustand';
import { applyAction } from '@shared/reducer';
import { newGameState } from '@shared/rules';
import { emptyTables, type GameTables } from '@shared/tables';
import type { Action, GameState } from '@shared/types';

export interface TablesInfo {
  source: 'user' | 'example';
  userPath: string;
  error?: string;
}

interface AppStore {
  state: GameState;
  tables: GameTables;
  tablesInfo: TablesInfo;
  hydrated: boolean;
  selectedBearId: string | null;
  selectedTokenId: string | null;
  hydrate: (state: GameState, tables: GameTables, info: TablesInfo) => void;
  setTables: (tables: GameTables, info: TablesInfo) => void;
  dispatch: (action: Action) => void;
  selectBear: (id: string | null) => void;
  selectToken: (id: string | null) => void;
}

export const useStore = create<AppStore>((set) => ({
  state: newGameState(),
  tables: emptyTables(),
  tablesInfo: { source: 'example', userPath: '' },
  hydrated: false,
  selectedBearId: null,
  selectedTokenId: null,
  hydrate: (state, tables, tablesInfo) => set({ state, tables, tablesInfo, hydrated: true }),
  setTables: (tables, tablesInfo) => set({ tables, tablesInfo }),
  dispatch: (action) =>
    set((prev) => {
      const next = applyAction(prev.state, action, prev.tables);
      // If we removed the currently selected bear/token, clear selection.
      let selectedBearId = prev.selectedBearId;
      let selectedTokenId = prev.selectedTokenId;
      if (selectedBearId && !next.bears.find((b) => b.id === selectedBearId)) selectedBearId = null;
      if (selectedTokenId && !next.tokens.find((t) => t.id === selectedTokenId)) selectedTokenId = null;
      return { state: next, selectedBearId, selectedTokenId };
    }),
  selectBear: (id) => set({ selectedBearId: id, selectedTokenId: null }),
  selectToken: (id) => set({ selectedTokenId: id }),
}));

export const useTables = () => useStore((s) => s.tables);
