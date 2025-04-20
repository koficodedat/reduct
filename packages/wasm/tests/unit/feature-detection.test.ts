import { describe, it, expect, vi } from 'vitest';
import { isWebAssemblySupported, WebAssemblyFeature } from '../../src/core/feature-detection';

describe('WebAssembly Feature Detection', () => {
  it('should detect WebAssembly support', () => {
    // This test assumes that the test environment supports WebAssembly
    expect(isWebAssemblySupported()).toBe(true);
  });

  it('should return false when WebAssembly is not supported', () => {
    // Mock WebAssembly as undefined
    const originalWebAssembly = global.WebAssembly;
    // @ts-ignore
    global.WebAssembly = undefined;

    expect(isWebAssemblySupported()).toBe(false);

    // Restore WebAssembly
    global.WebAssembly = originalWebAssembly;
  });

  it('should handle errors during detection', () => {
    // Mock WebAssembly to throw an error
    const originalWebAssembly = global.WebAssembly;

    // Mock the every method to throw an error
    const originalEvery = Array.prototype.every;
    Array.prototype.every = function() { throw new Error('Mock error'); };

    expect(isWebAssemblySupported()).toBe(false);

    // Restore original methods
    Array.prototype.every = originalEvery;
    global.WebAssembly = originalWebAssembly;
  });
});
