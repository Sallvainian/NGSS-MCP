/**
 * Query Validation and Sanitization
 * Provides input validation and sanitization for database queries
 */

export interface ValidationResult {
  isValid: boolean;
  sanitized?: string;
  error?: string;
}

export class QueryValidator {
  private static readonly MAX_QUERY_LENGTH = 500;
  private static readonly MIN_QUERY_LENGTH = 1;
  private static readonly MAX_LIMIT = 100;
  private static readonly VALID_DOMAINS = [
    'Physical Science',
    'Life Science',
    'Earth and Space Science',
    'physical-science',
    'life-science',
    'earth-space-science'
  ];

  /**
   * Validate and sanitize a search query string
   */
  static validateQuery(query: string): ValidationResult {
    // Check if query is provided
    if (query === undefined || query === null) {
      return {
        isValid: false,
        error: 'Query is required'
      };
    }

    // Convert to string and trim
    const sanitized = String(query).trim();

    // Check minimum length
    if (sanitized.length < this.MIN_QUERY_LENGTH) {
      return {
        isValid: false,
        error: 'Query must be at least 1 character'
      };
    }

    // Check maximum length
    if (sanitized.length > this.MAX_QUERY_LENGTH) {
      return {
        isValid: false,
        error: `Query exceeds maximum length of ${this.MAX_QUERY_LENGTH} characters`
      };
    }

    // Check for potential SQL injection patterns (defensive)
    if (this.containsSuspiciousPatterns(sanitized)) {
      return {
        isValid: false,
        error: 'Query contains invalid characters or patterns'
      };
    }

    return {
      isValid: true,
      sanitized
    };
  }

  /**
   * Validate limit parameter
   */
  static validateLimit(limit?: number): ValidationResult {
    if (limit === undefined || limit === null) {
      return { isValid: true }; // Optional parameter
    }

    const numLimit = Number(limit);

    if (!Number.isInteger(numLimit)) {
      return {
        isValid: false,
        error: 'Limit must be an integer'
      };
    }

    if (numLimit < 1) {
      return {
        isValid: false,
        error: 'Limit must be at least 1'
      };
    }

    if (numLimit > this.MAX_LIMIT) {
      return {
        isValid: false,
        error: `Limit cannot exceed ${this.MAX_LIMIT}`
      };
    }

    return { isValid: true };
  }

  /**
   * Validate domain parameter
   */
  static validateDomain(domain?: string): ValidationResult {
    if (domain === undefined || domain === null) {
      return { isValid: true }; // Optional parameter
    }

    const sanitized = String(domain).trim();

    if (!this.VALID_DOMAINS.includes(sanitized)) {
      return {
        isValid: false,
        error: `Invalid domain. Must be one of: ${this.VALID_DOMAINS.slice(0, 3).join(', ')}`
      };
    }

    return {
      isValid: true,
      sanitized
    };
  }

  /**
   * Validate standard code format
   */
  static validateStandardCode(code: string): ValidationResult {
    if (!code) {
      return {
        isValid: false,
        error: 'Standard code is required'
      };
    }

    const sanitized = String(code).trim();

    // Check format: MS-{PS|LS|ESS}{number}-{number}
    const codePattern = /^MS-(PS|LS|ESS)\d+-\d+$/;

    if (!codePattern.test(sanitized)) {
      return {
        isValid: false,
        error: 'Invalid standard code format. Expected: MS-{PS|LS|ESS}{number}-{number}'
      };
    }

    return {
      isValid: true,
      sanitized
    };
  }

  /**
   * Check for suspicious patterns that might indicate injection attempts
   */
  private static containsSuspiciousPatterns(input: string): boolean {
    // Check for common injection patterns (defensive security)
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,  // Event handlers like onclick=
      /\$\{/,         // Template literal injection
      /\{\{/,         // Template injection
      /__proto__/,    // Prototype pollution
      /constructor/i  // Constructor access
    ];

    return suspiciousPatterns.some(pattern => pattern.test(input));
  }

  /**
   * Sanitize text input by removing potentially harmful characters
   */
  static sanitizeText(input: string): string {
    return String(input)
      .trim()
      // Remove control characters
      .replace(/[\x00-\x1F\x7F]/g, '')
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      // Trim to max length
      .slice(0, this.MAX_QUERY_LENGTH);
  }

  /**
   * Validate search options object
   */
  static validateSearchOptions(options: {
    domain?: string;
    limit?: number;
  }): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate domain if provided
    if (options.domain !== undefined) {
      const domainResult = this.validateDomain(options.domain);
      if (!domainResult.isValid) {
        errors.push(domainResult.error!);
      }
    }

    // Validate limit if provided
    if (options.limit !== undefined) {
      const limitResult = this.validateLimit(options.limit);
      if (!limitResult.isValid) {
        errors.push(limitResult.error!);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
