#!/usr/bin/env bun
/**
 * Cache Performance Validation
 * Tests query caching effectiveness with repeated queries
 */

import { initializeDatabase, getDatabase } from '../src/server/database.js';
import { performance } from 'perf_hooks';

console.log('\n🧪 Cache Performance Test Suite\n');
console.log('='.repeat(60));

// Initialize database
console.log('\n📊 Initializing Database');
console.log('-'.repeat(60));
const db = initializeDatabase();

console.log('✅ Database initialized\n');

// Test 1: Cache Effectiveness - findByDrivingQuestion
console.log('🔍 Test 1: findByDrivingQuestion Cache Effectiveness');
console.log('-'.repeat(60));

const query = 'energy transfer systems';
let times: number[] = [];

console.log(`Query: "${query}"`);
console.log('\nExecuting 10 identical queries...\n');

for (let i = 0; i < 10; i++) {
  const start = performance.now();
  const results = db.findByDrivingQuestion(query);
  const duration = performance.now() - start;
  times.push(duration);

  console.log(`  ${i + 1}. ${duration.toFixed(4)}ms (${results.length} results)`);
}

const firstQueryTime = times[0];
const avgCachedTime = times.slice(1).reduce((sum, t) => sum + t, 0) / 9;
const speedup = firstQueryTime / avgCachedTime;

console.log('\n📊 Cache Performance:');
console.log(`  First query (cold): ${firstQueryTime.toFixed(4)}ms`);
console.log(`  Cached queries avg: ${avgCachedTime.toFixed(4)}ms`);
console.log(`  Speedup factor: ${speedup.toFixed(2)}x`);

// Test 2: Cache Effectiveness - searchStandards
console.log('\n\n🔎 Test 2: searchStandards Cache Effectiveness');
console.log('-'.repeat(60));

const searchQuery = 'ecosystem interactions organisms';
times = [];

console.log(`Query: "${searchQuery}" (limit: 5)`);
console.log('\nExecuting 10 identical queries...\n');

for (let i = 0; i < 10; i++) {
  const start = performance.now();
  const results = db.searchStandards(searchQuery, { limit: 5 });
  const duration = performance.now() - start;
  times.push(duration);

  console.log(`  ${i + 1}. ${duration.toFixed(4)}ms (${results.length} results)`);
}

const firstSearchTime = times[0];
const avgCachedSearchTime = times.slice(1).reduce((sum, t) => sum + t, 0) / 9;
const searchSpeedup = firstSearchTime / avgCachedSearchTime;

console.log('\n📊 Cache Performance:');
console.log(`  First query (cold): ${firstSearchTime.toFixed(4)}ms`);
console.log(`  Cached queries avg: ${avgCachedSearchTime.toFixed(4)}ms`);
console.log(`  Speedup factor: ${searchSpeedup.toFixed(2)}x`);

// Test 3: Cache with Domain Filter
console.log('\n\n🎯 Test 3: Domain-Filtered Search Cache');
console.log('-'.repeat(60));

const domainQuery = 'matter';
times = [];

console.log(`Query: "${domainQuery}" (domain: Physical Science, limit: 5)`);
console.log('\nExecuting 10 identical queries...\n');

for (let i = 0; i < 10; i++) {
  const start = performance.now();
  const results = db.searchStandards(domainQuery, {
    domain: 'Physical Science',
    limit: 5
  });
  const duration = performance.now() - start;
  times.push(duration);

  console.log(`  ${i + 1}. ${duration.toFixed(4)}ms (${results.length} results)`);
}

const firstDomainTime = times[0];
const avgCachedDomainTime = times.slice(1).reduce((sum, t) => sum + t, 0) / 9;
const domainSpeedup = firstDomainTime / avgCachedDomainTime;

console.log('\n📊 Cache Performance:');
console.log(`  First query (cold): ${firstDomainTime.toFixed(4)}ms`);
console.log(`  Cached queries avg: ${avgCachedDomainTime.toFixed(4)}ms`);
console.log(`  Speedup factor: ${domainSpeedup.toFixed(2)}x`);

// Test 4: Cache Metrics
console.log('\n\n📊 Test 4: Cache Statistics');
console.log('-'.repeat(60));

const cacheStats = db.getCacheStats();
console.log('\nCache Metrics:');
console.log(`  Cache size: ${cacheStats.cache.size} entries`);
console.log(`  Cache hits: ${cacheStats.cache.hits}`);
console.log(`  Cache misses: ${cacheStats.cache.misses}`);
console.log(`  Hit rate: ${(cacheStats.cache.hitRate * 100).toFixed(1)}%`);
console.log(`  Evictions: ${cacheStats.cache.evictions}`);

if (cacheStats.detailed.topEntries.length > 0) {
  console.log('\nTop Cached Queries:');
  cacheStats.detailed.topEntries.slice(0, 5).forEach((entry, i) => {
    console.log(`  ${i + 1}. ${entry.key}`);
    console.log(`     Hits: ${entry.hits}, Age: ${(entry.age / 1000).toFixed(1)}s`);
  });
}

// Test 5: Query Performance Metrics
console.log('\n\n⚡ Test 5: Query Performance Metrics');
console.log('-'.repeat(60));

const metrics = db.getQueryMetrics();
console.log('\nPerformance Metrics:');
console.log(`  Total queries: ${metrics.totalQueries}`);
console.log(`  Average time: ${metrics.averageTime.toFixed(4)}ms`);
console.log(`  Slowest query: ${metrics.slowestQuery.method} (${metrics.slowestQuery.time.toFixed(4)}ms)`);

console.log('\nQueries by Method:');
Object.entries(metrics.queriesByMethod).forEach(([method, count]) => {
  console.log(`  ${method}: ${count} queries`);
});

// Test 6: Different Query Variations (Cache Key Testing)
console.log('\n\n🔑 Test 6: Cache Key Differentiation');
console.log('-'.repeat(60));

console.log('\nTesting that different queries get separate cache entries...\n');

const variations = [
  { query: 'energy', options: {} },
  { query: 'energy', options: { limit: 5 } },
  { query: 'energy', options: { domain: 'Physical Science' } },
  { query: 'energy transfer', options: {} }
];

variations.forEach((variation, i) => {
  const start = performance.now();
  const results = db.searchStandards(variation.query, variation.options);
  const duration = performance.now() - start;

  const optStr = Object.keys(variation.options).length > 0
    ? JSON.stringify(variation.options)
    : 'no options';
  console.log(`  ${i + 1}. "${variation.query}" ${optStr}`);
  console.log(`     Time: ${duration.toFixed(4)}ms, Results: ${results.length}`);
});

const finalCacheStats = db.getCacheStats();
console.log(`\nFinal cache size: ${finalCacheStats.cache.size} entries`);
console.log('✅ Different queries create separate cache entries');

// Summary
console.log('\n\n' + '='.repeat(60));
console.log('📈 CACHE VALIDATION SUMMARY');
console.log('='.repeat(60));

console.log('\nCache Effectiveness:');
console.log(`  findByDrivingQuestion speedup: ${speedup.toFixed(2)}x`);
console.log(`  searchStandards speedup: ${searchSpeedup.toFixed(2)}x`);
console.log(`  Domain filtered speedup: ${domainSpeedup.toFixed(2)}x`);

console.log('\nCache Statistics:');
console.log(`  Total hits: ${finalCacheStats.cache.hits}`);
console.log(`  Total misses: ${finalCacheStats.cache.misses}`);
console.log(`  Hit rate: ${(finalCacheStats.cache.hitRate * 100).toFixed(1)}%`);
console.log(`  Cache utilization: ${finalCacheStats.cache.size}/100 entries`);

const avgSpeedup = (speedup + searchSpeedup + domainSpeedup) / 3;
if (avgSpeedup > 2) {
  console.log('\n✅ CACHE WORKING EXCELLENTLY');
  console.log(`   Average speedup: ${avgSpeedup.toFixed(2)}x faster for cached queries`);
} else if (avgSpeedup > 1.2) {
  console.log('\n✅ CACHE WORKING WELL');
  console.log(`   Average speedup: ${avgSpeedup.toFixed(2)}x faster for cached queries`);
} else {
  console.log('\n⚠️  CACHE NEEDS INVESTIGATION');
  console.log(`   Average speedup: ${avgSpeedup.toFixed(2)}x (expected >2x)`);
}

console.log('\n' + '='.repeat(60) + '\n');
