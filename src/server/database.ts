/**
 * NGSS Standards Database with Multi-Index Support
 * Loads JSON database and builds indexes for fast lookups
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { performance } from 'perf_hooks';
import type { Standard } from '../types/ngss.js';
import { QueryCache, generateCacheKey, type CacheMetrics } from './query-cache.js';
import { QueryValidator } from './query-validation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface DatabaseMetadata {
  generated_at: string;
  source: string;
}

interface DatabaseContent {
  generated_at: string;
  source: string;
  standards: Standard[];
}

interface QueryMetrics {
  totalQueries: number;
  averageTime: number;
  slowestQuery: { method: string; time: number };
  queriesByMethod: Record<string, number>;
}

export class NGSSDatabase {
  private metadata: DatabaseMetadata;
  private standards: Standard[];

  // Indexes for O(1) or O(log n) lookups
  private codeIndex: Map<string, Standard>;
  private domainIndex: Map<string, Standard[]>;
  private fullTextIndex: Map<string, Set<string>>;

  // Query caching and performance tracking
  private searchCache: QueryCache<Array<{ standard: Standard; score: number }>>;
  private queryMetrics: {
    count: number;
    totalTime: number;
    byMethod: Map<string, { count: number; totalTime: number; maxTime: number }>;
  };

  constructor(dbPath?: string, enableCache: boolean = true) {
    const resolvedPath = dbPath || join(__dirname, '../../data/ngss-ms-standards.json');
    const content = readFileSync(resolvedPath, 'utf-8');
    const data: DatabaseContent = JSON.parse(content);

    this.metadata = {
      generated_at: data.generated_at,
      source: data.source
    };
    this.standards = data.standards;

    // Initialize indexes
    this.codeIndex = new Map();
    this.domainIndex = new Map();
    this.fullTextIndex = new Map();

    // Initialize cache and metrics
    this.searchCache = new QueryCache(100, 5 * 60 * 1000); // 100 entries, 5 min TTL
    this.queryMetrics = {
      count: 0,
      totalTime: 0,
      byMethod: new Map()
    };

    this.buildIndexes();
  }

  /**
   * Track query execution time
   */
  private trackQuery(method: string, timeMs: number): void {
    this.queryMetrics.count++;
    this.queryMetrics.totalTime += timeMs;

    if (!this.queryMetrics.byMethod.has(method)) {
      this.queryMetrics.byMethod.set(method, { count: 0, totalTime: 0, maxTime: 0 });
    }

    const methodStats = this.queryMetrics.byMethod.get(method)!;
    methodStats.count++;
    methodStats.totalTime += timeMs;
    methodStats.maxTime = Math.max(methodStats.maxTime, timeMs);
  }

  private buildIndexes(): void {
    console.error(`Building indexes for ${this.standards.length} standards...`);

    for (const standard of this.standards) {
      // 1. Code index - O(1) lookup by standard code
      this.codeIndex.set(standard.code, standard);

      // 2. Domain index - group by domain
      const domainKey = this.normalizeDomain(standard.domain);
      if (!this.domainIndex.has(domainKey)) {
        this.domainIndex.set(domainKey, []);
      }
      this.domainIndex.get(domainKey)!.push(standard);

      // 3. Full-text index (PE + keywords + topic)
      const fullText = [
        standard.performance_expectation,
        standard.topic,
        ...(standard.keywords || [])
      ].join(' ');

      const textKeywords = this.extractKeywords(fullText);
      textKeywords.forEach(keyword => {
        if (!this.fullTextIndex.has(keyword)) {
          this.fullTextIndex.set(keyword, new Set());
        }
        this.fullTextIndex.get(keyword)!.add(standard.code);
      });
    }

    console.error(`Indexes built: ${this.codeIndex.size} codes, ${this.domainIndex.size} domains`);
  }

  private extractKeywords(text: string): string[] {
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'what', 'how', 'why', 'when', 'where', 'who']);

    return text
      .toLowerCase()
      .split(/\W+/)
      .filter(word => word.length > 2 && !stopWords.has(word));
  }

  private normalizeDomain(domain: string): string {
    const normalized = domain.toLowerCase();
    if (normalized.includes('physical')) return 'physical-science';
    if (normalized.includes('life')) return 'life-science';
    if (normalized.includes('earth') || normalized.includes('space')) return 'earth-space-science';
    return normalized;
  }

  // Public API methods

  getMetadata() {
    return { ...this.metadata };
  }

  getAllStandards(): Standard[] {
    return [...this.standards];
  }

  getStandardByCode(code: string): Standard | null {
    // Validate standard code format
    const validation = QueryValidator.validateStandardCode(code);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    return this.codeIndex.get(validation.sanitized!) || null;
  }

  searchByDomain(domain: string, options: {
    offset?: number;
    limit?: number;
  } = {}): Standard[] {
    // Validate domain parameter
    const validation = QueryValidator.validateDomain(domain);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    const offset = options.offset ?? 0;
    const limit = options.limit ?? 10;

    const domainKey = this.normalizeDomain(validation.sanitized!);
    const allResults = this.domainIndex.get(domainKey) || [];

    // Apply pagination: slice from offset to offset + limit
    return allResults.slice(offset, offset + limit);
  }

  get3DComponents(code: string): { sep: any; dci: any; ccc: any } | null {
    // Validate standard code format
    const validation = QueryValidator.validateStandardCode(code);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    const standard = this.getStandardByCode(validation.sanitized!);
    if (!standard) {
      return null;
    }

    return {
      sep: standard.sep,
      dci: standard.dci,
      ccc: standard.ccc
    };
  }

  searchStandards(query: string, options: {
    domain?: string;
    offset?: number;
    limit?: number;
  } = {}): Array<{ standard: Standard; score: number }> {
    const startTime = performance.now();

    // Validate query
    const queryValidation = QueryValidator.validateQuery(query);
    if (!queryValidation.isValid) {
      throw new Error(queryValidation.error);
    }

    // Validate options
    const optionsValidation = QueryValidator.validateSearchOptions(options);
    if (!optionsValidation.isValid) {
      throw new Error(optionsValidation.errors.join('; '));
    }

    const offset = options.offset ?? 0;
    const limit = options.limit ?? 10;

    // Check cache first (cache key includes pagination)
    const cacheKey = generateCacheKey('searchStandards', {
      query: queryValidation.sanitized,
      domain: options.domain,
      offset,
      limit
    });
    const cached = this.searchCache.get(cacheKey);
    if (cached) {
      this.trackQuery('searchStandards', performance.now() - startTime);
      return cached;
    }

    const keywords = this.extractKeywords(queryValidation.sanitized!);
    if (keywords.length === 0) {
      return [];
    }

    // Calculate relevance scores using full-text index
    const scoreMap = new Map<string, number>();

    keywords.forEach(keyword => {
      const matchingCodes = this.fullTextIndex.get(keyword);
      if (matchingCodes) {
        matchingCodes.forEach(code => {
          scoreMap.set(code, (scoreMap.get(code) || 0) + 1);
        });
      }
    });

    // Get standards with scores
    let results = Array.from(scoreMap.entries())
      .map(([code, score]) => ({
        standard: this.codeIndex.get(code)!,
        score: score / keywords.length // Normalize
      }));

    // Apply domain filter if specified
    if (options.domain) {
      const domainKey = this.normalizeDomain(options.domain);
      results = results.filter(r =>
        this.normalizeDomain(r.standard.domain) === domainKey
      );
    }

    // Sort by score and apply pagination
    results.sort((a, b) => b.score - a.score);

    // Apply offset and limit
    results = results.slice(offset, offset + limit);

    // Cache paginated results
    this.searchCache.set(cacheKey, results);
    this.trackQuery('searchStandards', performance.now() - startTime);

    return results;
  }

  getStats() {
    const domainCounts = new Map<string, number>();
    for (const standard of this.standards) {
      const domain = standard.domain;
      domainCounts.set(domain, (domainCounts.get(domain) || 0) + 1);
    }

    return {
      totalStandards: this.standards.length,
      byDomain: Object.fromEntries(domainCounts),
      indexSizes: {
        codes: this.codeIndex.size,
        domains: this.domainIndex.size,
        fullTextKeywords: this.fullTextIndex.size
      }
    };
  }

  /**
   * Get query performance metrics
   */
  getQueryMetrics(): QueryMetrics {
    const methodStats: Record<string, number> = {};
    let slowestQuery = { method: 'none', time: 0 };

    for (const [method, stats] of this.queryMetrics.byMethod.entries()) {
      methodStats[method] = stats.count;
      if (stats.maxTime > slowestQuery.time) {
        slowestQuery = { method, time: stats.maxTime };
      }
    }

    return {
      totalQueries: this.queryMetrics.count,
      averageTime: this.queryMetrics.count > 0
        ? this.queryMetrics.totalTime / this.queryMetrics.count
        : 0,
      slowestQuery,
      queriesByMethod: methodStats
    };
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      cache: this.searchCache.getMetrics(),
      detailed: this.searchCache.getDetailedStats()
    };
  }

  /**
   * Clear query cache
   */
  clearCache(): void {
    this.searchCache.clear();
  }
}

// Singleton pattern
let dbInstance: NGSSDatabase | null = null;

export function initializeDatabase(dbPath?: string): NGSSDatabase {
  if (dbInstance) {
    return dbInstance;
  }
  dbInstance = new NGSSDatabase(dbPath);
  return dbInstance;
}

export function getDatabase(): NGSSDatabase {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return dbInstance;
}