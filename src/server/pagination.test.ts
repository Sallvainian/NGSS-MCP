/**
 * Pagination Utility Tests
 * Unit tests for pagination metadata builder
 */

import { describe, expect, test } from 'bun:test';
import { buildPaginationMetadata } from './response-formatter.js';

describe('buildPaginationMetadata', () => {
  test('should return correct metadata for first page', () => {
    const metadata = buildPaginationMetadata(100, 0, 10);

    expect(metadata).toEqual({
      total: 100,
      offset: 0,
      limit: 10,
      hasMore: true
    });
  });

  test('should return correct metadata for middle page', () => {
    const metadata = buildPaginationMetadata(100, 20, 10);

    expect(metadata).toEqual({
      total: 100,
      offset: 20,
      limit: 10,
      hasMore: true
    });
  });

  test('should return correct metadata for last page (exact)', () => {
    const metadata = buildPaginationMetadata(100, 90, 10);

    expect(metadata).toEqual({
      total: 100,
      offset: 90,
      limit: 10,
      hasMore: false
    });
  });

  test('should return correct metadata for last page (partial)', () => {
    const metadata = buildPaginationMetadata(95, 90, 10);

    expect(metadata).toEqual({
      total: 95,
      offset: 90,
      limit: 10,
      hasMore: false
    });
  });

  test('should return hasMore=false when offset >= total', () => {
    const metadata = buildPaginationMetadata(100, 100, 10);

    expect(metadata).toEqual({
      total: 100,
      offset: 100,
      limit: 10,
      hasMore: false
    });
  });

  test('should handle single result set', () => {
    const metadata = buildPaginationMetadata(1, 0, 10);

    expect(metadata).toEqual({
      total: 1,
      offset: 0,
      limit: 10,
      hasMore: false
    });
  });

  test('should handle empty result set', () => {
    const metadata = buildPaginationMetadata(0, 0, 10);

    expect(metadata).toEqual({
      total: 0,
      offset: 0,
      limit: 10,
      hasMore: false
    });
  });

  test('should calculate hasMore correctly at boundary', () => {
    // offset + limit exactly equals total
    const metadata = buildPaginationMetadata(50, 40, 10);

    expect(metadata.hasMore).toBe(false);
  });

  test('should calculate hasMore correctly just before boundary', () => {
    // offset + limit is one less than total
    const metadata = buildPaginationMetadata(50, 39, 10);

    expect(metadata.hasMore).toBe(true);
  });
});
