#!/usr/bin/env bun
/**
 * Token Reduction Benchmark Script
 * Validates that summary mode achieves 85-90% token reduction vs full mode
 */

import { initializeDatabase, getDatabase } from '../src/server/database.js';
import { formatResponse, formatResponseArray } from '../src/server/response-formatter.js';
import { estimateTokensForObject } from '../src/server/token-counter.js';
import type { DetailLevel } from '../src/types/ngss.js';

interface BenchmarkResult {
  mode: DetailLevel;
  totalTokens: number;
  avgTokensPerStandard: number;
  sampleSize: number;
}

interface ReductionMetrics {
  minimal: {
    tokens: number;
    reductionVsFull: number;
    reductionPercentage: string;
  };
  summary: {
    tokens: number;
    reductionVsFull: number;
    reductionPercentage: string;
  };
  full: {
    tokens: number;
  };
  metTarget: boolean;
  targetRange: string;
}

function runBenchmark(sampleSize: number = 10): ReductionMetrics {
  console.log('🚀 Starting Token Reduction Benchmark\n');
  console.log(`Sample Size: ${sampleSize} standards\n`);

  // Initialize database
  initializeDatabase();
  const db = getDatabase();

  // Get sample standards from different domains
  const physicalScience = db.searchByDomain('Physical Science').slice(0, Math.ceil(sampleSize / 3));
  const lifeScience = db.searchByDomain('Life Science').slice(0, Math.ceil(sampleSize / 3));
  const earthScience = db.searchByDomain('Earth and Space Science').slice(0, Math.floor(sampleSize / 3));

  const sampleStandards = [...physicalScience, ...lifeScience, ...earthScience].slice(0, sampleSize);

  console.log(`✅ Loaded ${sampleStandards.length} sample standards\n`);

  // Benchmark each detail level
  const results: Record<DetailLevel, BenchmarkResult> = {
    minimal: { mode: 'minimal', totalTokens: 0, avgTokensPerStandard: 0, sampleSize: 0 },
    summary: { mode: 'summary', totalTokens: 0, avgTokensPerStandard: 0, sampleSize: 0 },
    full: { mode: 'full', totalTokens: 0, avgTokensPerStandard: 0, sampleSize: 0 }
  };

  // Run benchmark for each mode
  for (const mode of ['minimal', 'summary', 'full'] as DetailLevel[]) {
    console.log(`📊 Benchmarking ${mode} mode...`);

    let totalTokens = 0;

    for (const standard of sampleStandards) {
      const formatted = formatResponse(standard, mode);
      const tokens = estimateTokensForObject(formatted);
      totalTokens += tokens;
    }

    results[mode] = {
      mode,
      totalTokens,
      avgTokensPerStandard: Math.round(totalTokens / sampleStandards.length),
      sampleSize: sampleStandards.length
    };

    console.log(`   Total tokens: ${totalTokens}`);
    console.log(`   Avg per standard: ${results[mode].avgTokensPerStandard}\n`);
  }

  // Calculate reductions
  const fullTokens = results.full.totalTokens;
  const summaryTokens = results.summary.totalTokens;
  const minimalTokens = results.minimal.totalTokens;

  const summaryReduction = fullTokens - summaryTokens;
  const summaryReductionPct = (summaryReduction / fullTokens) * 100;

  const minimalReduction = fullTokens - minimalTokens;
  const minimalReductionPct = (minimalReduction / fullTokens) * 100;

  // Check if target is met (85-90% reduction)
  const metTarget = summaryReductionPct >= 85 && summaryReductionPct <= 90;

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📈 BENCHMARK RESULTS\n');

  console.log(`Full Mode:`);
  console.log(`  Total tokens: ${fullTokens}`);
  console.log(`  Avg per standard: ${results.full.avgTokensPerStandard}\n`);

  console.log(`Summary Mode:`);
  console.log(`  Total tokens: ${summaryTokens}`);
  console.log(`  Avg per standard: ${results.summary.avgTokensPerStandard}`);
  console.log(`  Reduction: ${summaryReduction} tokens (${summaryReductionPct.toFixed(2)}%)\n`);

  console.log(`Minimal Mode:`);
  console.log(`  Total tokens: ${minimalTokens}`);
  console.log(`  Avg per standard: ${results.minimal.avgTokensPerStandard}`);
  console.log(`  Reduction: ${minimalReduction} tokens (${minimalReductionPct.toFixed(2)}%)\n`);

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Validation against AC #7 (85-90% reduction target)
  console.log('\n✨ ACCEPTANCE CRITERIA VALIDATION (AC #7)\n');
  console.log(`Target: 85-90% token reduction (summary vs full)`);
  console.log(`Actual: ${summaryReductionPct.toFixed(2)}%`);

  if (metTarget) {
    console.log(`✅ TARGET MET! Summary mode achieves ${summaryReductionPct.toFixed(2)}% reduction`);
  } else if (summaryReductionPct > 90) {
    console.log(`⚠️  EXCEEDED TARGET: ${summaryReductionPct.toFixed(2)}% reduction (target: 85-90%)`);
    console.log(`   This is actually better than expected!`);
  } else {
    console.log(`❌ TARGET MISSED: ${summaryReductionPct.toFixed(2)}% reduction (target: 85-90%)`);
    console.log(`   Need ${(85 - summaryReductionPct).toFixed(2)}% more reduction to meet minimum target`);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  return {
    minimal: {
      tokens: minimalTokens,
      reductionVsFull: minimalReduction,
      reductionPercentage: `${minimalReductionPct.toFixed(2)}%`
    },
    summary: {
      tokens: summaryTokens,
      reductionVsFull: summaryReduction,
      reductionPercentage: `${summaryReductionPct.toFixed(2)}%`
    },
    full: {
      tokens: fullTokens
    },
    metTarget: metTarget || summaryReductionPct > 90,
    targetRange: '85-90%'
  };
}

// Run benchmark if executed directly
if (import.meta.main) {
  const sampleSize = process.argv[2] ? parseInt(process.argv[2], 10) : 10;
  const metrics = runBenchmark(sampleSize);

  // Exit with error code if target not met
  if (!metrics.metTarget) {
    console.error('❌ Benchmark failed: Token reduction target not met');
    process.exit(1);
  }

  console.log('✅ Benchmark passed: All targets met');
  process.exit(0);
}

export { runBenchmark };
