/**
 * Layer 6 - Job Discovery & Matching Module
 * Analysis Exports
 */

export {
  getFitAnalysis,
  analyzeFitBatch,
  createMockFitAnalysis,
  convertToLayer1Requirements,
  calculateFitScoreFromGaps,
} from './fit-analyzer';

export {
  calculateCareerCapital,
  calculateBrandValue,
  calculateSkillGrowthPotential,
  calculateNetworkPotential,
  calculateCompCompetitiveness,
  interpretBrandScore,
  interpretSkillGrowth,
  interpretNetwork,
  interpretComp,
} from './career-capital';

export {
  detectScamRisk,
  isScamJob,
} from './scam-detector';
