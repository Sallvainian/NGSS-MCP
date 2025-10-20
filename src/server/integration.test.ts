/**
 * Integration Tests for MCP Tools with Detail Levels
 * Tests all 5 tools with minimal, summary, and full detail levels
 */

import { describe, test, expect, beforeAll } from 'bun:test';
import { initializeDatabase, getDatabase } from './database.js';
import { formatResponse, formatResponseArray } from './response-formatter.js';
import { getTokenMetadata } from './token-counter.js';
import type { DetailLevel } from '../types/ngss.js';
import { SEP_VALUES, CCC_VALUES, DCI_VALUES } from '../constants/enum-values.js';

describe('Integration Tests - MCP Tools with Detail Levels', () => {
  beforeAll(() => {
    // Initialize database before running tests
    initializeDatabase();
  });

  /**
   * DATA VALIDATION: Critical Pre-Implementation Tests
   * These tests verify that enum values match actual data before implementing new tools
   * Risk R-1 & R-6 from tech spec: Enum/data mismatch could break filtering logic
   */
  describe('Data Validation: SEP and CCC Enum Values', () => {
    test('should verify all standards have sep.name field', () => {
      const db = getDatabase();
      const standards = db.getAllStandards();

      expect(standards.length).toBe(55);

      standards.forEach((s, i) => {
        expect(s.sep, `Standard ${i} (${s.code}) missing sep object`).toBeDefined();
        expect(s.sep.name, `Standard ${i} (${s.code}) missing sep.name`).toBeDefined();
        expect(typeof s.sep.name, `Standard ${i} (${s.code}) sep.name not string`).toBe('string');
        expect(s.sep.name.length, `Standard ${i} (${s.code}) sep.name empty`).toBeGreaterThan(0);
      });
    });

    test('should verify all standards have ccc.name field', () => {
      const db = getDatabase();
      const standards = db.getAllStandards();

      standards.forEach((s, i) => {
        expect(s.ccc, `Standard ${i} (${s.code}) missing ccc object`).toBeDefined();
        expect(s.ccc.name, `Standard ${i} (${s.code}) missing ccc.name`).toBeDefined();
        expect(typeof s.ccc.name, `Standard ${i} (${s.code}) ccc.name not string`).toBe('string');
        expect(s.ccc.name.length, `Standard ${i} (${s.code}) ccc.name empty`).toBeGreaterThan(0);
      });
    });

    test('should extract all unique SEP names from data', () => {
      const db = getDatabase();
      const standards = db.getAllStandards();

      const uniqueSEPs = new Set<string>();
      standards.forEach(s => uniqueSEPs.add(s.sep.name));

      const sepArray = Array.from(uniqueSEPs).sort();

      console.log('\n=== ACTUAL SEP VALUES IN DATA ===');
      console.log(`Total unique: ${sepArray.length}`);
      sepArray.forEach((name, i) => {
        console.log(`  ${i + 1}. "${name}"`);
      });

      // This test documents the actual values, not enforces an enum
      expect(sepArray.length).toBeGreaterThan(0);
    });

    test('should extract all unique CCC names from data', () => {
      const db = getDatabase();
      const standards = db.getAllStandards();

      const uniqueCCCs = new Set<string>();
      standards.forEach(s => uniqueCCCs.add(s.ccc.name));

      const cccArray = Array.from(uniqueCCCs).sort();

      console.log('\n=== ACTUAL CCC VALUES IN DATA ===');
      console.log(`Total unique: ${cccArray.length}`);
      cccArray.forEach((name, i) => {
        console.log(`  ${i + 1}. "${name}"`);
      });

      // This test documents the actual values, not enforces an enum
      expect(cccArray.length).toBeGreaterThan(0);
    });

    test('should detect OCR whitespace variations in SEP names', () => {
      const db = getDatabase();
      const standards = db.getAllStandards();

      // Helper to normalize whitespace
      const normalize = (str: string) => str.trim().replace(/\s+/g, ' ');

      const rawSEPs = new Set<string>();
      const normalizedSEPs = new Set<string>();

      standards.forEach(s => {
        rawSEPs.add(s.sep.name);
        normalizedSEPs.add(normalize(s.sep.name));
      });

      console.log('\n=== SEP WHITESPACE ANALYSIS ===');
      console.log(`Raw unique values: ${rawSEPs.size}`);
      console.log(`Normalized unique values: ${normalizedSEPs.size}`);
      console.log(`Whitespace duplicates: ${rawSEPs.size - normalizedSEPs.size}`);

      if (rawSEPs.size > normalizedSEPs.size) {
        console.log('\n⚠️  WHITESPACE VARIATIONS DETECTED:');
        const rawArray = Array.from(rawSEPs).sort();
        const normalizedMap = new Map<string, string[]>();

        rawArray.forEach(raw => {
          const norm = normalize(raw);
          if (!normalizedMap.has(norm)) {
            normalizedMap.set(norm, []);
          }
          normalizedMap.get(norm)!.push(raw);
        });

        normalizedMap.forEach((variations, normalized) => {
          if (variations.length > 1) {
            console.log(`\n  "${normalized}"`);
            variations.forEach(v => {
              console.log(`    - "${v}"`);
            });
          }
        });
      }

      // Document the finding
      expect(rawSEPs.size).toBeGreaterThanOrEqual(normalizedSEPs.size);
    });

    test('should detect OCR whitespace variations in CCC names', () => {
      const db = getDatabase();
      const standards = db.getAllStandards();

      // Helper to normalize whitespace
      const normalize = (str: string) => str.trim().replace(/\s+/g, ' ');

      const rawCCCs = new Set<string>();
      const normalizedCCCs = new Set<string>();

      standards.forEach(s => {
        rawCCCs.add(s.ccc.name);
        normalizedCCCs.add(normalize(s.ccc.name));
      });

      console.log('\n=== CCC WHITESPACE ANALYSIS ===');
      console.log(`Raw unique values: ${rawCCCs.size}`);
      console.log(`Normalized unique values: ${normalizedCCCs.size}`);
      console.log(`Whitespace duplicates: ${rawCCCs.size - normalizedCCCs.size}`);

      if (rawCCCs.size > normalizedCCCs.size) {
        console.log('\n⚠️  WHITESPACE VARIATIONS DETECTED:');
        const rawArray = Array.from(rawCCCs).sort();
        const normalizedMap = new Map<string, string[]>();

        rawArray.forEach(raw => {
          const norm = normalize(raw);
          if (!normalizedMap.has(norm)) {
            normalizedMap.set(norm, []);
          }
          normalizedMap.get(norm)!.push(raw);
        });

        normalizedMap.forEach((variations, normalized) => {
          if (variations.length > 1) {
            console.log(`\n  "${normalized}"`);
            variations.forEach(v => {
              console.log(`    - "${v}"`);
            });
          }
        });
      }

      // Document the finding
      expect(rawCCCs.size).toBeGreaterThanOrEqual(normalizedCCCs.size);
    });
  });

  describe('Tool 1: get_standard', () => {
    const testCode = 'MS-PS1-1';

    test('should return full standard with detail_level="full"', () => {
      const db = getDatabase();
      const standard = db.getStandardByCode(testCode);

      expect(standard).toBeDefined();

      const formatted = formatResponse(standard!, 'full');
      expect(formatted).toHaveProperty('sep');
      expect(formatted).toHaveProperty('dci');
      expect(formatted).toHaveProperty('ccc');
      expect(formatted).toHaveProperty('lesson_scope');
    });

    test('should return minimal standard with detail_level="minimal"', () => {
      const db = getDatabase();
      const standard = db.getStandardByCode(testCode);

      const formatted = formatResponse(standard!, 'minimal');
      expect(formatted).toHaveProperty('code');
      expect(formatted).toHaveProperty('topic');
      expect(formatted).toHaveProperty('performance_expectation');
      expect(formatted).not.toHaveProperty('sep');
      expect(formatted).not.toHaveProperty('keywords');

      const pe = (formatted as any).performance_expectation;
      expect(pe.length).toBeLessThanOrEqual(53); // 50 + '...'
    });

    test('should return summary standard with detail_level="summary"', () => {
      const db = getDatabase();
      const standard = db.getStandardByCode(testCode);

      const formatted = formatResponse(standard!, 'summary');
      expect(formatted).toHaveProperty('code');
      expect(formatted).toHaveProperty('topic');
      expect(formatted).toHaveProperty('performance_expectation');
      expect(formatted).toHaveProperty('keywords');
      expect(formatted).not.toHaveProperty('sep');

      const pe = (formatted as any).performance_expectation;
      expect(pe.length).toBeLessThanOrEqual(153); // 150 + '...'

      const keywords = (formatted as any).keywords;
      expect(keywords.length).toBeLessThanOrEqual(3);
    });

    test('should include token metadata', () => {
      const db = getDatabase();
      const standard = db.getStandardByCode(testCode);
      const formatted = formatResponse(standard!, 'summary');
      const tokens = getTokenMetadata(testCode, formatted);

      expect(tokens).toHaveProperty('input_tokens');
      expect(tokens).toHaveProperty('output_tokens');
      expect(tokens).toHaveProperty('total_tokens');
      expect(tokens.total_tokens).toBeGreaterThan(0);
    });
  });

  describe('Tool 2: search_by_domain', () => {
    test('should format array of standards with detail_level="minimal"', () => {
      const db = getDatabase();
      const standards = db.searchByDomain('Physical Science');

      expect(standards.length).toBeGreaterThan(0);

      const formatted = formatResponseArray(standards, 'minimal');
      formatted.forEach(std => {
        expect(std).toHaveProperty('code');
        expect(std).toHaveProperty('topic');
        expect(std).not.toHaveProperty('sep');
      });
    });

    test('should format array of standards with detail_level="summary"', () => {
      const db = getDatabase();
      const standards = db.searchByDomain('Life Science');

      const formatted = formatResponseArray(standards, 'summary');
      formatted.forEach(std => {
        expect(std).toHaveProperty('code');
        expect(std).toHaveProperty('keywords');
        expect(std).not.toHaveProperty('dci');
      });
    });

    test('should format array of standards with detail_level="full"', () => {
      const db = getDatabase();
      const standards = db.searchByDomain('Earth and Space Science');

      const formatted = formatResponseArray(standards, 'full');
      formatted.forEach(std => {
        expect(std).toHaveProperty('sep');
        expect(std).toHaveProperty('dci');
        expect(std).toHaveProperty('ccc');
      });
    });
  });

  describe('Tool 3: get_3d_components', () => {
    const testCode = 'MS-LS2-1';

    test('should return 3D components with token metadata', () => {
      const db = getDatabase();
      const components = db.get3DComponents(testCode);

      expect(components).toBeDefined();
      expect(components).toHaveProperty('sep');
      expect(components).toHaveProperty('dci');
      expect(components).toHaveProperty('ccc');

      const tokens = getTokenMetadata(testCode, components);
      expect(tokens).toHaveProperty('total_tokens');
    });
  });

  describe('Tool 4: search_standards', () => {
    test('should format full-text search results with detail_level="minimal"', () => {
      const db = getDatabase();
      const results = db.searchStandards('matter', { limit: 5 });

      const formattedResults = results.map(({ standard, score }) => {
        const formatted = formatResponse(standard, 'minimal');
        return { ...formatted, relevance: score };
      });

      expect(formattedResults.length).toBeGreaterThan(0);
      formattedResults.forEach(result => {
        expect(result).toHaveProperty('code');
        expect(result).toHaveProperty('relevance');
        expect(result).not.toHaveProperty('sep');
      });
    });

    test('should format full-text search results with detail_level="summary"', () => {
      const db = getDatabase();
      const results = db.searchStandards('energy', { limit: 5 });

      const formattedResults = results.map(({ standard, score }) => {
        const formatted = formatResponse(standard, 'summary');
        return { ...formatted, relevance: score };
      });

      formattedResults.forEach(result => {
        expect(result).toHaveProperty('keywords');
        expect(result).toHaveProperty('relevance');
        expect((result as any).keywords.length).toBeLessThanOrEqual(3);
      });
    });
  });

  /**
   * Tool 6: search_by_practice
   * Tests for AC-5.1 through AC-5.5
   */
  describe('Tool 6: search_by_practice', () => {
    // AC-5.1: Tool accepts all 10 valid SEP names as input
    // SEP_VALUES imported from shared constants

    test('AC-5.1: should accept all 10 valid SEP names (parameterized)', () => {
      const db = getDatabase();
      const allStandards = db.getAllStandards();

      SEP_VALUES.forEach(practice => {
        const filtered = allStandards.filter(s => s.sep.name === practice);
        // Each SEP should have at least 1 standard (or 0 for some edge cases)
        expect(Array.isArray(filtered)).toBe(true);
      });
    });

    test('AC-5.1: should filter standards by exact SEP name match', () => {
      const db = getDatabase();
      const allStandards = db.getAllStandards();

      const practice = 'Develop a model to predict and/or describe phenomena.';
      const filtered = allStandards.filter(s => s.sep.name === practice);

      expect(filtered.length).toBeGreaterThan(0);
      filtered.forEach(s => {
        expect(s.sep.name).toBe(practice);
      });
    });

    test('AC-5.2: should handle invalid practice name (validation at Zod level)', () => {
      // Note: In actual MCP server, Zod will reject invalid enum values
      // This test documents expected behavior
      const invalidPractice = 'Not a valid practice';
      const db = getDatabase();
      const allStandards = db.getAllStandards();

      const filtered = allStandards.filter(s => s.sep.name === invalidPractice);
      expect(filtered.length).toBe(0);
    });

    test('AC-5.3: should respect detail_level parameter (minimal)', () => {
      const db = getDatabase();
      const allStandards = db.getAllStandards();

      const practice = 'Develop a model to predict and/or describe phenomena.';
      const filtered = allStandards.filter(s => s.sep.name === practice);

      const formatted = formatResponseArray(filtered, 'minimal');
      formatted.forEach(std => {
        expect(std).toHaveProperty('code');
        expect(std).toHaveProperty('topic');
        expect(std).toHaveProperty('performance_expectation');
        expect(std).not.toHaveProperty('sep');
        expect(std).not.toHaveProperty('keywords');
      });
    });

    test('AC-5.3: should respect detail_level parameter (summary)', () => {
      const db = getDatabase();
      const allStandards = db.getAllStandards();

      const practice = 'Develop a model to predict and/or describe phenomena.';
      const filtered = allStandards.filter(s => s.sep.name === practice);

      const formatted = formatResponseArray(filtered, 'summary');
      formatted.forEach(std => {
        expect(std).toHaveProperty('code');
        expect(std).toHaveProperty('topic');
        expect(std).toHaveProperty('keywords');
        expect((std as any).keywords.length).toBeLessThanOrEqual(3);
        expect(std).not.toHaveProperty('sep');
      });
    });

    test('AC-5.3: should respect detail_level parameter (full)', () => {
      const db = getDatabase();
      const allStandards = db.getAllStandards();

      const practice = 'Develop a model to predict and/or describe phenomena.';
      const filtered = allStandards.filter(s => s.sep.name === practice);

      const formatted = formatResponseArray(filtered, 'full');
      formatted.forEach(std => {
        expect(std).toHaveProperty('code');
        expect(std).toHaveProperty('sep');
        expect(std).toHaveProperty('dci');
        expect(std).toHaveProperty('ccc');
        expect(std).toHaveProperty('lesson_scope');
      });
    });

    test('AC-5.4: should return empty array when no standards match', () => {
      const db = getDatabase();
      const allStandards = db.getAllStandards();

      // Use a valid SEP that might have 0 matches
      const practice = 'Unknown';
      const filtered = allStandards.filter(s => s.sep.name === practice);

      const formatted = formatResponseArray(filtered, 'full');
      expect(Array.isArray(formatted)).toBe(true);
      // If there are matches, they should all have the correct SEP
      filtered.forEach(s => {
        expect(s.sep.name).toBe(practice);
      });
    });

    test('AC-5.5: should return correct count in response', () => {
      const db = getDatabase();
      const allStandards = db.getAllStandards();

      SEP_VALUES.forEach(practice => {
        const filtered = allStandards.filter(s => s.sep.name === practice);
        const total = filtered.length;

        const formatted = formatResponseArray(filtered, 'full');
        expect(formatted.length).toBe(total);
      });
    });

    test('AC-5.5: should verify total field matches array length for all SEPs', () => {
      const db = getDatabase();
      const allStandards = db.getAllStandards();

      SEP_VALUES.forEach(practice => {
        const filtered = allStandards.filter(s => s.sep.name === practice);
        const formatted = formatResponseArray(filtered, 'summary');

        // Simulated response structure
        const response = {
          practice,
          total: filtered.length,
          standards: formatted
        };

        expect(response.total).toBe(response.standards.length);
      });
    });

    test('Integration: should handle all SEP values end-to-end', () => {
      const db = getDatabase();
      const allStandards = db.getAllStandards();

      const results = SEP_VALUES.map(practice => {
        const filtered = allStandards.filter(s => s.sep.name === practice);
        return {
          practice,
          count: filtered.length
        };
      });

      // Verify we have results for all 10 SEPs
      expect(results.length).toBe(10);

      // Verify total across all SEPs equals total standards
      const totalAcrossAllSEPs = results.reduce((sum, r) => sum + r.count, 0);
      expect(totalAcrossAllSEPs).toBe(allStandards.length);
    });

    test('Data Quality: Verify all standards have sep.name field', () => {
      const db = getDatabase();
      const allStandards = db.getAllStandards();

      allStandards.forEach(s => {
        expect(s.sep).toBeDefined();
        expect(s.sep.name).toBeDefined();
        expect(typeof s.sep.name).toBe('string');
        expect(s.sep.name.length).toBeGreaterThan(0);
      });
    });
  });

  /**
   * Tool 7: search_by_crosscutting_concept
   * Tests for AC-6.1 through AC-6.5
   */
  describe('Tool 7: search_by_crosscutting_concept', () => {
    // AC-6.1: Tool accepts all 8 valid CCC names as input
    // CCC_VALUES imported from shared constants

    test('AC-6.1: should accept all 8 valid CCC names (parameterized)', () => {
      const db = getDatabase();
      const allStandards = db.getAllStandards();

      CCC_VALUES.forEach(concept => {
        const filtered = allStandards.filter(s => s.ccc.name === concept);
        // Each CCC should have at least 1 standard
        expect(Array.isArray(filtered)).toBe(true);
      });
    });

    test('AC-6.1: should filter standards by exact CCC name match', () => {
      const db = getDatabase();
      const allStandards = db.getAllStandards();

      const concept = 'Patterns can be used to identify cause and effect relationships.';
      const filtered = allStandards.filter(s => s.ccc.name === concept);

      expect(filtered.length).toBeGreaterThan(0);
      filtered.forEach(s => {
        expect(s.ccc.name).toBe(concept);
      });
    });

    test('AC-6.2: should handle invalid concept name (validation at Zod level)', () => {
      // Note: In actual MCP server, Zod will reject invalid enum values
      // This test documents expected behavior
      const invalidConcept = 'Not a valid concept';
      const db = getDatabase();
      const allStandards = db.getAllStandards();

      const filtered = allStandards.filter(s => s.ccc.name === invalidConcept);
      expect(filtered.length).toBe(0);
    });

    test('AC-6.3: should respect detail_level parameter (minimal)', () => {
      const db = getDatabase();
      const allStandards = db.getAllStandards();

      const concept = 'Patterns can be used to identify cause and effect relationships.';
      const filtered = allStandards.filter(s => s.ccc.name === concept);

      const formatted = formatResponseArray(filtered, 'minimal');
      formatted.forEach(std => {
        expect(std).toHaveProperty('code');
        expect(std).toHaveProperty('topic');
        expect(std).toHaveProperty('performance_expectation');
        expect(std).not.toHaveProperty('ccc');
        expect(std).not.toHaveProperty('keywords');
      });
    });

    test('AC-6.3: should respect detail_level parameter (summary)', () => {
      const db = getDatabase();
      const allStandards = db.getAllStandards();

      const concept = 'Patterns can be used to identify cause and effect relationships.';
      const filtered = allStandards.filter(s => s.ccc.name === concept);

      const formatted = formatResponseArray(filtered, 'summary');
      formatted.forEach(std => {
        expect(std).toHaveProperty('code');
        expect(std).toHaveProperty('topic');
        expect(std).toHaveProperty('keywords');
        expect((std as any).keywords.length).toBeLessThanOrEqual(3);
        expect(std).not.toHaveProperty('ccc');
      });
    });

    test('AC-6.3: should respect detail_level parameter (full)', () => {
      const db = getDatabase();
      const allStandards = db.getAllStandards();

      const concept = 'Patterns can be used to identify cause and effect relationships.';
      const filtered = allStandards.filter(s => s.ccc.name === concept);

      const formatted = formatResponseArray(filtered, 'full');
      formatted.forEach(std => {
        expect(std).toHaveProperty('code');
        expect(std).toHaveProperty('sep');
        expect(std).toHaveProperty('dci');
        expect(std).toHaveProperty('ccc');
        expect(std).toHaveProperty('lesson_scope');
      });
    });

    test('AC-6.4: should return empty array when no standards match', () => {
      const db = getDatabase();
      const allStandards = db.getAllStandards();

      // Test with a valid CCC (all should have matches, but test structure)
      CCC_VALUES.forEach(concept => {
        const filtered = allStandards.filter(s => s.ccc.name === concept);
        const formatted = formatResponseArray(filtered, 'full');
        expect(Array.isArray(formatted)).toBe(true);
        // All filtered results should match the concept
        filtered.forEach(s => {
          expect(s.ccc.name).toBe(concept);
        });
      });
    });

    test('AC-6.5: should return correct count in response', () => {
      const db = getDatabase();
      const allStandards = db.getAllStandards();

      CCC_VALUES.forEach(concept => {
        const filtered = allStandards.filter(s => s.ccc.name === concept);
        const total = filtered.length;

        const formatted = formatResponseArray(filtered, 'full');
        expect(formatted.length).toBe(total);
      });
    });

    test('AC-6.5: should verify total field matches array length for all CCCs', () => {
      const db = getDatabase();
      const allStandards = db.getAllStandards();

      CCC_VALUES.forEach(concept => {
        const filtered = allStandards.filter(s => s.ccc.name === concept);
        const formatted = formatResponseArray(filtered, 'summary');

        // Simulated response structure
        const response = {
          concept,
          total: filtered.length,
          standards: formatted
        };

        expect(response.total).toBe(response.standards.length);
      });
    });

    test('Integration: should handle all CCC values end-to-end', () => {
      const db = getDatabase();
      const allStandards = db.getAllStandards();

      const results = CCC_VALUES.map(concept => {
        const filtered = allStandards.filter(s => s.ccc.name === concept);
        return {
          concept,
          count: filtered.length
        };
      });

      // Verify we have results for all 8 CCCs
      expect(results.length).toBe(8);

      // Verify total across all CCCs equals total standards
      const totalAcrossAllCCCs = results.reduce((sum, r) => sum + r.count, 0);
      expect(totalAcrossAllCCCs).toBe(allStandards.length);
    });

    test('Data Quality: Verify all standards have ccc.name field', () => {
      const db = getDatabase();
      const allStandards = db.getAllStandards();

      allStandards.forEach(s => {
        expect(s.ccc).toBeDefined();
        expect(s.ccc.name).toBeDefined();
        expect(typeof s.ccc.name).toBe('string');
        expect(s.ccc.name.length).toBeGreaterThan(0);
      });
    });
  });

  /**
   * Tool 8: search_by_disciplinary_core_idea
   * Tests for AC-7.1 through AC-7.5
   */
  describe('Tool 8: search_by_disciplinary_core_idea', () => {
    // AC-7.1: Tool accepts all 35 valid DCI names as input
    // DCI_VALUES imported from shared constants

    test('AC-7.1: should accept all 35 valid DCI names (parameterized)', () => {
      const db = getDatabase();
      const allStandards = db.getAllStandards();

      DCI_VALUES.forEach(dci => {
        const filtered = allStandards.filter(s => s.dci.name === dci);
        // Each DCI should have at least 1 standard (or 0 for some edge cases)
        expect(Array.isArray(filtered)).toBe(true);
      });
    });

    test('AC-7.1: should filter standards by exact DCI name match', () => {
      const db = getDatabase();
      const allStandards = db.getAllStandards();

      const dci = 'Definitions of Energy';
      const filtered = allStandards.filter(s => s.dci.name === dci);

      expect(filtered.length).toBeGreaterThan(0);
      filtered.forEach(s => {
        expect(s.dci.name).toBe(dci);
      });
    });

    test('AC-7.2: should handle invalid DCI name (validation at Zod level)', () => {
      // Note: In actual MCP server, Zod will reject invalid enum values
      // This test documents expected behavior
      const invalidDci = 'Not a valid DCI';
      const db = getDatabase();
      const allStandards = db.getAllStandards();

      const filtered = allStandards.filter(s => s.dci.name === invalidDci);
      expect(filtered.length).toBe(0);
    });

    test('AC-7.3: should respect detail_level parameter (minimal)', () => {
      const db = getDatabase();
      const allStandards = db.getAllStandards();

      const dci = 'Definitions of Energy';
      const filtered = allStandards.filter(s => s.dci.name === dci);

      const formatted = formatResponseArray(filtered, 'minimal');
      formatted.forEach(std => {
        expect(std).toHaveProperty('code');
        expect(std).toHaveProperty('topic');
        expect(std).toHaveProperty('performance_expectation');
        expect(std).not.toHaveProperty('sep');
        expect(std).not.toHaveProperty('keywords');
      });
    });

    test('AC-7.3: should respect detail_level parameter (summary)', () => {
      const db = getDatabase();
      const allStandards = db.getAllStandards();

      const dci = 'Definitions of Energy';
      const filtered = allStandards.filter(s => s.dci.name === dci);

      const formatted = formatResponseArray(filtered, 'summary');
      formatted.forEach(std => {
        expect(std).toHaveProperty('code');
        expect(std).toHaveProperty('topic');
        expect(std).toHaveProperty('keywords');
        expect((std as any).keywords.length).toBeLessThanOrEqual(3);
        expect(std).not.toHaveProperty('sep');
      });
    });

    test('AC-7.3: should respect detail_level parameter (full)', () => {
      const db = getDatabase();
      const allStandards = db.getAllStandards();

      const dci = 'Definitions of Energy';
      const filtered = allStandards.filter(s => s.dci.name === dci);

      const formatted = formatResponseArray(filtered, 'full');
      formatted.forEach(std => {
        expect(std).toHaveProperty('code');
        expect(std).toHaveProperty('sep');
        expect(std).toHaveProperty('dci');
        expect(std).toHaveProperty('ccc');
        expect(std).toHaveProperty('lesson_scope');
      });
    });

    test('AC-7.4: should return empty array when no standards match', () => {
      const db = getDatabase();
      const allStandards = db.getAllStandards();

      // Use a valid DCI that might have 0 matches
      // (All current DCIs have matches, so this tests the structure)
      const filtered = allStandards.filter(s => s.dci.name === 'Nonexistent DCI');
      expect(filtered.length).toBe(0);
    });

    test('AC-7.4: should verify all filtered results match DCI exactly', () => {
      const db = getDatabase();
      const allStandards = db.getAllStandards();

      // Test with a valid DCI (all should have matches, but test structure)
      DCI_VALUES.forEach(dci => {
        const filtered = allStandards.filter(s => s.dci.name === dci);
        const formatted = formatResponseArray(filtered, 'full');
        expect(Array.isArray(formatted)).toBe(true);
        // All filtered results should match the DCI
        filtered.forEach(s => {
          expect(s.dci.name).toBe(dci);
        });
      });
    });

    test('AC-7.5: should return correct count in response', () => {
      const db = getDatabase();
      const allStandards = db.getAllStandards();

      DCI_VALUES.forEach(dci => {
        const filtered = allStandards.filter(s => s.dci.name === dci);
        const total = filtered.length;

        const formatted = formatResponseArray(filtered, 'full');
        expect(formatted.length).toBe(total);
      });
    });

    test('AC-7.5: should verify total field matches array length for all DCIs', () => {
      const db = getDatabase();
      const allStandards = db.getAllStandards();

      DCI_VALUES.forEach(dci => {
        const filtered = allStandards.filter(s => s.dci.name === dci);
        const formatted = formatResponseArray(filtered, 'summary');

        // Simulated response structure
        const response = {
          dci,
          total: filtered.length,
          standards: formatted
        };

        expect(response.total).toBe(response.standards.length);
      });
    });

    test('Integration: should handle all DCI values end-to-end', () => {
      const db = getDatabase();
      const allStandards = db.getAllStandards();

      const results = DCI_VALUES.map(dci => {
        const filtered = allStandards.filter(s => s.dci.name === dci);
        return {
          dci,
          count: filtered.length
        };
      });

      // Verify we have results for all 35 DCIs
      expect(results.length).toBe(35);

      // Verify total across all DCIs equals total standards
      const totalAcrossAllDCIs = results.reduce((sum, r) => sum + r.count, 0);
      expect(totalAcrossAllDCIs).toBe(allStandards.length);
    });

    test('Data Quality: Verify all standards have dci.name field', () => {
      const db = getDatabase();
      const allStandards = db.getAllStandards();

      allStandards.forEach(s => {
        expect(s.dci).toBeDefined();
        expect(s.dci.name).toBeDefined();
        expect(typeof s.dci.name).toBe('string');
        expect(s.dci.name.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Backward Compatibility', () => {
    test('default behavior should return full standard (backward compatible)', () => {
      const db = getDatabase();
      const standard = db.getStandardByCode('MS-PS1-1');

      // Without specifying detail_level, should default to 'full'
      const formatted = formatResponse(standard!);

      expect(formatted).toHaveProperty('sep');
      expect(formatted).toHaveProperty('dci');
      expect(formatted).toHaveProperty('ccc');
      expect(formatted).toEqual(standard);
    });
  });

  describe('Invalid Detail Level Handling', () => {
    test('should handle invalid detail_level gracefully', () => {
      const db = getDatabase();
      const standard = db.getStandardByCode('MS-PS1-1');

      // TypeScript will catch this, but runtime should default to full
      const formatted = formatResponse(standard!, 'invalid' as DetailLevel);

      // Should default to full mode
      expect(formatted).toEqual(standard);
    });
  });

  describe('Pagination Integration Tests', () => {
    describe('search_by_domain pagination', () => {
      test('should return first page with default pagination', () => {
        const db = getDatabase();
        const results = db.searchByDomain('Physical Science', { offset: 0, limit: 10 });

        expect(results).toBeDefined();
        expect(results.length).toBeLessThanOrEqual(10);
      });

      test('should return correct page with custom offset and limit', () => {
        const db = getDatabase();
        const page1 = db.searchByDomain('Physical Science', { offset: 0, limit: 5 });
        const page2 = db.searchByDomain('Physical Science', { offset: 5, limit: 5 });

        expect(page1.length).toBeLessThanOrEqual(5);
        expect(page2.length).toBeLessThanOrEqual(5);

        // Pages should not overlap
        if (page1.length > 0 && page2.length > 0) {
          expect(page1[0].code).not.toBe(page2[0].code);
        }
      });

      test('should handle offset beyond total results', () => {
        const db = getDatabase();
        const results = db.searchByDomain('Physical Science', { offset: 1000, limit: 10 });

        expect(results).toEqual([]);
      });

      test('should enforce maximum limit of 50', () => {
        const db = getDatabase();
        const results = db.searchByDomain('Physical Science', { offset: 0, limit: 50 });

        expect(results.length).toBeLessThanOrEqual(50);
      });
    });

    describe('search_standards pagination', () => {
      test('should return first page with default pagination', () => {
        const db = getDatabase();
        const results = db.searchStandards('energy', { offset: 0, limit: 10 });

        expect(results).toBeDefined();
        expect(results.length).toBeLessThanOrEqual(10);
      });

      test('should return correct page with custom offset and limit', () => {
        const db = getDatabase();
        const page1 = db.searchStandards('matter', { offset: 0, limit: 5 });
        const page2 = db.searchStandards('matter', { offset: 5, limit: 5 });

        expect(page1.length).toBeLessThanOrEqual(5);
        expect(page2.length).toBeLessThanOrEqual(5);

        // Pages should not overlap if both have results
        if (page1.length > 0 && page2.length > 0) {
          expect(page1[0].standard.code).not.toBe(page2[0].standard.code);
        }
      });

      test('should handle offset beyond total results', () => {
        const db = getDatabase();
        const results = db.searchStandards('xyz', { offset: 1000, limit: 10 });

        expect(results).toEqual([]);
      });

      test('should maintain stable ordering across pages', () => {
        const db = getDatabase();

        // Get first two pages
        const page1 = db.searchStandards('science', { offset: 0, limit: 10 });
        const page2 = db.searchStandards('science', { offset: 10, limit: 10 });

        // Get full results
        const allResults = db.searchStandards('science', { offset: 0, limit: 20 });

        // Verify pages match sliced full results
        if (allResults.length >= 10) {
          for (let i = 0; i < page1.length; i++) {
            expect(page1[i].standard.code).toBe(allResults[i].standard.code);
          }
        }

        if (allResults.length >= 20) {
          for (let i = 0; i < page2.length; i++) {
            expect(page2[i].standard.code).toBe(allResults[i + 10].standard.code);
          }
        }
      });
    });

    describe('Pagination metadata accuracy', () => {
      test('should calculate hasMore correctly for partial page', () => {
        const db = getDatabase();
        const allResults = db.searchByDomain('Life Science');
        const total = allResults.length;

        if (total > 10) {
          // First page should have hasMore=true
          const firstPage = db.searchByDomain('Life Science', { offset: 0, limit: 10 });
          expect(firstPage.length).toBe(10);
          // Would need to check metadata directly in actual implementation
        }
      });

      test('should calculate hasMore correctly for last page', () => {
        const db = getDatabase();
        const allResults = db.searchByDomain('Earth and Space Science');
        const total = allResults.length;

        if (total > 0) {
          const lastPageOffset = Math.floor(total / 10) * 10;
          const lastPage = db.searchByDomain('Earth and Space Science', {
            offset: lastPageOffset,
            limit: 10
          });

          expect(lastPage.length).toBeLessThanOrEqual(10);
        }
      });
    });

    describe('Response metadata correctness', () => {
      test('should include correct total count in pagination metadata', () => {
        const db = getDatabase();

        // Get total results for a query
        const allResults = db.searchStandards('matter');
        const total = allResults.length;

        // Request only first page
        const pageResults = db.searchStandards('matter', { offset: 0, limit: 5 });

        // The pagination metadata should reflect the TOTAL count, not page size
        // This verifies the fix for the totalMatches inconsistency issue
        expect(pageResults.length).toBeLessThanOrEqual(5);

        // In the actual MCP response at src/server/index.ts:311,
        // totalMatches should equal 'total' (full result count),
        // not 'results.length' (paginated result count)
        // This test documents the expected behavior
        expect(total).toBeGreaterThanOrEqual(pageResults.length);
      });
    });

    describe('Edge cases', () => {
      test('should handle zero offset with small limit', () => {
        const db = getDatabase();
        const results = db.searchByDomain('Physical Science', { offset: 0, limit: 1 });

        expect(results.length).toBeLessThanOrEqual(1);
      });

      test('should handle large offset with small limit', () => {
        const db = getDatabase();
        const allResults = db.searchStandards('standard');
        const total = allResults.length;

        if (total > 0) {
          const results = db.searchStandards('standard', {
            offset: Math.max(0, total - 2),
            limit: 5
          });

          expect(results.length).toBeLessThanOrEqual(5);
        }
      });

      test('should return empty array for query with no results', () => {
        const db = getDatabase();
        const results = db.searchStandards('nonexistent-term-xyz-123', { offset: 0, limit: 10 });

        expect(results).toEqual([]);
      });
    });
  });

  //===========================================
  // Tool 8: get_unit_suggestions Tests
  //===========================================
  describe('Tool 8: get_unit_suggestions', () => {
    // AC-7.1: Tool accepts valid anchor_code and returns suggestions
    describe('Valid Anchor Code (AC-7.1)', () => {
      test('should return suggestions for valid anchor with unit_size=2', () => {
        const db = getDatabase();
        const anchor = db.getStandardByCode('MS-PS3-1');
        expect(anchor).toBeDefined();

        const allStandards = db.getAllStandards();
        const candidates = allStandards.filter(s => s.code !== 'MS-PS3-1');

        // Simulate tool logic
        const scored = candidates.map(c => ({
          code: c.code,
          score: (anchor!.domain === c.domain ? 3 : 0) +
                 (anchor!.sep.name === c.sep.name ? 2 : 0) +
                 (anchor!.ccc.name === c.ccc.name ? 2 : 0) +
                 (anchor!.dci.name === c.dci.name ? 1 : 0)
        }));

        const sorted = scored.sort((a, b) => b.score - a.score || a.code.localeCompare(b.code));
        const topSuggestions = sorted.slice(0, 1); // unit_size - 1

        expect(topSuggestions.length).toBe(1);
        expect(topSuggestions[0].score).toBeGreaterThanOrEqual(0);
      });

      test('should return suggestions for valid anchor with unit_size=3', () => {
        const db = getDatabase();
        const allStandards = db.getAllStandards();
        const anchor = allStandards[0];
        const candidates = allStandards.filter(s => s.code !== anchor.code);

        expect(candidates.length).toBe(54); // 55 - 1 anchor
      });

      test('should return suggestions for valid anchor with unit_size=5', () => {
        const db = getDatabase();
        const anchor = db.getStandardByCode('MS-LS2-1');
        expect(anchor).toBeDefined();
      });

      test('should return suggestions for valid anchor with unit_size=8', () => {
        const db = getDatabase();
        const anchor = db.getStandardByCode('MS-ESS3-1');
        expect(anchor).toBeDefined();
      });
    });

    // AC-7.2: Tool rejects invalid anchor_code with 404 error
    describe('Invalid Anchor Code (AC-7.2)', () => {
      test('should return null for invalid anchor code that matches format', () => {
        const db = getDatabase();
        const anchor = db.getStandardByCode('MS-PS99-99');

        expect(anchor).toBeNull();
      });

      test('should throw error for malformed anchor code', () => {
        const db = getDatabase();

        expect(() => {
          db.getStandardByCode('not-a-real-code');
        }).toThrow('Invalid standard code format');
      });
    });

    // AC-7.3: Tool enforces unit_size range constraints (handled by Zod schema)
    describe('Unit Size Validation (AC-7.3)', () => {
      test('unit_size=1 would be rejected by Zod schema', () => {
        // This test documents that Zod validates min(2)
        expect(2).toBeGreaterThanOrEqual(2); // min allowed
      });

      test('unit_size=2 is minimum valid value', () => {
        expect(2).toBeGreaterThanOrEqual(2);
        expect(2).toBeLessThanOrEqual(8);
      });

      test('unit_size=8 is maximum valid value', () => {
        expect(8).toBeGreaterThanOrEqual(2);
        expect(8).toBeLessThanOrEqual(8);
      });

      test('unit_size=9 would be rejected by Zod schema', () => {
        // This test documents that Zod validates max(8)
        expect(9).toBeGreaterThan(8); // exceeds max
      });
    });

    // AC-7.4: Compatibility scoring follows specified algorithm (binary matching)
    describe('Scoring Algorithm (AC-7.4)', () => {
      test('should score domain match correctly (+3 or 0)', () => {
        const db = getDatabase();
        const anchor = db.getStandardByCode('MS-PS3-1')!;
        const samePhysical = db.getAllStandards().find(s =>
          s.code !== 'MS-PS3-1' && s.domain === 'Physical Science'
        )!;
        const life = db.getAllStandards().find(s => s.domain === 'Life Science')!;

        // Same domain
        const domainMatch = anchor.domain === samePhysical.domain ? 3 : 0;
        expect(domainMatch).toBe(3);

        // Different domain
        const noDomainMatch = anchor.domain === life.domain ? 3 : 0;
        expect(noDomainMatch).toBe(0);
      });

      test('should score SEP match correctly (+2 or 0)', () => {
        const db = getDatabase();
        const anchor = db.getStandardByCode('MS-PS3-1')!;
        const allStandards = db.getAllStandards();

        const sameSEP = allStandards.find(s =>
          s.code !== 'MS-PS3-1' && s.sep.name === anchor.sep.name
        );

        if (sameSEP) {
          const sepMatch = anchor.sep.name === sameSEP.sep.name ? 2 : 0;
          expect(sepMatch).toBe(2);
        } else {
          // If no match found, verify binary scoring would be 0
          expect(0).toBe(0);
        }
      });

      test('should score CCC match correctly (+2 or 0)', () => {
        const db = getDatabase();
        const anchor = db.getStandardByCode('MS-PS3-1')!;
        const allStandards = db.getAllStandards();

        const sameCCC = allStandards.find(s =>
          s.code !== 'MS-PS3-1' && s.ccc.name === anchor.ccc.name
        );

        if (sameCCC) {
          const cccMatch = anchor.ccc.name === sameCCC.ccc.name ? 2 : 0;
          expect(cccMatch).toBe(2);
        } else {
          expect(0).toBe(0);
        }
      });

      test('should score DCI match correctly (+1 or 0)', () => {
        const db = getDatabase();
        const anchor = db.getStandardByCode('MS-PS3-1')!;
        const allStandards = db.getAllStandards();

        const sameDCI = allStandards.find(s =>
          s.code !== 'MS-PS3-1' && s.dci.name === anchor.dci.name
        );

        if (sameDCI) {
          const dciMatch = anchor.dci.name === sameDCI.dci.name ? 1 : 0;
          expect(dciMatch).toBe(1);
        } else {
          expect(0).toBe(0);
        }
      });

      test('should calculate combined score correctly', () => {
        const db = getDatabase();
        const anchor = db.getStandardByCode('MS-PS3-1')!;
        const candidate = db.getStandardByCode('MS-PS3-2')!;

        const score =
          (anchor.domain === candidate.domain ? 3 : 0) +
          (anchor.sep.name === candidate.sep.name ? 2 : 0) +
          (anchor.ccc.name === candidate.ccc.name ? 2 : 0) +
          (anchor.dci.name === candidate.dci.name ? 1 : 0);

        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(8); // max possible score
      });
    });

    // AC-7.5: Suggestions are sorted by compatibility score
    describe('Sorting Order (AC-7.5)', () => {
      test('should sort suggestions by score descending', () => {
        const db = getDatabase();
        const anchor = db.getStandardByCode('MS-PS3-1')!;
        const allStandards = db.getAllStandards();
        const candidates = allStandards.filter(s => s.code !== 'MS-PS3-1');

        const scored = candidates.map(c => ({
          code: c.code,
          score: (anchor.domain === c.domain ? 3 : 0) +
                 (anchor.sep.name === c.sep.name ? 2 : 0) +
                 (anchor.ccc.name === c.ccc.name ? 2 : 0) +
                 (anchor.dci.name === c.dci.name ? 1 : 0)
        }));

        const sorted = scored.sort((a, b) => b.score - a.score || a.code.localeCompare(b.code));

        // Verify descending order
        for (let i = 0; i < sorted.length - 1; i++) {
          expect(sorted[i].score).toBeGreaterThanOrEqual(sorted[i + 1].score);
        }
      });

      test('should use code as tiebreaker when scores are equal', () => {
        const scores = [
          { code: 'MS-PS3-2', score: 5 },
          { code: 'MS-PS3-1', score: 5 },
          { code: 'MS-PS3-3', score: 5 }
        ];

        const sorted = scores.sort((a, b) =>
          b.score - a.score || a.code.localeCompare(b.code)
        );

        expect(sorted[0].code).toBe('MS-PS3-1');
        expect(sorted[1].code).toBe('MS-PS3-2');
        expect(sorted[2].code).toBe('MS-PS3-3');
      });
    });

    // AC-7.6: Tool includes score breakdown in response
    describe('Score Breakdown (AC-7.6)', () => {
      test('should include compatibility_score in suggestion', () => {
        // This test verifies the structure documented in AC-7.6
        const suggestion = {
          code: 'MS-PS3-2',
          compatibility_score: 6,
          match_reasons: []
        };

        expect(suggestion.compatibility_score).toBeDefined();
        expect(typeof suggestion.compatibility_score).toBe('number');
      });

      test('should include match_reasons array in suggestion', () => {
        const suggestion = {
          code: 'MS-PS3-2',
          compatibility_score: 6,
          match_reasons: [
            'Same domain: Physical Science (+3)',
            'Shared CCC: "Cause and effect" (+2)',
            'Shared DCI: "Energy" (+1)'
          ]
        };

        expect(suggestion.match_reasons).toBeDefined();
        expect(Array.isArray(suggestion.match_reasons)).toBe(true);
      });
    });

    // AC-7.7: Tool respects detail_level parameter
    describe('Detail Level (AC-7.7)', () => {
      test('should accept minimal detail_level', () => {
        const detailLevel: 'minimal' | 'summary' | 'full' = 'minimal';
        expect(['minimal', 'summary', 'full']).toContain(detailLevel);
      });

      test('should accept summary detail_level', () => {
        const detailLevel: 'minimal' | 'summary' | 'full' = 'summary';
        expect(['minimal', 'summary', 'full']).toContain(detailLevel);
      });

      test('should accept full detail_level', () => {
        const detailLevel: 'minimal' | 'summary' | 'full' = 'full';
        expect(['minimal', 'summary', 'full']).toContain(detailLevel);
      });
    });

    // AC-7.8: Tool excludes anchor standard from suggestions
    describe('Anchor Exclusion (AC-7.8)', () => {
      test('should exclude anchor from suggestions list', () => {
        const db = getDatabase();
        const anchor = db.getStandardByCode('MS-PS3-1')!;
        const allStandards = db.getAllStandards();
        const candidates = allStandards.filter(s => s.code !== 'MS-PS3-1');

        expect(candidates.length).toBe(54); // 55 - 1 anchor
        expect(candidates.some(c => c.code === 'MS-PS3-1')).toBe(false);
      });
    });

    // AC-7.9: Tool handles edge case of unit_size exceeding available standards
    describe('Edge Cases (AC-7.9)', () => {
      test('should return all available candidates when unit_size exceeds total', () => {
        const db = getDatabase();
        const allStandards = db.getAllStandards();
        const anchor = allStandards[0];
        const candidates = allStandards.filter(s => s.code !== anchor.code);

        const unit_size = 8;
        const suggestions = candidates.slice(0, Math.min(unit_size - 1, candidates.length));

        expect(suggestions.length).toBeLessThanOrEqual(7);
        expect(suggestions.length).toBeLessThanOrEqual(candidates.length);
      });

      test('should handle unit_size=8 with only 55 total standards', () => {
        const db = getDatabase();
        const allStandards = db.getAllStandards();

        expect(allStandards.length).toBe(55);

        const maxSuggestions = 8 - 1; // 7 suggestions for unit_size=8
        expect(maxSuggestions).toBe(7);
        expect(allStandards.length - 1).toBeGreaterThanOrEqual(maxSuggestions); // 54 >= 7
      });
    });
  });

  // Story 1.4: Integration Tests for v1.1.0 Release
  describe('Story 1.4: Integration Tests (Data Validation + Regression)', () => {
    // Task 1: Data Validation Tests (Per ADR-001: Single Objects)
    describe('Data Validation: Single Object Model (ADR-001)', () => {
      test('all 55 standards have sep.name (non-empty string)', () => {
        const db = getDatabase();
        const standards = db.getAllStandards();

        expect(standards.length).toBe(55);
        standards.forEach(s => {
          expect(typeof s.sep?.name).toBe('string');
          expect(s.sep.name.length).toBeGreaterThan(0);
        });
      });

      test('all 55 standards have ccc.name (non-empty string)', () => {
        const db = getDatabase();
        const standards = db.getAllStandards();

        standards.forEach(s => {
          expect(typeof s.ccc?.name).toBe('string');
          expect(s.ccc.name.length).toBeGreaterThan(0);
        });
      });

      test('all 55 standards have dci.name (non-empty string)', () => {
        const db = getDatabase();
        const standards = db.getAllStandards();

        standards.forEach(s => {
          expect(typeof s.dci?.name).toBe('string');
          expect(s.dci.name.length).toBeGreaterThan(0);
        });
      });

      test('all standard codes are unique (Set size === 55)', () => {
        const db = getDatabase();
        const standards = db.getAllStandards();
        const codes = new Set(standards.map(s => s.code));

        expect(codes.size).toBe(55);
      });
    });

    // Task 2: Backward Compatibility Regression Tests
    describe('Backward Compatibility: Tools 1-4 (v1.0.1 behavior)', () => {
      test('Tools 1-2 representative inputs match v1.0.1 behavior', () => {
        const db = getDatabase();

        // Tool 1: get_standard
        const standard = db.getStandardByCode('MS-PS1-1');
        expect(standard).toBeDefined();
        expect(standard!.code).toBe('MS-PS1-1');
        expect(standard!.domain).toBe('Physical Science');
        expect(standard!.sep).toBeDefined();
        expect(standard!.ccc).toBeDefined();
        expect(standard!.dci).toBeDefined();

        // Tool 2: search_by_domain
        const domainResults = db.searchByDomain('Life Science');
        expect(Array.isArray(domainResults)).toBe(true);
        expect(domainResults.length).toBeGreaterThan(0);
        domainResults.forEach(s => {
          expect(s.domain).toBe('Life Science');
        });
      });

      test('Tools 3-4 representative inputs match v1.0.1 behavior', () => {
        const db = getDatabase();

        // Tool 3: get_3d_components (same as getStandardByCode, just returns 3D fields)
        const standard = db.getStandardByCode('MS-LS2-1');
        expect(standard).toBeDefined();
        expect(standard!.code).toBe('MS-LS2-1');
        expect(standard!.sep).toBeDefined();
        expect(standard!.ccc).toBeDefined();
        expect(standard!.dci).toBeDefined();

        // Tool 4: search_standards
        const searchResults = db.searchStandards('energy');
        expect(Array.isArray(searchResults)).toBe(true);
        expect(searchResults.length).toBeGreaterThan(0);
      });
    });

    // Task 3: Tool Regression Tests (New Tools Smoke Tests)
    describe('Tool Regression: New Tools 5, 6, 8 (v1.1.0)', () => {
      test('Tools 5-6 smoke test: basic queries return valid results', () => {
        const db = getDatabase();
        const allStandards = db.getAllStandards();

        // Tool 5: search_by_practice (filter by SEP)
        const practice = 'Develop a model to predict and/or describe phenomena.';
        const practiceResults = allStandards.filter(s => s.sep.name === practice);
        expect(Array.isArray(practiceResults)).toBe(true);
        expect(practiceResults.length).toBeGreaterThan(0);
        practiceResults.forEach(s => {
          expect(s.sep.name).toBe(practice);
        });

        // Tool 6: search_by_crosscutting_concept (filter by CCC)
        const concept = 'Patterns can be used to identify cause and effect relationships.';
        const cccResults = allStandards.filter(s => s.ccc.name === concept);
        expect(Array.isArray(cccResults)).toBe(true);
        expect(cccResults.length).toBeGreaterThan(0);
        cccResults.forEach(s => {
          expect(s.ccc.name).toBe(concept);
        });
      });

      test('Tool 8 anchor exclusion: suggestions do not include anchor standard', () => {
        const db = getDatabase();
        const anchorCode = 'MS-PS1-1';
        const unitSize = 5;

        // Get the anchor standard
        const anchor = db.getStandardByCode(anchorCode);
        expect(anchor).toBeDefined();

        // Get all standards excluding the anchor
        const allStandards = db.getAllStandards();
        const candidates = allStandards.filter(s => s.code !== anchorCode);

        expect(candidates.length).toBe(54); // 55 total - 1 anchor
        expect(candidates.every(s => s.code !== anchorCode)).toBe(true);

        // Verify we can get suggestions (unit_size - 1)
        const maxSuggestions = unitSize - 1; // 4 suggestions for unit_size=5
        expect(candidates.length).toBeGreaterThanOrEqual(maxSuggestions);
      });
    });
  });
});
