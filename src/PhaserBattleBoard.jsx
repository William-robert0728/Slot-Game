import { useState, useEffect, useRef, useCallback, createElement } from 'react';
import { ugc as ugcApi } from '../lib/api';

const API_BASE = import.meta.env.REACT_APP_BACKEND_URL || '';
/** Live WebGL GLB on board slots (path is site-relative / public). */
const SLOT_CARD_MODEL_SRC = '/assets/soldier-compressed.glb';
const BOARD_W = 1536;
const BOARD_H = 1024;

// ─── Default calibrated slot positions (1536×1024 space; scaled from 960×640) ─
const DEFAULT_GRID = {
  left: [
    { x: 307, y: 353 }, { x: 392, y: 352 }, { x: 476, y: 353 }, { x: 564, y: 353 }, { x: 653, y: 353 },
    { x: 282, y: 427 }, { x: 371, y: 427 }, { x: 461, y: 428 }, { x: 555, y: 425 }, { x: 648, y: 427 },
    { x: 235, y: 558 }, { x: 336, y: 558 }, { x: 434, y: 559 }, { x: 536, y: 559 }, { x: 639, y: 559 },
    { x: 200, y: 657 }, { x: 309, y: 657 }, { x: 416, y: 657 }, { x: 523, y: 657 }, { x: 631, y: 656 },
  ],
  right: [
    { x: 798, y: 353 }, { x: 883, y: 353 }, { x: 973, y: 352 }, { x: 1060, y: 353 }, { x: 1148, y: 353 },
    { x: 798, y: 427 }, { x: 893, y: 427 }, { x: 986, y: 427 }, { x: 1078, y: 427 }, { x: 1171, y: 427 },
    { x: 805, y: 557 }, { x: 907, y: 557 }, { x: 1009, y: 557 }, { x: 1112, y: 557 }, { x: 1215, y: 557 },
    { x: 808, y: 658 }, { x: 919, y: 657 }, { x: 1028, y: 656 }, { x: 1139, y: 656 }, { x: 1250, y: 657 },
  ],
  deckLeft: { x: 138, y: 410 },
  deckRight: { x: 1337, y: 412 },
};

// ─── Default per-slot CSS transforms ────────────────────────────────────────
const DEFAULT_TRANSFORMS = {
  _default: { cw: 83, ch: 96, rx: 58, ry: 0, rz: -2, sx: -4, sy: 0, persp: 800 },
  left_0: { cw: 72, ch: 115, rx: 58, ry: 0, rz: -2, sx: -12.5, sy: 0, persp: 800 },
  left_1: { cw: 72, ch: 111, rx: 57, ry: 0, rz: -2, sx: -10, sy: 2, persp: 800 },
  left_2: { cw: 70, ch: 102, rx: 53.5, ry: 1, rz: 0, sx: -6.5, sy: 0, persp: 800 },
  left_3: { cw: 74, ch: 114, rx: 59, ry: 1, rz: -2, sx: -5, sy: 0, persp: 800 },
  left_4: { cw: 73, ch: 114, rx: 58, ry: -1, rz: -1, sx: -4, sy: 0, persp: 800 },
  left_5: { cw: 75, ch: 127, rx: 58, ry: 1, rz: -1.5, sx: -11.5, sy: 1, persp: 800 },
  left_6: { cw: 76, ch: 120, rx: 57, ry: 0, rz: -2, sx: -10, sy: 2, persp: 800 },
  left_7: { cw: 75, ch: 95, rx: 44, ry: 2, rz: -2.5, sx: -11, sy: 0, persp: 800 },
  left_8: { cw: 76, ch: 127, rx: 58, ry: 0, rz: 0, sx: -4.5, sy: 0, persp: 800 },
  left_9: { cw: 77, ch: 128, rx: 59, ry: 1.5, rz: -2, sx: -3.5, sy: -1, persp: 800 },
  left_10: { cw: 82, ch: 148, rx: 58, ry: 0, rz: 4, sx: -5, sy: -5, persp: 800 },
  left_11: { cw: 80, ch: 148, rx: 58, ry: 0, rz: -2, sx: -9, sy: 2.5, persp: 800 },
  left_12: { cw: 83, ch: 137, rx: 54, ry: 0, rz: 2, sx: -4, sy: -1.5, persp: 800 },
  left_13: { cw: 83, ch: 150, rx: 58, ry: 0, rz: 0, sx: -4, sy: 0, persp: 800 },
  left_14: { cw: 85, ch: 150, rx: 58, ry: 1, rz: -2, sx: -3.5, sy: 0, persp: 800 },
  left_15: { cw: 90, ch: 162, rx: 57, ry: -4, rz: 4.5, sx: -6, sy: 2, persp: 2128 },
  left_16: { cw: 90, ch: 133, rx: 47, ry: 2.5, rz: -4, sx: -14, sy: 1, persp: 736 },
  left_17: { cw: 90, ch: 133, rx: 47, ry: 2.5, rz: -4, sx: -10.5, sy: 0, persp: 800 },
  left_18: { cw: 91, ch: 150, rx: 53.5, ry: 0, rz: -2, sx: -6, sy: 2, persp: 800 },
  left_19: { cw: 90, ch: 191, rx: 61, ry: 5, rz: -0.5, sx: -2.5, sy: -7.5, persp: 1056 },
  right_0: { cw: 74, ch: 96, rx: 51, ry: -4, rz: -4, sx: -2, sy: 9.5, persp: 800 },
  right_1: { cw: 72, ch: 96, rx: 49.5, ry: 0, rz: -2, sx: 3, sy: 3, persp: 800 },
  right_2: { cw: 75, ch: 96, rx: 51, ry: 0, rz: -2, sx: 3.5, sy: 0, persp: 800 },
  right_3: { cw: 75, ch: 87, rx: 45.5, ry: 11.5, rz: -12, sx: -1.5, sy: -0.5, persp: 800 },
  right_4: { cw: 74, ch: 95, rx: 49.5, ry: 1, rz: -5, sx: 8, sy: 2.5, persp: 800 },
  right_5: { cw: 77, ch: 126, rx: 58.5, ry: -1.5, rz: -4.5, sx: -2.5, sy: 9, persp: 800 },
  right_6: { cw: 77, ch: 112, rx: 53.5, ry: 0, rz: -2, sx: 1, sy: 0, persp: 800 },
  right_7: { cw: 77, ch: 125, rx: 57, ry: -1.5, rz: -4.5, sx: 2, sy: 5.5, persp: 800 },
  right_8: { cw: 77, ch: 125, rx: 58, ry: 0, rz: -2, sx: 5, sy: 1, persp: 800 },
  right_9: { cw: 77, ch: 100, rx: 45.5, ry: 0, rz: -2, sx: 12, sy: 2.5, persp: 800 },
  right_10: { cw: 82, ch: 149, rx: 58, ry: 0, rz: -2, sx: 0, sy: 0, persp: 800 },
  right_11: { cw: 80, ch: 149, rx: 57, ry: -1.5, rz: -3.5, sx: 0.5, sy: 2.5, persp: 800 },
  right_12: { cw: 84, ch: 149, rx: 58, ry: 0, rz: -2, sx: 5, sy: 3, persp: 800 },
  right_13: { cw: 83, ch: 153, rx: 58.5, ry: 3.5, rz: -4.5, sx: 5, sy: -1.5, persp: 800 },
  right_14: { cw: 83, ch: 152, rx: 58.5, ry: 1, rz: -6, sx: 4.5, sy: 6.5, persp: 800 },
  right_15: { cw: 89, ch: 91, rx: 6, ry: -4, rz: -2.5, sx: 2, sy: 3, persp: 800 },
  right_16: { cw: 97, ch: 130, rx: 48.5, ry: 15, rz: -21, sx: -14, sy: 5.5, persp: 800 },
  right_17: { cw: 90, ch: 166, rx: 57, ry: 0, rz: -11.5, sx: -4.5, sy: 12.5, persp: 800 },
  right_18: { cw: 91, ch: 144, rx: 51, ry: 0, rz: -14.5, sx: -4.5, sy: 14.5, persp: 800 },
  right_19: { cw: 90, ch: 98, rx: 19, ry: 12.5, rz: -9, sx: 9.5, sy: 3, persp: 800 },
  deck_left: { cw: 104, ch: 150, rx: 54.5, ry: 0, rz: 0, sx: -16, sy: 0, persp: 800 },
  deck_right: { cw: 108, ch: 138, rx: 51, ry: 0, rz: 0, sx: 20.5, sy: 0, persp: 800 },
};

function getT(transforms, side, idx) {
  return transforms[`${side}_${idx}`] || transforms._default || DEFAULT_TRANSFORMS._default;
}

function cssTransform(t) {
  return `perspective(${t.persp}px) rotateX(${t.rx}deg) rotateY(${t.ry}deg) rotateZ(${t.rz}deg) skewX(${t.sx}deg) skewY(${t.sy}deg)`;
}

function getCardImageUrl(card) {
  if (!card) return null;
  if (card.is_ugc && card.image_url?.startsWith('/api/ugc/')) return `${API_BASE}${card.image_url}`;
  if (card.image_url) return `${API_BASE}/api/card-images/${card.image_url.split('/').pop()}`;
  if (card.image_filename) return `${API_BASE}/api/card-images/${card.image_filename}`;
  return null;
}

// ─── SlotCard: a card placed in a slot with calibrated CSS transform ────────
/** `<model-viewer>` WebGL in the card’s 3D plane; feet at card center (bottom of viewer = slot center), scaled. */
const CHARACTER_MODEL_SCALE = 1.4;

function SlotCharacter3D({ card, side }) {
  const az = side === 'right' ? 22 : -22;
  const mvStyle = {
    width: '100%',
    height: '100%',
    background: 'transparent',
    pointerEvents: 'none',
    ['--poster-color']: 'transparent',
  };
  return createElement('model-viewer', {
    key: String(card.card_id || card._id || card.card_name || 'mv'),
    src: SLOT_CARD_MODEL_SRC,
    alt: card.card_name || '',
    style: mvStyle,
    'camera-orbit': `${az}deg 72deg 90%`,
    'field-of-view': '22deg',
    'min-field-of-view': '18deg',
    'max-field-of-view': '30deg',
    'shadow-intensity': '1',
    'environment-image': 'neutral',
    'interaction-prompt': 'none',
    exposure: '1.1',
    loading: 'eager',
    reveal: 'auto',
    'touch-action': 'none',
  });
}

function SlotCard({ card, side, idx, scale, selected, onClick, grid, transforms }) {
  const t = getT(transforms, side, idx);
  const pos = side === 'left' ? grid.left[idx] : grid.right[idx];
  if (!pos) return null;

  const w = t.cw * scale;
  const h = t.ch * scale;

  return (
    <div
      onClick={onClick}
      style={{
        position: 'absolute',
        left: pos.x * scale - w / 2,
        top: pos.y * scale - h / 2,
        width: w,
        height: h,
        transform: cssTransform(t),
        transformOrigin: 'center center',
        cursor: onClick ? 'pointer' : 'default',
        zIndex: Math.floor(pos.y) + (selected ? 50 : 0),
        overflow: 'visible',
      }}
      data-testid={`slot-${side}-${idx}`}
    >
      {/* Card back as base */}
      <img
        src="/assets/card_backside.png"
        alt=""
        style={{
          width: '100%', height: '100%',
          objectFit: 'cover',
          borderRadius: 3 * scale,
          opacity: 0.6,
        }}
        crossOrigin="anonymous"
      />
      {/* Live GLB: bottom-center of viewer at card (x,y) center; scale grows upward; overflow allowed */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: '100%',
          height: '100%',
          transform: `translate(-50%, -100%) scale(${CHARACTER_MODEL_SCALE})`,
          transformOrigin: 'center bottom',
          zIndex: 1,
          pointerEvents: 'none',
          overflow: 'visible',
        }}
      >
        <SlotCharacter3D card={card} side={side} />
      </div>
      {/* Selection glow */}
      {selected && (
        <div style={{
          position: 'absolute', inset: -2,
          border: '2px solid #22c55e',
          borderRadius: 4 * scale,
          boxShadow: '0 0 10px #22c55e88',
          zIndex: 2,
          pointerEvents: 'none',
        }} />
      )}
      {/* UGC glow */}
      {card.is_ugc && (
        <div style={{
          position: 'absolute', inset: -1,
          border: '2px solid #f59e0b',
          borderRadius: 4 * scale,
          boxShadow: '0 0 8px #f59e0b66',
          zIndex: 2,
          pointerEvents: 'none',
        }} />
      )}
      {/* Name */}
      <div style={{
        position: 'absolute', bottom: 1, left: 0, right: 0,
        textAlign: 'center', fontSize: Math.max(6 * scale, 5),
        color: card.is_ugc ? '#f59e0b' : '#e0d0a0',
        fontFamily: 'monospace', fontWeight: 700,
        textShadow: '0 1px 3px #000',
        overflow: 'hidden', whiteSpace: 'nowrap',
        zIndex: 3,
        pointerEvents: 'none',
      }}>
        {card.card_name}
      </div>
      {/* Power */}
      <div style={{
        position: 'absolute', top: 1, right: 2,
        fontSize: Math.max(7 * scale, 5),
        color: '#fbbf24',
        fontFamily: 'monospace', fontWeight: 700,
        textShadow: '0 1px 3px #000',
        zIndex: 3,
        pointerEvents: 'none',
      }}>
        {card.power}
      </div>
    </div>
  );
}

// ─── EmptySlot: outline for available slot ──────────────────────────────────
function EmptySlot({ side, idx, scale, highlight, onClick, grid, transforms }) {
  const t = getT(transforms, side, idx);
  const pos = side === 'left' ? grid.left[idx] : grid.right[idx];
  if (!pos) return null;

  const w = t.cw * scale;
  const h = t.ch * scale;

  return (
    <div
      onClick={highlight ? onClick : undefined}
      style={{
        position: 'absolute',
        left: pos.x * scale - w / 2,
        top: pos.y * scale - h / 2,
        width: w,
        height: h,
        transform: cssTransform(t),
        transformOrigin: 'center center',
        border: `1.5px ${highlight ? 'solid' : 'dashed'} ${highlight ? '#ffd70088' : 'rgba(180,160,120,0.15)'}`,
        borderRadius: 3 * scale,
        cursor: highlight ? 'pointer' : 'default',
        boxShadow: highlight ? '0 0 12px #ffd70044' : 'none',
        zIndex: Math.floor(pos.y),
      }}
      data-testid={`empty-${side}-${idx}`}
    />
  );
}

// ─── DeckPile: stacked card backs ───────────────────────────────────────────
function DeckPile({ side, scale, count, label, onClick, grid, transforms }) {
  const pos = side === 'left' ? grid.deckLeft : grid.deckRight;
  const t = getT(transforms, 'deck', side);
  const w = t.cw * scale;
  const h = t.ch * scale;

  return (
    <div
      onClick={onClick}
      style={{
        position: 'absolute',
        left: pos.x * scale - w / 2,
        top: pos.y * scale - h / 2,
        width: w,
        height: h,
        transform: cssTransform(t),
        cursor: onClick ? 'pointer' : 'default',
        zIndex: 5,
      }}
    >
      {[2, 1, 0].map(i => (
        <img key={i} src="/assets/card_backside.png" alt="" crossOrigin="anonymous"
          style={{
            position: 'absolute',
            top: i * 2 * scale, left: i * 1.5 * scale,
            width: (t.cw - 4) * scale, height: (t.ch - 4) * scale,
            objectFit: 'cover', borderRadius: 3 * scale,
          }}
        />
      ))}
      <div style={{
        position: 'absolute', top: -14 * scale, left: 0, right: 0,
        textAlign: 'center', fontSize: 8 * scale,
        color: '#c8b84a', fontFamily: 'monospace', fontWeight: 700,
        textShadow: '0 1px 3px #000',
      }}>
        {label}
      </div>
      {count > 0 && (
        <div style={{
          position: 'absolute', bottom: 4 * scale, left: 0, right: 0,
          textAlign: 'center', fontSize: 9 * scale,
          color: '#ffd700', fontFamily: 'monospace', fontWeight: 700,
        }}>
          x{count}
        </div>
      )}
    </div>
  );
}

// ─── HandRow: fan inventory at the bottom ───────────────────────────────────
function HandRow({ cards, selected, onSelect, pageSize = 7, page, onPageChange, totalAvailable }) {
  const totalPages = Math.max(1, Math.ceil(totalAvailable / pageSize));

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
      padding: '4px 0',
    }}>
      <div style={{
        fontSize: 9, color: '#c8aa50', fontFamily: 'monospace',
        fontWeight: 700, textTransform: 'uppercase',
        textShadow: '0 1px 3px #000',
      }}>
        INVENTARIO ({totalAvailable}) &nbsp; {page + 1}/{totalPages}
      </div>
      <div style={{
        display: 'flex', gap: 3, justifyContent: 'center',
        alignItems: 'flex-end', minHeight: 110,
      }}>
        {/* Page left */}
        <button onClick={() => onPageChange(Math.max(0, page - 1))}
          style={{
            background: 'none', border: 'none', color: '#c8aa50',
            fontSize: 18, cursor: 'pointer', padding: '0 4px',
            opacity: page > 0 ? 1 : 0.3,
          }}>
          {'<'}
        </button>

        {cards.map((card, i) => {
          const mid = (cards.length - 1) / 2;
          const offset = i - mid;
          const isSelected = selected === i;
          return (
            <div key={card.card_id || i}
              onClick={() => onSelect(isSelected ? null : i)}
              style={{
                transform: isSelected
                  ? 'translateY(-18px) scale(1.12)'
                  : `rotate(${offset * 4}deg) translateY(${Math.abs(offset) * 3}px)`,
                transition: 'transform 0.2s ease',
                zIndex: isSelected ? 20 : 10 - Math.abs(offset),
                cursor: 'pointer',
              }}
            >
              <div style={{
                width: 68, height: 92,
                borderRadius: 6,
                background: 'linear-gradient(160deg, #1a1e2e 0%, #0d1117 100%)',
                border: `2px solid ${isSelected ? '#ffd700' : card.is_ugc ? '#f59e0b' : '#c8aa50'}`,
                boxShadow: isSelected
                  ? '0 0 16px #ffd70088, 0 8px 20px #000a'
                  : '0 4px 12px #0008',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'space-between',
                padding: '3px 2px 2px', overflow: 'hidden',
                position: 'relative',
              }}>
                {/* Image */}
                <div style={{ width: '92%', height: 48, borderRadius: 4, overflow: 'hidden', background: '#000' }}>
                  {getCardImageUrl(card) && (
                    <img src={getCardImageUrl(card)} alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      crossOrigin="anonymous" />
                  )}
                </div>
                {/* Name */}
                <div style={{
                  fontSize: 6, color: card.is_ugc ? '#f59e0b' : '#e0d0a0',
                  fontFamily: 'monospace', fontWeight: 700,
                  textAlign: 'center', lineHeight: 1.1,
                  textTransform: 'uppercase',
                  textShadow: '0 1px 2px #000',
                }}>
                  {card.card_name || '?'}
                </div>
                {/* Power badge */}
                <div style={{
                  position: 'absolute', top: 2, right: 3,
                  fontSize: 8, color: '#fbbf24',
                  fontFamily: 'monospace', fontWeight: 700,
                  textShadow: '0 1px 3px #000',
                }}>
                  {card.power || '?'}
                </div>
              </div>
            </div>
          );
        })}

        {/* Page right */}
        <button onClick={() => onPageChange(page + 1)}
          style={{
            background: 'none', border: 'none', color: '#c8aa50',
            fontSize: 18, cursor: 'pointer', padding: '0 4px',
            opacity: page < totalPages - 1 ? 1 : 0.3,
          }}>
          {'>'}
        </button>
      </div>
    </div>
  );
}

// ─── Main Board ─────────────────────────────────────────────────────────────
export default function PhaserBattleBoard({
  slots, opponentSlots, phase,
  allCards, onCardDeploy, onCardRemove,
  mode, selectedForBattle, onToggleBattle, defenderCardCount,
}) {
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [selectedHand, setSelectedHand] = useState(null);
  const [invPage, setInvPage] = useState(0);
  const [grid, setGrid] = useState(DEFAULT_GRID);
  const [transforms, setTransforms] = useState(DEFAULT_TRANSFORMS);

  // Load board config from API
  useEffect(() => {
    ugcApi.boardConfig().then(res => {
      if (res.data) {
        if (res.data.grid) setGrid(res.data.grid);
        if (res.data.transforms) setTransforms(res.data.transforms);
      }
    }).catch(() => { });
  }, []);

  // Scale tracking — based on rendered image width
  useEffect(() => {
    if (!containerRef.current) return;
    const update = () => {
      const img = containerRef.current?.querySelector('img');
      if (img && img.clientWidth > 0) {
        setScale(img.clientWidth / BOARD_W);
      } else if (containerRef.current) {
        setScale(containerRef.current.clientWidth / BOARD_W);
      }
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Available cards (not deployed)
  const placedIds = new Set();
  (slots || []).filter(Boolean).forEach(c => {
    if (c.card_id) placedIds.add(String(c.card_id));
    if (c._id) placedIds.add(String(c._id));
  });
  const available = (allCards || [])
    .filter(c => {
      const cid = String(c.card_id || c._id || '');
      return cid && !placedIds.has(cid) && !c.is_deployed;
    })
    .sort((a, b) => (b.power || 0) - (a.power || 0));

  const pageSize = 7;
  const totalPages = Math.max(1, Math.ceil(available.length / pageSize));
  const safePage = invPage >= totalPages ? 0 : invPage;
  const pageCards = available.slice(safePage * pageSize, (safePage + 1) * pageSize);

  // Place selected hand card into specific slot
  // In defend mode, cards go to right side (defender's); in deploy mode, left side
  const placeCard = useCallback((slotIdx) => {
    if (selectedHand === null || (mode !== 'deploy' && mode !== 'defend')) return;
    const card = pageCards[selectedHand];
    if (!card) return;
    onCardDeploy?.(card, slotIdx);
    setSelectedHand(null);
  }, [selectedHand, pageCards, mode, onCardDeploy]);

  const showOpp = ['reveal', 'fighting', 'result', 'replay'].includes(phase);

  // In defend mode, swap sides: LEFT=attacker(face-down), RIGHT=defender(face-up, interactive)
  const isDefender = mode === 'defend';
  const leftCards = isDefender ? opponentSlots : slots;
  const rightCards = isDefender ? slots : opponentSlots;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', alignItems: 'center' }} data-testid="phaser-board">
      {/* Board area — image dictates height, slots overlay on top */}
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: BOARD_W,
          overflow: 'visible',
          background: '#0a0e1a',
          margin: '0 auto',
        }}
      >
        {/* Background tileset — natural proportions, width fills container */}
        <img
          src="/assets/arena_floor.png"
          alt=""
          style={{ display: 'block', width: '100%', height: 'auto' }}
        />

        {/* ── LEFT SLOTS ──────────────────────────────────────────────── */}
        {grid.left.map((_, i) => {
          const card = leftCards?.[i];

          if (card) {
            // In defend mode, left = attacker's face-down cards
            if (isDefender && card._faceDown) {
              const t = getT(transforms, 'left', i);
              const pos = grid.left[i];
              if (!pos) return null;
              const w = t.cw * scale;
              const h = t.ch * scale;
              return (
                <div key={`l${i}`} style={{
                  position: 'absolute',
                  left: pos.x * scale - w / 2,
                  top: pos.y * scale - h / 2,
                  width: w, height: h,
                  transform: cssTransform(t),
                  transformOrigin: 'center center',
                  zIndex: Math.floor(pos.y),
                }} data-testid={`slot-left-${i}-facedown`}>
                  <img src="/assets/card_backside.png" alt="" crossOrigin="anonymous"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 3 * scale, opacity: 0.7 }} />
                  <div style={{
                    position: 'absolute', inset: -1,
                    border: '2px solid #ef444466',
                    borderRadius: 4 * scale,
                    boxShadow: '0 0 6px #ef444433',
                  }} />
                </div>
              );
            }

            // Normal mode: left = player's cards (deploy/attack)
            return (
              <SlotCard key={`l${i}`} card={card} side="left" idx={i} scale={scale}
                grid={grid} transforms={transforms}
                selected={mode === 'attack' && selectedForBattle?.includes(card.card_id)}
                onClick={() => {
                  if (mode === 'attack') onToggleBattle?.(card.card_id);
                  else if (mode === 'deploy') onCardRemove?.(i);
                }}
              />
            );
          }

          // Empty left slot
          return (
            <EmptySlot key={`l${i}`} side="left" idx={i} scale={scale}
              grid={grid} transforms={transforms}
              highlight={selectedHand !== null && mode === 'deploy'}
              onClick={() => { if (mode === 'deploy') placeCard(i); }}
            />
          );
        })}

        {/* ── RIGHT SLOTS ─────────────────────────────────────────────── */}
        {grid.right.map((_, i) => {
          const card = rightCards?.[i];

          if (card) {
            // In defend mode, right = defender's own cards (face-up, selectable)
            if (isDefender) {
              return (
                <SlotCard key={`r${i}`} card={card} side="right" idx={i} scale={scale}
                  grid={grid} transforms={transforms}
                  selected={selectedForBattle?.includes(card.card_id)}
                  onClick={() => onToggleBattle?.(card.card_id)}
                />
              );
            }

            // Normal mode: right = opponent cards
            if (card._faceDown) {
              const t = getT(transforms, 'right', i);
              const pos = grid.right[i];
              if (!pos) return null;
              const w = t.cw * scale;
              const h = t.ch * scale;
              return (
                <div key={`r${i}`} style={{
                  position: 'absolute',
                  left: pos.x * scale - w / 2,
                  top: pos.y * scale - h / 2,
                  width: w, height: h,
                  transform: cssTransform(t),
                  transformOrigin: 'center center',
                  zIndex: Math.floor(pos.y),
                }} data-testid={`slot-right-${i}-facedown`}>
                  <img src="/assets/card_backside.png" alt="" crossOrigin="anonymous"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 3 * scale, opacity: 0.7 }} />
                  <div style={{
                    position: 'absolute', inset: -1,
                    border: '2px solid #ef444466',
                    borderRadius: 4 * scale,
                    boxShadow: '0 0 6px #ef444433',
                  }} />
                </div>
              );
            }

            if (showOpp) {
              return (
                <SlotCard key={`r${i}`} card={card} side="right" idx={i} scale={scale}
                  grid={grid} transforms={transforms} />
              );
            }
          }

          // Empty right slot — in defend mode, defender can place cards here
          return (
            <EmptySlot key={`r${i}`} side="right" idx={i} scale={scale}
              grid={grid} transforms={transforms}
              highlight={isDefender && selectedHand !== null}
              onClick={() => { if (isDefender) placeCard(i); }}
            />
          );
        })}

        {/* Decks */}
        <DeckPile side="left" scale={scale}
          count={isDefender ? (Number(defenderCardCount) || 0) : available.length}
          label={isDefender ? 'OPP' : 'DECK'}
          grid={grid} transforms={transforms}
          onClick={isDefender ? undefined : () => setInvPage(p => (p + 1) % totalPages)} />
        <DeckPile side="right" scale={scale}
          count={isDefender ? available.length : (Number(defenderCardCount) || 0)}
          label={isDefender ? 'DECK' : 'OPP'}
          grid={grid} transforms={transforms}
          onClick={isDefender ? () => setInvPage(p => (p + 1) % totalPages) : undefined} />
      </div>

      {/* Hand inventory below the board */}
      {(mode === 'deploy' || mode === 'attack' || mode === 'defend') && (
        <HandRow
          cards={pageCards}
          selected={selectedHand}
          onSelect={setSelectedHand}
          pageSize={pageSize}
          page={safePage}
          onPageChange={p => { setInvPage(p % totalPages); setSelectedHand(null); }}
          totalAvailable={available.length}
        />
      )}
    </div>
  );
}
