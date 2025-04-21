/**
 * Mock Accelerator class for testing
 */

export enum AcceleratorTier {
  // Always use WebAssembly (significant performance benefit)
  HIGH_VALUE = 'high-value',

  // Use WebAssembly conditionally (based on input characteristics)
  CONDITIONAL = 'conditional',

  // Prefer JavaScript (WebAssembly overhead outweighs benefits)
  JS_PREFERRED = 'js-preferred'
}

export interface AcceleratorOptions {
  // Element type for specialized implementations
  elementType?: string;

  // Tiering strategy for this accelerator
  tiering?: Record<AcceleratorTier, (input: any) => boolean>;

  // Default thresholds for common operations
  thresholds?: {
    // Minimum array size for using WebAssembly
    minArraySize?: number;

    // Minimum string length for using WebAssembly
    minStringLength?: number;

    // Minimum matrix size for using WebAssembly
    minMatrixSize?: number;
  };
}

export class Accelerator<T, R> {
  protected options?: AcceleratorOptions;

  constructor(
    protected domain: string,
    protected type: string,
    protected operation: string,
    options?: AcceleratorOptions
  ) {
    this.options = options;
  }

  public isAvailable(): boolean {
    return true;
  }

  protected getModule(): any {
    return null;
  }

  protected determineTier(input: any): AcceleratorTier {
    if (this.options?.tiering) {
      // Check each tier in order of priority
      if (this.options.tiering[AcceleratorTier.HIGH_VALUE]?.(input)) {
        return AcceleratorTier.HIGH_VALUE;
      }
      if (this.options.tiering[AcceleratorTier.CONDITIONAL]?.(input)) {
        return AcceleratorTier.CONDITIONAL;
      }
      if (this.options.tiering[AcceleratorTier.JS_PREFERRED]?.(input)) {
        return AcceleratorTier.JS_PREFERRED;
      }
    }
    
    // Default to JS_PREFERRED if no tiering strategy is provided
    return AcceleratorTier.JS_PREFERRED;
  }
}

export class MatrixAccelerator extends Accelerator<any, any> {
  constructor(options?: AcceleratorOptions) {
    super('data-structures', 'matrix', 'operations', options);
  }

  public multiply(input: any): number[] {
    // Mock implementation that just returns an empty array
    return [];
  }
}
