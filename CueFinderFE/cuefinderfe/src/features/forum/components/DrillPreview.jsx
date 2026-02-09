import React, { useMemo } from 'react';
import DrillTable from './DrillTable';
import { ensureBallSet } from '../utils/drillUtils';

export default function DrillPreview({ drill }) {
  const normalizedBalls = useMemo(() => ensureBallSet(drill?.balls || []), [drill]);
  const placedCount = normalizedBalls.filter((ball) => ball.placed).length;

  return (
    <div className="rounded-2xl border border-blue-500/20 bg-slate-900/70 p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-blue-300">Drill Layout</h3>
          <p className="text-xs text-slate-400">{placedCount} μπάλες τοποθετημένες</p>
        </div>
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-500/10 text-blue-200 border border-blue-500/20">
          Practice Drills
        </span>
      </div>

      {drill?.notes && (
        <div className="text-sm text-slate-300 bg-slate-800/60 border border-blue-500/15 rounded-xl p-3">
          {drill.notes}
        </div>
      )}

      <DrillTable balls={normalizedBalls} readOnly />
    </div>
  );
}
