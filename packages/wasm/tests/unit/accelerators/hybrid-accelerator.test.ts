/**
 * Tests for HybridAccelerator
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HybridAccelerator, HybridOperationImplementation } from '../../../src/accelerators/hybrid-accelerator';
import { AcceleratorTier } from '../../../src/accelerators/accelerator';
import { ProcessingStrategy } from '../../../src/utils/enhanced-input-characteristics';

// Mock the EnhancedInputCharacteristicsAnalyzer
vi.mock('../../../src/utils/enhanced-input-characteristics', () => {
  return {
    EnhancedInputCharacteristicsAnalyzer: {
      analyzeArray: vi.fn().mockImplementation(() => ({
        size: 1000,
        sizeCategory: 'medium',
        dataType: 'number',
        isHomogeneous: true,
        densityCategory: 'dense',
        valueRangeCategory: 'medium',
        isIntegerOnly: true,
        isSmallIntegerOnly: true,
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

describe('HybridAccelerator', () => {
  // Test domain, type, and operation
  const domain = 'test-domain';
  const type = 'test-type';
  const operation = 'test-operation';

  // Test implementation
  const implementation: HybridOperationImplementation<number[], number[], number[]> = {
    preprocess: vi.fn((input: number[]) => input.map(x => x * 2)),
    process: vi.fn((input: number[]) => input.map(x => x + 1)),
    postprocess: vi.fn((input: number[]) => input.map(x => x / 2)),
    jsImplementation: vi.fn((input: number[]) => input.map(x => x + 1))
  };

  // Test accelerator
  let accelerator: HybridAccelerator<number[], number[], number[]>;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Create a new accelerator for each test
    accelerator = new HybridAccelerator(domain, type, operation, {
      implementation,
      estimatedSpeedup: 1.5,
      useEnhancedAnalysis: true
    });
  });

  describe('constructor', () => {
    it('should create a hybrid accelerator', () => {
      expect(accelerator).toBeInstanceOf(HybridAccelerator);
    });

    it('should accept options', () => {
      const acceleratorWithOptions = new HybridAccelerator(domain, type, operation, {
        implementation,
        estimatedSpeedup: 2.0,
        effectiveInputSize: 1000,
        memoryOverhead: 4096,
        useEnhancedAnalysis: true
      });

      expect(acceleratorWithOptions).toBeInstanceOf(HybridAccelerator);
    });
  });

  describe('determineTier', () => {
    it('should use enhanced analysis if enabled', () => {
      const input = [1, 2, 3];
      const tier = accelerator.determineTier(input);

      // The mock returns ProcessingStrategy.HYBRID, which maps to AcceleratorTier.CONDITIONAL
      expect(tier).toBe(AcceleratorTier.CONDITIONAL);
    });

    it('should use default tier determination if enhanced analysis is disabled', () => {
      // Create an accelerator without enhanced analysis
      const acceleratorWithoutEnhancedAnalysis = new HybridAccelerator(domain, type, operation, {
        implementation,
        useEnhancedAnalysis: false
      });

      const input = [1, 2, 3];
      const tier = acceleratorWithoutEnhancedAnalysis.determineTier(input);

      // Default to JS_PREFERRED for small arrays
      expect(tier).toBe(AcceleratorTier.JS_PREFERRED);
    });
  });

  describe('executeWithTier', () => {
    it('should use JavaScript implementation for JS_PREFERRED tier', () => {
      const input = [1, 2, 3];
      (accelerator as any).executeWithTier(input, AcceleratorTier.JS_PREFERRED);

      expect(implementation.jsImplementation).toHaveBeenCalledWith(input);
      expect(implementation.preprocess).not.toHaveBeenCalled();
      expect(implementation.process).not.toHaveBeenCalled();
      expect(implementation.postprocess).not.toHaveBeenCalled();
    });

    it('should use hybrid implementation for CONDITIONAL tier', () => {
      const input = [1, 2, 3];
      (accelerator as any).executeWithTier(input, AcceleratorTier.CONDITIONAL);

      expect(implementation.preprocess).toHaveBeenCalledWith(input);
      expect(implementation.process).toHaveBeenCalled();
      expect(implementation.postprocess).toHaveBeenCalled();
      expect(implementation.jsImplementation).not.toHaveBeenCalled();
    });

    it('should use hybrid implementation for HIGH_VALUE tier', () => {
      const input = [1, 2, 3];
      (accelerator as any).executeWithTier(input, AcceleratorTier.HIGH_VALUE);

      expect(implementation.preprocess).toHaveBeenCalledWith(input);
      expect(implementation.process).toHaveBeenCalled();
      expect(implementation.postprocess).toHaveBeenCalled();
      expect(implementation.jsImplementation).not.toHaveBeenCalled();
    });

    it('should fall back to JavaScript implementation if hybrid implementation fails', () => {
      // Make the preprocess function throw an error
      implementation.preprocess.mockImplementationOnce(() => {
        throw new Error('Preprocess error');
      });

      const input = [1, 2, 3];
      (accelerator as any).executeWithTier(input, AcceleratorTier.HIGH_VALUE);

      expect(implementation.preprocess).toHaveBeenCalledWith(input);
      expect(implementation.jsImplementation).toHaveBeenCalledWith(input);
    });
  });

  describe('execute', () => {
    it('should execute the operation with the appropriate tier', () => {
      // Mock determineTier to return CONDITIONAL
      vi.spyOn(accelerator, 'determineTier').mockReturnValueOnce(AcceleratorTier.CONDITIONAL);

      const input = [1, 2, 3];
      accelerator.execute(input);

      expect(implementation.preprocess).toHaveBeenCalledWith(input);
      expect(implementation.process).toHaveBeenCalled();
      expect(implementation.postprocess).toHaveBeenCalled();
    });

    it('should call executeWithTier when executing an operation', () => {
      // Mock executeWithTier to directly call the JS implementation
      // This ensures we don't need to rely on the actual tier determination
      const executeWithTierSpy = vi.spyOn(accelerator as any, 'executeWithTier');

      const input = [1, 2, 3];
      accelerator.execute(input);

      // Verify that executeWithTier was called
      expect(executeWithTierSpy).toHaveBeenCalled();
    });

    it('should provide performance statistics', () => {
      // We're just testing that the getPerformanceStats method returns an object with the expected structure
      // We don't care about the actual values since they depend on the implementation details
      const stats = accelerator.getPerformanceStats();

      // Verify the structure of the stats object
      expect(stats).toHaveProperty('tierUsage');
      expect(stats).toHaveProperty('averageExecutionTime');
      expect(stats).toHaveProperty('inputSizeDistribution');

      // Verify that the tierUsage object has the expected properties
      expect(stats.tierUsage).toHaveProperty(AcceleratorTier.JS_PREFERRED);
      expect(stats.tierUsage).toHaveProperty(AcceleratorTier.CONDITIONAL);
      expect(stats.tierUsage).toHaveProperty(AcceleratorTier.HIGH_VALUE);

      // Verify that the averageExecutionTime object has the expected properties
      expect(stats.averageExecutionTime).toHaveProperty(AcceleratorTier.JS_PREFERRED);
      expect(stats.averageExecutionTime).toHaveProperty(AcceleratorTier.CONDITIONAL);
      expect(stats.averageExecutionTime).toHaveProperty(AcceleratorTier.HIGH_VALUE);

      // Verify that the inputSizeDistribution object has the expected properties
      expect(stats.inputSizeDistribution).toHaveProperty(AcceleratorTier.JS_PREFERRED);
      expect(stats.inputSizeDistribution).toHaveProperty(AcceleratorTier.CONDITIONAL);
      expect(stats.inputSizeDistribution).toHaveProperty(AcceleratorTier.HIGH_VALUE);
    });
  });

  describe('getPerformanceProfile', () => {
    it('should return the performance profile', () => {
      const profile = accelerator.getPerformanceProfile();

      expect(profile.estimatedSpeedup).toBe(1.5);
    });
  });
});
