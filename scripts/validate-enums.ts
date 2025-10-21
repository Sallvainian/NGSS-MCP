#!/usr/bin/env bun
/**
 * Data Validation Script: Extract unique SEP and CCC values from data
 * This script helps verify that enum definitions match actual data
 */

import { readFileSync } from 'fs';
import { join } from 'path';

const dataPath = join(process.cwd(), 'data/ngss-ms-standards.json');
const data = JSON.parse(readFileSync(dataPath, 'utf-8'));

// Extract unique SEP names
const sepNames = new Set<string>();
data.standards.forEach((s: any) => {
  if (s.sep?.name) {
    sepNames.add(s.sep.name);
  }
});

// Extract unique CCC names
const cccNames = new Set<string>();
data.standards.forEach((s: any) => {
  if (s.ccc?.name) {
    cccNames.add(s.ccc.name);
  }
});

// Extract unique DCI names (for Tool 7)
const dciNames = new Set<string>();
data.standards.forEach((s: any) => {
  if (s.dci?.name) {
    dciNames.add(s.dci.name);
  }
});

console.log('=== DATA VALIDATION RESULTS ===\n');

console.log(`Total standards: ${data.standards.length}\n`);

console.log('=== UNIQUE SEP VALUES (${sepNames.size} total) ===');
const sepArray = Array.from(sepNames).sort();
sepArray.forEach((name, i) => {
  console.log(`${i + 1}. "${name}"`);
});

console.log('\n=== UNIQUE CCC VALUES (${cccNames.size} total) ===');
const cccArray = Array.from(cccNames).sort();
cccArray.forEach((name, i) => {
  console.log(`${i + 1}. "${name}"`);
});

console.log('\n=== UNIQUE DCI VALUES (${dciNames.size} total) ===');
const dciArray = Array.from(dciNames).sort();
dciArray.forEach((name, i) => {
  console.log(`${i + 1}. "${name}"`);
});

console.log('\n=== TYPESCRIPT ENUM FORMAT ===\n');

console.log('const SEP_VALUES = [');
sepArray.forEach((name, i) => {
  console.log(`  '${name}'${i < sepArray.length - 1 ? ',' : ''}`);
});
console.log('] as const;\n');

console.log('const CCC_VALUES = [');
cccArray.forEach((name, i) => {
  console.log(`  '${name}'${i < sepArray.length - 1 ? ',' : ''}`);
});
console.log('] as const;\n');
