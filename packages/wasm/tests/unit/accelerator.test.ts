import { describe, it, expect, vi } from 'vitest';
import { 
  BaseAccelerator, 
  JavaScriptFallbackAccelerator, 
  AcceleratorRegistry,
  PerformanceProfile
} from '../../src/accelerators/accelerator';

// Mock implementation of BaseAccelerator for testing
class MockAccelerator extends BaseAccelerator<number[], number[]> {
  constructor() {
    super('test', 'mock', 'operation');
  }
  
  execute(input: number[]): number[] {
    this.ensureAvailable();
    return input.map(x => x * 2);
  }
  
  getPerformanceProfile(): PerformanceProfile {
    return {
      estimatedSpeedup: 2.0
    };
  }
}

describe('Accelerator API', () => {
  describe('BaseAccelerator', () => {
    it('should create an accelerator with the correct properties', () => {
      const accelerator = new MockAccelerator();
      expect(accelerator.isAvailable()).toBe(true);
      expect(accelerator.getPerformanceProfile().estimatedSpeedup).toBe(2.0);
    });
    
    it('should execute the operation', () => {
      const accelerator = new MockAccelerator();
      const result = accelerator.execute([1, 2, 3]);
      expect(result).toEqual([2, 4, 6]);
    });
  });
  
  describe('JavaScriptFallbackAccelerator', () => {
    it('should create a fallback accelerator with the correct properties', () => {
      const accelerator = new JavaScriptFallbackAccelerator(
        'test',
        'mock',
        'operation',
        (input: number[]) => input.map(x => x * 3)
      );
      
      expect(accelerator.isAvailable()).toBe(true);
      expect(accelerator.getPerformanceProfile().estimatedSpeedup).toBe(1.0);
    });
    
    it('should execute the operation using the JavaScript implementation', () => {
      const accelerator = new JavaScriptFallbackAccelerator(
        'test',
        'mock',
        'operation',
        (input: number[]) => input.map(x => x * 3)
      );
      
      const result = accelerator.execute([1, 2, 3]);
      expect(result).toEqual([3, 6, 9]);
    });
  });
  
  describe('AcceleratorRegistry', () => {
    it('should register and retrieve accelerators', () => {
      const registry = AcceleratorRegistry.getInstance();
      const accelerator = new MockAccelerator();
      
      // Clear the registry first
      registry.clear();
      
      // Register the accelerator
      registry.register('test', 'mock', 'operation', accelerator);
      
      // Check if the accelerator is registered
      expect(registry.has('test', 'mock', 'operation')).toBe(true);
      
      // Retrieve the accelerator
      const retrievedAccelerator = registry.get('test', 'mock', 'operation');
      expect(retrievedAccelerator).toBe(accelerator);
    });
    
    it('should unregister accelerators', () => {
      const registry = AcceleratorRegistry.getInstance();
      const accelerator = new MockAccelerator();
      
      // Clear the registry first
      registry.clear();
      
      // Register the accelerator
      registry.register('test', 'mock', 'operation', accelerator);
      
      // Unregister the accelerator
      const result = registry.unregister('test', 'mock', 'operation');
      expect(result).toBe(true);
      
      // Check if the accelerator is unregistered
      expect(registry.has('test', 'mock', 'operation')).toBe(false);
    });
    
    it('should clear all registered accelerators', () => {
      const registry = AcceleratorRegistry.getInstance();
      const accelerator = new MockAccelerator();
      
      // Register the accelerator
      registry.register('test', 'mock', 'operation', accelerator);
      
      // Clear the registry
      registry.clear();
      
      // Check if the accelerator is unregistered
      expect(registry.has('test', 'mock', 'operation')).toBe(false);
    });
  });
});
