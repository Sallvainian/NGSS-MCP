#!/usr/bin/env tsx
/**
 * Build Data Script - Epic 1 Story 1 Implementation
 * Extracts NGSS standards from PDFs into structured JSON database
 */
import { BatchProcessor } from '../src/extraction/batch-processor.js';
import { TopicExtractor } from '../src/extraction/topic-extractor.js';
import { writeFileSync } from 'fs';
import { resolve } from 'path';
async function main() {
    console.log('NGSS Data Extraction Pipeline');
    console.log('==============================\n');
    const pdfPath = resolve(process.cwd(), 'docs/Middle School By Topic NGSS.pdf');
    console.log('PDF:', pdfPath);
    console.log('\nPhase 1: Topic Discovery');
    console.log('------------------------');
    const topicExtractor = new TopicExtractor();
    const topics = await topicExtractor.listAllTopics(pdfPath);
    console.log('Found topics:', topics.length);
    for (const topic of topics) {
        console.log('-', topic.topic, '(pages', topic.start_page, '-', topic.end_page, ')');
        console.log('  Standards:', topic.standard_codes.length);
    }
    console.log('\nPhase 2: Batch Extraction');
    console.log('-------------------------');
    const batchProcessor = new BatchProcessor();
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
        standards: allStandards
    };
    const outputPath = resolve(process.cwd(), 'data/ngss-ms-standards.json');
    writeFileSync(outputPath, JSON.stringify(database, null, 2));
    console.log('\nDatabase saved to:', outputPath);
    console.log('Size:', Math.round(JSON.stringify(database).length / 1024), 'KB');
    console.log('\n✅ Data extraction complete!');
}
main().catch(console.error);
//# sourceMappingURL=build-data.js.map