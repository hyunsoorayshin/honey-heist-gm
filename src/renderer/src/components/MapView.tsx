import { useEffect, useRef, useState } from 'react';
import { useStore, useTables } from '../store.js';
import { bearIcon, ELEMENT_ICON } from '../icons.js';
import type { GameTables } from '@shared/tables';
import type { Bear, Token } from '@shared/types';

export function MapView() {
  const state = useStore((s) => s.state);
  const dispatch = useStore((s) => s.dispatch);
  const selectedTokenId = useStore((s) => s.selectedTokenId);
  const selectToken = useStore((s) => s.selectToken);
  const selectBear = useStore((s) => s.selectBear);
  const tables = useTables();

  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null);
  const [wrapSize, setWrapSize] = useState<{ w: number; h: number } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Track the available area so the frame can scale to fill it (preserving aspect).
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setWrapSize({ w: el.clientWidth, h: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Size the frame to the largest rect inside the wrap that matches the image aspect.
  const frameStyle = (() => {
    if (!imgSize || !wrapSize) return undefined;
    const pad = 24;
    const availW = Math.max(0, wrapSize.w - pad * 2);
    const availH = Math.max(0, wrapSize.h - pad * 2);
    const imgAspect = imgSize.w / imgSize.h;
    const availAspect = availW / availH;
    const w = imgAspect > availAspect ? availW : availH * imgAspect;
    const h = imgAspect > availAspect ? availW / imgAspect : availH;
    return { width: w, height: h };
  })();

  const mapSrc = state.map.imagePath
    ? `gm-img://${encodeURIComponent(state.map.imagePath)}`
    : null;

  const pickMap = async () => {
    const picked = await window.gm.pickMap();
    if (picked) dispatch({ type: 'set-map-image', imagePath: picked });
  };

  const onFrameMouseDown = (e: React.MouseEvent) => {
    // Click on empty map area clears selection.
    if (e.target === e.currentTarget || (e.target as HTMLElement).tagName === 'IMG') {
      selectToken(null);
    }
  };

  const bearsById = new Map(state.bears.map((b) => [b.id, b]));

  return (
    <div className="map-wrap" ref={wrapRef}>
      <div className="map-toolbar">
        <button onClick={pickMap}>Change Map…</button>
        {state.map.imagePath && (
          <button className="ghost" onClick={() => dispatch({ type: 'set-map-image', imagePath: '' })}>
            Clear Map
          </button>
        )}
      </div>
      {mapSrc ? (
        <div className="map-frame" style={frameStyle} onMouseDown={onFrameMouseDown}>
          <img
            className="bg"
            src={mapSrc}
            alt="map"
            onLoad={(e) => {
              const img = e.currentTarget;
              setImgSize({ w: img.naturalWidth, h: img.naturalHeight });
            }}
            draggable={false}
          />
          {imgSize &&
            state.tokens.map((t) => (
              <TokenPiece
                key={t.id}
                token={t}
                bear={t.kind === 'bear' ? bearsById.get(t.id) ?? null : null}
                tables={tables}
                selected={selectedTokenId === t.id}
                onSelect={() => {
                  selectToken(t.id);
                  if (t.kind === 'bear') selectBear(t.id);
                }}
              />
            ))}
        </div>
      ) : (
        <div className="map-frame empty" onClick={pickMap}>
          <div className="empty-msg" style={{ textAlign: 'center' }}>
            No map loaded.
            <br />
            <button className="primary" style={{ marginTop: 8 }} onClick={pickMap}>
              Choose a map image
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function TokenPiece({
  token,
  bear,
  tables,
  selected,
  onSelect,
}: {
  token: Token;
  bear: Bear | null;
  tables: GameTables;
  selected: boolean;
  onSelect: () => void;
}) {
  const dispatch = useStore((s) => s.dispatch);
  const [draggingPos, setDraggingPos] = useState<{ x: number; y: number } | null>(null);
  const [editingLabel, setEditingLabel] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  const x = draggingPos?.x ?? token.x;
  const y = draggingPos?.y ?? token.y;

  const onPointerDown = (e: React.PointerEvent) => {
    if (editingLabel) return;
    e.stopPropagation();
    onSelect();
    const frame = elementRef.current?.closest('.map-frame') as HTMLElement | null;
    if (!frame) return;
    (e.target as Element).setPointerCapture(e.pointerId);

    let moved = false;
    const startX = e.clientX;
    const startY = e.clientY;

    const move = (ev: PointerEvent) => {
      if (!moved && Math.hypot(ev.clientX - startX, ev.clientY - startY) < 3) return;
      moved = true;
      const rect = frame.getBoundingClientRect();
      const nx = (ev.clientX - rect.left) / rect.width;
      const ny = (ev.clientY - rect.top) / rect.height;
      setDraggingPos({ x: clamp01(nx), y: clamp01(ny) });
    };
    const up = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      if (moved) {
        const rect = frame.getBoundingClientRect();
        const nx = clamp01((ev.clientX - rect.left) / rect.width);
        const ny = clamp01((ev.clientY - rect.top) / rect.height);
        dispatch({ type: 'move-token', tokenId: token.id, x: nx, y: ny });
      }
      setDraggingPos(null);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  let icon: string;
  let label: string;
  let extraClass = '';
  let badge: string | null = null;

  if (token.kind === 'bear' && bear) {
    icon = bearIcon(tables, bear.bearType);
    label = bear.name;
    extraClass = `bear ${bear.status}`;
    badge = `B${bear.stats.bear}/C${bear.stats.criminal}`;
  } else if (token.kind === 'element') {
    icon = ELEMENT_ICON[token.elementKind];
    label = token.label;
    extraClass = 'element';
  } else {
    // Bear token whose backing bear was removed — render placeholder.
    icon = '❓';
    label = 'missing';
  }

  return (
    <>
      <div
        ref={elementRef}
        className={`token ${extraClass}${selected ? ' selected' : ''}${draggingPos ? ' dragging' : ''}`}
        style={{ left: `${x * 100}%`, top: `${y * 100}%` }}
        onPointerDown={onPointerDown}
        onDoubleClick={(e) => {
          e.stopPropagation();
          if (token.kind === 'element') setEditingLabel(true);
        }}
      >
        <div className="label">{label}</div>
        <div className="icon-wrap">
          {icon}
          {badge && <span className="badge">{badge}</span>}
        </div>
      </div>
      {selected && token.kind === 'element' && !editingLabel && (
        <TokenPopover x={x} y={y}>
          <button onClick={() => setEditingLabel(true)} title="Rename">
            ✏️ Rename
          </button>
          <button
            className="danger"
            onClick={() => dispatch({ type: 'remove-token', tokenId: token.id })}
          >
            Remove
          </button>
        </TokenPopover>
      )}
      {selected && token.kind === 'element' && editingLabel && (
        <TokenPopover x={x} y={y}>
          <RenameInput
            initial={token.label}
            onCommit={(value) => {
              dispatch({ type: 'relabel-token', tokenId: token.id, label: value });
              setEditingLabel(false);
            }}
            onCancel={() => setEditingLabel(false)}
          />
        </TokenPopover>
      )}
    </>
  );
}

function TokenPopover({
  x,
  y,
  children,
}: {
  x: number;
  y: number;
  children: React.ReactNode;
}) {
  return (
    <div
      className="token-popover"
      style={{
        left: `${x * 100}%`,
        top: `calc(${y * 100}% + 32px)`,
        transform: 'translateX(-50%)',
      }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  );
}

function RenameInput({
  initial,
  onCommit,
  onCancel,
}: {
  initial: string;
  onCommit: (v: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(initial);
  return (
    <>
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onCommit(value.trim() || initial);
          if (e.key === 'Escape') onCancel();
        }}
      />
      <button className="primary" onClick={() => onCommit(value.trim() || initial)}>
        Save
      </button>
      <button className="ghost" onClick={onCancel}>
        Cancel
      </button>
    </>
  );
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}
