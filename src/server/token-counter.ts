/**
 * Token Counter Module
 * Provides token estimation utilities for response size optimization
 */

/**
 * Estimate token count using chars/4 approximation
 * This is a rough estimate based on GPT tokenization patterns
 *
 * @param text - The text to estimate tokens for
 * @returns Estimated token count
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Estimate tokens for a JSON object
 *
 * @param obj - The object to estimate tokens for
 * @returns Estimated token count
 */
export function estimateTokensForObject(obj: unknown): number {
  const jsonString = JSON.stringify(obj);
  return estimateTokens(jsonString);
}

/**
 * Get token metadata for a response
 *
 * @param input - The input query/request
 * @param output - The output response
 * @returns Token metadata object
 */
export function getTokenMetadata(input: string, output: unknown): {
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
} {
  const inputTokens = estimateTokens(input);
  const outputTokens = estimateTokensForObject(output);

  return {
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    total_tokens: inputTokens + outputTokens
  };
}
