import { describe, it, expect } from 'vitest';
import { Implementation, Registry, OperationMetadata, OperationsRegistry } from '../../src/registry';

describe('Registry Types', () => {
  it('should define Implementation interface', () => {
    const implementation: Implementation<number[]> = {
      name: 'Test Implementation',
      description: 'Test description',
      category: 'data-structure',
      type: 'list',
      create: (size) => Array.from({ length: size }, (_, i) => i),
      operations: {
        get: (arr, index) => arr[index],
        size: (arr) => arr.length
      },
      capabilities: ['sequence']
    };

    expect(implementation.name).toBe('Test Implementation');
    expect(implementation.category).toBe('data-structure');
    expect(implementation.create(3).length).toBe(3);
    expect(implementation.operations.get([1, 2, 3], 1)).toBe(2);
  });

  it('should define Registry type', () => {
    const registry: Registry = {
      'test-implementation': {
        name: 'Test Implementation',
        category: 'data-structure',
        type: 'list',
        create: (size) => Array.from({ length: size }, (_, i) => i),
        operations: {
          get: (arr, index) => arr[index],
          size: (arr) => arr.length
        }
      }
    };

    expect(registry['test-implementation'].name).toBe('Test Implementation');
  });

  it('should define OperationMetadata interface', () => {
    const metadata: OperationMetadata = {
      name: 'get',
      description: 'Get an element by index',
      category: 'access',
      readOnly: true,
      defaultArgs: [0],
      requiredCapabilities: ['sequence']
    };

    expect(metadata.name).toBe('get');
    expect(metadata.readOnly).toBe(true);
  });

  it('should define OperationsRegistry type', () => {
    const registry: OperationsRegistry = {
      'get': {
        name: 'get',
        category: 'access',
        readOnly: true
      },
      'set': {
        name: 'set',
        category: 'mutation',
        readOnly: false
      }
    };

    expect(registry['get'].readOnly).toBe(true);
    expect(registry['set'].readOnly).toBe(false);
  });
});
