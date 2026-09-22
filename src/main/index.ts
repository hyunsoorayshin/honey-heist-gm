import { app, BrowserWindow, dialog, ipcMain, protocol, shell } from 'electron';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import type { GameState } from '../shared/types.js';
import { newGameState } from '../shared/rules.js';
import {
  parseTables,
  TablesValidationError,
  type GameTables,
  type TablesLoadResult,
} from '../shared/tables.js';
import exampleTablesJson from '../shared/tables.example.json';

const __dirname = dirname(fileURLToPath(import.meta.url));

let mainWindow: BrowserWindow | null = null;

function userDataDir(): string {
  return app.getPath('userData');
}

function stateFile(): string {
  return join(userDataDir(), 'state.json');
}

function tablesFile(): string {
  return join(userDataDir(), 'tables.json');
}

// --- game tables ---------------------------------------------------------

const EXAMPLE_TABLES: GameTables = parseTables(exampleTablesJson);

async function loadTables(): Promise<TablesLoadResult> {
  const userPath = tablesFile();
  let raw: string;
  try {
    raw = await readFile(userPath, 'utf8');
  } catch {
    return { tables: EXAMPLE_TABLES, source: 'example', userPath };
  }
  try {
    return { tables: parseTables(JSON.parse(raw)), source: 'user', userPath };
  } catch (err) {
    const message =
      err instanceof TablesValidationError
        ? err.message
        : err instanceof SyntaxError
          ? `not valid JSON (${err.message})`
          : String(err);
    return { tables: EXAMPLE_TABLES, source: 'example', userPath, error: message };
  }
}

// --- persisted game state ------------------------------------------------

async function loadState(): Promise<GameState> {
  try {
    const raw = await readFile(stateFile(), 'utf8');
    const parsed = JSON.parse(raw) as GameState;
    // Light migration: ensure required keys exist.
    return {
      ...newGameState(),
      ...parsed,
      scenario: { ...newGameState().scenario, ...parsed.scenario },
      map: { ...newGameState().map, ...parsed.map },
    };
  } catch {
    return newGameState();
  }
}

async function saveState(state: GameState): Promise<void> {
  await mkdir(userDataDir(), { recursive: true });
  await writeFile(stateFile(), JSON.stringify(state, null, 2), 'utf8');
}

// --- window --------------------------------------------------------------

function createWindow(title: string) {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 1024,
    minHeight: 680,
    backgroundColor: '#1c1410',
    title,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
    },
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

app.whenReady().then(async () => {
  // Custom protocol so the renderer can display arbitrary image paths the GM picks.
  protocol.registerFileProtocol('gm-img', (request, callback) => {
    const url = request.url.replace(/^gm-img:\/\//, '');
    callback({ path: decodeURIComponent(url) });
  });

  ipcMain.handle('tables:load', () => loadTables());

  ipcMain.handle('state:load', () => loadState());
  ipcMain.handle('state:save', async (_e, state: GameState) => {
    await saveState(state);
    return { ok: true };
  });

  ipcMain.handle('map:pick', async () => {
    if (!mainWindow) return null;
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Choose a map image',
      properties: ['openFile'],
      filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'] }],
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    return result.filePaths[0];
  });

  ipcMain.handle('tables:reveal', () => shell.showItemInFolder(tablesFile()));

  const { tables } = await loadTables();
  createWindow(tables.title);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow(tables.title);
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
