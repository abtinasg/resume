/**
 * No Legacy Imports - Static Analysis Tests
 *
 * Validates that API routes do NOT import legacy 3D scoring functions.
 * These tests act as guardrails during the migration to prevent
 * re-introduction of legacy scoring dependencies.
 *
 * NOTE: These tests currently serve as a BASELINE. Some will fail
 * because legacy imports still exist (e.g., /api/analyze/route.ts).
 * As migration progresses, these tests should be enabled one by one.
 */

import * as fs from 'fs';
import * as path from 'path';

// ==================== Helpers ====================

/**
 * Recursively find files matching a pattern
 */
function findFiles(dir: string, pattern: RegExp): string[] {
  const results: string[] = [];

  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      results.push(...findFiles(fullPath, pattern));
    } else if (pattern.test(entry.name)) {
      results.push(fullPath);
    }
  }

  return results;
}

/**
 * Read file content safely
 */
function readFileContent(filePath: string): string {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return '';
  }
}

// ==================== Path Setup ====================

const ROOT_DIR = path.resolve(__dirname, '../../..');
const API_DIR = path.join(ROOT_DIR, 'app', 'api');
const SERVICES_DIR = path.join(ROOT_DIR, 'lib', 'services');

// ==================== Tests ====================

describe('No Legacy Imports in Services', () => {
  test('scoring-service.ts does not import calculate3DScore', () => {
    const filePath = path.join(SERVICES_DIR, 'scoring-service.ts');
    const content = readFileContent(filePath);

    expect(content).not.toContain('calculate3DScore');
    expect(content).not.toContain("from '@/lib/scoring/3d'");
    expect(content).not.toContain("from '../scoring/3d'");
  });

  test('scoring-service.ts uses PRO scoring', () => {
    const filePath = path.join(SERVICES_DIR, 'scoring-service.ts');
    const content = readFileContent(filePath);

    expect(content).toContain('calculatePROScore');
  });
});

describe('No Legacy Imports in /api/score', () => {
  test('/api/score/route.ts does not import legacy scoring', () => {
    const filePath = path.join(API_DIR, 'score', 'route.ts');
    const content = readFileContent(filePath);

    expect(content).not.toContain('calculate3DScore');
    expect(content).not.toContain('ResumeScores');
    expect(content).not.toContain('Hybrid3DScoringResult');
  });
});

describe('Legacy 3D References Baseline', () => {
  /**
   * This test documents which files currently import legacy 3D scoring.
   * As migration progresses, files should be removed from this list.
   */
  test('documents all files importing calculate3DScore', () => {
    const allTsFiles = findFiles(ROOT_DIR, /\.(ts|tsx)$/);

    const filesImporting3D = allTsFiles.filter(file => {
      // Skip node_modules and .next
      if (file.includes('node_modules') || file.includes('.next')) return false;

      const content = readFileContent(file);
      return content.includes('calculate3DScore');
    });

    // Current known files using legacy 3D scoring:
    // 1. lib/scoring/algorithms.ts - the implementation itself
    // 2. app/api/analyze/route.ts - primary consumer
    // 3. docs/ files - documentation references
    const knownLegacyFiles = filesImporting3D.map(f =>
      path.relative(ROOT_DIR, f)
    );

    // Log for audit purposes
    console.log('Files containing calculate3DScore:', knownLegacyFiles);

    // The implementation file will always contain it (until removal)
    expect(knownLegacyFiles).toContain('lib/scoring/algorithms.ts');
  });

  test('documents all files importing legacy 3D types', () => {
    const allTsFiles = findFiles(ROOT_DIR, /\.(ts|tsx)$/);

    const filesUsing3DTypes = allTsFiles.filter(file => {
      if (file.includes('node_modules') || file.includes('.next')) return false;

      const content = readFileContent(file);
      return (
        content.includes('ResumeScores') ||
        content.includes('AI3DAnalysisResponse') ||
        content.includes('Hybrid3DScoringResult')
      );
    });

    const knownFiles = filesUsing3DTypes.map(f =>
      path.relative(ROOT_DIR, f)
    );

    console.log('Files using legacy 3D types:', knownFiles);

    // These are the files that need migration
    expect(knownFiles.length).toBeGreaterThan(0); // At minimum types.ts defines them
  });
});

describe('PRO Scoring is Canonical', () => {
  test('lib/scoring/index.ts exports calculatePROScore', () => {
    const filePath = path.join(ROOT_DIR, 'lib', 'scoring', 'index.ts');
    const content = readFileContent(filePath);

    expect(content).toContain('export async function calculatePROScore');
  });

  test('lib/scoring/types.ts defines ScoringResult', () => {
    const filePath = path.join(ROOT_DIR, 'lib', 'scoring', 'types.ts');
    const content = readFileContent(filePath);

    expect(content).toContain('export interface ScoringResult');
  });

  test('derivedViews.ts exists as migration bridge', () => {
    const filePath = path.join(ROOT_DIR, 'lib', 'scoring', 'derivedViews.ts');
    const exists = fs.existsSync(filePath);

    expect(exists).toBe(true);

    const content = readFileContent(filePath);
    expect(content).toContain('derive3DFromPRO');
  });
});

describe('No New 3D Scoring Consumers', () => {
  /**
   * Ensures no NEW files start importing legacy 3D scoring.
   * The allowed list contains only pre-existing files.
   */
  test('only known files import from legacy 3D scoring', () => {
    const ALLOWED_LEGACY_FILES = new Set([
      'lib/scoring/algorithms.ts',     // Implementation (to be deprecated)
      'lib/scoring/types.ts',          // Type definitions (to be deprecated)
      'docs/resume-analysis/CODE_ANALYSIS_REPORT.md', // Documentation
      'lib/scoring/__tests__/noLegacyImports.test.ts', // This test file (references in string literals)
    ]);

    const allTsFiles = findFiles(ROOT_DIR, /\.(ts|tsx)$/);

    const newConsumers = allTsFiles.filter(file => {
      if (file.includes('node_modules') || file.includes('.next')) return false;

      const relative = path.relative(ROOT_DIR, file);
      if (ALLOWED_LEGACY_FILES.has(relative)) return false;

      const content = readFileContent(file);
      return content.includes('calculate3DScore');
    });

    const newConsumerPaths = newConsumers.map(f => path.relative(ROOT_DIR, f));

    expect(newConsumerPaths).toEqual([]);
  });
});
