/**
 * Structured Extractor - Parse full NGSS standards with automatic section detection
 */

import type { Standard, SEP, DCI, CCC, LessonScope } from '../types/ngss.js';
import { PDFReader, parsePageContent } from './pdf-reader.js';
import { PatternExtractor } from './pattern-extractor.js';

export class StructuredExtractor {
  private pdfReader: PDFReader;
  private patternExtractor: PatternExtractor;

  constructor() {
    this.pdfReader = new PDFReader();
    this.patternExtractor = new PatternExtractor();
  }

  async extractStructuredStandard(
    pdfPath: string,
    standardCode: string
  ): Promise<Standard | null> {
    // Find pages containing this standard
    const allCodes = await this.patternExtractor.extractStandardCodes(pdfPath);
    const targetCode = allCodes.find((c) => c.code === standardCode);

    if (!targetCode) {
      return null;
    }

    // Extract that page's content
    const pageContent = await this.pdfReader.extractPages(
      pdfPath,
      targetCode.page.toString()
    );
    const pages = parsePageContent(pageContent, targetCode.page.toString());
    const content = pages[0]?.content || '';

    // Parse the standard
    return this.parseStandardFromContent(content, standardCode);
  }

  private parseStandardFromContent(
    content: string,
    standardCode: string
  ): Standard {
    // Extract grade level and domain from code
    const [gradeLevel, domainCode] = standardCode.split('-');

    // Determine domain name
    const domainMap: Record<string, string> = {
      'LS': 'Life Science',
      'PS': 'Physical Science',
      'ESS': 'Earth and Space Science'
    };
    const domain = domainCode ? (domainMap[domainCode.replace(/\d+$/, '')] || 'Unknown') : 'Unknown';

    // Extract performance expectation (text after standard code)
    const pePattern = new RegExp(`${standardCode}\\.?\\s+([^\\[]+)`);
    const peMatch = content.match(pePattern);
    const performance_expectation = (peMatch && peMatch[1])
      ? peMatch[1].trim().replace(/\s+/g, ' ')
      : '';

    // Parse 3D components
    const sep = this.parseSEP(content);
    const dci = this.parseDCI(content);
    const ccc = this.parseCCC(content);

    // Extract topic (from page header)
    // Fixed regex to capture full topic name including capital letters
    const topicMatch = content.match(/^MS\.([A-Z][A-Za-z\s&-]+)/m);
    const topic = (topicMatch && topicMatch[1]) ? topicMatch[1].trim() : '';

    // Generate driving questions (placeholder - would need enhancement)
    const driving_questions = this.generateDrivingQuestions(
      performance_expectation,
      topic
    );

    // Extract keywords
    const keywords = this.extractKeywords(performance_expectation, topic);

    // Create lesson scope
    const lesson_scope = this.createLessonScope(content, performance_expectation);

    return {
      code: standardCode,
      grade_level: gradeLevel || 'MS',
      domain,
      topic,
      performance_expectation,
      sep,
      dci,
      ccc,
      driving_questions,
      keywords,
      lesson_scope
    };
  }

  private parseSEP(content: string): SEP {
    const sepSection = content.match(
      /Science and Engineering Practices[\s\S]*?(?=Disciplinary Core Ideas|$)/i
    );
    if (!sepSection) {
      return { code: 'SEP-1', name: 'Unknown', description: '' };
    }

    const text = sepSection[0];
    const practiceMatch = text.match(/▪\s+([^(]+)\(/);
    // Clean newlines and extra whitespace from name
    const name = (practiceMatch && practiceMatch[1]) 
      ? practiceMatch[1].trim().replace(/\s+/g, ' ') 
      : 'Unknown Practice';

    return {
      code: 'SEP-1',
      name,
      description: text.slice(0, 200).trim().replace(/\s+/g, ' ')
    };
  }

  private parseDCI(content: string): DCI {
    const dciSection = content.match(
      /Disciplinary Core Ideas[\s\S]*?(?=Crosscutting Concepts|$)/i
    );
    if (!dciSection) {
      return { code: 'PS1.A', name: 'Unknown', description: '' };
    }

    const text = dciSection[0];
    const codeMatch = text.match(/([A-Z]{2,3}\d+\.[A-Z]):\s+([^\n]+)/);

    if (codeMatch && codeMatch[1] && codeMatch[2]) {
      return {
        code: codeMatch[1],
        name: codeMatch[2].trim(),
        description: text.slice(0, 200).trim().replace(/\s+/g, ' ')
      };
    }

    return { code: 'PS1.A', name: 'Unknown', description: text.slice(0, 200).trim().replace(/\s+/g, ' ') };
  }

  private parseCCC(content: string): CCC {
    const cccSection = content.match(
      /Crosscutting Concepts[\s\S]*?(?=Connections|$)/i
    );
    if (!cccSection) {
      return { code: 'CCC-1', name: 'Unknown', description: '' };
    }

    const text = cccSection[0];
    // Capture across multiple lines until period or end of sentence
    const conceptMatch = text.match(/▪\s+([\s\S]+?\.)/);
    // Clean newlines and extra whitespace from name
    const name = (conceptMatch && conceptMatch[1]) 
      ? conceptMatch[1].trim().replace(/\s+/g, ' ') 
      : 'Unknown Concept';

    return {
      code: 'CCC-1',
      name,
      description: text.slice(0, 200).trim().replace(/\s+/g, ' ')
    };
  }

  private generateDrivingQuestions(pe: string, topic: string): string[] {
    const questions: string[] = [];

    // Extract question if PE already contains one
    if (pe.includes('?')) {
      const parts = pe.split('?');
      if (parts[0]) {
        questions.push(parts[0].trim() + '?');
      }
    }

    // Generate topic-based question only if we have a valid topic
    if (topic && topic.length > 3 && !topic.includes('Unknown')) {
      // Check if topic is truncated or incomplete
      const seemsComplete = !topic.endsWith(' and') &&
                           !topic.endsWith(' or') &&
                           !topic.endsWith(' of');

      if (seemsComplete) {
        // Use more flexible phrasing that works for both singular and plural
        questions.push(`What do we know about ${topic.toLowerCase()}?`);
      } else {
        // Topic incomplete, generate more generic question
        questions.push(`What is ${topic.toLowerCase()} about?`);
      }
    }

    // Generate PE-based question if no questions yet
    if (questions.length === 0 && pe) {
      // Extract first verb and object from PE
      const verbMatch = pe.match(/^(\w+)\s+(.{20,60})/i);
      if (verbMatch && verbMatch[1] && verbMatch[2]) {
        const verb = verbMatch[1].toLowerCase();
        const object = verbMatch[2];
        if (['develop', 'design', 'construct', 'plan', 'analyze'].includes(verb)) {
          questions.push(`How can we ${verb} ${object}?`);
        } else if (['explain', 'describe', 'define'].includes(verb)) {
          questions.push(`What ${object}?`);
        }
      }
    }

    return questions.slice(0, 2);
  }

  private extractKeywords(pe: string, topic: string): string[] {
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
    const words = (pe + ' ' + topic)
      .toLowerCase()
      .split(/\W+/)
      .filter((w) => w.length > 3 && !stopWords.has(w));
    
    return [...new Set(words)].slice(0, 8);
  }

  private createLessonScope(content: string, pe: string): LessonScope {
    return {
      key_concepts: this.extractKeywords(pe, ''),
      prerequisite_knowledge: [],
      common_misconceptions: [],
      depth_boundaries: {
        include: [],
        exclude: []
      }
    };
  }
}