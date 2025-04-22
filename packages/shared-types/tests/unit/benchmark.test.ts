import { describe, it, expect } from 'vitest';
import { 
  OperationCategory, 
  OperationComplexity, 
  BenchmarkOperationMetadata,
  BenchmarkOperation,
  BenchmarkSpecialCase
} from '../../src/benchmark';

describe('Benchmark Types', () => {
  it('should define OperationCategory enum', () => {
    expect(OperationCategory.ACCESS).toBe('access');
    expect(OperationCategory.MODIFICATION).toBe('modification');
    expect(OperationCategory.TRAVERSAL).toBe('traversal');
    expect(OperationCategory.SEARCH).toBe('search');
    expect(OperationCategory.SORT).toBe('sort');
    expect(OperationCategory.CREATION).toBe('creation');
    expect(OperationCategory.CONVERSION).toBe('conversion');
    expect(OperationCategory.BULK).toBe('bulk');
    expect(OperationCategory.UTILITY).toBe('utility');
  });

  it('should define OperationComplexity enum', () => {
    expect(OperationComplexity.CONSTANT).toBe('O(1)');
    expect(OperationComplexity.LOGARITHMIC).toBe('O(log n)');
    expect(OperationComplexity.LINEAR).toBe('O(n)');
    expect(OperationComplexity.LINEARITHMIC).toBe('O(n log n)');
    expect(OperationComplexity.QUADRATIC).toBe('O(n²)');
    expect(OperationComplexity.CUBIC).toBe('O(n³)');
    expect(OperationComplexity.EXPONENTIAL).toBe('O(2^n)');
    expect(OperationComplexity.FACTORIAL).toBe('O(n!)');
  });

  it('should define BenchmarkOperationMetadata interface', () => {
    const metadata: BenchmarkOperationMetadata = {
      name: 'test',
      category: OperationCategory.ACCESS,
      readOnly: true,
      complexity: OperationComplexity.CONSTANT,
      tags: ['test'],
      version: '1.0.0'
    };

    expect(metadata.name).toBe('test');
    expect(metadata.category).toBe(OperationCategory.ACCESS);
    expect(metadata.readOnly).toBe(true);
    expect(metadata.complexity).toBe(OperationComplexity.CONSTANT);
    expect(metadata.tags).toEqual(['test']);
    expect(metadata.version).toBe('1.0.0');
  });

  it('should define BenchmarkOperation interface', () => {
    const operation: BenchmarkOperation = {
      name: 'test',
      description: 'Test operation',
      adapter: () => {}
    };

    expect(operation.name).toBe('test');
    expect(operation.description).toBe('Test operation');
    expect(typeof operation.adapter).toBe('function');
  });

  it('should define BenchmarkSpecialCase interface', () => {
    const specialCase: BenchmarkSpecialCase = {
      name: 'test',
      description: 'Test special case',
      setupFn: (size) => Array.from({ length: size }, (_, i) => i)
    };

    expect(specialCase.name).toBe('test');
    expect(specialCase.description).toBe('Test special case');
    expect(typeof specialCase.setupFn).toBe('function');
    expect(specialCase.setupFn(3)).toEqual([0, 1, 2]);
  });
});
