/**
 * No Legacy Imports - Static Analysis Tests
 *
 * Validates that:
 * 1. No code imports from the deleted `@/lib/scoring` path
 * 2. All scoring imports use `@/lib/layers/layer1` (single source of truth)
 * 3. PRO scoring is properly exported from Layer 1
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

const ROOT_DIR = path.resolve(__dirname, '../../../../..');
const API_DIR = path.join(ROOT_DIR, 'app', 'api');
const SERVICES_DIR = path.join(ROOT_DIR, 'lib', 'services');
const PRO_SCORING_DIR = path.join(ROOT_DIR, 'lib', 'layers', 'layer1', 'pro-scoring');

// ==================== Tests ====================

describe('Legacy /lib/scoring/ is DELETED', () => {
  test('/lib/scoring/ directory does not exist', () => {
    const legacyScoringDir = path.join(ROOT_DIR, 'lib', 'scoring');
    expect(fs.existsSync(legacyScoringDir)).toBe(false);
  });
});

describe('No imports from deleted @/lib/scoring path', () => {
  test('no source files import from @/lib/scoring', () => {
    const allTsFiles = findFiles(ROOT_DIR, /\.(ts|tsx)$/);

    const offenders = allTsFiles.filter(file => {
      if (file.includes('node_modules') || file.includes('.next')) return false;
      // Allow test files and audit reports to mention the path in string literals
      if (file.includes('noLegacyImports.test.ts')) return false;
      if (file.endsWith('.md')) return false;

      const content = readFileContent(file);
      // Check for actual import statements (not string references in tests/docs)
      return (
        content.includes("from '@/lib/scoring'") ||
        content.includes("from '@/lib/scoring/") ||
        content.includes('from "@/lib/scoring"') ||
        content.includes('from "@/lib/scoring/')
      );
    });

    const offenderPaths = offenders.map(f => path.relative(ROOT_DIR, f));

    expect(offenderPaths).toEqual([]);
  });
});

describe('PRO Scoring is in Layer 1 (Single Source of Truth)', () => {
  test('pro-scoring/index.ts exports calculatePROScore', () => {
    const filePath = path.join(PRO_SCORING_DIR, 'index.ts');
    const content = readFileContent(filePath);

    expect(content).toContain('export async function calculatePROScore');
  });

  test('pro-scoring/types.ts defines ScoringResult', () => {
    const filePath = path.join(PRO_SCORING_DIR, 'types.ts');
    const content = readFileContent(filePath);

    expect(content).toContain('export interface ScoringResult');
  });

  test('pro-scoring/derivedViews.ts exists for backward compatibility', () => {
    const filePath = path.join(PRO_SCORING_DIR, 'derivedViews.ts');
    const exists = fs.existsSync(filePath);

    expect(exists).toBe(true);

    const content = readFileContent(filePath);
    expect(content).toContain('derive3DFromPRO');
  });

  test('layer1/index.ts re-exports calculatePROScore', () => {
    const filePath = path.join(ROOT_DIR, 'lib', 'layers', 'layer1', 'index.ts');
    const content = readFileContent(filePath);

    expect(content).toContain('calculatePROScore');
  });
});

describe('No Legacy Imports in Services', () => {
  test('scoring-service.ts uses Layer 1 imports', () => {
    const filePath = path.join(SERVICES_DIR, 'scoring-service.ts');
    const content = readFileContent(filePath);

    expect(content).toContain('calculatePROScore');
    expect(content).not.toContain("from '@/lib/scoring'");
    expect(content).not.toContain("from '@/lib/scoring/");
  });
});

describe('No Legacy Imports in API Routes', () => {
  test('/api/analyze/route.ts uses Layer 1 imports', () => {
    const filePath = path.join(API_DIR, 'analyze', 'route.ts');
    const content = readFileContent(filePath);

    expect(content).toContain('calculatePROScore');
    expect(content).not.toContain("from '@/lib/scoring'");
    expect(content).not.toContain("from '@/lib/scoring/");
  });
});
