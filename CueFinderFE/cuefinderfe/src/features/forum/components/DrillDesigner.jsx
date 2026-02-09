import React, { useMemo, useState } from 'react';
import DrillTable from './DrillTable';
import { createDefaultDrill, ensureBallSet, getBallLabel, getBallStyle } from '../utils/drillUtils';

export default function DrillDesigner({ drill, onChange }) {
  const [selectedBallId, setSelectedBallId] = useState(1);
  const baseDrill = drill || createDefaultDrill();
  const normalizedBalls = useMemo(() => ensureBallSet(baseDrill.balls || []), [baseDrill]);

  const updateBall = (ballId, x, y) => {
    const nextBalls = normalizedBalls.map((ball) =>
      ball.id === ballId ? { ...ball, x, y, placed: true } : ball
    );
    onChange({ ...baseDrill, balls: nextBalls });
  };

  const removeBall = (ballId) => {
    const nextBalls = normalizedBalls.map((ball) =>
      ball.id === ballId ? { ...ball, x: null, y: null, placed: false } : ball
    );
    onChange({ ...baseDrill, balls: nextBalls });
  };

  const resetRack = () => {
    const defaultLayout = createDefaultDrill();
    onChange({ ...baseDrill, balls: defaultLayout.balls });
  };

  const clearLayout = () => {
    const nextBalls = normalizedBalls.map((ball) => ({ ...ball, x: null, y: null, placed: false }));
    onChange({ ...baseDrill, balls: nextBalls });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-blue-300">Σχεδίαση Drill</h4>
          <p className="text-xs text-slate-400">15 μπάλες διαθέσιμες • επιλέξτε μπάλα και κάντε κλικ στο τραπέζι</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={resetRack}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-blue-500/30 text-blue-200 bg-blue-500/10 hover:bg-blue-500/20"
          >
            Rack 15
          </button>
          <button
            type="button"
            onClick={clearLayout}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700/40"
          >
            Καθαρισμός
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {normalizedBalls.map((ball) => {
          const style = getBallStyle(ball.id);
          return (
            <button
              key={ball.id}
              type="button"
              onClick={() => setSelectedBallId(ball.id)}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shadow-sm transition-transform ${
                selectedBallId === ball.id ? 'ring-2 ring-blue-400 scale-105' : 'hover:scale-105'
              }`}
              style={{
                background: style.background,
                color: style.color,
                border: style.border || '1px solid rgba(15, 23, 42, 0.4)',
              }}
              title={`Ball ${getBallLabel(ball.id)}`}
            >
              {getBallLabel(ball.id)}
            </button>
          );
        })}
      </div>

      <DrillTable
        balls={normalizedBalls}
        selectedBallId={selectedBallId}
        onTableClick={(x, y) => updateBall(selectedBallId, x, y)}
        onBallClick={(ballId) => {
          if (ballId === selectedBallId) {
            removeBall(ballId);
          } else {
            setSelectedBallId(ballId);
          }
        }}
      />

      <p className="text-xs text-slate-500">Κάντε κλικ πάνω σε μια υπάρχουσα μπάλα για μετακίνηση ή επιλογή. Δεύτερο κλικ στην ίδια μπάλα την αφαιρεί.</p>
    </div>
  );
}
