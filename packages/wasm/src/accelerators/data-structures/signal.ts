/**
 * WebAssembly accelerator for signal processing operations
 * 
 * Provides WebAssembly-accelerated implementations of common signal processing operations.
 */

import { Accelerator, AcceleratorOptions, AcceleratorTier } from '../accelerator';
import { safeWasmOperation } from '../../core/error-handling';
import { getWasmModule } from '../../core/wasm-module';

/**
 * Input for FFT operation
 */
export interface FFTInput {
  /** The input signal (real values) */
  signal: number[];
}

/**
 * Input for convolution operation
 */
export interface ConvolutionInput {
  /** The first signal */
  signal1: number[];
  /** The second signal */
  signal2: number[];
}

/**
 * Signal processing accelerator
 * 
 * Provides WebAssembly-accelerated implementations of common signal processing operations.
 */
export class SignalAccelerator extends Accelerator<any, any> {
  constructor(options?: AcceleratorOptions) {
    super('data-structures', 'signal', 'operations', options);
  }

  /**
   * Perform a Fast Fourier Transform (FFT) on a real-valued signal
   * 
   * @param input The input signal
   * @returns The FFT result (complex values as alternating real and imaginary parts)
   */
  public fft(input: FFTInput): number[] {
    // Determine the appropriate tier for the input
    const tier = this.determineTier(input);

    // Execute the operation using the appropriate implementation
    if (tier === AcceleratorTier.JS_PREFERRED) {
      return this.fftJs(input);
    } else {
      return this.fftWasm(input);
    }
  }

  /**
   * Perform a Fast Fourier Transform (FFT) on a real-valued signal using WebAssembly
   * 
   * @param input The input signal
   * @returns The FFT result (complex values as alternating real and imaginary parts)
   */
  private fftWasm(input: FFTInput): number[] {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return this.fftJs(input);
    }

    return safeWasmOperation(() => {
      try {
        // Check if the signal length is a power of 2
        const n = input.signal.length;
        if (n <= 1 || (n & (n - 1)) !== 0) {
          throw new Error('Signal length must be a power of 2');
        }

        // Convert to Float64Array for better performance
        const signalTypedArray = new Float64Array(input.signal);
        
        // Call the WebAssembly implementation
        const result = module.fft_f64(signalTypedArray);
        
        // Convert the result back to a regular array
        return Array.from(new Float64Array(result));
      } catch (error) {
        // Fall back to native implementation
        console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
        return this.fftJs(input);
      }
    });
  }

  /**
   * Perform a Fast Fourier Transform (FFT) on a real-valued signal using JavaScript
   * 
   * @param input The input signal
   * @returns The FFT result (complex values as alternating real and imaginary parts)
   */
  private fftJs(input: FFTInput): number[] {
    // Check if the signal length is a power of 2
    const n = input.signal.length;
    if (n <= 1 || (n & (n - 1)) !== 0) {
      throw new Error('Signal length must be a power of 2');
    }

    // Create complex signal (real values, zero imaginary parts)
    const complexSignal: number[] = [];
    for (let i = 0; i < n; i++) {
      complexSignal.push(input.signal[i], 0);
    }

    // Perform the FFT
    return this.fftRecursiveJs(complexSignal);
  }

  /**
   * Recursive implementation of the FFT algorithm using JavaScript
   * 
   * @param signal The input signal (complex values as alternating real and imaginary parts)
   * @returns The FFT result (complex values as alternating real and imaginary parts)
   */
  private fftRecursiveJs(signal: number[]): number[] {
    const n = signal.length / 2; // Number of complex values

    // Base case
    if (n === 1) {
      return signal.slice();
    }

    // Split the signal into even and odd indices
    const even: number[] = [];
    const odd: number[] = [];
    for (let i = 0; i < n; i++) {
      even.push(signal[i * 4], signal[i * 4 + 1]);
      odd.push(signal[i * 4 + 2], signal[i * 4 + 3]);
    }

    // Recursively compute the FFT of the even and odd parts
    const evenFFT = this.fftRecursiveJs(even);
    const oddFFT = this.fftRecursiveJs(odd);

    // Combine the results
    const result: number[] = new Array(signal.length);
    for (let k = 0; k < n / 2; k++) {
      // Calculate the twiddle factor
      const angle = -2 * Math.PI * k / n;
      const twiddleReal = Math.cos(angle);
      const twiddleImag = Math.sin(angle);
      
      // Get the odd term
      const oddReal = oddFFT[k * 2];
      const oddImag = oddFFT[k * 2 + 1];
      
      // Calculate the odd term multiplied by the twiddle factor
      const oddTermReal = oddReal * twiddleReal - oddImag * twiddleImag;
      const oddTermImag = oddReal * twiddleImag + oddImag * twiddleReal;
      
      // Get the even term
      const evenReal = evenFFT[k * 2];
      const evenImag = evenFFT[k * 2 + 1];
      
      // Calculate the FFT values
      result[k * 2] = evenReal + oddTermReal;
      result[k * 2 + 1] = evenImag + oddTermImag;
      result[(k + n / 2) * 2] = evenReal - oddTermReal;
      result[(k + n / 2) * 2 + 1] = evenImag - oddTermImag;
    }

    return result;
  }

  /**
   * Perform a convolution of two signals
   * 
   * @param input The input signals
   * @returns The convolution result
   */
  public convolve(input: ConvolutionInput): number[] {
    // Determine the appropriate tier for the input
    const tier = this.determineTier(input);

    // Execute the operation using the appropriate implementation
    if (tier === AcceleratorTier.JS_PREFERRED) {
      return this.convolveJs(input);
    } else {
      return this.convolveWasm(input);
    }
  }

  /**
   * Perform a convolution of two signals using WebAssembly
   * 
   * @param input The input signals
   * @returns The convolution result
   */
  private convolveWasm(input: ConvolutionInput): number[] {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return this.convolveJs(input);
    }

    return safeWasmOperation(() => {
      try {
        // Get the signal lengths
        const n1 = input.signal1.length;
        const n2 = input.signal2.length;
        
        // Convert to Float64Array for better performance
        const signal1TypedArray = new Float64Array(input.signal1);
        const signal2TypedArray = new Float64Array(input.signal2);
        
        // Call the WebAssembly implementation
        const result = module.convolve_f64(signal1TypedArray, signal2TypedArray, n1, n2);
        
        // Convert the result back to a regular array
        return Array.from(new Float64Array(result));
      } catch (error) {
        // Fall back to native implementation
        console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
        return this.convolveJs(input);
      }
    });
  }

  /**
   * Perform a convolution of two signals using JavaScript
   * 
   * @param input The input signals
   * @returns The convolution result
   */
  private convolveJs(input: ConvolutionInput): number[] {
    // Get the signal lengths
    const n1 = input.signal1.length;
    const n2 = input.signal2.length;
    const n = n1 + n2 - 1;

    // Create the result array
    const result = new Array(n).fill(0);

    // Perform the convolution
    for (let i = 0; i < n1; i++) {
      for (let j = 0; j < n2; j++) {
        result[i + j] += input.signal1[i] * input.signal2[j];
      }
    }

    return result;
  }

  /**
   * Determine the appropriate tier for the input
   * 
   * @param input The input
   * @returns The appropriate tier
   */
  protected override determineTier(input: FFTInput | ConvolutionInput): AcceleratorTier {
    // Use the tiering strategy if provided
    if (this.options?.tiering) {
      return super.determineTier(input);
    }

    // Default tiering strategy based on signal size
    let signalSize = 0;
    
    if ('signal' in input) {
      // FFT input
      signalSize = input.signal.length;
    } else {
      // Convolution input
      signalSize = input.signal1.length + input.signal2.length;
    }

    // Always use WebAssembly for large signals
    if (signalSize >= 1024) {
      return AcceleratorTier.HIGH_VALUE;
    }

    // Use WebAssembly conditionally for medium-sized signals
    if (signalSize >= 256) {
      return AcceleratorTier.CONDITIONAL;
    }

    // Use JavaScript for small signals
    return AcceleratorTier.JS_PREFERRED;
  }
}
