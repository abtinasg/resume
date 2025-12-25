/**
 * Layer 2 - Strategy Engine
 * Strategy Module Index
 *
 * Exports fit score calculation, mode selection, and hysteresis functions.
 */

// Fit score functions
export {
  calculateFitScore,
  getFitLevel,
  getFitRecommendations,
  meetsMinimumFit,
  calculateScoreGap,
} from './fit-score';

// Mode selection functions
export {
  selectMode,
  selectModeFromLayers,
  getModeName,
  getModeDescription,
  getReasonDescription,
  getFactorDescription,
} from './mode-selection';

// Hysteresis functions
export {
  checkHysteresis,
  getDaysInCurrentMode,
  getHysteresisConfig,
  isNearThreshold,
} from './hysteresis';
