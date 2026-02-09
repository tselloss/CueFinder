export const DRILL_CONTENT_PREFIX = 'DRILL_V1::';

export const isPracticeDrillsCategory = (name) => /practise|practice/i.test(name || '');

export const getBallLabel = (id) => (id === 0 ? 'C' : String(id));

export const getBallStyle = (id) => {
  const styles = {
    0: { background: '#f8fafc', color: '#0f172a', border: '1px solid #cbd5f5' },
    1: { background: '#facc15', color: '#0f172a' },
    2: { background: '#3b82f6', color: '#f8fafc' },
    3: { background: '#ef4444', color: '#f8fafc' },
    4: { background: '#a855f7', color: '#f8fafc' },
    5: { background: '#fb923c', color: '#0f172a' },
    6: { background: '#22c55e', color: '#0f172a' },
    7: { background: '#7c2d12', color: '#f8fafc' },
    8: { background: '#0f172a', color: '#f8fafc' },
    9: { background: '#facc15', color: '#0f172a', border: '2px solid #0f172a' },
    10: { background: '#3b82f6', color: '#f8fafc', border: '2px solid #0f172a' },
    11: { background: '#ef4444', color: '#f8fafc', border: '2px solid #0f172a' },
    12: { background: '#a855f7', color: '#f8fafc', border: '2px solid #0f172a' },
    13: { background: '#fb923c', color: '#0f172a', border: '2px solid #0f172a' },
    14: { background: '#22c55e', color: '#0f172a', border: '2px solid #0f172a' },
    15: { background: '#7c2d12', color: '#f8fafc', border: '2px solid #0f172a' },
  };

  return styles[id] || styles[0];
};

export const ensureBallSet = (balls = []) => {
  const normalizeId = (value) => {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? value : parsed;
  };
  const ballMap = new Map(balls.map((ball) => [normalizeId(ball.id), ball]));
  const result = [];

  for (let id = 0; id <= 15; id += 1) {
    const existing = ballMap.get(id);
    result.push({
      id,
      x: existing?.x ?? null,
      y: existing?.y ?? null,
      placed: existing?.placed ?? (existing?.x != null && existing?.y != null),
    });
  }

  return result;
};

export const createRackBalls = () => {
  const spacing = 0.055;
  const startX = 0.28;
  const centerY = 0.5;
  const balls = [];
  let currentId = 1;

  for (let row = 0; row < 5; row += 1) {
    for (let col = 0; col <= row; col += 1) {
      const x = startX + row * spacing;
      const y = centerY - (row * spacing) / 2 + col * spacing;
      balls.push({ id: currentId, x, y, placed: true });
      currentId += 1;
    }
  }

  return ensureBallSet(balls);
};

export const createDefaultDrill = () => ({
  notes: '',
  balls: createRackBalls(),
  table: {
    type: 'pool',
    size: '9ft',
  },
});

export const encodeDrillContent = ({ notes, balls, table }) => {
  const payload = {
    version: 1,
    notes: (notes || '').trim(),
    balls: ensureBallSet(balls).map((ball) => ({
      id: ball.id,
      x: ball.placed ? ball.x : null,
      y: ball.placed ? ball.y : null,
      placed: Boolean(ball.placed),
    })),
    table: table || { type: 'pool', size: '9ft' },
  };

  return `${DRILL_CONTENT_PREFIX}${JSON.stringify(payload)}`;
};

export const parseDrillContent = (content) => {
  if (!content || typeof content !== 'string') return null;
  if (!content.startsWith(DRILL_CONTENT_PREFIX)) return null;

  try {
    const raw = JSON.parse(content.slice(DRILL_CONTENT_PREFIX.length));
    return {
      version: raw?.version || 1,
      notes: raw?.notes || '',
      balls: ensureBallSet(raw?.balls || []),
      table: raw?.table || { type: 'pool', size: '9ft' },
    };
  } catch (error) {
    return null;
  }
};
