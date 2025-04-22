import { describe, it, expect } from 'vitest';
import { AcceleratorTier, WebAssemblyFeature } from '../../src/wasm';

describe('WebAssembly Types', () => {
  it('should define AcceleratorTier enum', () => {
    expect(AcceleratorTier.HIGH_VALUE).toBe('high-value');
    expect(AcceleratorTier.CONDITIONAL).toBe('conditional');
    expect(AcceleratorTier.JS_PREFERRED).toBe('js-preferred');
  });

  it('should define WebAssemblyFeature enum', () => {
    expect(WebAssemblyFeature.BASIC).toBe('basic');
    expect(WebAssemblyFeature.SIMD).toBe('simd');
    expect(WebAssemblyFeature.THREADS).toBe('threads');
    expect(WebAssemblyFeature.REFERENCE_TYPES).toBe('reference-types');
    expect(WebAssemblyFeature.BULK_MEMORY).toBe('bulk-memory');
    expect(WebAssemblyFeature.EXCEPTION_HANDLING).toBe('exception-handling');
  });
});
