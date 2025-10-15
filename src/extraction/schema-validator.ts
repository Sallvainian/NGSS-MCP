import type { Standard, ExtractionResult } from '../types/ngss.js';
import { StandardSchema } from '../types/ngss.js';
import { ZodError } from 'zod';

export class SchemaValidator {
  validate(standard: Standard): ExtractionResult<Standard> {
    try {
      const validated = StandardSchema.parse(standard);
      return { success: true, data: validated };
    } catch (error) {
      if (error instanceof ZodError) {
        return {
          success: false,
          error: 'Validation failed',
          validation_errors: error.errors.map(e => e.path.join('.') + ': ' + e.message)
        };
      }
      return { success: false, error: 'Unknown validation error' };
    }
  }

  validateBatch(standards: Standard[]): ExtractionResult<Standard[]> {
    const validated: Standard[] = [];
    const errors: string[] = [];
    for (const standard of standards) {
      const result = this.validate(standard);
      if (result.success && result.data) {
        validated.push(result.data);
      } else {
        errors.push(standard.code + ': ' + (result.error || 'Validation failed'));
      }
    }
    return errors.length > 0 
      ? { success: false, data: validated, validation_errors: errors }
      : { success: true, data: validated };
  }

  check3DCompleteness(standard: Standard): boolean {
    return !!(standard.sep?.code && standard.dci?.code && standard.ccc?.code);
  }

  validate3DBatch(standards: Standard[]) {
    const complete: Standard[] = [];
    const incomplete: Standard[] = [];
    for (const s of standards) {
      (this.check3DCompleteness(s) ? complete : incomplete).push(s);
    }
    return { complete, incomplete };
  }
}
