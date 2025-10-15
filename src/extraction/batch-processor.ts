import type { Standard } from '../types/ngss.js';
import { StructuredExtractor } from './structured-extractor.js';
import { SchemaValidator } from './schema-validator.js';
import { PatternExtractor } from './pattern-extractor.js';

export class BatchProcessor {
  private structuredExtractor: StructuredExtractor;
  private schemaValidator: SchemaValidator;
  private patternExtractor: PatternExtractor;

  constructor() {
    this.structuredExtractor = new StructuredExtractor();
    this.schemaValidator = new SchemaValidator();
    this.patternExtractor = new PatternExtractor();
  }

  async batchExtractStandards(
    pdfPath: string,
    domainFilter?: 'MS-PS' | 'MS-LS' | 'MS-ESS'
  ): Promise<Standard[]> {
    const allCodes = await this.patternExtractor.extractStandardCodes(pdfPath);
    let targetCodes = allCodes;

    if (domainFilter) {
      targetCodes = allCodes.filter(c => c.code.startsWith(domainFilter));
    }

    const standards: Standard[] = [];
    
    for (const codeInfo of targetCodes) {
      try {
        const standard = await this.structuredExtractor.extractStructuredStandard(
          pdfPath,
          codeInfo.code
        );
        if (standard) {
          standards.push(standard);
        }
      } catch (error) {
        console.error('Failed to extract ' + codeInfo.code + ':', error);
      }
    }

    const validation = this.schemaValidator.validate3DBatch(standards);
    console.log('Extracted:', standards.length);
    console.log('Complete 3D:', validation.complete.length);
    console.log('Incomplete 3D:', validation.incomplete.length);

    return validation.complete;
  }

  async parallelExtract(
    pdfPath: string,
    codes: string[],
    concurrency: number = 5
  ): Promise<Standard[]> {
    const results: Standard[] = [];
    
    for (let i = 0; i < codes.length; i += concurrency) {
      const batch = codes.slice(i, i + concurrency);
      const promises = batch.map(code =>
        this.structuredExtractor.extractStructuredStandard(pdfPath, code)
      );
      
      const batchResults = await Promise.all(promises);
      results.push(...batchResults.filter((s): s is Standard => s !== null));
    }

    return results;
  }
}
