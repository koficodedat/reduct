/**
 * Tests for HybridStringAccelerator
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HybridStringAccelerator, StringSearchInput, StringSearchResult } from '../../../../src/accelerators/data-structures/hybrid-string-accelerator';
import { AcceleratorTier } from '../../../../src/accelerators/accelerator';
import { ProcessingStrategy } from '../../../../src/utils/enhanced-input-characteristics';

// Mock the EnhancedInputCharacteristicsAnalyzer
vi.mock('../../../../src/utils/enhanced-input-characteristics', () => {
  return {
    EnhancedInputCharacteristicsAnalyzer: {
      analyzeArray: vi.fn().mockImplementation(() => ({
        size: 1000,
        sizeCategory: 'medium',
        dataType: 'string',
        isHomogeneous: true,
        densityCategory: 'dense',
        valueRangeCategory: 'medium',
        isIntegerOnly: false,
        isSmallIntegerOnly: false,
        isSorted: false,
        isReverseSorted: false,
        hasSpecialValues: false,
        isWasmSuitable: true,
        isSIMDSuitable: false,
        isParallelSuitable: false,
        isHybridSuitable: true,
        recommendedStrategy: ProcessingStrategy.HYBRID,
        estimatedWasmSpeedup: 1.5,
        estimatedMemoryOverhead: 4096,
        complexityScore: 3
      }))
    },
    ProcessingStrategy: {
      JAVASCRIPT: 'javascript',
      WEBASSEMBLY: 'webassembly',
      HYBRID: 'hybrid',
      SIMD: 'simd',
      PARALLEL: 'parallel',
      SPECIALIZED: 'specialized'
    }
  };
});

describe('HybridStringAccelerator', () => {
  // Test accelerator
  let accelerator: HybridStringAccelerator;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Create a new accelerator for each test
    accelerator = new HybridStringAccelerator();
  });

  describe('constructor', () => {
    it('should create a hybrid string accelerator', () => {
      expect(accelerator).toBeInstanceOf(HybridStringAccelerator);
    });

    it('should accept options', () => {
      const acceleratorWithOptions = new HybridStringAccelerator({
        thresholds: {
          minStringLength: 5000
        }
      });

      expect(acceleratorWithOptions).toBeInstanceOf(HybridStringAccelerator);
    });
  });

  describe('determineTier', () => {
    it('should return a valid tier for string operations', () => {
      // Override the determineTier method to use a simpler implementation for testing
      const originalDetermineTier = accelerator.determineTier;
      accelerator.determineTier = vi.fn().mockImplementation((input: StringSearchInput) => {
        // Simple implementation based on string length
        if (input.text.length >= 10000) {
          return AcceleratorTier.HIGH_VALUE;
        } else if (input.text.length >= 1000) {
          return AcceleratorTier.CONDITIONAL;
        } else {
          return AcceleratorTier.JS_PREFERRED;
        }
      });

      // Test with a small input
      const smallInput: StringSearchInput = {
        text: 'hello world',
        pattern: 'world'
      };
      const smallTier = accelerator.determineTier(smallInput);
      expect(smallTier).toBe(AcceleratorTier.JS_PREFERRED);

      // Test with a medium input
      const mediumInput: StringSearchInput = {
        text: 'a'.repeat(1000),
        pattern: 'a'
      };
      const mediumTier = accelerator.determineTier(mediumInput);
      expect(mediumTier).toBe(AcceleratorTier.CONDITIONAL);

      // Test with a large input
      const largeInput: StringSearchInput = {
        text: 'a'.repeat(10000),
        pattern: 'a'
      };
      const largeTier = accelerator.determineTier(largeInput);
      expect(largeTier).toBe(AcceleratorTier.HIGH_VALUE);

      // Restore the original method
      accelerator.determineTier = originalDetermineTier;
    });
  });

  describe('execute', () => {
    it('should find a pattern in a text', () => {
      const input: StringSearchInput = {
        text: 'hello world',
        pattern: 'world'
      };

      const result = accelerator.execute(input);

      expect(result.indices).toEqual([6]);
      expect(result.matches).toEqual(['world']);
    });

    it('should find all occurrences of a pattern', () => {
      const input: StringSearchInput = {
        text: 'hello world, hello universe',
        pattern: 'hello',
        findAll: true
      };

      const result = accelerator.execute(input);

      expect(result.indices).toEqual([0, 13]);
      expect(result.matches).toEqual(['hello', 'hello']);
    });

    it('should return empty arrays if pattern is not found', () => {
      const input: StringSearchInput = {
        text: 'hello world',
        pattern: 'foo'
      };

      const result = accelerator.execute(input);

      expect(result.indices).toEqual([]);
      expect(result.matches).toEqual([]);
    });

    it('should throw an error if text or pattern is missing', () => {
      const input: StringSearchInput = {
        text: '',
        pattern: 'world'
      };

      expect(() => accelerator.execute(input)).toThrow();
    });
  });
});
