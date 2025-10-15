#!/usr/bin/env bun
/**
 * Fuzzy Matching Validation Test Suite
 * Tests Levenshtein distance-based driving question matching with 20 student variants
 * Target: 95% accuracy (19/20 correct matches)
 */

import { initializeDatabase } from '../src/server/database.js';
import { performance } from 'perf_hooks';

interface TestCase {
  id: number;
  studentQuery: string;
  expectedCode: string;
  expectedQuestion: string;
  category: 'exact' | 'typo' | 'word_order' | 'partial' | 'case' | 'spacing';
  minConfidence: number;
}

// 20-variant test set covering all fuzzy matching scenarios
// Based on ACTUAL driving questions from the database
const testCases: TestCase[] = [
  // Exact matches (4 tests)
  {
    id: 1,
    studentQuery: 'What do we know about structure and properties of matter?',
    expectedCode: 'MS-PS1-1',
    expectedQuestion: 'What do we know about structure and properties of matter?',
    category: 'exact',
    minConfidence: 1.0
  },
  {
    id: 2,
    studentQuery: 'What do we know about chemical reactions?',
    expectedCode: 'MS-PS1-2',
    expectedQuestion: 'What do we know about chemical reactions?',
    category: 'exact',
    minConfidence: 1.0
  },
  {
    id: 3,
    studentQuery: 'What do we know about forces and interactions?',
    expectedCode: 'MS-PS2-1',
    expectedQuestion: 'What do we know about forces and interactions?',
    category: 'exact',
    minConfidence: 1.0
  },
  {
    id: 4,
    studentQuery: 'What do we know about energy?',
    expectedCode: 'MS-PS3-1',
    expectedQuestion: 'What do we know about energy?',
    category: 'exact',
    minConfidence: 1.0
  },

  // Typos (5 tests)
  {
    id: 5,
    studentQuery: 'What do we knw about structur and propertys of mater?',
    expectedCode: 'MS-PS1-1',
    expectedQuestion: 'What do we know about structure and properties of matter?',
    category: 'typo',
    minConfidence: 0.80
  },
  {
    id: 6,
    studentQuery: 'What do we kno about chemcal reacions?',
    expectedCode: 'MS-PS1-2',
    expectedQuestion: 'What do we know about chemical reactions?',
    category: 'typo',
    minConfidence: 0.85
  },
  {
    id: 7,
    studentQuery: 'What do we knw about forses and interactons?',
    expectedCode: 'MS-PS2-1',
    expectedQuestion: 'What do we know about forces and interactions?',
    category: 'typo',
    minConfidence: 0.85
  },
  {
    id: 8,
    studentQuery: 'What do we konw about enrgy?',
    expectedCode: 'MS-PS3-1',
    expectedQuestion: 'What do we know about energy?',
    category: 'typo',
    minConfidence: 0.85
  },
  {
    id: 9,
    studentQuery: 'Wat do we no about mater and enegy in organisims and ecosytems?',
    expectedCode: 'MS-LS1-6',
    expectedQuestion: 'What do we know about matter and energy in organisms and ecosystems?',
    category: 'typo',
    minConfidence: 0.75
  },

  // Word order variations (4 tests)
  {
    id: 10,
    studentQuery: 'structure and properties of matter what do we know about?',
    expectedCode: 'MS-PS1-1',
    expectedQuestion: 'What do we know about structure and properties of matter?',
    category: 'word_order',
    minConfidence: 0.75
  },
  {
    id: 11,
    studentQuery: 'chemical reactions what do we know about?',
    expectedCode: 'MS-PS1-2',
    expectedQuestion: 'What do we know about chemical reactions?',
    category: 'word_order',
    minConfidence: 0.75
  },
  {
    id: 12,
    studentQuery: 'forces and interactions what do we know?',
    expectedCode: 'MS-PS2-1',
    expectedQuestion: 'What do we know about forces and interactions?',
    category: 'word_order',
    minConfidence: 0.70
  },
  {
    id: 13,
    studentQuery: 'energy what do we know about?',
    expectedCode: 'MS-PS3-1',
    expectedQuestion: 'What do we know about energy?',
    category: 'word_order',
    minConfidence: 0.75
  },

  // Partial matches (4 tests)
  {
    id: 14,
    studentQuery: 'structure properties matter',
    expectedCode: 'MS-PS1-1',
    expectedQuestion: 'What do we know about structure and properties of matter?',
    category: 'partial',
    minConfidence: 0.70
  },
  {
    id: 15,
    studentQuery: 'chemical reactions',
    expectedCode: 'MS-PS1-2',
    expectedQuestion: 'What do we know about chemical reactions?',
    category: 'partial',
    minConfidence: 0.70
  },
  {
    id: 16,
    studentQuery: 'forces interactions',
    expectedCode: 'MS-PS2-1',
    expectedQuestion: 'What do we know about forces and interactions?',
    category: 'partial',
    minConfidence: 0.70
  },
  {
    id: 17,
    studentQuery: 'matter energy organisms',
    expectedCode: 'MS-LS1-6',
    expectedQuestion: 'What do we know about matter and energy in organisms and ecosystems?',
    category: 'partial',
    minConfidence: 0.70
  },

  // Case and spacing variations (3 tests)
  {
    id: 18,
    studentQuery: 'WHAT DO WE KNOW ABOUT ENERGY?',
    expectedCode: 'MS-PS3-1',
    expectedQuestion: 'What do we know about energy?',
    category: 'case',
    minConfidence: 1.0
  },
  {
    id: 19,
    studentQuery: 'what   do   we    know    about    energy?',
    expectedCode: 'MS-PS3-1',
    expectedQuestion: 'What do we know about energy?',
    category: 'spacing',
    minConfidence: 0.95
  },
  {
    id: 20,
    studentQuery: 'WhatDoWeKnowAboutEnergy?',
    expectedCode: 'MS-PS3-1',
    expectedQuestion: 'What do we know about energy?',
    category: 'spacing',
    minConfidence: 0.90
  }
];

interface TestResult {
  id: number;
  passed: boolean;
  studentQuery: string;
  expectedCode: string;
  actualCode: string | null;
  expectedQuestion: string;
  matchedQuestion: string | null;
  confidence: number;
  minConfidence: number;
  category: string;
  duration: number;
  reason?: string;
}

async function runTests() {
  console.log('\n🧪 Fuzzy Matching Validation Test Suite\n');
  console.log('='.repeat(80));
  console.log('Target: 95% accuracy (19/20 correct matches with confidence >= threshold)\n');

  // Initialize database
  const initStart = performance.now();
  const db = initializeDatabase();
  const initDuration = performance.now() - initStart;
  console.log(`✅ Database initialized in ${initDuration.toFixed(2)}ms\n`);

  const results: TestResult[] = [];
  const categoryCounts: Record<string, { total: number; passed: number }> = {};

  console.log('Running 20 test cases...\n');

  for (const testCase of testCases) {
    const start = performance.now();
    const matches = db.findByDrivingQuestion(testCase.studentQuery);
    const duration = performance.now() - start;

    const topMatch = matches.length > 0 ? matches[0] : null;
    const actualCode = topMatch?.standard.code || null;
    const matchedQuestion = topMatch?.matched_question || null;
    const confidence = topMatch?.score || 0;

    // Test passes if:
    // 1. Correct standard code matched
    // 2. Confidence >= minimum threshold
    const codeMatches = actualCode === testCase.expectedCode;
    const confidenceMet = confidence >= testCase.minConfidence;
    const passed = codeMatches && confidenceMet;

    let reason: string | undefined;
    if (!codeMatches) {
      reason = `Expected ${testCase.expectedCode}, got ${actualCode}`;
    } else if (!confidenceMet) {
      reason = `Confidence ${confidence.toFixed(3)} < ${testCase.minConfidence}`;
    }

    results.push({
      id: testCase.id,
      passed,
      studentQuery: testCase.studentQuery,
      expectedCode: testCase.expectedCode,
      actualCode,
      expectedQuestion: testCase.expectedQuestion,
      matchedQuestion,
      confidence,
      minConfidence: testCase.minConfidence,
      category: testCase.category,
      duration,
      reason
    });

    // Update category counts
    if (!categoryCounts[testCase.category]) {
      categoryCounts[testCase.category] = { total: 0, passed: 0 };
    }
    categoryCounts[testCase.category].total++;
    if (passed) {
      categoryCounts[testCase.category].passed++;
    }

    // Log result
    const status = passed ? '✅' : '❌';
    const confidenceStr = confidence > 0 ? confidence.toFixed(3) : 'N/A';
    console.log(`${status} Test ${testCase.id} [${testCase.category}]: ${confidenceStr} confidence (${duration.toFixed(2)}ms)`);
    if (!passed) {
      console.log(`   Query: "${testCase.studentQuery}"`);
      console.log(`   Reason: ${reason}`);
    }
  }

  // Calculate statistics
  const totalTests = results.length;
  const passedTests = results.filter(r => r.passed).length;
  const accuracy = (passedTests / totalTests) * 100;
  const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / totalTests;
  const avgConfidence = results
    .filter(r => r.confidence > 0)
    .reduce((sum, r) => sum + r.confidence, 0) / results.filter(r => r.confidence > 0).length;

  // Print summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 TEST RESULTS SUMMARY\n');
  console.log('='.repeat(80));
  console.log(`\nOverall Performance:`);
  console.log(`  Total Tests: ${totalTests}`);
  console.log(`  Passed: ${passedTests} (${accuracy.toFixed(1)}%)`);
  console.log(`  Failed: ${totalTests - passedTests}`);
  console.log(`  Accuracy Target: 95.0% (19/20)`);
  console.log(`  Status: ${accuracy >= 95 ? '✅ PASSED' : '❌ FAILED'}`);

  console.log(`\nPerformance Metrics:`);
  console.log(`  Average Query Time: ${avgDuration.toFixed(2)}ms`);
  console.log(`  Average Confidence: ${avgConfidence.toFixed(3)}`);

  console.log(`\nResults by Category:`);
  for (const [category, stats] of Object.entries(categoryCounts)) {
    const categoryAccuracy = (stats.passed / stats.total) * 100;
    const status = categoryAccuracy === 100 ? '✅' : categoryAccuracy >= 75 ? '⚠️' : '❌';
    console.log(`  ${status} ${category}: ${stats.passed}/${stats.total} (${categoryAccuracy.toFixed(1)}%)`);
  }

  // Print failed tests details
  const failedTests = results.filter(r => !r.passed);
  if (failedTests.length > 0) {
    console.log(`\n❌ Failed Test Details:\n`);
    for (const test of failedTests) {
      console.log(`Test ${test.id} [${test.category}]:`);
      console.log(`  Query: "${test.studentQuery}"`);
      console.log(`  Expected: ${test.expectedCode} - "${test.expectedQuestion}"`);
      console.log(`  Got: ${test.actualCode || 'NO MATCH'} - "${test.matchedQuestion || 'N/A'}"`);
      console.log(`  Confidence: ${test.confidence.toFixed(3)} (min: ${test.minConfidence})`);
      console.log(`  Reason: ${test.reason}\n`);
    }
  }

  console.log('='.repeat(80) + '\n');

  // Return exit code based on success
  process.exit(accuracy >= 95 ? 0 : 1);
}

// Run tests
runTests().catch(console.error);
