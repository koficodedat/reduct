import { describe, it, expect } from 'vitest';
import * from '../../src/composition';

describe('compose', () => {
  it('should compose functions from right to left', () => {
    const add1 = (x: number) => x + 1;
    const multiply2 = (x: number) => x * 2;

    const add1ThenMultiply2 = compose(multiply2, add1);
    expect(add1ThenMultiply2(3)).toBe(8); // (3 + 1) * 2 = 8

    const multiply2ThenAdd1 = compose(add1, multiply2);
    expect(multiply2ThenAdd1(3)).toBe(7); // (3 * 2) + 1 = 7
  });

  it('should handle multiple function composition', () => {
    const add1 = (x: number) => x + 1;
    const multiply2 = (x: number) => x * 2;
    const subtract3 = (x: number) => x - 3;

    const composed = compose(subtract3, multiply2, add1);
    expect(composed(5)).toBe(9); // ((5 + 1) * 2) - 3 = 9
  });

  it('should return identity function when no functions provided', () => {
    const identity = compose();
    expect(identity(5)).toBe(5);
  });
});

describe('pipe', () => {
  it('should pipe a value through functions from left to right', () => {
    const add1 = (x: number) => x + 1;
    const multiply2 = (x: number) => x * 2;

    expect(pipe(3, add1, multiply2)).toBe(8); // (3 + 1) * 2 = 8
    expect(pipe(3, multiply2, add1)).toBe(7); // (3 * 2) + 1 = 7
  });

  it('should handle piping through multiple functions', () => {
    const add1 = (x: number) => x + 1;
    const multiply2 = (x: number) => x * 2;
    const subtract3 = (x: number) => x - 3;

    expect(pipe(5, add1, multiply2, subtract3)).toBe(9); // ((5 + 1) * 2) - 3 = 9
  });

  it('should return the input when no functions provided', () => {
    expect(pipe(5)).toBe(5);
  });
});
