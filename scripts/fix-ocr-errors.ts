#!/usr/bin/env bun
/**
 * OCR Error Correction Script
 *
 * This script fixes known OCR errors in the NGSS standards data file.
 * It maps dirty OCR values to their canonical clean versions.
 *
 * OCR errors identified during data validation (2025-10-19):
 * - SEP: 11 unique values → should be 10
 * - CCC: 13 unique values → should be 8
 *
 * See ADR-002 for architectural decision rationale.
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// SEP (Science & Engineering Practices) corrections
// Maps OCR-damaged values to canonical clean values
const SEP_CORRECTIONS: Record<string, string> = {
  // Space in "questions"
  "Ask ques tions that can be investigated within the scope of the classroom, outdoor environment, and museums and other public facilities with available resources and, when appropriate, frame a hypothesis based on observations and scientific principles.":
  "Ask questions that can be investigated within the scope of the classroom, outdoor environment, and museums and other public facilities with available resources and, when appropriate, frame a hypothesis based on observations and scientific principles.",

  // Space before period (merge with existing correct version)
  "Develop and use a model to describe phenomena .":
  "Develop and use a model to describe phenomena.",
};

// CCC (Crosscutting Concepts) corrections
const CCC_CORRECTIONS: Record<string, string> = {
  // Space in "in" + various system type variations
  "Cause and effect relationships may be used to predict phenomena i n natural or designed systems.":
  "Cause and effect relationships may be used to predict phenomena in natural or designed systems.",

  "Cause and effect relationships may be used to predict phenomena i n natural systems.":
  "Cause and effect relationships may be used to predict phenomena in natural systems.",

  // Space before period
  "Cause and effect relationships may be used to predict phenomena in natural or designed systems .":
  "Cause and effect relationships may be used to predict phenomena in natural or designed systems.",

  // Space before period
  "Graphs and charts can be used to identify patterns in data .":
  "Graphs and charts can be used to identify patterns in data.",

  // Space before hyphen
  "Macroscopic patterns are related to the nature of microscopic and atomic -level structure.":
  "Macroscopic patterns are related to the nature of microscopic and atomic-level structure.",

  // Space in "Patterns"
  "Patter ns can be used to identify cause and effect relationships.":
  "Patterns can be used to identify cause and effect relationships.",

  // Space in "cause"
  "Patterns can be used to identify cau se and effect relationships.":
  "Patterns can be used to identify cause and effect relationships.",

  // Space in "natural"
  "Patterns in rates of change and other numerical relationships can provide information about natura l systems.":
  "Patterns in rates of change and other numerical relationships can provide information about natural systems.",

  // Truncated OCR value - complete it
  "Proportional relationships (e.":
  "Proportional relationships (e.g., speed as the ratio of distance traveled to time taken) among different types of quantities provide information about the magnitude of properties and processes.",
};

interface Standard {
  code: string;
  sep: { name: string; description: string };
  ccc: { name: string; description: string };
  [key: string]: any;
}

interface DataFile {
  generated_at: string;
  source: string;
  standards: Standard[];
}

function main() {
  console.log('🔧 OCR Error Correction Script\n');

  const dataPath = join(process.cwd(), 'data', 'ngss-ms-standards.json');

  console.log(`📖 Reading: ${dataPath}`);
  const rawData = readFileSync(dataPath, 'utf-8');
  const dataFile: DataFile = JSON.parse(rawData);
  const standards = dataFile.standards;

  console.log(`✅ Loaded ${standards.length} standards\n`);

  let sepCorrections = 0;
  let cccCorrections = 0;

  // Apply corrections
  standards.forEach((standard, index) => {
    // Fix SEP values
    if (SEP_CORRECTIONS[standard.sep.name]) {
      const oldValue = standard.sep.name;
      const newValue = SEP_CORRECTIONS[oldValue];
      standard.sep.name = newValue;
      sepCorrections++;
      console.log(`✓ [${standard.code}] SEP corrected`);
      console.log(`  Old: "${oldValue.substring(0, 50)}..."`);
      console.log(`  New: "${newValue.substring(0, 50)}..."`);
    }

    // Fix CCC values
    if (CCC_CORRECTIONS[standard.ccc.name]) {
      const oldValue = standard.ccc.name;
      const newValue = CCC_CORRECTIONS[oldValue];
      standard.ccc.name = newValue;
      cccCorrections++;
      console.log(`✓ [${standard.code}] CCC corrected`);
      console.log(`  Old: "${oldValue}"`);
      console.log(`  New: "${newValue}"`);
    }
  });

  console.log(`\n📊 Summary:`);
  console.log(`   SEP corrections: ${sepCorrections}`);
  console.log(`   CCC corrections: ${cccCorrections}`);
  console.log(`   Total corrections: ${sepCorrections + cccCorrections}`);

  if (sepCorrections === 0 && cccCorrections === 0) {
    console.log('\n✨ No OCR errors found - data is already clean!');
    return;
  }

  // Write corrected data back
  console.log(`\n💾 Writing corrected data to: ${dataPath}`);
  dataFile.standards = standards;
  const correctedData = JSON.stringify(dataFile, null, 2);
  writeFileSync(dataPath, correctedData + '\n', 'utf-8');

  console.log('✅ Data file updated successfully!\n');
  console.log('🔍 Next step: Run validation tests to confirm corrections');
  console.log('   Command: bun test src/server/integration.test.ts');
}

main();
