/**
 * Topic Extractor - Detect topic boundaries and page ranges
 */

import type { TopicPageRange } from '../types/ngss.js';
import { PDFReader, parsePageContent } from './pdf-reader.js';
import { PatternExtractor } from './pattern-extractor.js';

export class TopicExtractor {
  private pdfReader: PDFReader;
  private patternExtractor: PatternExtractor;

  constructor() {
    this.pdfReader = new PDFReader();
    this.patternExtractor = new PatternExtractor();
  }

  async extractTopicPages(
    pdfPath: string,
    topicPattern: string
  ): Promise<TopicPageRange | null> {
    // Get all content to scan for topics
    const content = await this.pdfReader.extractAll(pdfPath);
    const pages = parsePageContent(content, 'all');

    // Find pages matching topic pattern
    const matchingPages: number[] = [];
    
    for (const page of pages) {
      if (this.matchesTopic(page.content, topicPattern)) {
        matchingPages.push(page.pageNumber);
      }
    }

    if (matchingPages.length === 0) {
      return null;
    }

    // Determine page range
    const start_page = Math.min(...matchingPages);
    const end_page = Math.max(...matchingPages);

    // Extract standard codes from this range
    const codes = await this.patternExtractor.extractStandardCodes(
      pdfPath,
      `${start_page}-${end_page}`
    );

    return {
      topic: topicPattern,
      start_page,
      end_page,
      standard_codes: codes.map((c) => c.code)
    };
  }

  private matchesTopic(content: string, pattern: string): boolean {
    // Case-insensitive fuzzy matching
    const normalizedContent = content.toLowerCase();
    const normalizedPattern = pattern.toLowerCase();

    // Direct match
    if (normalizedContent.includes(normalizedPattern)) {
      return true;
    }

    // Header pattern: "MS.Topic"
    const headerRegex = new RegExp(`MS\\.${pattern}`, 'i');
    if (headerRegex.test(content)) {
      return true;
    }

    // Word-based similarity (simple)
    const patternWords = normalizedPattern.split(/\s+/);
    const matchCount = patternWords.filter((word) =>
      normalizedContent.includes(word)
    ).length;

    // At least 70% of pattern words must match
    return matchCount / patternWords.length >= 0.7;
  }

  async listAllTopics(pdfPath: string): Promise<TopicPageRange[]> {
    const content = await this.pdfReader.extractAll(pdfPath);
    const pages = parsePageContent(content, 'all');
    
    const topics = new Map<string, number[]>();

    for (const page of pages) {
      // Look for topic headers like "MS.Chemical Reactions"
      // Fixed regex to capture full topic name including capital letters
      const headerMatch = page.content.match(/MS\.([A-Z][A-Za-z\s&-]+)/);

      if (headerMatch && headerMatch[1]) {
        const topic = headerMatch[1].trim();
        const existing = topics.get(topic) || [];
        existing.push(page.pageNumber);
        topics.set(topic, existing);
      }
    }

    // Convert to TopicPageRange array
    const results: TopicPageRange[] = [];
    
    for (const [topic, pages] of topics.entries()) {
      const start_page = Math.min(...pages);
      const end_page = Math.max(...pages);
      
      const codes = await this.patternExtractor.extractStandardCodes(
        pdfPath,
        `${start_page}-${end_page}`
      );

      results.push({
        topic,
        start_page,
        end_page,
        standard_codes: codes.map((c) => c.code)
      });
    }

    return results.sort((a, b) => a.start_page - b.start_page);
  }
}
