import { useStore, useTables } from '../store.js';
import { bearTypeLabel, type BearAttributeField } from '@shared/tables';
import { STAT_MAX, STAT_MIN } from '@shared/rules';
import type { Bear, BearStatus } from '@shared/types';

export function BearEditor() {
  const bear = useStore((s) => s.state.bears.find((b) => b.id === s.selectedBearId) ?? null);
  if (!bear) {
    return (
      <div className="sidebar-section">
        <h2>Character</h2>
        <div className="empty-msg">Select a bear to edit.</div>
      </div>
    );
  }
  return <BearEditorBody bear={bear} />;
}

function BearEditorBody({ bear }: { bear: Bear }) {
  const dispatch = useStore((s) => s.dispatch);
  const selectBear = useStore((s) => s.selectBear);
  const t = useTables();

  const update = (field: BearAttributeField, value: number | null) =>
    dispatch({ type: 'set-attribute', bearId: bear.id, field, value });
  const roll = (field: BearAttributeField) => () =>
    dispatch({ type: 'roll-attribute', bearId: bear.id, field });
  const setStatus = (status: BearStatus) =>
    dispatch({ type: 'set-bear-status', bearId: bear.id, status });

  return (
    <div className="sidebar-section">
      <h2>Character</h2>
      <div className="bear-editor">
        <div className="row">
          <label>Name</label>
          <input
            value={bear.name}
            onChange={(e) =>
              dispatch({ type: 'rename-bear', bearId: bear.id, name: e.target.value })
            }
          />
          <span className={`status-pill ${bear.status}`}>{t.statusLabels[bear.status]}</span>
        </div>

        <AttrRow
          label="Descriptor"
          options={t.descriptors}
          value={bear.descriptor}
          onChange={(v) => update('descriptor', v)}
          onRoll={roll('descriptor')}
        />
        <AttrRow
          label="Role"
          options={t.roles}
          value={bear.role}
          onChange={(v) => update('role', v)}
          onRoll={roll('role')}
        />
        <AttrRow
          label="Bear Type"
          options={t.bearTypes.map(bearTypeLabel)}
          value={bear.bearType}
          onChange={(v) => update('bearType', v)}
          onRoll={roll('bearType')}
        />
        <AttrRow
          label="Hat"
          options={t.hats}
          value={bear.hat}
          onChange={(v) => update('hat', v)}
          onRoll={roll('hat')}
          allowNone
        />

        <StatRow
          label={t.statLabels.bear}
          klass="stat-bear"
          value={bear.stats.bear}
          onChange={(d) => dispatch({ type: 'adjust-stat', bearId: bear.id, stat: 'bear', delta: d })}
        />
        <StatRow
          label={t.statLabels.criminal}
          klass="stat-criminal"
          value={bear.stats.criminal}
          onChange={(d) =>
            dispatch({ type: 'adjust-stat', bearId: bear.id, stat: 'criminal', delta: d })
          }
        />

        <div>
          <label className="field-label">Notes</label>
          <textarea
            value={bear.notes}
            placeholder="Quick GM notes about this bear…"
            onChange={(e) =>
              dispatch({ type: 'set-bear-notes', bearId: bear.id, notes: e.target.value })
            }
          />
        </div>

        <div className="status-row">
          {(['active', 'betrayed', 'lost-it'] as const).map((status) => (
            <button
              key={status}
              className={bear.status === status ? 'primary' : ''}
              onClick={() => setStatus(status)}
              style={{ fontSize: 11, padding: '3px 8px' }}
            >
              {t.statusLabels[status]}
            </button>
          ))}
        </div>

        <div className="actions">
          <button
            className="ghost"
            onClick={() => dispatch({ type: 'reset-bear', bearId: bear.id })}
          >
            Reset Sheet
          </button>
          <button
            className="danger"
            onClick={() => {
              dispatch({ type: 'remove-bear', bearId: bear.id });
              selectBear(null);
            }}
          >
            Remove Bear
          </button>
        </div>
      </div>
    </div>
  );
}

function AttrRow({
  label,
  options,
  value,
  onChange,
  onRoll,
  allowNone,
}: {
  label: string;
  options: readonly string[];
  value: number | null;
  onChange: (v: number | null) => void;
  onRoll: () => void;
  allowNone?: boolean;
}) {
  // A saved index beyond the current table still shows up so it can be changed.
  const stale = value != null && value > options.length;
  return (
    <div className="row">
      <label>{label}</label>
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
      >
        <option value="">{allowNone ? '— none —' : '— not rolled —'}</option>
        {options.map((opt, i) => (
          <option key={i} value={i + 1}>
            {i + 1}. {opt}
          </option>
        ))}
        {stale && <option value={value}>{value}. (not in current tables)</option>}
      </select>
      <button className="ghost" onClick={onRoll} title={`Roll ${label}`}>
        🎲
      </button>
    </div>
  );
}

function StatRow({
  label,
  klass,
  value,
  onChange,
}: {
  label: string;
  klass: string;
  value: number;
  onChange: (delta: number) => void;
}) {
  return (
    <div className="stat-row">
      <label className="field-label">{label}</label>
      <div className="stat-controls">
        <button onClick={() => onChange(-1)} disabled={value <= STAT_MIN}>
          −
        </button>
        <span className={`num ${klass}`}>{value}</span>
        <button onClick={() => onChange(1)} disabled={value >= STAT_MAX}>
          +
        </button>
        <span className="stat-hint">target: roll ≤ {value} on d6</span>
      </div>
    </div>
  );
}
