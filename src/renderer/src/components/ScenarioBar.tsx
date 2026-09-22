import { useStore, useTables } from '../store.js';
import { rowLabel } from '@shared/tables';

export function ScenarioBar() {
  const scenario = useStore((s) => s.state.scenario);
  const dispatch = useStore((s) => s.dispatch);
  const t = useTables();

  const adjective = rowLabel(t.locationAdjectives, scenario.locationAdjective);
  const noun = rowLabel(t.locationNouns, scenario.locationNoun);
  const loc = adjective && noun ? `${adjective} ${noun}` : null;

  const security = scenario.security
    .map((i) => rowLabel(t.securityFeatures, i))
    .filter(Boolean)
    .join(' + ');

  return (
    <div className="scenario-bar">
      <span className="title">{t.title}</span>
      <Field
        label="Location"
        value={loc}
        onReroll={() => {
          dispatch({ type: 'roll-scenario', field: 'locationAdjective' });
          dispatch({ type: 'roll-scenario', field: 'locationNoun' });
        }}
      />
      <Field
        label="Organizer"
        value={rowLabel(t.organizerTraits, scenario.organizer)}
        onReroll={() => dispatch({ type: 'roll-scenario', field: 'organizer' })}
      />
      <Field
        label="Prize"
        value={rowLabel(t.prizes, scenario.prize)}
        onReroll={() => dispatch({ type: 'roll-scenario', field: 'prize' })}
      />
      <Field
        label="Security"
        value={security || null}
        onReroll={() => {
          dispatch({ type: 'roll-scenario', field: 'security0' });
          dispatch({ type: 'roll-scenario', field: 'security1' });
        }}
      />
      <Field
        label="Twist"
        value={rowLabel(t.twists, scenario.twist)}
        onReroll={() => dispatch({ type: 'roll-scenario', field: 'twist' })}
      />
      <div className="spacer" />
      <button className="primary" onClick={() => dispatch({ type: 'roll-scenario', field: 'all' })}>
        Roll Scenario
      </button>
    </div>
  );
}

function Field({
  label,
  value,
  onReroll,
}: {
  label: string;
  value: string | null;
  onReroll: () => void;
}) {
  return (
    <div className="field">
      <label>{label}</label>
      <span className={`value${value ? '' : ' empty'}`}>{value ?? '—'}</span>
      <button className="reroll ghost" onClick={onReroll} title={`Reroll ${label}`}>
        🎲
      </button>
    </div>
  );
}
