import { useStore } from '../store.js';
import { ELEMENT_ICON } from '../icons.js';
import { ELEMENT_KINDS } from '@shared/types';
import { defaultLabel } from '@shared/reducer';

export function ElementPalette() {
  const dispatch = useStore((s) => s.dispatch);
  return (
    <div className="sidebar-section">
      <h2>Place on Map</h2>
      <div className="palette">
        {ELEMENT_KINDS.map((kind) => (
          <button
            key={kind}
            onClick={() => dispatch({ type: 'add-element', elementKind: kind })}
            title={`Add ${defaultLabel(kind)}`}
          >
            <span className="em">{ELEMENT_ICON[kind]}</span>
            <span className="lbl">{defaultLabel(kind)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
