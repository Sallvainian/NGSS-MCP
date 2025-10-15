/**
 * Pattern Extractor - Smart pattern-based extraction from NGSS PDFs
 */

import type {
  ExtractedStandardCode,
  ExtractedSection
} from '../types/ngss.js';
import { PATTERNS } from '../types/ngss.js';
import { PDFReader, parsePageContent } from './pdf-reader.js';

export type ExtractionPattern =
  | 'standard_codes'
  | 'sep_sections'
  | 'dci_sections'
  | 'ccc_sections';

export class PatternExtractor {
  private pdfReader: PDFReader;

  constructor() {
    this.pdfReader = new PDFReader();
  }

  async extractStandardCodes(
    pdfPath: string,
    pages?: string
  ): Promise<ExtractedStandardCode[]> {
    const content = pages
      ? await this.pdfReader.extractPages(pdfPath, pages)
      : await this.pdfReader.extractAll(pdfPath);

    const pageContents = parsePageContent(content, pages || 'all');
    const results: ExtractedStandardCode[] = [];

    for (const page of pageContents) {
      const matches = page.content.matchAll(PATTERNS.STANDARD_CODE);

      for (const match of matches) {
        const code = match[0];
        const contextStart = Math.max(0, match.index! - 50);
        const contextEnd = Math.min(
          page.content.length,
          match.index! + code.length + 50
        );
        const context = page.content.slice(contextStart, contextEnd);

        results.push({
          code,
          page: page.pageNumber,
          context: context.trim()
        });
      }
    }

    const unique = results.filter(
      (item, index, self) => index === self.findIndex((t) => t.code === item.code)
    );

    return unique;
  }

  async extractSEPSections(
    pdfPath: string,
    pages?: string
  ): Promise<ExtractedSection[]> {
    return this.extractSectionsByPattern(pdfPath, 'SEP', pages);
  }

  async extractDCISections(
    pdfPath: string,
    pages?: string
  ): Promise<ExtractedSection[]> {
    return this.extractSectionsByPattern(pdfPath, 'DCI', pages);
  }

  async extractCCCSections(
    pdfPath: string,
    pages?: string
  ): Promise<ExtractedSection[]> {
    return this.extractSectionsByPattern(pdfPath, 'CCC', pages);
  }

  private async extractSectionsByPattern(
    pdfPath: string,
    sectionType: 'SEP' | 'DCI' | 'CCC',
    pages?: string
  ): Promise<ExtractedSection[]> {
    const content = pages
      ? await this.pdfReader.extractPages(pdfPath, pages)
      : await this.pdfReader.extractAll(pdfPath);

    const pageContents = parsePageContent(content, pages || 'all');
    const results: ExtractedSection[] = [];

    const pattern =
      sectionType === 'SEP'
        ? PATTERNS.SEP_SECTION
        : sectionType === 'DCI'
        ? PATTERNS.DCI_SECTION
        : PATTERNS.CCC_SECTION;

    for (const page of pageContents) {
      const match = pattern.exec(page.content);

      if (match) {
        const startIndex = match.index! + match[0].length;
        const nextSectionPattern =
          /(?:Science and Engineering Practices|Disciplinary Core Ideas|Crosscutting Concepts|Connections to)/gi;

        const restContent = page.content.slice(startIndex);
        const nextMatch = nextSectionPattern.exec(restContent);
        const endIndex = nextMatch ? nextMatch.index : restContent.length;

        const content = restContent.slice(0, endIndex).trim();

        results.push({
          type: sectionType,
          content,
          page: page.pageNumber
        });
      }
    }

    return results;
  }

  async extractByPattern(
    pdfPath: string,
    pattern: ExtractionPattern,
    pages?: string
  ): Promise<ExtractedStandardCode[] | ExtractedSection[]> {
    switch (pattern) {
      case 'standard_codes':
        return this.extractStandardCodes(pdfPath, pages);
      case 'sep_sections':
        return this.extractSEPSections(pdfPath, pages);
      case 'dci_sections':
        return this.extractDCISections(pdfPath, pages);
      case 'ccc_sections':
        return this.extractCCCSections(pdfPath, pages);
    }
  }
}
