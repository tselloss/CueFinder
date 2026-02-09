import React, { useMemo, useRef } from 'react';
import { getBallLabel, getBallStyle } from '../utils/drillUtils';

export default function DrillTable({
  balls,
  onTableClick,
  onBallClick,
  selectedBallId,
  readOnly = false,
}) {
  const tableRef = useRef(null);

  const placedBalls = useMemo(
    () => (balls || []).filter((ball) => typeof ball.x === 'number' && typeof ball.y === 'number'),
    [balls]
  );

  const handleTableClick = (event) => {
    if (readOnly || !onTableClick) return;
    const rect = tableRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    onTableClick(Math.min(Math.max(x, 0), 1), Math.min(Math.max(y, 0), 1));
  };

  return (
    <div
      ref={tableRef}
      role="presentation"
      onClick={handleTableClick}
      className="relative w-full aspect-[2/1] rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-900 shadow-inner overflow-hidden"
    >
      <div className="absolute inset-4 border border-emerald-300/30 rounded-xl" />

      {placedBalls.map((ball) => {
        const style = getBallStyle(ball.id);
        return (
          <button
            key={ball.id}
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              if (readOnly) return;
              if (onBallClick) onBallClick(ball.id);
            }}
            className={`absolute w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shadow-md transition-transform ${
              selectedBallId === ball.id ? 'scale-110 ring-2 ring-blue-400' : 'hover:scale-105'
            }`}
            style={{
              left: `${ball.x * 100}%`,
              top: `${ball.y * 100}%`,
              transform: 'translate(-50%, -50%)',
              background: style.background,
              color: style.color,
              border: style.border || '1px solid rgba(15, 23, 42, 0.4)',
            }}
          >
            {getBallLabel(ball.id)}
          </button>
        );
      })}
    </div>
  );
}
