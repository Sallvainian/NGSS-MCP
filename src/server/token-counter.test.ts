/**
 * Unit Tests for Token Counter Module
 */

import { describe, test, expect } from 'bun:test';
import { estimateTokens, estimateTokensForObject, getTokenMetadata } from './token-counter.js';

describe('estimateTokens', () => {
  test('should estimate tokens using chars/4 approximation', () => {
    const text = 'Hello world'; // 11 chars
    const result = estimateTokens(text);
    expect(result).toBe(Math.ceil(11 / 4)); // 3 tokens
  });

  test('should round up fractional tokens', () => {
    const text = 'Hi'; // 2 chars -> 0.5 tokens -> should round up to 1
    const result = estimateTokens(text);
    expect(result).toBe(1);
  });

  test('should handle empty string', () => {
    const result = estimateTokens('');
    expect(result).toBe(0);
  });

  test('should handle longer text', () => {
    const text = 'This is a longer piece of text to test token estimation'; // 56 chars
    const result = estimateTokens(text);
    expect(result).toBe(Math.ceil(56 / 4)); // 14 tokens
  });
});

describe('estimateTokensForObject', () => {
  test('should estimate tokens for simple object', () => {
    const obj = { code: 'MS-PS1-1', topic: 'Matter' };
    const result = estimateTokensForObject(obj);

    // JSON.stringify adds quotes and braces
    const jsonString = JSON.stringify(obj);
    const expected = Math.ceil(jsonString.length / 4);

    expect(result).toBe(expected);
  });

  test('should estimate tokens for nested object', () => {
    const obj = {
      code: 'MS-PS1-1',
      data: {
        nested: 'value',
        array: [1, 2, 3]
      }
    };
    const result = estimateTokensForObject(obj);

    const jsonString = JSON.stringify(obj);
    const expected = Math.ceil(jsonString.length / 4);

    expect(result).toBe(expected);
  });

  test('should handle null', () => {
    const result = estimateTokensForObject(null);
    expect(result).toBe(1); // "null" is 4 chars / 4 = 1 token
  });

  test('should handle array', () => {
    const arr = ['one', 'two', 'three'];
    const result = estimateTokensForObject(arr);

    const jsonString = JSON.stringify(arr);
    const expected = Math.ceil(jsonString.length / 4);

    expect(result).toBe(expected);
  });
});

describe('getTokenMetadata', () => {
  test('should return token metadata with input, output, and total', () => {
    const input = 'MS-PS1-1';
    const output = { code: 'MS-PS1-1', topic: 'Matter' };

    const result = getTokenMetadata(input, output);

    expect(result).toHaveProperty('input_tokens');
    expect(result).toHaveProperty('output_tokens');
    expect(result).toHaveProperty('total_tokens');

    expect(result.input_tokens).toBe(Math.ceil(input.length / 4));
    expect(result.output_tokens).toBe(Math.ceil(JSON.stringify(output).length / 4));
    expect(result.total_tokens).toBe(result.input_tokens + result.output_tokens);
  });

  test('should calculate total as sum of input and output', () => {
    const input = 'test query';
    const output = { result: 'data' };

    const result = getTokenMetadata(input, output);

    expect(result.total_tokens).toBe(result.input_tokens + result.output_tokens);
  });

  test('should handle empty input', () => {
    const input = '';
    const output = { data: 'value' };

    const result = getTokenMetadata(input, output);

    expect(result.input_tokens).toBe(0);
    expect(result.output_tokens).toBeGreaterThan(0);
    expect(result.total_tokens).toBe(result.output_tokens);
  });
});
