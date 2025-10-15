/**
 * NGSS Data Model Types
 * Complete TypeScript type definitions for Next Generation Science Standards
 */

import { z } from 'zod';

// ===== Core NGSS Types =====

export interface SEP {
  code: string;
  name: string;
  description: string;
}

export interface DCI {
  code: string;
  name: string;
  description: string;
}

export interface CCC {
  code: string;
  name: string;
  description: string;
}

export interface LessonScope {
  key_concepts: string[];
  prerequisite_knowledge: string[];
  common_misconceptions: string[];
  depth_boundaries: {
    include: string[];
    exclude: string[];
  };
}

export interface Standard {
  code: string;
  grade_level: string;
  domain: string;
  topic: string;
  performance_expectation: string;
  sep: SEP;
  dci: DCI;
  ccc: CCC;
  driving_questions: string[];
  keywords: string[];
  lesson_scope: LessonScope;
}

export interface StandardsDatabase {
  standards: Standard[];
}

// ===== Zod Schemas for Validation =====

export const SEPSchema = z.object({
  code: z.string().regex(/^SEP-\d+$/),
  name: z.string().min(5),
  description: z.string().min(20)
});

export const DCISchema = z.object({
  code: z.string().regex(/^[A-Z]{2,3}\d+\.[A-Z]$/),
  name: z.string().min(5),
  description: z.string().min(20)
});

export const CCCSchema = z.object({
  code: z.string().regex(/^CCC-\d+$/),
  name: z.string().min(3),
  description: z.string().min(20)
});

export const LessonScopeSchema = z.object({
  key_concepts: z.array(z.string()).min(1),
  prerequisite_knowledge: z.array(z.string()),
  common_misconceptions: z.array(z.string()),
  depth_boundaries: z.object({
    include: z.array(z.string()),
    exclude: z.array(z.string())
  })
});

export const StandardSchema = z.object({
  code: z.string().regex(/^[A-Z]{2}-[A-Z]{2,3}\d+-\d+$/),
  grade_level: z.string(),
  domain: z.string(),
  topic: z.string(),
  performance_expectation: z.string().min(50),
  sep: SEPSchema,
  dci: DCISchema,
  ccc: CCCSchema,
  driving_questions: z.array(z.string()).min(1),
  keywords: z.array(z.string()),
  lesson_scope: LessonScopeSchema
});

export const StandardsDatabaseSchema = z.object({
  standards: z.array(StandardSchema)
});

// ===== Extraction Types =====

export interface ExtractedStandardCode {
  code: string;
  page: number;
  context: string;
}

export interface ExtractedSection {
  type: 'SEP' | 'DCI' | 'CCC';
  content: string;
  page: number;
}

export interface TopicPageRange {
  topic: string;
  start_page: number;
  end_page: number;
  standard_codes: string[];
}

export interface ExtractionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  validation_errors?: string[];
}

// ===== Domain Filters =====

export type Domain = 'Life Science' | 'Physical Science' | 'Earth and Space Science';
export type DomainCode = 'LS' | 'PS' | 'ESS';
export type GradeLevel = 'ES' | 'MS' | 'HS';

export const DOMAIN_MAP: Record<DomainCode, Domain> = {
  LS: 'Life Science',
  PS: 'Physical Science',
  ESS: 'Earth and Space Science'
};

// ===== Regex Patterns =====

export const PATTERNS = {
  STANDARD_CODE: /\b([A-Z]{2})-([A-Z]{2,3})(\d+)-(\d+)\b/g,
  SEP_SECTION: /Science and Engineering Practices/i,
  DCI_SECTION: /Disciplinary Core Ideas/i,
  CCC_SECTION: /Crosscutting Concepts/i,
  TOPIC_HEADER: /^MS\.([A-Z][a-z\s]+)$/m
};
