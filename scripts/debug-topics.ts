#!/usr/bin/env tsx
import { PDFReader, parsePageContent } from '../src/extraction/pdf-reader.js';
import { resolve } from 'path';

async function main() {
  const pdfPath = resolve(process.cwd(), 'docs/Middle School By Topic NGSS.pdf');
  const reader = new PDFReader();

  try {
    console.log('Extracting pages 3-10 to check topic headers...\n');
    const content = await reader.extractPages(pdfPath, '3,4,5,6,7,8,9,10');
    const pages = parsePageContent(content, '3-10');

    for (const page of pages) {
      // Look for MS. topic headers
      const matches = page.content.matchAll(/MS\.([^\n]{1,100})/g);
      for (const match of matches) {
        console.log(`Page ${page.pageNumber}: MS.${match[1]}`);
      }
    }
  } finally {
    await reader.close();
  }
}

main().catch(console.error);
