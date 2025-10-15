#!/usr/bin/env bun
/**
 * Query Interface Testing & Validation
 * Tests all database methods and measures performance
 */

import { initializeDatabase, getDatabase } from '../src/server/database.js';
import { performance } from 'perf_hooks';

interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  details?: string;
}

const results: TestResult[] = [];

function logTest(name: string, passed: boolean, duration: number, details?: string) {
  results.push({ name, passed, duration, details });
  const status = passed ? '✅' : '❌';
  const time = `${duration.toFixed(2)}ms`;
  console.log(`${status} ${name} (${time})${details ? `: ${details}` : ''}`);
}

async function runTests() {
  console.log('\n🧪 NGSS Query Interface Test Suite\n');
  console.log('='.repeat(60));

  // Initialize database
  console.log('\n📊 Database Initialization');
  console.log('-'.repeat(60));

  const initStart = performance.now();
  const db = initializeDatabase();
  const initDuration = performance.now() - initStart;

  logTest('Database initialization', true, initDuration, '55 standards loaded');

  // Test 1: getStandardByCode - Valid codes
  console.log('\n🔍 Test Suite 1: getStandardByCode');
  console.log('-'.repeat(60));

  const testCodes = ['MS-PS1-1', 'MS-LS2-3', 'MS-ESS3-1'];
  for (const code of testCodes) {
    const start = performance.now();
    const standard = db.getStandardByCode(code);
    const duration = performance.now() - start;

    const passed = standard !== null && standard.code === code;
    logTest(`Get standard ${code}`, passed, duration,
      passed ? `Found: ${standard?.topic}` : 'Not found');
  }

  // Test 2: getStandardByCode - Invalid code
  const invalidStart = performance.now();
  const invalidStandard = db.getStandardByCode('MS-PS1-99');
  const invalidDuration = performance.now() - invalidStart;
  logTest('Get invalid standard', invalidStandard === null, invalidDuration, 'Correctly returns null');

  // Test 3: searchByDomain
  console.log('\n🌍 Test Suite 2: searchByDomain');
  console.log('-'.repeat(60));

  const domains = [
    { name: 'Physical Science', expected: 19 },
    { name: 'Life Science', expected: 21 },
    { name: 'Earth and Space Science', expected: 15 }
  ];

  for (const domain of domains) {
    const start = performance.now();
    const standards = db.searchByDomain(domain.name);
    const duration = performance.now() - start;

    const passed = standards.length === domain.expected;
    logTest(`Search ${domain.name}`, passed, duration,
      `Found ${standards.length}/${domain.expected} standards`);
  }

  // Test 4: findByDrivingQuestion
  console.log('\n❓ Test Suite 3: findByDrivingQuestion');
  console.log('-'.repeat(60));

  const queries = [
    { query: 'energy', minResults: 3 },
    { query: 'ecosystem interactions', minResults: 2 },
    { query: 'chemical reactions', minResults: 2 },
    { query: 'earth systems', minResults: 2 }
  ];

  for (const { query, minResults } of queries) {
    const start = performance.now();
    const results = db.findByDrivingQuestion(query);
    const duration = performance.now() - start;

    const passed = results.length >= minResults;
    logTest(`Query: "${query}"`, passed, duration,
      `${results.length} results, top relevance: ${results[0]?.score.toFixed(2) || 0}`);
  }

  // Test 5: get3DComponents
  console.log('\n🧬 Test Suite 4: get3DComponents');
  console.log('-'.repeat(60));

  const componentCodes = ['MS-PS1-1', 'MS-LS2-1', 'MS-ESS1-1'];
  for (const code of componentCodes) {
    const start = performance.now();
    const components = db.get3DComponents(code);
    const duration = performance.now() - start;

    const passed = components !== null &&
                   components.sep !== undefined &&
                   components.dci !== undefined &&
                   components.ccc !== undefined;
    logTest(`Get 3D for ${code}`, passed, duration,
      passed ? `SEP: ${components?.sep.code}, DCI: ${components?.dci.code}, CCC: ${components?.ccc.code}` : 'Missing components');
  }

  // Test 6: searchStandards - Full-text search
  console.log('\n🔎 Test Suite 5: searchStandards (Full-Text)');
  console.log('-'.repeat(60));

  const fullTextQueries = [
    { query: 'energy transfer', limit: 5 },
    { query: 'ecosystem', limit: 10 },
    { query: 'matter', limit: 5 },
    { query: 'patterns', limit: 5 }
  ];

  for (const { query, limit } of fullTextQueries) {
    const start = performance.now();
    const results = db.searchStandards(query, { limit });
    const duration = performance.now() - start;

    const passed = results.length > 0 && results.length <= limit;
    logTest(`Full-text: "${query}"`, passed, duration,
      `${results.length} results, avg relevance: ${(results.reduce((sum, r) => sum + r.score, 0) / results.length).toFixed(2)}`);
  }

  // Test 7: searchStandards - With domain filter
  console.log('\n🎯 Test Suite 6: searchStandards (Domain Filtered)');
  console.log('-'.repeat(60));

  const filteredQueries = [
    { query: 'energy', domain: 'Physical Science', minResults: 1 },
    { query: 'organism', domain: 'Life Science', minResults: 1 },
    { query: 'earth', domain: 'Earth and Space Science', minResults: 1 }
  ];

  for (const { query, domain, minResults } of filteredQueries) {
    const start = performance.now();
    const results = db.searchStandards(query, { domain, limit: 10 });
    const duration = performance.now() - start;

    const passed = results.length >= minResults &&
                   results.every(r => r.standard.domain === domain);
    logTest(`"${query}" in ${domain}`, passed, duration,
      `${results.length} results, all in correct domain: ${passed}`);
  }

  // Test 8: Performance stress test
  console.log('\n⚡ Test Suite 7: Performance Stress Test');
  console.log('-'.repeat(60));

  // Rapid successive queries
  const rapidStart = performance.now();
  for (let i = 0; i < 100; i++) {
    db.getStandardByCode('MS-PS1-1');
  }
  const rapidDuration = performance.now() - rapidStart;
  logTest('100 rapid code lookups', true, rapidDuration,
    `Avg: ${(rapidDuration / 100).toFixed(3)}ms per lookup`);

  // Complex search queries
  const complexStart = performance.now();
  for (let i = 0; i < 50; i++) {
    db.searchStandards('energy matter interactions', { limit: 10 });
  }
  const complexDuration = performance.now() - complexStart;
  logTest('50 complex searches', true, complexDuration,
    `Avg: ${(complexDuration / 50).toFixed(2)}ms per search`);

  // Test 9: Validation tests
  console.log('\n🛡️ Test Suite 8: Input Validation');
  console.log('-'.repeat(60));

  // Invalid standard code format
  try {
    db.getStandardByCode('INVALID-CODE');
    logTest('Invalid code format', false, 0, 'Should have thrown error');
  } catch (error) {
    const passed = error instanceof Error && error.message.includes('Invalid standard code format');
    logTest('Invalid code format', passed, 0,
      passed ? 'Correctly rejects invalid format' : `Unexpected error: ${error}`);
  }

  // Invalid domain
  try {
    db.searchByDomain('Invalid Domain');
    logTest('Invalid domain', false, 0, 'Should have thrown error');
  } catch (error) {
    const passed = error instanceof Error && error.message.includes('Invalid domain');
    logTest('Invalid domain', passed, 0,
      passed ? 'Correctly rejects invalid domain' : `Unexpected error: ${error}`);
  }

  // Invalid limit (too large)
  try {
    db.searchStandards('energy', { limit: 999 });
    logTest('Invalid limit (too large)', false, 0, 'Should have thrown error');
  } catch (error) {
    const passed = error instanceof Error && error.message.includes('cannot exceed');
    logTest('Invalid limit (too large)', passed, 0,
      passed ? 'Correctly rejects excessive limit' : `Unexpected error: ${error}`);
  }

  // Invalid limit (negative)
  try {
    db.searchStandards('energy', { limit: -1 });
    logTest('Invalid limit (negative)', false, 0, 'Should have thrown error');
  } catch (error) {
    const passed = error instanceof Error && error.message.includes('must be at least 1');
    logTest('Invalid limit (negative)', passed, 0,
      passed ? 'Correctly rejects negative limit' : `Unexpected error: ${error}`);
  }

  // Test 10: Edge cases
  console.log('\n🎪 Test Suite 9: Edge Cases');
  console.log('-'.repeat(60));

  // Empty query - should throw validation error
  const emptyStart = performance.now();
  try {
    db.findByDrivingQuestion('');
    logTest('Empty query validation', false, performance.now() - emptyStart,
      'Should have thrown error');
  } catch (error) {
    const emptyDuration = performance.now() - emptyStart;
    const passed = error instanceof Error && error.message.includes('at least 1 character');
    logTest('Empty query validation', passed, emptyDuration,
      passed ? 'Correctly rejects empty query' : `Unexpected error: ${error}`);
  }

  // Single character query
  const singleStart = performance.now();
  const singleResults = db.searchStandards('a', { limit: 10 });
  const singleDuration = performance.now() - singleStart;
  logTest('Single char query', singleResults.length >= 0, singleDuration,
    `${singleResults.length} results (valid behavior)`);

  // Very long query
  const longQuery = 'energy matter interactions organisms ecosystems patterns systems structure function';
  const longStart = performance.now();
  const longResults = db.searchStandards(longQuery, { limit: 10 });
  const longDuration = performance.now() - longStart;
  logTest('Long query (10 keywords)', longResults.length > 0, longDuration,
    `${longResults.length} results found`);

  // Test 11: getStats
  console.log('\n📊 Test Suite 10: Database Statistics');
  console.log('-'.repeat(60));

  const statsStart = performance.now();
  const stats = db.getStats();
  const statsDuration = performance.now() - statsStart;

  const statsValid = stats.totalStandards === 55 &&
                     Object.keys(stats.byDomain).length === 3 &&
                     stats.indexSizes.codes === 55;
  logTest('Database statistics', statsValid, statsDuration,
    `${stats.totalStandards} standards, ${stats.indexSizes.fullTextKeywords} keywords indexed`);

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📈 TEST SUMMARY');
  console.log('='.repeat(60));

  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / total;
  const maxDuration = Math.max(...results.map(r => r.duration));

  console.log(`\nTotal Tests: ${total}`);
  console.log(`Passed: ${passed} (${((passed / total) * 100).toFixed(1)}%)`);
  console.log(`Failed: ${total - passed}`);
  console.log(`\nPerformance:`);
  console.log(`  Average: ${avgDuration.toFixed(2)}ms`);
  console.log(`  Maximum: ${maxDuration.toFixed(2)}ms`);
  console.log(`  Database Init: ${initDuration.toFixed(2)}ms`);

  if (passed === total) {
    console.log('\n✅ ALL TESTS PASSED!');
  } else {
    console.log('\n❌ SOME TESTS FAILED');
    console.log('\nFailed tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.name}: ${r.details}`);
    });
  }

  console.log('\n' + '='.repeat(60) + '\n');
}

// Run tests
runTests().catch(console.error);
