/**
 * WebAssembly batch processor
 * 
 * Provides a way to batch WebAssembly operations to reduce the overhead of crossing
 * the JavaScript/WebAssembly boundary.
 */

import { WasmMemoryPool } from './wasm-memory-pool';

/**
 * Batch operation
 */
interface BatchOperation<T, R> {
  /** The input for the operation */
  input: T;
  /** The operation to perform */
  operation: (input: T) => R;
  /** The callback to call with the result */
  callback: (result: R) => void;
}

/**
 * Batch processor configuration
 */
export interface BatchProcessorConfig {
  /** The maximum number of operations to batch */
  maxBatchSize?: number;
  /** The maximum time to wait before processing a batch (in milliseconds) */
  maxBatchDelay?: number;
  /** The memory pool to use */
  memoryPool?: WasmMemoryPool;
}

/**
 * Default batch processor configuration
 */
const DEFAULT_CONFIG: Required<BatchProcessorConfig> = {
  maxBatchSize: 100,
  maxBatchDelay: 10,
  memoryPool: WasmMemoryPool.getInstance()
};

/**
 * WebAssembly batch processor
 * 
 * Provides a way to batch WebAssembly operations to reduce the overhead of crossing
 * the JavaScript/WebAssembly boundary.
 */
export class WasmBatchProcessor<T, R> {
  /** The batch processor configuration */
  private config: Required<BatchProcessorConfig>;

  /** The current batch of operations */
  private batch: BatchOperation<T, R>[] = [];

  /** The timeout for processing the batch */
  private timeout: NodeJS.Timeout | null = null;

  /** Whether the processor is currently processing a batch */
  private processing: boolean = false;

  /**
   * Create a new batch processor
   * 
   * @param config The batch processor configuration
   */
  constructor(config: BatchProcessorConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Add an operation to the batch
   * 
   * @param input The input for the operation
   * @param operation The operation to perform
   * @returns A promise that resolves with the result of the operation
   */
  public add(input: T, operation: (input: T) => R): Promise<R> {
    return new Promise<R>(resolve => {
      // Add the operation to the batch
      this.batch.push({
        input,
        operation,
        callback: resolve
      });

      // Process the batch if it's full
      if (this.batch.length >= this.config.maxBatchSize) {
        this.processBatch();
        return;
      }

      // Start a timeout to process the batch if it's not already started
      if (!this.timeout && !this.processing) {
        this.timeout = setTimeout(() => {
          this.processBatch();
        }, this.config.maxBatchDelay);
      }
    });
  }

  /**
   * Process the current batch of operations
   */
  private processBatch(): void {
    // Clear the timeout
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }

    // If there are no operations or we're already processing, return
    if (this.batch.length === 0 || this.processing) {
      return;
    }

    // Mark as processing
    this.processing = true;

    // Get the current batch and clear it
    const currentBatch = this.batch;
    this.batch = [];

    // Process each operation
    for (const operation of currentBatch) {
      try {
        const result = operation.operation(operation.input);
        operation.callback(result);
      } catch (error) {
        console.error('Error processing batch operation:', error);
        // Call the callback with a default value or re-throw the error
        operation.callback(null as unknown as R);
      }
    }

    // Mark as not processing
    this.processing = false;

    // Process any new operations that were added during processing
    if (this.batch.length > 0) {
      this.processBatch();
    }
  }

  /**
   * Flush the current batch of operations
   * 
   * @returns A promise that resolves when the batch has been processed
   */
  public flush(): Promise<void> {
    return new Promise<void>(resolve => {
      // If there are no operations, resolve immediately
      if (this.batch.length === 0 && !this.processing) {
        resolve();
        return;
      }

      // Process the batch
      this.processBatch();

      // Wait for processing to complete
      const checkProcessing = () => {
        if (this.processing || this.batch.length > 0) {
          setTimeout(checkProcessing, 1);
        } else {
          resolve();
        }
      };
      checkProcessing();
    });
  }

  /**
   * Get the number of operations in the current batch
   * 
   * @returns The number of operations
   */
  public getBatchSize(): number {
    return this.batch.length;
  }

  /**
   * Check if the processor is currently processing a batch
   * 
   * @returns True if processing, false otherwise
   */
  public isProcessing(): boolean {
    return this.processing;
  }
}
