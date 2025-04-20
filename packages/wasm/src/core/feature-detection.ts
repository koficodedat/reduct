/**
 * WebAssembly feature detection utilities
 */

/**
 * WebAssembly features that can be detected
 */
export enum WebAssemblyFeature {
  BASIC = 'basic',
  SIMD = 'simd',
  THREADS = 'threads',
  REFERENCE_TYPES = 'reference-types',
  BULK_MEMORY = 'bulk-memory',
  EXCEPTION_HANDLING = 'exception-handling',
}

/**
 * Check if WebAssembly is supported in the current environment
 * @returns True if WebAssembly is supported, false otherwise
 */
export function isWebAssemblySupported(): boolean {
  try {
    // Check for basic WebAssembly support
    if (typeof WebAssembly !== 'object') return false;
    
    // Check for necessary WebAssembly features
    const requiredFeatures = [
      typeof WebAssembly.compile === 'function',
      typeof WebAssembly.instantiate === 'function',
      typeof WebAssembly.Module === 'function',
      typeof WebAssembly.Instance === 'function',
      typeof WebAssembly.Memory === 'function',
    ];
    
    return requiredFeatures.every(Boolean);
  } catch (e) {
    return false;
  }
}

/**
 * Check if a specific WebAssembly feature is supported
 * @param feature The WebAssembly feature to check
 * @returns True if the feature is supported, false otherwise
 */
export async function isFeatureSupported(feature: WebAssemblyFeature): Promise<boolean> {
  // First check if basic WebAssembly is supported
  if (!isWebAssemblySupported()) return false;
  
  try {
    switch (feature) {
      case WebAssemblyFeature.BASIC:
        return true;
        
      case WebAssemblyFeature.SIMD:
        // Check for SIMD support
        return WebAssembly.validate(new Uint8Array([
          0x00, 0x61, 0x73, 0x6d, // magic bytes
          0x01, 0x00, 0x00, 0x00, // version
          0x01, 0x05, 0x01, 0x60, 0x00, 0x01, 0x7b, // type section
          0x03, 0x02, 0x01, 0x00, // function section
          0x07, 0x05, 0x01, 0x01, 0x66, 0x00, 0x00, // export section
          0x0a, 0x09, 0x01, 0x07, 0x00, 0xfd, 0x0f, 0x00, 0x00, 0x0b // code section with SIMD instruction
        ]));
        
      case WebAssemblyFeature.THREADS:
        // Check for threads support
        try {
          return typeof SharedArrayBuffer === 'function' && 
                 typeof Atomics === 'object' &&
                 typeof WebAssembly.Memory === 'function' &&
                 new WebAssembly.Memory({ initial: 1, maximum: 1, shared: true }) instanceof WebAssembly.Memory;
        } catch (e) {
          return false;
        }
        
      case WebAssemblyFeature.REFERENCE_TYPES:
        // Check for reference types support
        return WebAssembly.validate(new Uint8Array([
          0x00, 0x61, 0x73, 0x6d, // magic bytes
          0x01, 0x00, 0x00, 0x00, // version
          0x01, 0x04, 0x01, 0x60, 0x00, 0x00, // type section
          0x03, 0x02, 0x01, 0x00, // function section
          0x07, 0x05, 0x01, 0x01, 0x66, 0x00, 0x00, // export section
          0x0a, 0x05, 0x01, 0x03, 0x00, 0xd0, 0x0b // code section with reference type instruction
        ]));
        
      case WebAssemblyFeature.BULK_MEMORY:
        // Check for bulk memory operations support
        return WebAssembly.validate(new Uint8Array([
          0x00, 0x61, 0x73, 0x6d, // magic bytes
          0x01, 0x00, 0x00, 0x00, // version
          0x01, 0x04, 0x01, 0x60, 0x00, 0x00, // type section
          0x03, 0x02, 0x01, 0x00, // function section
          0x07, 0x05, 0x01, 0x01, 0x66, 0x00, 0x00, // export section
          0x0a, 0x05, 0x01, 0x03, 0x00, 0xfc, 0x0b // code section with bulk memory instruction
        ]));
        
      case WebAssemblyFeature.EXCEPTION_HANDLING:
        // Check for exception handling support
        return WebAssembly.validate(new Uint8Array([
          0x00, 0x61, 0x73, 0x6d, // magic bytes
          0x01, 0x00, 0x00, 0x00, // version
          0x01, 0x04, 0x01, 0x60, 0x00, 0x00, // type section
          0x03, 0x02, 0x01, 0x00, // function section
          0x07, 0x05, 0x01, 0x01, 0x66, 0x00, 0x00, // export section
          0x0a, 0x05, 0x01, 0x03, 0x00, 0x06, 0x0b // code section with exception handling instruction
        ]));
        
      default:
        return false;
    }
  } catch (e) {
    return false;
  }
}

/**
 * Get a list of supported WebAssembly features
 * @returns A promise that resolves to an array of supported WebAssembly features
 */
export async function getSupportedFeatures(): Promise<WebAssemblyFeature[]> {
  const features = Object.values(WebAssemblyFeature);
  const supportPromises = features.map(async feature => {
    const isSupported = await isFeatureSupported(feature);
    return isSupported ? feature : null;
  });
  
  const results = await Promise.all(supportPromises);
  return results.filter((feature): feature is WebAssemblyFeature => feature !== null);
}
