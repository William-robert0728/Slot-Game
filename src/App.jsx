import { useMemo, useState, useCallback } from 'react';
import PhaserBattleBoard from '@PhaserBattleBoard.jsx';

const DEMO_CARDS = [
  { card_id: 'c1', card_name: 'Knight', power: 7, image_filename: 'knight.png', is_deployed: false },
  { card_id: 'c2', card_name: 'Mage', power: 5, image_filename: 'mage.png', is_deployed: false },
  { card_id: 'c3', card_name: 'Rogue', power: 6, image_filename: 'rogue.png', is_deployed: false },
  { card_id: 'c4', card_name: 'UGC Hero', power: 8, is_ugc: true, image_url: '/api/ugc/demo-face.png', is_deployed: false },
  { card_id: 'c5', card_name: 'Tank', power: 4, image_filename: 'tank.png', is_deployed: false },
];

function emptySlots(n) {
  return Array.from({ length: n }, () => null);
}

const PHASES = ['deploy', 'attack', 'defend', 'reveal', 'fighting', 'result', 'replay', 'idle'];

export default function App() {
  const [mode, setMode] = useState('deploy');
  const [phase, setPhase] = useState('deploy');
  const [slots, setSlots] = useState(() => {
    const s = emptySlots(12);
    s[0] = { ...DEMO_CARDS[0], is_deployed: true };
    s[2] = { ...DEMO_CARDS[1], is_deployed: true };
    return s;
  });
  const [opponentSlots, setOpponentSlots] = useState(() => {
    const o = emptySlots(10);
    o[0] = { card_id: 'o1', card_name: 'Enemy A', power: 6, _faceDown: true };
    o[1] = { card_id: 'o2', card_name: 'Enemy B', power: 5, _faceDown: true };
    return o;
  });
  const [selectedForBattle, setSelectedForBattle] = useState([]);

  const allCards = useMemo(() => DEMO_CARDS, []);

  const onCardDeploy = useCallback((card, slotIdx) => {
    if (mode === 'deploy') {
      setSlots(prev => {
        const next = [...prev];
        next[slotIdx] = { ...card, is_deployed: true };
        return next;
      });
    } else if (mode === 'defend') {
      setSlots(prev => {
        const next = [...prev];
        next[slotIdx] = { ...card, is_deployed: true };
        return next;
      });
    }
  }, [mode]);

  const onCardRemove = useCallback((slotIdx) => {
    setSlots(prev => {
      const next = [...prev];
      next[slotIdx] = null;
      return next;
    });
  }, []);

  const onToggleBattle = useCallback((cardId) => {
    setSelectedForBattle(prev => {
      if (prev.includes(cardId)) return prev.filter(id => id !== cardId);
      return [...prev, cardId];
    });
  }, []);

  const resetDemo = () => {
    setMode('deploy');
    setPhase('deploy');
    const s = emptySlots(12);
    s[0] = { ...DEMO_CARDS[0], is_deployed: true };
    s[2] = { ...DEMO_CARDS[1], is_deployed: true };
    setSlots(s);
    const o = emptySlots(10);
    o[0] = { card_id: 'o1', card_name: 'Enemy A', power: 6, _faceDown: true };
    o[1] = { card_id: 'o2', card_name: 'Enemy B', power: 5, _faceDown: true };
    setOpponentSlots(o);
    setSelectedForBattle([]);
  };

  return (
    <div style={{ padding: 16, maxWidth: 1000, margin: '0 auto' }}>
      <header style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 8px' }}>
          PhaserBattleBoard harness
        </h1>
        <p style={{ margin: '0 0 12px', fontSize: 13, color: '#94a3b8' }}>
          Vite + React with stubbed <code style={{ color: '#cbd5e1' }}>lib/api</code> and{' '}
          <code style={{ color: '#cbd5e1' }}>lib/pixi3dRenderer</code>. Edit{' '}
          <code style={{ color: '#cbd5e1' }}>src/PhaserBattleBoard.jsx</code> in sync with the
          parent file, or import from the parent repo via path alias.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#94a3b8' }}>Mode</span>
          {['deploy', 'attack', 'defend'].map(m => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              style={{
                padding: '6px 10px',
                borderRadius: 6,
                border: mode === m ? '1px solid #38bdf8' : '1px solid #334155',
                background: mode === m ? '#0c4a6e' : '#0f172a',
                color: '#e2e8f0',
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              {m}
            </button>
          ))}
          <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 8 }}>Phase</span>
          <select
            value={phase}
            onChange={e => setPhase(e.target.value)}
            style={{
              padding: '6px 8px',
              borderRadius: 6,
              border: '1px solid #334155',
              background: '#0f172a',
              color: '#e2e8f0',
              fontSize: 12,
            }}
          >
            {PHASES.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={resetDemo}
            style={{
              marginLeft: 8,
              padding: '6px 10px',
              borderRadius: 6,
              border: '1px solid #475569',
              background: '#1e293b',
              color: '#e2e8f0',
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            Reset demo
          </button>
        </div>
        {mode === 'attack' && (
          <p style={{ margin: '8px 0 0', fontSize: 12, color: '#86efac' }}>
            Selected for battle: {selectedForBattle.length ? selectedForBattle.join(', ') : 'none'} — click your left-slot cards to toggle.
          </p>
        )}
      </header>

      <PhaserBattleBoard
        slots={slots}
        opponentSlots={opponentSlots}
        phase={phase}
        allCards={allCards}
        onCardDeploy={onCardDeploy}
        onCardRemove={onCardRemove}
        mode={mode}
        selectedForBattle={selectedForBattle}
        onToggleBattle={onToggleBattle}
        defenderCardCount={4}
      />
    </div>
  );
}
