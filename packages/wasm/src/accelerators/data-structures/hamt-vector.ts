/**
 * WebAssembly accelerator for HAMTPersistentVector operations
 * 
 * Provides WebAssembly-accelerated implementations of common HAMTPersistentVector operations.
 */

import { Accelerator, AcceleratorOptions, AcceleratorTier } from '../accelerator';
import { safeWasmOperation } from '../../core/error-handling';
import { getWasmModule } from '../../core/wasm-module';

/**
 * Input for path finding operation
 */
export interface PathFindingInput {
  /** The index to find the path to */
  index: number;
  /** The height of the trie */
  height: number;
  /** The size of the vector */
  size: number;
}

/**
 * Input for node manipulation operation
 */
export interface NodeManipulationInput {
  /** The bitmap of the node */
  bitmap: number;
  /** The position in the node */
  position: number;
  /** The operation to perform (set, get, remove) */
  operation: 'get' | 'set' | 'remove';
}

/**
 * Input for bulk operations
 */
export interface BulkOperationInput {
  /** The data array */
  data: number[];
  /** The operation to perform */
  operation: 'append' | 'prepend' | 'insert' | 'remove';
  /** The index for insert/remove operations */
  index?: number;
  /** The value for append/prepend/insert operations */
  value?: number;
}

/**
 * HAMTPersistentVector accelerator
 * 
 * Provides WebAssembly-accelerated implementations of common HAMTPersistentVector operations.
 */
export class HAMTVectorAccelerator extends Accelerator<any, any> {
  constructor(options?: AcceleratorOptions) {
    super('data-structures', 'hamt-vector', 'operations', options);
  }

  /**
   * Find the path to a node at the specified index
   * 
   * @param input The input for the path finding operation
   * @returns The path to the node (array of positions)
   */
  public findPath(input: PathFindingInput): number[] {
    // Determine the appropriate tier for the input
    const tier = this.determineTier(input);

    // Execute the operation using the appropriate implementation
    if (tier === AcceleratorTier.JS_PREFERRED) {
      return this.findPathJs(input);
    } else {
      return this.findPathWasm(input);
    }
  }

  /**
   * Find the path to a node at the specified index using WebAssembly
   * 
   * @param input The input for the path finding operation
   * @returns The path to the node (array of positions)
   */
  private findPathWasm(input: PathFindingInput): number[] {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return this.findPathJs(input);
    }

    return safeWasmOperation(() => {
      try {
        // Call the WebAssembly implementation
        const result = module.hamt_find_path(input.index, input.height, input.size);
        
        // Convert the result to a JavaScript array
        return Array.from(new Int32Array(result));
      } catch (error) {
        // Fall back to JavaScript implementation
        console.warn('WebAssembly acceleration failed, falling back to JavaScript implementation:', error);
        return this.findPathJs(input);
      }
    });
  }

  /**
   * Find the path to a node at the specified index using JavaScript
   * 
   * @param input The input for the path finding operation
   * @returns The path to the node (array of positions)
   */
  private findPathJs(input: PathFindingInput): number[] {
    const { index, height } = input;
    const path: number[] = [];
    const BITS_PER_LEVEL = 5;
    const MASK = (1 << BITS_PER_LEVEL) - 1; // 0x1F
    
    // Calculate the positions at each level
    for (let level = height; level >= 0; level--) {
      const shift = level * BITS_PER_LEVEL;
      const position = (index >>> shift) & MASK;
      path.push(position);
    }
    
    return path;
  }

  /**
   * Manipulate a node (get, set, or remove a child)
   * 
   * @param input The input for the node manipulation operation
   * @returns The result of the operation
   */
  public manipulateNode(input: NodeManipulationInput): any {
    // Determine the appropriate tier for the input
    const tier = this.determineTier(input);

    // Execute the operation using the appropriate implementation
    if (tier === AcceleratorTier.JS_PREFERRED) {
      return this.manipulateNodeJs(input);
    } else {
      return this.manipulateNodeWasm(input);
    }
  }

  /**
   * Manipulate a node using WebAssembly
   * 
   * @param input The input for the node manipulation operation
   * @returns The result of the operation
   */
  private manipulateNodeWasm(input: NodeManipulationInput): any {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return this.manipulateNodeJs(input);
    }

    return safeWasmOperation(() => {
      try {
        // Call the WebAssembly implementation based on the operation
        switch (input.operation) {
          case 'get':
            return module.hamt_get_index(input.bitmap, input.position);
          case 'set':
            return module.hamt_set_bit(input.bitmap, input.position);
          case 'remove':
            return module.hamt_clear_bit(input.bitmap, input.position);
          default:
            throw new Error(`Unknown operation: ${input.operation}`);
        }
      } catch (error) {
        // Fall back to JavaScript implementation
        console.warn('WebAssembly acceleration failed, falling back to JavaScript implementation:', error);
        return this.manipulateNodeJs(input);
      }
    });
  }

  /**
   * Manipulate a node using JavaScript
   * 
   * @param input The input for the node manipulation operation
   * @returns The result of the operation
   */
  private manipulateNodeJs(input: NodeManipulationInput): any {
    const { bitmap, position, operation } = input;
    
    switch (operation) {
      case 'get': {
        // Count the number of bits set in the bitmap before the position
        const mask = (1 << position) - 1;
        let count = 0;
        let n = bitmap & mask;
        while (n) {
          n &= n - 1;
          count++;
        }
        return count;
      }
      case 'set':
        return bitmap | (1 << position);
      case 'remove':
        return bitmap & ~(1 << position);
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  }

  /**
   * Perform a bulk operation on a vector
   * 
   * @param input The input for the bulk operation
   * @returns The result of the operation
   */
  public bulkOperation(input: BulkOperationInput): number[] {
    // Determine the appropriate tier for the input
    const tier = this.determineTier(input);

    // Execute the operation using the appropriate implementation
    if (tier === AcceleratorTier.JS_PREFERRED) {
      return this.bulkOperationJs(input);
    } else {
      return this.bulkOperationWasm(input);
    }
  }

  /**
   * Perform a bulk operation using WebAssembly
   * 
   * @param input The input for the bulk operation
   * @returns The result of the operation
   */
  private bulkOperationWasm(input: BulkOperationInput): number[] {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return this.bulkOperationJs(input);
    }

    return safeWasmOperation(() => {
      try {
        // Convert the data to a typed array for better performance
        const dataArray = new Float64Array(input.data);
        
        // Call the WebAssembly implementation based on the operation
        let result;
        switch (input.operation) {
          case 'append':
            result = module.hamt_append(dataArray, input.value as number);
            break;
          case 'prepend':
            result = module.hamt_prepend(dataArray, input.value as number);
            break;
          case 'insert':
            result = module.hamt_insert(dataArray, input.index as number, input.value as number);
            break;
          case 'remove':
            result = module.hamt_remove(dataArray, input.index as number);
            break;
          default:
            throw new Error(`Unknown operation: ${input.operation}`);
        }
        
        // Convert the result to a JavaScript array
        return Array.from(new Float64Array(result));
      } catch (error) {
        // Fall back to JavaScript implementation
        console.warn('WebAssembly acceleration failed, falling back to JavaScript implementation:', error);
        return this.bulkOperationJs(input);
      }
    });
  }

  /**
   * Perform a bulk operation using JavaScript
   * 
   * @param input The input for the bulk operation
   * @returns The result of the operation
   */
  private bulkOperationJs(input: BulkOperationInput): number[] {
    const { data, operation, index, value } = input;
    
    // Create a copy of the data
    const result = [...data];
    
    // Perform the operation
    switch (operation) {
      case 'append':
        result.push(value as number);
        break;
      case 'prepend':
        result.unshift(value as number);
        break;
      case 'insert':
        result.splice(index as number, 0, value as number);
        break;
      case 'remove':
        result.splice(index as number, 1);
        break;
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
    
    return result;
  }

  /**
   * Determine the appropriate tier for the input
   * 
   * @param input The input
   * @returns The appropriate tier
   */
  protected override determineTier(input: any): AcceleratorTier {
    // Use the tiering strategy if provided
    if (this.options?.tiering) {
      return super.determineTier(input);
    }

    // Default tiering strategy based on input characteristics
    if ('data' in input) {
      // Bulk operation input
      const dataSize = input.data.length;
      
      // Always use WebAssembly for large arrays
      if (dataSize >= 100000) {
        return AcceleratorTier.HIGH_VALUE;
      }
      
      // Use WebAssembly conditionally for medium-sized arrays
      if (dataSize >= 10000) {
        return AcceleratorTier.CONDITIONAL;
      }
    } else if ('height' in input) {
      // Path finding input
      const height = input.height;
      
      // Always use WebAssembly for deep tries
      if (height >= 4) {
        return AcceleratorTier.HIGH_VALUE;
      }
      
      // Use WebAssembly conditionally for medium-depth tries
      if (height >= 2) {
        return AcceleratorTier.CONDITIONAL;
      }
    }
    
    // Use JavaScript for everything else
    return AcceleratorTier.JS_PREFERRED;
  }
}
