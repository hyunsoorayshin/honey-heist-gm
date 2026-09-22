import { useStore } from '../store.js';

// Shown while the app is running on the bundled placeholder tables, so the GM
// knows where to put their own tables.json and can reload without restarting.
export function TablesNotice() {
  const info = useStore((s) => s.tablesInfo);
  const setTables = useStore((s) => s.setTables);

  if (info.source === 'user') return null;

  const reload = async () => {
    const t = await window.gm.loadTables();
    setTables(t.tables, { source: t.source, userPath: t.userPath, error: t.error });
  };

  return (
    <div className="tables-notice">
      <span>
        {info.error
          ? `Your tables.json could not be used (${info.error}); showing placeholder tables.`
          : 'Using placeholder tables. Provide your own tables.json to see real entries.'}
      </span>
      <code title={info.userPath}>{info.userPath}</code>
      <button className="ghost" onClick={() => window.gm.revealTablesFile()}>
        Show folder
      </button>
      <button className="ghost" onClick={reload}>
        Reload
      </button>
    </div>
  );
}
