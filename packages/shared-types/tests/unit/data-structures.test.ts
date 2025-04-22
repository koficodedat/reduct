import { describe, it, expect } from 'vitest';
import { DataStructureType, MemoryStats } from '../../src/data-structures';

describe('Data Structure Types', () => {
  it('should define DataStructureType enum', () => {
    expect(DataStructureType.LIST).toBe('list');
    expect(DataStructureType.MAP).toBe('map');
    expect(DataStructureType.SET).toBe('set');
    expect(DataStructureType.STACK).toBe('stack');
    expect(DataStructureType.QUEUE).toBe('queue');
    expect(DataStructureType.TREE).toBe('tree');
    expect(DataStructureType.GRAPH).toBe('graph');
    expect(DataStructureType.MATRIX).toBe('matrix');
    expect(DataStructureType.VECTOR).toBe('vector');
  });

  it('should define MemoryStats interface', () => {
    const stats: MemoryStats = {
      instanceCount: 10,
      elementCount: 1000,
      memoryUsage: 10000,
      memoryPerElement: 10
    };

    expect(stats.instanceCount).toBe(10);
    expect(stats.elementCount).toBe(1000);
    expect(stats.memoryUsage).toBe(10000);
    expect(stats.memoryPerElement).toBe(10);
  });
});
