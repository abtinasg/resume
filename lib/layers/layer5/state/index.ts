/**
 * Layer 5 - Orchestrator
 * State Module Exports
 */

// State Validator
export {
  validateState,
  isStateValidForPlanning,
  getValidationSummary,
} from './state-validator';

// Staleness Handler
export {
  assessStaleness,
  isCriticallyStale,
  hasStaleWarning,
  generateStalePlan,
  generateStaleDailyPlan,
  getRecoveryGuidance,
  hasRecoveredFromStaleness,
  getStalenessDisplay,
} from './staleness-handler';
