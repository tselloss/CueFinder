// Minimal drill utilities to satisfy feature-flagged code paths
export function parseDrillContent(content) {
  if (!content) return null;
  try {
    return JSON.parse(content);
  } catch {
    // content may be plain text; return null for now
    return null;
  }
}

export function createDefaultDrill() {
  return { shots: [] };
}

export function encodeDrillContent(drill) {
  try {
    return JSON.stringify(drill || {});
  } catch {
    return '';
  }
}

export function isPracticeDrillsCategory(name) {
  return /practise|practice/i.test(name || '');
}
