import { describe, it, expect } from 'vitest';
import { DeepReadonly, DeepPartial, ElementOf, ValueOf, isString, isNumber, isEnum } from '../../src/core';

describe('Core Utility Types', () => {
  it('should provide type guards', () => {
    expect(isString('test')).toBe(true);
    expect(isString(123)).toBe(false);
    
    expect(isNumber(123)).toBe(true);
    expect(isNumber('test')).toBe(false);
  });
  
  it('should provide enum type guard factory', () => {
    enum TestEnum {
      A = 'a',
      B = 'b',
      C = 'c'
    }
    
    const isTestEnum = isEnum(TestEnum);
    
    expect(isTestEnum('a')).toBe(true);
    expect(isTestEnum('d')).toBe(false);
  });
});
