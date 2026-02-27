// Centralized feature flags for the frontend
// Default: features are disabled unless explicitly enabled via env vars
export const isDesignDrillEnabled = (process.env.REACT_APP_FEATURE_DESIGN_DRILL || 'false').toLowerCase() === 'true';
