import { contextBridge, ipcRenderer } from 'electron';
import type { GameState } from '../shared/types.js';
import type { TablesLoadResult } from '../shared/tables.js';

const api = {
  loadTables: (): Promise<TablesLoadResult> => ipcRenderer.invoke('tables:load'),
  revealTablesFile: (): Promise<void> => ipcRenderer.invoke('tables:reveal'),
  loadState: (): Promise<GameState> => ipcRenderer.invoke('state:load'),
  saveState: (state: GameState): Promise<{ ok: boolean }> =>
    ipcRenderer.invoke('state:save', state),
  pickMap: (): Promise<string | null> => ipcRenderer.invoke('map:pick'),
};

contextBridge.exposeInMainWorld('gm', api);

export type GmApi = typeof api;
