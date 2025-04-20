/**
 * WebAssembly error handling utilities
 */

/**
 * Error thrown when WebAssembly is not supported
 */
export class WasmNotSupportedError extends Error {
  constructor(message = 'WebAssembly is not supported in this environment') {
    super(message);
    this.name = 'WasmNotSupportedError';
  }
}

/**
 * Error thrown when a WebAssembly module fails to load
 */
export class WasmLoadError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'WasmLoadError';
  }
}

/**
 * Error thrown when a WebAssembly feature is not supported
 */
export class WasmFeatureNotSupportedError extends Error {
  constructor(feature: string) {
    super(`WebAssembly feature '${feature}' is not supported in this environment`);
    this.name = 'WasmFeatureNotSupportedError';
  }
}

/**
 * Error thrown when a WebAssembly memory operation fails
 */
export class WasmMemoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WasmMemoryError';
  }
}

/**
 * Error thrown when a WebAssembly accelerator is not available
 */
export class WasmAcceleratorNotAvailableError extends Error {
  constructor(domain: string, type: string, operation: string) {
    super(`WebAssembly accelerator for ${domain}/${type}/${operation} is not available`);
    this.name = 'WasmAcceleratorNotAvailableError';
  }
}

/**
 * Error thrown when a WebAssembly operation fails
 */
export class WasmOperationError extends Error {
  constructor(message: string, public readonly operation: string, public readonly cause?: Error) {
    super(message);
    this.name = 'WasmOperationError';
  }
}

/**
 * Safely execute a WebAssembly operation with error handling
 * @param operation The operation to execute
 * @param operationName The name of the operation (for error reporting)
 * @returns The result of the operation
 * @throws WasmOperationError if the operation fails
 */
export function safeWasmOperation<T>(operation: () => T, operationName: string): T {
  try {
    return operation();
  } catch (error) {
    throw new WasmOperationError(
      `WebAssembly operation '${operationName}' failed: ${error}`,
      operationName,
      error instanceof Error ? error : undefined
    );
  }
}
