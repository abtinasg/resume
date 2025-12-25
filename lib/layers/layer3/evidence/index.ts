/**
 * Layer 3 - Execution Engine
 * Evidence System Exports
 */

export {
  buildEvidenceLedger,
  buildSectionEvidenceLedger,
  buildSummaryEvidenceLedger,
  allowResumeEnrichmentInBullet,
  getEvidenceById,
  getEvidenceByType,
  getEvidenceBySource,
  getAllNormalizedTerms,
  termExistsInLedger,
  findEvidenceForTerm,
  type BuildEvidenceLedgerParams,
} from './ledger-builder';

export {
  createEvidenceMap,
  addEvidenceMapItem,
  createEvidenceMapItem,
  getAllReferencedEvidenceIds,
  getAllMappedSpans,
  isSpanMapped,
  findEvidenceIdsForSpan,
  validateEvidenceIdsExist,
  validateSpansExist,
  mergeEvidenceMaps,
  calculateEvidenceCoverage,
  formatEvidenceMap,
  evidenceMapToJSON,
  parseEvidenceMapFromLLM,
} from './evidence-map';
