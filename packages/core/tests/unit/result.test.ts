import { describe, it, expect } from 'vitest';
import { ok, err, tryCatch } from '../../src/result';

describe('Result', () => {
  describe('Ok', () => {
    it('should return the contained value with get', () => {
      const resultValue = ok(42);
      expect(resultValue.get()).toBe(42);
    });

    it('should transform the value with map', () => {
      const resultValue = ok(42);
      const mapped = resultValue.map(x => x * 2);
      expect(mapped.get()).toBe(84);
    });

    it('should return the contained value with getOrElse', () => {
      const resultValue = ok(42);
      expect(resultValue.getOrElse(0)).toBe(42);
    });

    it('should flatMap correctly', () => {
      const resultValue = ok(42);
      const flatMapped = resultValue.flatMap(x => ok(x * 2));
      expect(flatMapped.get()).toBe(84);

      const flatMappedToErr = resultValue.flatMap(_ => err('error'));
      expect(flatMappedToErr.isErr()).toBe(true);
    });

    it('should report isOk correctly', () => {
      const resultValue = ok(42);
      expect(resultValue.isOk()).toBe(true);
      expect(resultValue.isErr()).toBe(false);
    });

    it('should execute forEach with the value', () => {
      const resultValue = ok(42);
      let value = 0;
      resultValue.forEach(x => { value = x; });
      expect(value).toBe(42);
    });

    it('should not modify when using mapErr', () => {
      const resultValue = ok(42);
      const mapped = resultValue.mapErr(e => `${e}!`);
      expect(mapped.isOk()).toBe(true);
      expect(mapped.get()).toBe(42);
    });
  });

  describe('Err', () => {
    it('should throw when calling get', () => {
      const resultValue = err('error');
      expect(() => resultValue.get()).toThrow();
    });

    it('should return Err when mapping', () => {
      const resultValue = err('error');
      const mapped = resultValue.map(x => x);
      expect(mapped.isErr()).toBe(true);
    });

    it('should return the default with getOrElse', () => {
      const resultValue = err('error');
      expect(resultValue.getOrElse(42)).toBe(42);
    });

    it('should return Err when flatMapping', () => {
      const resultValue = err('error');
      const flatMapped = resultValue.flatMap(x => ok(x));
      expect(flatMapped.isErr()).toBe(true);
    });

    it('should report isErr correctly', () => {
      const resultValue = err('error');
      expect(resultValue.isOk()).toBe(false);
      expect(resultValue.isErr()).toBe(true);
    });

    it('should not execute forEach', () => {
      const resultValue = err('error');
      let executed = false;
      resultValue.forEach(() => { executed = true; });
      expect(executed).toBe(false);
    });

    it('should transform the error with mapErr', () => {
      const resultValue = err('error');
      const mapped = resultValue.mapErr(e => `${e}!`);
      expect(mapped.isErr()).toBe(true);
      expect(mapped.getErr()).toBe('error!');
    });

    it('should return the error with getErr', () => {
      const resultValue = err('error');
      expect(resultValue.getErr()).toBe('error');
    });
  });

  describe('tryCatch', () => {
    it('should return Ok for successful operations', () => {
      const resultValue = tryCatch(() => 42, e => String(e));
      expect(resultValue.isOk()).toBe(true);
      expect(resultValue.get()).toBe(42);
    });

    it('should return Err for failed operations', () => {
      const resultValue = tryCatch(() => {
        throw new Error('something went wrong');
      }, e => e instanceof Error ? e.message : String(e));

      expect(resultValue.isErr()).toBe(true);
      expect(resultValue.getErr()).toBe('something went wrong');
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
