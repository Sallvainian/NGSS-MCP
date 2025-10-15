#!/usr/bin/env tsx
/**
 * Build Data Script - Epic 1 Story 1 Implementation
 * Extracts NGSS standards from PDFs into structured JSON database
 */

import { BatchProcessor } from '../src/extraction/batch-processor.js';
import { TopicExtractor } from '../src/extraction/topic-extractor.js';
import { PDFReader } from '../src/extraction/pdf-reader.js';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';

async function main() {
  console.log('NGSS Data Extraction Pipeline');
  console.log('==============================\n');

  const pdfPath = resolve(process.cwd(), 'docs/Middle School By Topic NGSS.pdf');

  console.log('PDF:', pdfPath);
  console.log('\nPhase 1: Topic Discovery');
  console.log('------------------------');

  const topicExtractor = new TopicExtractor();
  const batchProcessor = new BatchProcessor();

  try {
    const topics = await topicExtractor.listAllTopics(pdfPath);

    console.log('Found topics:', topics.length);
    for (const topic of topics) {
      console.log('-', topic.topic, '(pages', topic.start_page, '-', topic.end_page, ')');
      console.log('  Standards:', topic.standard_codes.length);
    }

    console.log('\nPhase 2: Batch Extraction');
    console.log('-------------------------');

    console.log('\nExtracting Physical Science standards...');
    const psStandards = await batchProcessor.batchExtractStandards(pdfPath, 'MS-PS');

    console.log('\nExtracting Life Science standards...');
    const lsStandards = await batchProcessor.batchExtractStandards(pdfPath, 'MS-LS');

    console.log('\nExtracting Earth and Space Science standards...');
    const essStandards = await batchProcessor.batchExtractStandards(pdfPath, 'MS-ESS');

    const allStandards = [...psStandards, ...lsStandards, ...essStandards];

    console.log('\nPhase 3: Database Generation');
    console.log('----------------------------');
    console.log('Total standards extracted:', allStandards.length);
    console.log('Physical Science:', psStandards.length);
    console.log('Life Science:', lsStandards.length);
    console.log('Earth and Space Science:', essStandards.length);

    const database = {
      generated_at: new Date().toISOString(),
      source: 'Middle School By Topic NGSS.pdf',
      standards: allStandards,
      topics: topics.length,
      extraction_method: 'Epic 1 Story 1 - Pattern-based PDF extraction'
    };

    const outputPath = resolve(process.cwd(), 'data/ngss-ms-standards.json');

    // Ensure data directory exists
    const dataDir = dirname(outputPath);
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true });
      console.log('Created data directory:', dataDir);
    }

    writeFileSync(outputPath, JSON.stringify(database, null, 2));

    console.log('\nDatabase saved to:', outputPath);
    console.log('Size:', Math.round(JSON.stringify(database).length / 1024), 'KB');
    console.log('\n✅ Data extraction complete!');

  } catch (error) {
    console.error('\n❌ Extraction failed:', error);
    throw error;
  } finally {
    // Clean up MCP connections
    console.log('\n🧹 Cleaning up MCP connections...');

    // Access the internal PDFReader instances from extractors
    // Note: This requires the extractors to expose their PDFReader or implement cleanup
    // For now, we'll rely on process exit to close connections
    console.log('   MCP connections will be cleaned up on process exit');
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
