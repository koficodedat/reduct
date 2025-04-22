/**
 * Tests for FrequencyAwareAccelerator
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FrequencyAwareAccelerator } from '../../../src/accelerators/frequency-aware-accelerator';
import { AcceleratorTier } from '@reduct/shared-types/wasm';

describe('FrequencyAwareAccelerator', () => {
  // Test domain, type, and operation
  const domain = 'test-domain';
  const type = 'test-type';
  const operation = 'test-operation';

  // Mock implementations
  const jsImplementation = vi.fn((input: number[]) => input.map(x => x * 2));
  const wasmImplementation = vi.fn((input: number[]) => input.map(x => x * 2));

  // Test accelerator
  let accelerator: FrequencyAwareAccelerator<number[], number[]>;

  beforeEach(() => {
    // Reset mocks
    jsImplementation.mockClear();
    wasmImplementation.mockClear();

    // Create a new accelerator for each test
    accelerator = new FrequencyAwareAccelerator(domain, type, operation, {
      jsImplementation,
      wasmImplementation,
      estimatedSpeedup: 2.0,
      useFrequencyDetection: true
    });
  });

  describe('executeWithTier', () => {
    it('should use JavaScript implementation for JS_PREFERRED tier', () => {
      // Execute with JS_PREFERRED tier
      const input = [1, 2, 3];
      const result = (accelerator as any).executeWithTier(input, AcceleratorTier.JS_PREFERRED);

      // Verify that the JavaScript implementation was called
      expect(jsImplementation).toHaveBeenCalledWith(input);
      expect(wasmImplementation).not.toHaveBeenCalled();
      expect(result).toEqual([2, 4, 6]);
    });

    it('should use WebAssembly implementation for HIGH_VALUE tier', () => {
      // Execute with HIGH_VALUE tier
      const input = [1, 2, 3];
      const result = (accelerator as any).executeWithTier(input, AcceleratorTier.HIGH_VALUE);

      // Verify that the WebAssembly implementation was called
      expect(wasmImplementation).toHaveBeenCalledWith(input);
      expect(jsImplementation).not.toHaveBeenCalled();
      expect(result).toEqual([2, 4, 6]);
    });

    it('should use WebAssembly implementation for CONDITIONAL tier', () => {
      // Execute with CONDITIONAL tier
      const input = [1, 2, 3];
      const result = (accelerator as any).executeWithTier(input, AcceleratorTier.CONDITIONAL);

      // Verify that the WebAssembly implementation was called
      expect(wasmImplementation).toHaveBeenCalledWith(input);
      expect(jsImplementation).not.toHaveBeenCalled();
      expect(result).toEqual([2, 4, 6]);
    });

    it('should fall back to JavaScript implementation if WebAssembly fails', () => {
      // Make the WebAssembly implementation throw an error
      wasmImplementation.mockImplementationOnce(() => {
        throw new Error('WebAssembly error');
      });

      // Execute with HIGH_VALUE tier
      const input = [1, 2, 3];
      const result = (accelerator as any).executeWithTier(input, AcceleratorTier.HIGH_VALUE);

      // Verify that both implementations were called
      expect(wasmImplementation).toHaveBeenCalledWith(input);
      expect(jsImplementation).toHaveBeenCalledWith(input);
      expect(result).toEqual([2, 4, 6]);
    });
  });

  describe('getPerformanceProfile', () => {
    it('should return the performance profile', () => {
      // Get the performance profile
      const profile = accelerator.getPerformanceProfile();

      // Verify the profile
      expect(profile.estimatedSpeedup).toBe(2.0);
    });
  });

  describe('execute', () => {
    it('should execute the operation with the appropriate tier', () => {
      // Mock determineTier to return HIGH_VALUE
      vi.spyOn(accelerator, 'determineTier').mockReturnValueOnce(AcceleratorTier.HIGH_VALUE);

      // Execute the operation
      const input = [1, 2, 3];
      const result = accelerator.execute(input);

      // Verify that the WebAssembly implementation was called
      expect(wasmImplementation).toHaveBeenCalledWith(input);
      expect(result).toEqual([2, 4, 6]);
    });

    it('should update performance statistics', () => {
      // Execute the operation
      const input = [1, 2, 3];
      accelerator.execute(input);

      // Get the performance statistics
      const stats = accelerator.getPerformanceStats();

      // Verify that the statistics were updated
      expect(stats.tierUsage[AcceleratorTier.JS_PREFERRED]).toBe(1);
      expect(stats.averageExecutionTime[AcceleratorTier.JS_PREFERRED]).toBeGreaterThan(0);
    });
  });

  describe('frequency detection', () => {
    it('should use frequency detection if enabled', () => {
      // Create an accelerator with frequency detection
      const acceleratorWithFrequencyDetection = new FrequencyAwareAccelerator(domain, type, operation, {
        jsImplementation,
        wasmImplementation,
        useFrequencyDetection: true
      });

      // Execute the operation to initialize frequency detection
      acceleratorWithFrequencyDetection.execute([1, 2, 3]);

      // Get the frequency detection statistics
      const stats = acceleratorWithFrequencyDetection.getFrequencyDetectionStats();

      // Verify that frequency detection is enabled
      expect(stats).toBeDefined();
    });

    it('should not use frequency detection if disabled', () => {
      // Create an accelerator without frequency detection
      const acceleratorWithoutFrequencyDetection = new FrequencyAwareAccelerator(domain, type, operation, {
        jsImplementation,
        wasmImplementation,
        useFrequencyDetection: false
      });

      // Get the frequency detection statistics
      const stats = acceleratorWithoutFrequencyDetection.getFrequencyDetectionStats();

      // Verify that frequency detection is disabled
      expect(stats).toBeUndefined();
    });
  });
});
