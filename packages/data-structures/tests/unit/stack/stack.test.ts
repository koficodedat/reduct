import { describe, it, expect } from 'vitest';
import { Stack } from '../../src/stack';

describe('Persistent Stack', () => {
  describe('Construction', () => {
    it('should create an empty stack', () => {
      const stack = Stack.empty<number>();
      expect(stack.size).toBe(0);
      expect(stack.isEmpty).toBe(true);
    });

    it('should create a stack from an array', () => {
      const stack = Stack.from([1, 2, 3]);
      expect(stack.size).toBe(3);
      expect(stack.isEmpty).toBe(false);
      expect(stack.toArray()).toEqual([1, 2, 3]);
    });

    it('should create a stack with provided elements', () => {
      const stack = Stack.of('a', 'b', 'c');
      expect(stack.size).toBe(3);
      expect(stack.isEmpty).toBe(false);
      expect(stack.toArray()).toEqual(['a', 'b', 'c']);
    });
  });

  describe('Stack operations', () => {
    it('should peek at the top element', () => {
      const emptyStack = Stack.empty<number>();
      const stack = Stack.of(1, 2, 3);

      expect(emptyStack.peek().isNone()).toBe(true);
      expect(stack.peek().isSome()).toBe(true);
      expect(stack.peek().get()).toBe(3); // Last element is on top
    });

    it('should push elements', () => {
      const stack = Stack.empty<number>();
      const stack1 = stack.push(1);
      const stack2 = stack1.push(2);
      const stack3 = stack2.push(3);

      expect(stack.size).toBe(0);
      expect(stack1.size).toBe(1);
      expect(stack2.size).toBe(2);
      expect(stack3.size).toBe(3);

      expect(stack1.peek().get()).toBe(1);
      expect(stack2.peek().get()).toBe(2);
      expect(stack3.peek().get()).toBe(3);
    });

    it('should pop elements', () => {
      const stack = Stack.of(1, 2, 3);

      const stack1 = stack.pop();
      expect(stack1.size).toBe(2);
      expect(stack1.peek().get()).toBe(2);

      const stack2 = stack1.pop();
      expect(stack2.size).toBe(1);
      expect(stack2.peek().get()).toBe(1);

      const stack3 = stack2.pop();
      expect(stack3.size).toBe(0);
      expect(stack3.isEmpty).toBe(true);

      const stack4 = stack3.pop();
      expect(stack4).toBe(stack3); // Should return the same stack if already empty
    });

    it('should pop with element', () => {
      const stack = Stack.of(1, 2, 3);

      const [element1, stack1] = stack.popWithElement();
      expect(element1.get()).toBe(3);
      expect(stack1.size).toBe(2);
      expect(stack1.peek().get()).toBe(2);

      const [element2, stack2] = stack1.popWithElement();
      expect(element2.get()).toBe(2);
      expect(stack2.size).toBe(1);
      expect(stack2.peek().get()).toBe(1);

      const [element3, stack3] = stack2.popWithElement();
      expect(element3.get()).toBe(1);
      expect(stack3.size).toBe(0);
      expect(stack3.isEmpty).toBe(true);

      const [element4, stack4] = stack3.popWithElement();
      expect(element4.isNone()).toBe(true);
      expect(stack4).toBe(stack3); // Should return the same stack if already empty
    });
  });

  describe('Immutability', () => {
    it('should not modify the original stack when transformed', () => {
      const original = Stack.of(1, 2, 3);

      const pushed = original.push(4);
      expect(original.size).toBe(3);
      expect(original.peek().get()).toBe(3);
      expect(pushed.size).toBe(4);
      expect(pushed.peek().get()).toBe(4);

      const popped = original.pop();
      expect(original.size).toBe(3);
      expect(original.peek().get()).toBe(3);
      expect(popped.size).toBe(2);
      expect(popped.peek().get()).toBe(2);
    });
  });

  describe('Transformation operations', () => {
    it('should map elements', () => {
      const stack = Stack.of(1, 2, 3);
      const mapped = stack.map(x => x * 2);

      expect(mapped.size).toBe(3);
      expect(mapped.toArray()).toEqual([2, 4, 6]);
    });

    it('should filter elements', () => {
      const stack = Stack.of(1, 2, 3, 4, 5);
      const filtered = stack.filter(x => x % 2 === 0);

      expect(filtered.size).toBe(2);
      expect(filtered.toArray()).toEqual([2, 4]);
    });

    it('should execute forEach', () => {
      const stack = Stack.of(1, 2, 3);
      const results: number[] = [];

      stack.forEach(x => {
        results.push(x);
      });

      expect(results).toEqual([1, 2, 3]);
    });
  });

  describe('Utility methods', () => {
    it('should convert to string representation', () => {
      const stack = Stack.of(1, 2, 3);
      expect(stack.toString()).toBe('Stack(1, 2, 3)');
    });
  });
});
