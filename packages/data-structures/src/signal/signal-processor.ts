/**
 * Signal processor implementation
 *
 * A basic implementation of signal processing operations.
 *
 * @packageDocumentation
 */

import { IComplex, ISignalProcessor } from './types';
import { Complex } from './complex';

/**
 * Signal processor implementation
 * 
 * A basic implementation of signal processing operations.
 */
export class SignalProcessor implements ISignalProcessor {
  /**
   * Perform a Fast Fourier Transform (FFT) on a real-valued signal
   * 
   * @param signal The input signal (real values)
   * @returns The FFT result (complex values)
   */
  public fft(signal: number[]): IComplex[] {
    // Check if the signal length is a power of 2
    const n = signal.length;
    if (n <= 1 || (n & (n - 1)) !== 0) {
      throw new Error('Signal length must be a power of 2');
    }

    // Convert the signal to complex numbers
    const complexSignal: IComplex[] = signal.map(value => new Complex(value, 0));

    // Perform the FFT
    return this.fftRecursive(complexSignal);
  }

  /**
   * Recursive implementation of the FFT algorithm
   * 
   * @param signal The input signal (complex values)
   * @returns The FFT result (complex values)
   */
  private fftRecursive(signal: IComplex[]): IComplex[] {
    const n = signal.length;

    // Base case
    if (n === 1) {
      return [signal[0]];
    }

    // Split the signal into even and odd indices
    const even: IComplex[] = [];
    const odd: IComplex[] = [];
    for (let i = 0; i < n; i += 2) {
      even.push(signal[i]);
      odd.push(signal[i + 1]);
    }

    // Recursively compute the FFT of the even and odd parts
    const evenFFT = this.fftRecursive(even);
    const oddFFT = this.fftRecursive(odd);

    // Combine the results
    const result: IComplex[] = new Array(n);
    for (let k = 0; k < n / 2; k++) {
      // Calculate the twiddle factor
      const angle = -2 * Math.PI * k / n;
      const twiddle = Complex.fromPolar(1, angle);
      
      // Calculate the FFT values
      const oddTerm = twiddle.multiply(oddFFT[k]);
      result[k] = evenFFT[k].add(oddTerm);
      result[k + n / 2] = evenFFT[k].subtract(oddTerm);
    }

    return result;
  }

  /**
   * Perform an Inverse Fast Fourier Transform (IFFT) on a complex-valued signal
   * 
   * @param spectrum The input spectrum (complex values)
   * @returns The IFFT result (real values)
   */
  public ifft(spectrum: IComplex[]): number[] {
    // Check if the spectrum length is a power of 2
    const n = spectrum.length;
    if (n <= 1 || (n & (n - 1)) !== 0) {
      throw new Error('Spectrum length must be a power of 2');
    }

    // Take the complex conjugate of the spectrum
    const conjugatedSpectrum = spectrum.map(value => value.conjugate());

    // Perform the FFT on the conjugated spectrum
    const result = this.fftRecursive(conjugatedSpectrum);

    // Take the complex conjugate of the result and divide by n
    return result.map(value => value.conjugate().real / n);
  }

  /**
   * Perform a convolution of two signals
   * 
   * @param signal1 The first signal
   * @param signal2 The second signal
   * @returns The convolution result
   */
  public convolve(signal1: number[], signal2: number[]): number[] {
    // Get the signal lengths
    const n1 = signal1.length;
    const n2 = signal2.length;
    const n = n1 + n2 - 1;

    // Pad the signals to the next power of 2
    const paddedLength = Math.pow(2, Math.ceil(Math.log2(n)));
    const paddedSignal1 = this.padSignal(signal1, paddedLength);
    const paddedSignal2 = this.padSignal(signal2, paddedLength);

    // Compute the FFT of both signals
    const fft1 = this.fft(paddedSignal1);
    const fft2 = this.fft(paddedSignal2);

    // Multiply the FFTs element-wise
    const product: IComplex[] = new Array(paddedLength);
    for (let i = 0; i < paddedLength; i++) {
      product[i] = fft1[i].multiply(fft2[i]);
    }

    // Compute the IFFT of the product
    const result = this.ifft(product);

    // Return only the first n values
    return result.slice(0, n);
  }

  /**
   * Apply a filter to a signal
   * 
   * @param signal The input signal
   * @param filter The filter coefficients
   * @returns The filtered signal
   */
  public filter(signal: number[], filter: number[]): number[] {
    // Perform convolution of the signal and the filter
    return this.convolve(signal, filter);
  }

  /**
   * Calculate the power spectrum of a signal
   * 
   * @param signal The input signal
   * @returns The power spectrum
   */
  public powerSpectrum(signal: number[]): number[] {
    // Compute the FFT of the signal
    const fft = this.fft(signal);

    // Calculate the power spectrum (magnitude squared)
    return fft.map(value => value.magnitude() * value.magnitude());
  }

  /**
   * Calculate the cross-correlation of two signals
   * 
   * @param signal1 The first signal
   * @param signal2 The second signal
   * @returns The cross-correlation result
   */
  public correlate(signal1: number[], signal2: number[]): number[] {
    // Reverse the second signal
    const reversedSignal2 = signal2.slice().reverse();

    // Perform convolution of the first signal and the reversed second signal
    return this.convolve(signal1, reversedSignal2);
  }

  /**
   * Pad a signal to the specified length
   * 
   * @param signal The input signal
   * @param length The desired length
   * @returns The padded signal
   */
  private padSignal(signal: number[], length: number): number[] {
    if (signal.length >= length) {
      return signal.slice(0, length);
    }
    return [...signal, ...new Array(length - signal.length).fill(0)];
  }
}
