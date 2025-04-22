import { describe, it, expect } from 'vitest';
import { DataType, RepresentationType } from '../../src/data-structures';

describe('Data Structure List Types', () => {
  it('should define DataType enum', () => {
    expect(DataType.UNKNOWN).toBe('unknown');
    expect(DataType.NUMERIC).toBe('numeric');
    expect(DataType.STRING).toBe('string');
    expect(DataType.OBJECT_REFERENCE).toBe('object_reference');
    expect(DataType.MIXED).toBe('mixed');
  });

  it('should define RepresentationType enum', () => {
    expect(RepresentationType.ARRAY).toBe('array');
    expect(RepresentationType.SMALL).toBe('small');
    expect(RepresentationType.CHUNKED).toBe('chunked');
    expect(RepresentationType.VECTOR).toBe('vector');
    expect(RepresentationType.HAMT_VECTOR).toBe('hamt_vector');
  });
});
