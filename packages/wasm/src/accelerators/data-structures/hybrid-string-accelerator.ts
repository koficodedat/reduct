/**
 * Hybrid string accelerator
 *
 * Provides optimized implementations of string operations using a hybrid approach
 * that combines JavaScript and WebAssembly.
 */

import { HybridAccelerator, HybridOperationImplementation } from '../hybrid-accelerator';
import { AcceleratorOptions, AcceleratorTier } from '@reduct/shared-types/wasm';
import { WebAssemblyFeature } from '@reduct/shared-types/wasm';
import { EnhancedInputCharacteristicsAnalyzer } from '../../utils/enhanced-input-characteristics';

/**
 * Input for the string search operation
 */
export interface StringSearchInput {
  /**
   * The text to search in
   */
  text: string;

  /**
   * The pattern to search for
   */
  pattern: string;

  /**
   * Whether to search for all occurrences
   */
  findAll?: boolean;
}

/**
 * Result of the string search operation
 */
export interface StringSearchResult {
  /**
   * The indices of the matches
   */
  indices: number[];

  /**
   * The matches
   */
  matches: string[];
}

/**
 * Intermediate data for string search
 */
interface StringSearchIntermediate {
  /**
   * The text to search in
   */
  text: string;

  /**
   * The pattern to search for
   */
  pattern: string;

  /**
   * Whether to search for all occurrences
   */
  findAll: boolean;

  /**
   * The indices of the matches
   */
  indices: number[];
}

/**
 * Hybrid string accelerator
 *
 * Provides optimized implementations of string operations using a hybrid approach
 * that combines JavaScript and WebAssembly.
 */
export class HybridStringAccelerator extends HybridAccelerator<StringSearchInput, StringSearchResult, StringSearchIntermediate> {
  /**
   * Create a new hybrid string accelerator
   *
   * @param options Options for the accelerator
   */
  constructor(options: AcceleratorOptions = {}) {
    // Create the hybrid operation implementation
    const implementation: HybridOperationImplementation<StringSearchInput, StringSearchResult, StringSearchIntermediate> = {
      // Preprocessing: Validate and normalize input (JavaScript)
      preprocess: (input: StringSearchInput): StringSearchIntermediate => {
        // Validate input
        if (!input.text || !input.pattern) {
          throw new Error('Text and pattern are required');
        }

        // Normalize input
        return {
          text: input.text,
          pattern: input.pattern,
          findAll: input.findAll || false,
          indices: []
        };
      },

      // Core processing: Find pattern matches (WebAssembly)
      process: (input: StringSearchIntermediate): StringSearchIntermediate => {
        // This would be implemented in WebAssembly
        // For now, we'll use a JavaScript implementation
        const { text, pattern, findAll } = input;
        const indices: number[] = [];

        // Simple string search algorithm
        let index = text.indexOf(pattern);
        while (index !== -1) {
          indices.push(index);
          if (!findAll) {
            break;
          }
          index = text.indexOf(pattern, index + 1);
        }

        return {
          ...input,
          indices
        };
      },

      // Postprocessing: Extract matches and format result (JavaScript)
      postprocess: (input: StringSearchIntermediate): StringSearchResult => {
        const { text, pattern, indices } = input;
        const matches: string[] = indices.map(() => pattern);

        return {
          indices,
          matches
        };
      },

      // Pure JavaScript implementation
      jsImplementation: (input: StringSearchInput): StringSearchResult => {
        // Validate input
        if (!input.text || !input.pattern) {
          throw new Error('Text and pattern are required');
        }

        const { text, pattern, findAll } = input;
        const indices: number[] = [];
        const matches: string[] = [];

        // Simple string search algorithm
        let index = text.indexOf(pattern);
        while (index !== -1) {
          indices.push(index);
          matches.push(pattern);
          if (!findAll) {
            break;
          }
          index = text.indexOf(pattern, index + 1);
        }

        return {
          indices,
          matches
        };
      }
    };

    // Create the accelerator
    super('data-structures', 'string', 'search', {
      ...options,
      implementation,
      requiredFeatures: [WebAssemblyFeature.BASIC],
      useEnhancedAnalysis: true,
      // Default tiering strategy for string operations
      tiering: {
        // Tier 1: Always use WebAssembly for large strings
        [AcceleratorTier.HIGH_VALUE]: (input: StringSearchInput) => {
          return input.text.length >= 100000 || input.pattern.length >= 1000;
        },
        // Tier 2: Use WebAssembly for medium strings
        [AcceleratorTier.CONDITIONAL]: (input: StringSearchInput) => {
          return input.text.length >= 10000 || input.pattern.length >= 100;
        },
        // Tier 3: Use JavaScript for small strings
        [AcceleratorTier.JS_PREFERRED]: () => true,
      },
      // Default thresholds for string operations
      thresholds: {
        minStringLength: 10000,
      },
      // Estimated speedup for string operations
      estimatedSpeedup: 1.5,
      // Effective input size for string operations
      effectiveInputSize: 10000,
    });
  }

  /**
   * Determine the appropriate tier for the input
   *
   * @param input The input for the operation
   * @returns The appropriate tier
   */
  public override determineTier(input: StringSearchInput): AcceleratorTier {
    // Use enhanced analysis for string operations
    const textCharacteristics = EnhancedInputCharacteristicsAnalyzer.analyzeArray(Array.from(input.text));
    const patternCharacteristics = EnhancedInputCharacteristicsAnalyzer.analyzeArray(Array.from(input.pattern));

    // Use the complexity score to determine the tier
    const textComplexity = textCharacteristics.complexityScore;
    const patternComplexity = patternCharacteristics.complexityScore;
    const totalComplexity = textComplexity + patternComplexity;

    // High complexity operations benefit from WebAssembly
    if (totalComplexity >= 8) {
      return AcceleratorTier.HIGH_VALUE;
    }

    // Medium complexity operations might benefit from WebAssembly
    if (totalComplexity >= 4) {
      return AcceleratorTier.CONDITIONAL;
    }

    // Low complexity operations are better in JavaScript
    return AcceleratorTier.JS_PREFERRED;
  }
}
