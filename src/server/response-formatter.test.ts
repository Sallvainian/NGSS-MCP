/**
 * Unit Tests for Response Formatter Module
 */

import { describe, test, expect } from 'bun:test';
import { formatResponse, formatResponseArray, truncateAtWordBoundary, limitKeywords } from './response-formatter.js';
import type { Standard } from '../types/ngss.js';

// Sample standard for testing
const sampleStandard: Standard = {
  code: 'MS-PS1-1',
  grade_level: 'MS',
  domain: 'Physical Science',
  topic: 'Structure and Properties of Matter',
  performance_expectation: 'Develop models to describe the atomic composition of simple molecules and extended structures. Emphasis is on developing models of molecules that vary in complexity. Examples of simple molecules could include ammonia, methanol, or water. Examples of extended structures could include sodium chloride or diamonds. Examples of molecular-level models could include drawings, 3D ball and stick structures, or computer representations showing different molecules with different types of atoms.',
  sep: {
    code: 'SEP-2',
    name: 'Developing and Using Models',
    description: 'Modeling in 6-8 builds on K-5 experiences and progresses to developing, using, and revising models to describe, test, and predict more abstract phenomena and design systems.'
  },
  dci: {
    code: 'PS1.A',
    name: 'Structure and Properties of Matter',
    description: 'Substances are made from different types of atoms, which combine with one another in various ways. Atoms form molecules that range in size from two to thousands of atoms.'
  },
  ccc: {
    code: 'CCC-7',
    name: 'Scale, Proportion, and Quantity',
    description: 'Time, space, and energy phenomena can be observed at various scales using models to study systems that are too large or too small.'
  },
  driving_questions: [
    'How do atoms combine to form molecules?',
    'What determines the structure of molecules?',
    'How can we model molecular structures?'
  ],
  keywords: ['atoms', 'molecules', 'molecular structure', 'chemical composition', 'models', 'atomic composition', 'simple molecules', 'extended structures'],
  lesson_scope: {
    key_concepts: [
      'Atoms are basic building blocks of matter',
      'Molecules are formed when atoms combine',
      'Models help visualize molecular structures'
    ],
    prerequisite_knowledge: [
      'Basic understanding of atoms',
      'Concept of elements and compounds'
    ],
    common_misconceptions: [
      'Atoms can be seen with the naked eye',
      'All molecules are the same size'
    ],
    depth_boundaries: {
      include: [
        'Simple molecular models',
        'Atomic composition of molecules'
      ],
      exclude: [
        'Quantum mechanics',
        'Advanced bonding theories'
      ]
    }
  }
};

describe('truncateAtWordBoundary', () => {
  test('should not truncate text shorter than maxChars', () => {
    const text = 'Short text';
    const result = truncateAtWordBoundary(text, 100);
    expect(result).toBe('Short text');
  });

  test('should truncate at word boundary and add ellipsis', () => {
    const text = 'This is a longer text that needs to be truncated';
    const result = truncateAtWordBoundary(text, 20);
    expect(result).toContain('...');
    expect(result.length).toBeLessThanOrEqual(23); // 20 + '...'
    expect(result.endsWith('...')).toBe(true);
  });

  test('should truncate at maxChars if no space found', () => {
    const text = 'Superlongwordwithoutanyspaces';
    const result = truncateAtWordBoundary(text, 10);
    expect(result).toBe('Superlongw...');
  });

  test('should handle exact length match', () => {
    const text = 'Exact';
    const result = truncateAtWordBoundary(text, 5);
    expect(result).toBe('Exact');
  });
});

describe('limitKeywords', () => {
  test('should limit keywords to specified count', () => {
    const keywords = ['one', 'two', 'three', 'four', 'five'];
    const result = limitKeywords(keywords, 3);
    expect(result).toEqual(['one', 'two', 'three']);
    expect(result.length).toBe(3);
  });

  test('should return all keywords if limit is greater than array length', () => {
    const keywords = ['one', 'two'];
    const result = limitKeywords(keywords, 5);
    expect(result).toEqual(['one', 'two']);
    expect(result.length).toBe(2);
  });

  test('should handle empty array', () => {
    const keywords: string[] = [];
    const result = limitKeywords(keywords, 3);
    expect(result).toEqual([]);
  });
});

describe('formatResponse', () => {
  test('should return full standard when detail_level is "full"', () => {
    const result = formatResponse(sampleStandard, 'full');
    expect(result).toEqual(sampleStandard);
    expect(result).toHaveProperty('sep');
    expect(result).toHaveProperty('dci');
    expect(result).toHaveProperty('ccc');
    expect(result).toHaveProperty('lesson_scope');
  });

  test('should return full standard when no detail_level specified (default)', () => {
    const result = formatResponse(sampleStandard);
    expect(result).toEqual(sampleStandard);
  });

  test('should return minimal standard when detail_level is "minimal"', () => {
    const result = formatResponse(sampleStandard, 'minimal');

    expect(result).toHaveProperty('code', 'MS-PS1-1');
    expect(result).toHaveProperty('topic', 'Structure and Properties of Matter');
    expect(result).toHaveProperty('performance_expectation');

    // Should not have other fields
    expect(result).not.toHaveProperty('sep');
    expect(result).not.toHaveProperty('dci');
    expect(result).not.toHaveProperty('keywords');

    // PE should be truncated to ~50 chars
    const pe = (result as any).performance_expectation;
    expect(pe.length).toBeLessThanOrEqual(53); // 50 + '...'
    expect(pe).toContain('...');
  });

  test('should return summary standard when detail_level is "summary"', () => {
    const result = formatResponse(sampleStandard, 'summary');

    expect(result).toHaveProperty('code', 'MS-PS1-1');
    expect(result).toHaveProperty('topic', 'Structure and Properties of Matter');
    expect(result).toHaveProperty('performance_expectation');
    expect(result).toHaveProperty('keywords');

    // Should not have full standard fields
    expect(result).not.toHaveProperty('sep');
    expect(result).not.toHaveProperty('dci');
    expect(result).not.toHaveProperty('lesson_scope');

    // PE should be truncated to ~150 chars
    const pe = (result as any).performance_expectation;
    expect(pe.length).toBeLessThanOrEqual(153); // 150 + '...'

    // Keywords should be limited to 3
    const keywords = (result as any).keywords;
    expect(keywords).toBeArray();
    expect(keywords.length).toBeLessThanOrEqual(3);
  });

  test('minimal mode should truncate PE to approximately 50 chars', () => {
    const result = formatResponse(sampleStandard, 'minimal');
    const pe = (result as any).performance_expectation;

    // Should be around 50 chars (plus ellipsis)
    expect(pe.length).toBeLessThanOrEqual(53);
    expect(pe).toContain('...');
  });

  test('summary mode should truncate PE to approximately 138 chars', () => {
    const result = formatResponse(sampleStandard, 'summary');
    const pe = (result as any).performance_expectation;

    // Should be around 138 chars (plus ellipsis if truncated)
    expect(pe.length).toBeLessThanOrEqual(141);
  });

  test('summary mode should limit keywords to top 3', () => {
    const result = formatResponse(sampleStandard, 'summary');
    const keywords = (result as any).keywords;

    expect(keywords).toBeArray();
    expect(keywords.length).toBe(3);
    expect(keywords).toEqual(['atoms', 'molecules', 'molecular structure']);
  });
});

describe('formatResponseArray', () => {
  const standards = [sampleStandard, { ...sampleStandard, code: 'MS-PS1-2' }];

  test('should format array of standards in minimal mode', () => {
    const results = formatResponseArray(standards, 'minimal');

    expect(results).toBeArray();
    expect(results.length).toBe(2);

    results.forEach(result => {
      expect(result).toHaveProperty('code');
      expect(result).toHaveProperty('topic');
      expect(result).toHaveProperty('performance_expectation');
      expect(result).not.toHaveProperty('sep');
    });
  });

  test('should format array of standards in summary mode', () => {
    const results = formatResponseArray(standards, 'summary');

    expect(results).toBeArray();
    expect(results.length).toBe(2);

    results.forEach(result => {
      expect(result).toHaveProperty('code');
      expect(result).toHaveProperty('topic');
      expect(result).toHaveProperty('performance_expectation');
      expect(result).toHaveProperty('keywords');
      expect(result).not.toHaveProperty('sep');
    });
  });

  test('should format array of standards in full mode', () => {
    const results = formatResponseArray(standards, 'full');

    expect(results).toBeArray();
    expect(results.length).toBe(2);

    results.forEach(result => {
      expect(result).toHaveProperty('sep');
      expect(result).toHaveProperty('dci');
      expect(result).toHaveProperty('ccc');
    });
  });
});
