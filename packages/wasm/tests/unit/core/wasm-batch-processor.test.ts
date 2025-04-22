/**
 * Tests for WasmBatchProcessor
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WasmBatchProcessor, BatchProcessorConfig } from '../../../src/core/wasm-batch-processor';

describe('WasmBatchProcessor', () => {
  let batchProcessor: WasmBatchProcessor<number, number>;

  beforeEach(() => {
    // Create a new batch processor for each test
    batchProcessor = new WasmBatchProcessor<number, number>({
      maxBatchSize: 5,
      maxBatchDelay: 10
    });
  });

  describe('constructor', () => {
    it('should create a batch processor with default configuration', () => {
      const processor = new WasmBatchProcessor();
      expect(processor).toBeDefined();
    });

    it('should accept configuration options', () => {
      const config: BatchProcessorConfig = {
        maxBatchSize: 10,
        maxBatchDelay: 20
      };
      const processor = new WasmBatchProcessor(config);
      expect(processor).toBeDefined();
    });
  });

  describe('add', () => {
    it('should add an operation to the batch', async () => {
      const operation = (x: number) => x * 2;
      const promise = batchProcessor.add(5, operation);
      expect(batchProcessor.getBatchSize()).toBe(1);
      expect(promise).toBeInstanceOf(Promise);
    });

    it('should process the batch when it reaches maxBatchSize', async () => {
      const operation = (x: number) => x * 2;
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(batchProcessor.add(i, operation));
      }
      // The batch might be processed immediately or asynchronously
      // So we can't reliably check isProcessing() here
      expect(batchProcessor.getBatchSize()).toBe(0);
      const results = await Promise.all(promises);
      expect(results).toEqual([0, 2, 4, 6, 8]);
    });

    it('should process the batch after maxBatchDelay', async () => {
      const operation = (x: number) => x * 2;
      const promise = batchProcessor.add(5, operation);
      expect(batchProcessor.getBatchSize()).toBe(1);
      const result = await promise;
      expect(result).toBe(10);
      expect(batchProcessor.getBatchSize()).toBe(0);
    });

    it('should handle errors in operations', async () => {
      const operation = (x: number) => {
        if (x === 0) {
          throw new Error('Zero not allowed');
        }
        return x * 2;
      };
      const promise1 = batchProcessor.add(0, operation);
      const promise2 = batchProcessor.add(5, operation);
      const result1 = await promise1.catch(e => e);
      const result2 = await promise2;
      expect(result1).toBeNull();
      expect(result2).toBe(10);
    });
  });

  describe('flush', () => {
    it('should process all pending operations', async () => {
      const operation = (x: number) => x * 2;
      const promises = [];
      for (let i = 0; i < 3; i++) {
        promises.push(batchProcessor.add(i, operation));
      }
      expect(batchProcessor.getBatchSize()).toBe(3);
      await batchProcessor.flush();
      expect(batchProcessor.getBatchSize()).toBe(0);
      const results = await Promise.all(promises);
      expect(results).toEqual([0, 2, 4]);
    });

    it('should do nothing if there are no pending operations', async () => {
      await batchProcessor.flush();
      expect(batchProcessor.getBatchSize()).toBe(0);
    });
  });

  describe('getBatchSize', () => {
    it('should return the number of operations in the batch', () => {
      expect(batchProcessor.getBatchSize()).toBe(0);
      batchProcessor.add(1, x => x * 2);
      expect(batchProcessor.getBatchSize()).toBe(1);
      batchProcessor.add(2, x => x * 2);
      expect(batchProcessor.getBatchSize()).toBe(2);
    });
  });

  describe('isProcessing', () => {
    it('should return whether the processor is processing a batch', async () => {
      expect(batchProcessor.isProcessing()).toBe(false);

      // Manually set processing to true to test the getter
      (batchProcessor as any).processing = true;
      expect(batchProcessor.isProcessing()).toBe(true);

      // Reset processing
      (batchProcessor as any).processing = false;
      expect(batchProcessor.isProcessing()).toBe(false);
    });
  });
});
