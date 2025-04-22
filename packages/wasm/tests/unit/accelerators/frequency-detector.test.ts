/**
 * Tests for FrequencyDetector
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { FrequencyDetector, FrequencyDetectorConfig } from '../../../src/accelerators/frequency-detector';
import { AcceleratorTier } from '../../../src/accelerators/accelerator';

describe('FrequencyDetector', () => {
  let detector: FrequencyDetector;
  const domain = 'test-domain';
  const type = 'test-type';
  const operation = 'test-operation';

  beforeEach(() => {
    // Create a new detector for each test
    detector = new FrequencyDetector();
  });

  describe('recordCall and recordResult', () => {
    it('should record a call and its result', () => {
      // Record a call
      const input = [1, 2, 3, 4, 5];
      const inputHash = detector.recordCall(domain, type, operation, input);

      // Record the result
      const result = [2, 4, 6, 8, 10];
      const executionTime = 10;
      detector.recordResult(domain, type, operation, inputHash, result, executionTime);

      // Get the stats
      const stats = detector.getStats(domain, type, operation);

      // Verify the stats
      expect(stats).toBeDefined();
      expect(stats?.callCount).toBe(1);
      expect(stats?.recentCalls.length).toBe(1);
      expect(stats?.recentCalls[0].inputHash).toBe(inputHash);
      expect(stats?.recentCalls[0].result).toEqual(result);
      expect(stats?.recentCalls[0].executionTime).toBe(executionTime);
      expect(stats?.averageExecutionTime).toBe(executionTime);
    });

    it('should update average execution time', () => {
      // Record multiple calls with different execution times
      const input1 = [1, 2, 3];
      const inputHash1 = detector.recordCall(domain, type, operation, input1);
      detector.recordResult(domain, type, operation, inputHash1, [2, 4, 6], 10);

      const input2 = [4, 5, 6];
      const inputHash2 = detector.recordCall(domain, type, operation, input2);
      detector.recordResult(domain, type, operation, inputHash2, [8, 10, 12], 20);

      // Get the stats
      const stats = detector.getStats(domain, type, operation);

      // Verify the average execution time
      expect(stats?.averageExecutionTime).toBe(15); // (10 + 20) / 2
    });
  });

  describe('getCachedResult', () => {
    it('should return undefined for non-cached inputs', () => {
      const input = [1, 2, 3];
      const result = detector.getCachedResult(domain, type, operation, input);
      expect(result).toBeUndefined();
    });

    it('should return cached results', () => {
      // Record a call and its result
      const input = [1, 2, 3];
      const inputHash = detector.recordCall(domain, type, operation, input);
      const expectedResult = [2, 4, 6];
      detector.recordResult(domain, type, operation, inputHash, expectedResult, 10);

      // Get the cached result
      const result = detector.getCachedResult(domain, type, operation, input);
      expect(result).toEqual(expectedResult);
    });

    it('should handle different input types', () => {
      // Test with a string
      const stringInput = 'test';
      const stringHash = detector.recordCall(domain, type, operation, stringInput);
      const stringResult = 'TEST';
      detector.recordResult(domain, type, operation, stringHash, stringResult, 5);

      // Test with an object
      const objectInput = { a: 1, b: 2 };
      const objectHash = detector.recordCall(domain, type, operation, objectInput);
      const objectResult = { a: 2, b: 4 };
      detector.recordResult(domain, type, operation, objectHash, objectResult, 15);

      // Get the cached results
      const cachedStringResult = detector.getCachedResult(domain, type, operation, stringInput);
      const cachedObjectResult = detector.getCachedResult(domain, type, operation, objectInput);

      // Verify the results
      expect(cachedStringResult).toEqual(stringResult);
      expect(cachedObjectResult).toEqual(objectResult);
    });
  });

  describe('determineTier', () => {
    it('should default to JS_PREFERRED for new operations', () => {
      const input = [1, 2, 3];
      const tier = detector.determineTier(domain, type, operation, input);
      expect(tier).toBe(AcceleratorTier.JS_PREFERRED);
    });

    it('should use HIGH_VALUE for high-frequency operations', () => {
      // Configure the detector with a low threshold
      const config: FrequencyDetectorConfig = {
        highValueFrequencyThreshold: 2, // 2 calls per second
        frequencyWindow: 1000 // 1 second
      };
      detector = new FrequencyDetector(config);

      // Record multiple calls in quick succession
      const input = [1, 2, 3];
      detector.recordCall(domain, type, operation, input);
      detector.recordCall(domain, type, operation, input);
      detector.recordCall(domain, type, operation, input);

      // Determine the tier
      const tier = detector.determineTier(domain, type, operation, input);
      expect(tier).toBe(AcceleratorTier.HIGH_VALUE);
    });

    it('should use CONDITIONAL for medium-frequency operations', () => {
      // Configure the detector with appropriate thresholds
      const config: FrequencyDetectorConfig = {
        highValueFrequencyThreshold: 10, // 10 calls per second
        conditionalFrequencyThreshold: 2, // 2 calls per second
        frequencyWindow: 1000 // 1 second
      };
      detector = new FrequencyDetector(config);

      // Record multiple calls in quick succession
      const input = [1, 2, 3];
      detector.recordCall(domain, type, operation, input);
      detector.recordCall(domain, type, operation, input);
      detector.recordCall(domain, type, operation, input);

      // Determine the tier
      const tier = detector.determineTier(domain, type, operation, input);
      expect(tier).toBe(AcceleratorTier.CONDITIONAL);
    });

    it('should use HIGH_VALUE for operations with long execution times', () => {
      // Configure the detector with appropriate thresholds
      const config: FrequencyDetectorConfig = {
        highValueExecutionTimeThreshold: 20, // 20 milliseconds
        conditionalExecutionTimeThreshold: 10 // 10 milliseconds
      };
      detector = new FrequencyDetector(config);

      // Record a call with a long execution time
      const input = [1, 2, 3];
      const inputHash = detector.recordCall(domain, type, operation, input);
      detector.recordResult(domain, type, operation, inputHash, [2, 4, 6], 30);

      // Determine the tier
      const tier = detector.determineTier(domain, type, operation, input);
      expect(tier).toBe(AcceleratorTier.HIGH_VALUE);
    });
  });

  describe('clear', () => {
    it('should clear all statistics and cache', () => {
      // Record a call and its result
      const input = [1, 2, 3];
      const inputHash = detector.recordCall(domain, type, operation, input);
      detector.recordResult(domain, type, operation, inputHash, [2, 4, 6], 10);

      // Clear the detector
      detector.clear();

      // Verify that the stats and cache are cleared
      const stats = detector.getStats(domain, type, operation);
      const cachedResult = detector.getCachedResult(domain, type, operation, input);

      expect(stats).toBeUndefined();
      expect(cachedResult).toBeUndefined();
    });
  });
});
