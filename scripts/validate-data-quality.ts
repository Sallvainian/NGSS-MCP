#!/usr/bin/env bun
/**
 * Data Quality Validation Script
 *
 * This script enforces data quality standards for NGSS-MCP.
 * It runs in CI to prevent OCR errors from re-entering the dataset.
 *
 * Validation Rules:
 * 1. Exactly 10 unique SEP (Science & Engineering Practices) values
 * 2. Exactly 8 unique CCC (Crosscutting Concepts) values
 * 3. No whitespace anomalies (multiple consecutive spaces, trailing spaces)
 * 4. No truncated values (ends with incomplete words like "e.")
 *
 * Exit codes:
 * - 0: All validations passed
 * - 1: Validation failures detected
 *
 * See ADR-002 for rationale.
 */

import { readFileSync } from 'fs';
import { join } from 'path';

interface Standard {
  code: string;
  sep: { name: string };
  ccc: { name: string };
  [key: string]: any;
}

interface DataFile {
  standards: Standard[];
}

const EXPECTED_SEP_COUNT = 10;
const EXPECTED_CCC_COUNT = 8;

// Known truncated patterns that indicate OCR errors
const TRUNCATION_PATTERNS = [
  /\(e\.\s*$/,           // Ends with "(e." - incomplete abbreviation
  /\s\.$/,               // Space before final period
  /\s-\s*$/,             // Space before final hyphen
  /[a-z]\s[a-z]+\s*$/,   // Word with space in the middle at end
];

function detectWhitespaceAnomalies(value: string): string[] {
  const issues: string[] = [];

  // Check for multiple consecutive spaces
  if (/\s{2,}/.test(value)) {
    issues.push('Multiple consecutive spaces detected');
  }

  // Check for trailing spaces
  if (value !== value.trim()) {
    issues.push('Leading or trailing whitespace detected');
  }

  // Check for space before punctuation
  if (/\s[.,;!?)]/.test(value)) {
    issues.push('Space before punctuation detected');
  }

  // Check for space after opening punctuation
  if (/[(]\s/.test(value)) {
    issues.push('Space after opening parenthesis detected');
  }

  // Note: Split word detection removed - too many false positives
  // The unique value count check (10 SEP, 8 CCC) is more reliable for catching OCR errors

  return issues;
}

function detectTruncation(value: string): boolean {
  return TRUNCATION_PATTERNS.some(pattern => pattern.test(value));
}

function main() {
  console.log('🔍 NGSS Data Quality Validation\n');

  const dataPath = join(process.cwd(), 'data', 'ngss-ms-standards.json');

  console.log(`📖 Reading: ${dataPath}`);
  const rawData = readFileSync(dataPath, 'utf-8');
  const dataFile: DataFile = JSON.parse(rawData);
  const standards = dataFile.standards;

  console.log(`✅ Loaded ${standards.length} standards\n`);

  let hasErrors = false;

  // Collect unique values
  const sepValues = new Set<string>();
  const cccValues = new Set<string>();

  standards.forEach(s => {
    sepValues.add(s.sep.name);
    cccValues.add(s.ccc.name);
  });

  // Validation 1: SEP count
  console.log(`📊 Validation 1: SEP Unique Value Count`);
  console.log(`   Expected: ${EXPECTED_SEP_COUNT}`);
  console.log(`   Actual:   ${sepValues.size}`);

  if (sepValues.size !== EXPECTED_SEP_COUNT) {
    console.log(`   ❌ FAIL: Expected ${EXPECTED_SEP_COUNT} unique SEP values, found ${sepValues.size}`);
    console.log(`\n   Actual SEP values:`);
    Array.from(sepValues).sort().forEach((v, i) => {
      console.log(`   ${i + 1}. "${v.substring(0, 60)}${v.length > 60 ? '...' : ''}"`);
    });
    hasErrors = true;
  } else {
    console.log(`   ✅ PASS\n`);
  }

  // Validation 2: CCC count
  console.log(`📊 Validation 2: CCC Unique Value Count`);
  console.log(`   Expected: ${EXPECTED_CCC_COUNT}`);
  console.log(`   Actual:   ${cccValues.size}`);

  if (cccValues.size !== EXPECTED_CCC_COUNT) {
    console.log(`   ❌ FAIL: Expected ${EXPECTED_CCC_COUNT} unique CCC values, found ${cccValues.size}`);
    console.log(`\n   Actual CCC values:`);
    Array.from(cccValues).sort().forEach((v, i) => {
      console.log(`   ${i + 1}. "${v}"`);
    });
    hasErrors = true;
  } else {
    console.log(`   ✅ PASS\n`);
  }

  // Validation 3: Whitespace anomalies
  console.log(`📊 Validation 3: Whitespace Quality Check`);

  const sepIssues: Array<{value: string, issues: string[]}> = [];
  const cccIssues: Array<{value: string, issues: string[]}> = [];

  sepValues.forEach(value => {
    const issues = detectWhitespaceAnomalies(value);
    if (issues.length > 0) {
      sepIssues.push({ value, issues });
    }
  });

  cccValues.forEach(value => {
    const issues = detectWhitespaceAnomalies(value);
    if (issues.length > 0) {
      cccIssues.push({ value, issues });
    }
  });

  if (sepIssues.length > 0) {
    console.log(`   ❌ FAIL: ${sepIssues.length} SEP values with whitespace issues:`);
    sepIssues.forEach(({ value, issues }) => {
      console.log(`\n   Value: "${value.substring(0, 60)}..."`);
      issues.forEach(issue => console.log(`     - ${issue}`));
    });
    hasErrors = true;
  } else {
    console.log(`   SEP: ✅ No whitespace anomalies detected`);
  }

  if (cccIssues.length > 0) {
    console.log(`   ❌ FAIL: ${cccIssues.length} CCC values with whitespace issues:`);
    cccIssues.forEach(({ value, issues }) => {
      console.log(`\n   Value: "${value}"`);
      issues.forEach(issue => console.log(`     - ${issue}`));
    });
    hasErrors = true;
  } else {
    console.log(`   CCC: ✅ No whitespace anomalies detected`);
  }

  if (!sepIssues.length && !cccIssues.length) {
    console.log(`   ✅ PASS\n`);
  } else {
    console.log('');
  }

  // Validation 4: Truncation check
  console.log(`📊 Validation 4: Truncation Check`);

  const truncatedSEPs = Array.from(sepValues).filter(detectTruncation);
  const truncatedCCCs = Array.from(cccValues).filter(detectTruncation);

  if (truncatedSEPs.length > 0) {
    console.log(`   ❌ FAIL: ${truncatedSEPs.length} SEP values appear truncated:`);
    truncatedSEPs.forEach(v => console.log(`     - "${v}"`));
    hasErrors = true;
  } else {
    console.log(`   SEP: ✅ No truncated values detected`);
  }

  if (truncatedCCCs.length > 0) {
    console.log(`   ❌ FAIL: ${truncatedCCCs.length} CCC values appear truncated:`);
    truncatedCCCs.forEach(v => console.log(`     - "${v}"`));
    hasErrors = true;
  } else {
    console.log(`   CCC: ✅ No truncated values detected`);
  }

  if (!truncatedSEPs.length && !truncatedCCCs.length) {
    console.log(`   ✅ PASS\n`);
  } else {
    console.log('');
  }

  // Summary
  console.log('═'.repeat(60));

  if (hasErrors) {
    console.log('❌ DATA QUALITY VALIDATION FAILED\n');
    console.log('Action required:');
    console.log('1. Review the failures above');
    console.log('2. Run: bun run scripts/fix-ocr-errors.ts');
    console.log('3. Or manually correct the data file');
    console.log('4. Re-run this validation\n');
    process.exit(1);
  } else {
    console.log('✅ ALL VALIDATIONS PASSED\n');
    console.log('Data quality is excellent!');
    console.log(`- ${EXPECTED_SEP_COUNT} unique SEP values (correct)`);
    console.log(`- ${EXPECTED_CCC_COUNT} unique CCC values (correct)`);
    console.log('- No whitespace anomalies');
    console.log('- No truncated values\n');
    process.exit(0);
  }
}

main();
