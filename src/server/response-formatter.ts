/**
 * Response Formatter Module
 * Provides configurable response formatting for token optimization
 */

import type { Standard, DetailLevel, MinimalStandard, SummaryStandard } from '../types/ngss.js';

/**
 * Truncate text at word boundary
 *
 * @param text - Text to truncate
 * @param maxChars - Maximum character length
 * @returns Truncated text with "..." if truncated
 */
export function truncateAtWordBoundary(text: string, maxChars: number): string {
  if (text.length <= maxChars) {
    return text;
  }

  // Find last space before maxChars
  const truncated = text.substring(0, maxChars);
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace > 0) {
    return truncated.substring(0, lastSpace) + '...';
  }

  // If no space found, just cut at maxChars
  return truncated + '...';
}

/**
 * Get top N keywords from keyword array
 *
 * @param keywords - Array of keywords
 * @param limit - Maximum number of keywords to return
 * @returns Limited keyword array
 */
export function limitKeywords(keywords: string[], limit: number): string[] {
  return keywords.slice(0, limit);
}

/**
 * Format standard response based on detail level
 *
 * @param standard - Full standard object
 * @param detailLevel - Level of detail to return
 * @returns Formatted standard (minimal, summary, or full)
 */
export function formatResponse(
  standard: Standard,
  detailLevel: DetailLevel = 'full'
): MinimalStandard | SummaryStandard | Standard {
  switch (detailLevel) {
    case 'minimal':
      return {
        code: standard.code,
        topic: standard.topic,
        performance_expectation: truncateAtWordBoundary(standard.performance_expectation, 50)
      };

    case 'summary':
      return {
        code: standard.code,
        topic: standard.topic,
        performance_expectation: truncateAtWordBoundary(standard.performance_expectation, 138),
        keywords: limitKeywords(standard.keywords, 3)
      };

    case 'full':
    default:
      return standard;
  }
}

/**
 * Format array of standards based on detail level
 *
 * @param standards - Array of full standard objects
 * @param detailLevel - Level of detail to return
 * @returns Array of formatted standards
 */
export function formatResponseArray(
  standards: Standard[],
  detailLevel: DetailLevel = 'full'
): (MinimalStandard | SummaryStandard | Standard)[] {
  return standards.map(standard => formatResponse(standard, detailLevel));
}
