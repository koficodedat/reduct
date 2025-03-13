import { describe, it, expect } from 'vitest';
import { ok, err, tryCatch } from './result';

describe('Result', () => {
  describe('Ok', () => {
    it('should return the contained value with get', () => {
      const result = ok(42);
      expect(result.get()).toBe(42);
    });

    it('should transform the value with map', () => {
      const result = ok(42);
      const mapped = result.map(x => x * 2);
      expect(mapped.get()).toBe(84);
    });

    it('should return the contained value with getOrElse', () => {
      const result = ok(42);
      expect(result.getOrElse(0)).toBe(42);
    });

    it('should flatMap correctly', () => {
      const result = ok(42);
      const flatMapped = result.flatMap(x => ok(x * 2));
      expect(flatMapped.get()).toBe(84);

      const flatMappedToErr = result.flatMap(_ => err('error'));
      expect(flatMappedToErr.isErr()).toBe(true);
    });

    it('should report isOk correctly', () => {
      const result = ok(42);
      expect(result.isOk()).toBe(true);
      expect(result.isErr()).toBe(false);
    });

    it('should execute forEach with the value', () => {
      const result = ok(42);
      let value = 0;
      result.forEach(x => { value = x; });
      expect(value).toBe(42);
    });

    it('should not modify when using mapErr', () => {
      const result = ok(42);
      const mapped = result.mapErr(e => `${e}!`);
      expect(mapped.isOk()).toBe(true);
      expect(mapped.get()).toBe(42);
    });
  });

  describe('Err', () => {
    it('should throw when calling get', () => {
      const result = err('error');
      expect(() => result.get()).toThrow();
    });

    it('should return Err when mapping', () => {
      const result = err('error');
      const mapped = result.map(x => x);
      expect(mapped.isErr()).toBe(true);
    });

    it('should return the default with getOrElse', () => {
      const result = err('error');
      expect(result.getOrElse(42)).toBe(42);
    });

    it('should return Err when flatMapping', () => {
      const result = err('error');
      const flatMapped = result.flatMap(x => ok(x));
      expect(flatMapped.isErr()).toBe(true);
    });

    it('should report isErr correctly', () => {
      const result = err('error');
      expect(result.isOk()).toBe(false);
      expect(result.isErr()).toBe(true);
    });

    it('should not execute forEach', () => {
      const result = err('error');
      let executed = false;
      result.forEach(() => { executed = true; });
      expect(executed).toBe(false);
    });

    it('should transform the error with mapErr', () => {
      const result = err('error');
      const mapped = result.mapErr(e => `${e}!`);
      expect(mapped.isErr()).toBe(true);
      expect(mapped.getErr()).toBe('error!');
    });

    it('should return the error with getErr', () => {
      const result = err('error');
      expect(result.getErr()).toBe('error');
    });
  });

  describe('tryCatch', () => {
    it('should return Ok for successful operations', () => {
      const result = tryCatch(() => 42, e => String(e));
      expect(result.isOk()).toBe(true);
      expect(result.get()).toBe(42);
    });

    it('should return Err for failed operations', () => {
      const result = tryCatch(() => {
        throw new Error('something went wrong');
      }, e => e instanceof Error ? e.message : String(e));

      expect(result.isErr()).toBe(true);
      expect(result.getErr()).toBe('something went wrong');
    });

    it('should handle JSON parsing example', () => {
      const goodJson = '{"value": 42}';
      const badJson = '{value: 42}';

      const goodResult = tryCatch(
        () => JSON.parse(goodJson),
        e => `Failed to parse JSON: ${String(e)}`
      );

      const badResult = tryCatch(
        () => JSON.parse(badJson),
        e => `Failed to parse JSON: ${String(e)}`
      );

      expect(goodResult.isOk()).toBe(true);
      expect(goodResult.get().value).toBe(42);

      expect(badResult.isErr()).toBe(true);
      expect(badResult.getErr()).toContain('Failed to parse JSON');
    });
  });
});
