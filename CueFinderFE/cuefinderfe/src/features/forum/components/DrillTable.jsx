import React, { useMemo, useRef, useState, useCallback } from 'react';
import { getBallLabel, getBallStyle } from '../utils/drillUtils';

export default function DrillTable({
  balls,
  onTableClick,
  onBallClick,
  onBallMove,
  selectedBallId,
  readOnly = false,
}) {
  const tableRef = useRef(null);
  const pointerIdRef = useRef(null);
  const [draggingId, setDraggingId] = useState(null);

  const placedBalls = useMemo(
    () => (balls || []).filter((ball) => typeof ball.x === 'number' && typeof ball.y === 'number'),
    [balls]
  );

  const getRelativePoint = useCallback((clientX, clientY) => {
    const rect = tableRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;
    return {
      x: Math.min(Math.max(x, 0), 1),
      y: Math.min(Math.max(y, 0), 1),
    };
  }, []);

  const handleTableClick = (event) => {
    if (readOnly || !onTableClick) return;
    if (draggingId !== null) return;
    const point = getRelativePoint(event.clientX, event.clientY);
    if (!point) return;
    onTableClick(point.x, point.y);
  };

  const handlePointerMove = (event) => {
    if (readOnly || draggingId === null || !onBallMove) return;
    const point = getRelativePoint(event.clientX, event.clientY);
    if (!point) return;
    onBallMove(draggingId, point.x, point.y);
  };

  const stopDragging = (event) => {
    if (pointerIdRef.current !== null && event?.currentTarget?.hasPointerCapture) {
      try {
        event.currentTarget.releasePointerCapture(pointerIdRef.current);
      } catch {
        // Ignore release errors
      }
    }
    pointerIdRef.current = null;
    setDraggingId(null);
  };

  return (
    <div
      ref={tableRef}
      role="presentation"
      onClick={handleTableClick}
      onPointerMove={handlePointerMove}
      onPointerUp={stopDragging}
      onPointerLeave={stopDragging}
      onPointerCancel={stopDragging}
      className="relative w-full aspect-[3/2] rounded-[20px] bg-center bg-no-repeat shadow-2xl overflow-hidden touch-none drill-table"
      style={{
        backgroundImage: "url('/BilliardDrillTable.jpg')",
        backgroundSize: '100% 100%',
      }}
    >
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
            onPointerDown={(event) => {
              if (readOnly) return;
              event.preventDefault();
              event.stopPropagation();
              pointerIdRef.current = event.pointerId;
              event.currentTarget.setPointerCapture(event.pointerId);
              setDraggingId(ball.id);
            }}
            className={`absolute rounded-full flex items-center justify-center text-[11px] font-bold shadow-md transition-transform drill-ball ${
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
            {style.stripe && (
              <span
                className="absolute left-1/2 top-1/2 h-[40%] w-[78%] -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{ background: 'rgba(255,255,255,0.92)' }}
              />
            )}
            <span className="relative z-10 w-[65%] h-[65%] rounded-full bg-white/90 flex items-center justify-center text-[9px] font-bold text-slate-900">
              {getBallLabel(ball.id)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
