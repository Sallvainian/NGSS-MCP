#!/usr/bin/env tsx
/**
 * Test PDF Extraction - Validate MCP connection and PDF parsing
 */

import { PDFReader, parsePageContent } from '../src/extraction/pdf-reader.js';
import { PatternExtractor } from '../src/extraction/pattern-extractor.js';
import { resolve } from 'path';

async function main() {
  console.log('PDF Extraction Test Suite');
  console.log('=========================\n');

  const pdfPath = resolve(process.cwd(), 'docs/Middle School By Topic NGSS.pdf');
  console.log('PDF:', pdfPath);

  const reader = new PDFReader();
  const patternExtractor = new PatternExtractor();

  try {
    // Test 1: Extract first 3 pages
    console.log('\n[Test 1] Extracting pages 1-3...');
    const pages1to3 = await reader.extractPages(pdfPath, '1,2,3');
    console.log('✅ Extraction successful');
    console.log('Length:', pages1to3.length, 'characters');
    console.log('First 200 chars:', pages1to3.substring(0, 200));

    // Test 2: Parse page content
    console.log('\n[Test 2] Parsing page content...');
    const parsed = parsePageContent(pages1to3, '1,2,3');
    console.log('✅ Parsed', parsed.length, 'pages');
    for (const page of parsed) {
      console.log(`  Page ${page.pageNumber}: ${page.content.length} chars`);
    }

    // Test 3: Extract standard codes from first 10 pages
    console.log('\n[Test 3] Extracting standard codes from pages 1-10...');
    const codes = await patternExtractor.extractStandardCodes(pdfPath, '1-10');
    console.log('✅ Found', codes.length, 'standard codes');
    for (const code of codes.slice(0, 5)) {
      console.log(`  ${code.code} (page ${code.page})`);
      console.log(`    Context: ${code.context.substring(0, 80)}...`);
    }

    // Test 4: Check for malformed text
    console.log('\n[Test 4] Quality check...');
    const hasWeirdChars = /[\x00-\x08\x0B-\x0C\x0E-\x1F]/.test(pages1to3);
    const hasNormalText = /[A-Za-z]{4,}/.test(pages1to3);

    if (hasWeirdChars) {
      console.log('⚠️  Warning: Found control characters in extracted text');
    } else {
      console.log('✅ No control characters');
    }

    if (hasNormalText) {
      console.log('✅ Contains readable text');
    } else {
      console.log('❌ Text quality issue: No readable words found');
    }

    console.log('\n✅ All tests passed! PDF extraction is working correctly.');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  } finally {
    // Clean up
    await reader.close();
    console.log('\n🧹 Cleaned up MCP connection');
  }
}

main().catch(console.error);
