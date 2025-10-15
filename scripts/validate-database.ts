#!/usr/bin/env tsx
/**
 * Database Validation Script - Analyze extracted NGSS standards
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

interface Standard {
  code: string;
  grade_level: string;
  domain: string;
  topic: string;
  performance_expectation: string;
  sep: { code: string; name: string; description: string };
  dci: { code: string; name: string; description: string };
  ccc: { code: string; name: string; description: string };
  driving_questions: string[];
  keywords: string[];
  lesson_scope: any;
}

interface Database {
  generated_at: string;
  source: string;
  standards: Standard[];
  topics: number;
  extraction_method: string;
}

function main() {
  console.log('NGSS Database Validation');
  console.log('========================\n');

  const dbPath = resolve(process.cwd(), 'data/ngss-ms-standards.json');
  const db: Database = JSON.parse(readFileSync(dbPath, 'utf-8'));

  console.log('📊 Database Metadata');
  console.log('-------------------');
  console.log('Generated:', new Date(db.generated_at).toLocaleString());
  console.log('Source:', db.source);
  console.log('Method:', db.extraction_method);
  console.log('Topics:', db.topics);
  console.log('Total Standards:', db.standards.length);

  // Count by domain
  const byDomain: Record<string, number> = {};
  for (const std of db.standards) {
    byDomain[std.domain] = (byDomain[std.domain] || 0) + 1;
  }

  console.log('\n📚 Standards by Domain');
  console.log('---------------------');
  for (const [domain, count] of Object.entries(byDomain)) {
    console.log(`${domain}: ${count}`);
  }

  // Verify 3D completeness
  console.log('\n🔍 3D Framework Validation');
  console.log('-------------------------');
  let complete3D = 0;
  let incomplete3D = 0;

  for (const std of db.standards) {
    if (std.sep?.code && std.dci?.code && std.ccc?.code) {
      complete3D++;
    } else {
      incomplete3D++;
      console.log(`⚠️  Incomplete: ${std.code}`);
      if (!std.sep?.code) console.log('   Missing SEP');
      if (!std.dci?.code) console.log('   Missing DCI');
      if (!std.ccc?.code) console.log('   Missing CCC');
    }
  }

  console.log(`✅ Complete 3D: ${complete3D} (${Math.round(complete3D / db.standards.length * 100)}%)`);
  console.log(`❌ Incomplete 3D: ${incomplete3D}`);

  // Check standard codes
  console.log('\n🏷️  Standard Code Validation');
  console.log('---------------------------');
  const codePattern = /^MS-(PS|LS|ESS)\d+-\d+$/;
  let validCodes = 0;
  let invalidCodes = 0;

  for (const std of db.standards) {
    if (codePattern.test(std.code)) {
      validCodes++;
    } else {
      invalidCodes++;
      console.log(`⚠️  Invalid code format: ${std.code}`);
    }
  }

  console.log(`✅ Valid codes: ${validCodes}`);
  console.log(`❌ Invalid codes: ${invalidCodes}`);

  // Sample standards by domain
  console.log('\n📖 Sample Standards');
  console.log('------------------');
  const samples: Record<string, Standard> = {};

  for (const std of db.standards) {
    if (!samples[std.domain]) {
      samples[std.domain] = std;
    }
  }

  for (const [domain, std] of Object.entries(samples)) {
    console.log(`\n${domain} - ${std.code}`);
    console.log(`  PE: ${std.performance_expectation.substring(0, 80)}...`);
    console.log(`  SEP: ${std.sep.code} - ${std.sep.name.substring(0, 50)}...`);
    console.log(`  DCI: ${std.dci.code} - ${std.dci.name.substring(0, 50)}...`);
    console.log(`  CCC: ${std.ccc.code} - ${std.ccc.name.substring(0, 50)}...`);
    console.log(`  Keywords: ${std.keywords.slice(0, 5).join(', ')}`);
  }

  // Quality checks
  console.log('\n✨ Quality Checks');
  console.log('----------------');

  const avgPELength = db.standards.reduce((sum, s) => sum + s.performance_expectation.length, 0) / db.standards.length;
  const avgKeywords = db.standards.reduce((sum, s) => sum + s.keywords.length, 0) / db.standards.length;
  const avgQuestions = db.standards.reduce((sum, s) => sum + s.driving_questions.length, 0) / db.standards.length;

  console.log(`Average PE length: ${Math.round(avgPELength)} characters`);
  console.log(`Average keywords per standard: ${avgKeywords.toFixed(1)}`);
  console.log(`Average driving questions: ${avgQuestions.toFixed(1)}`);

  // File size
  const dbSize = readFileSync(dbPath).length;
  console.log(`\nDatabase size: ${Math.round(dbSize / 1024)} KB`);
  console.log(`Size per standard: ${Math.round(dbSize / db.standards.length / 1024 * 1000)} bytes`);

  console.log('\n✅ Validation complete!');
}

main();
