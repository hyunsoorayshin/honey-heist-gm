import { useEffect, useRef } from 'react';
import { useStore } from './store.js';
import { ScenarioBar } from './components/ScenarioBar.js';
import { TablesNotice } from './components/TablesNotice.js';
import { Roster } from './components/Roster.js';
import { BearEditor } from './components/BearEditor.js';
import { ElementPalette } from './components/ElementPalette.js';
import { MapView } from './components/MapView.js';

export function App() {
  const hydrated = useStore((s) => s.hydrated);
  const state = useStore((s) => s.state);
  const hydrate = useStore((s) => s.hydrate);
  const lastSavedRef = useRef<string>('');

  useEffect(() => {
    Promise.all([window.gm.loadState(), window.gm.loadTables()]).then(([loaded, t]) => {
      hydrate(loaded, t.tables, { source: t.source, userPath: t.userPath, error: t.error });
      lastSavedRef.current = JSON.stringify(loaded);
    });
  }, [hydrate]);

  // Debounced autosave.
  useEffect(() => {
    if (!hydrated) return;
    const serialized = JSON.stringify(state);
    if (serialized === lastSavedRef.current) return;
    const t = setTimeout(() => {
      window.gm.saveState(state).then(() => {
        lastSavedRef.current = serialized;
      });
    }, 400);
    return () => clearTimeout(t);
  }, [state, hydrated]);

  if (!hydrated) {
    return <div style={{ padding: 24 }}>Loading…</div>;
  }

  return (
    <div className="app">
      <ScenarioBar />
      <TablesNotice />
      <div className="body">
        <aside className="sidebar">
          <Roster />
          <BearEditor />
          <ElementPalette />
        </aside>
        <MapView />
      </div>
    </div>
  );
}
