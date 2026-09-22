import { useStore, useTables } from '../store.js';
import { bearIcon } from '../icons.js';
import { bearTypeEntry, rowLabel } from '@shared/tables';

export function Roster() {
  const bears = useStore((s) => s.state.bears);
  const selectedBearId = useStore((s) => s.selectedBearId);
  const selectBear = useStore((s) => s.selectBear);
  const dispatch = useStore((s) => s.dispatch);
  const t = useTables();

  return (
    <div className="sidebar-section">
      <h2>Bears</h2>
      <div className="roster-list">
        {bears.length === 0 && <div className="empty-msg">No bears yet. Add one to get started.</div>}
        {bears.map((b) => {
          const subParts = [
            bearTypeEntry(t, b.bearType)?.name ?? null,
            rowLabel(t.roles, b.role),
          ].filter(Boolean);
          return (
            <div
              key={b.id}
              className={`roster-item${selectedBearId === b.id ? ' selected' : ''}`}
              onClick={() => selectBear(b.id)}
            >
              <span className="icon">{bearIcon(t, b.bearType)}</span>
              <div className="meta">
                <div className="name">{b.name}</div>
                <div className="sub">{subParts.join(' · ') || 'no class yet'}</div>
              </div>
              <div className="stats">
                <span className="bear-stat">B{b.stats.bear}</span> /{' '}
                <span className="crim-stat">C{b.stats.criminal}</span>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
        <button className="primary" onClick={() => dispatch({ type: 'add-bear' })}>
          + Add Bear
        </button>
      </div>
    </div>
  );
}
