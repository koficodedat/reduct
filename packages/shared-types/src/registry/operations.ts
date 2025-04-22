/**
 * Registry operation types
 *
 * This module provides types for the registry system's operations.
 *
 * @packageDocumentation
 */

/**
 * Operation metadata
 */
export interface OperationMetadata {
  /** Name of the operation */
  name: string;
  /** Description of the operation */
  description?: string;
  /** Category of the operation */
  category: string;
  /** Whether the operation is read-only */
  readOnly?: boolean;
  /** Default arguments for the operation */
  defaultArgs?: any[];
  /** Required capabilities for this operation */
  requiredCapabilities?: string[];
}

/**
 * Registry of operations
 */
export type OperationsRegistry = Record<string, OperationMetadata>;
