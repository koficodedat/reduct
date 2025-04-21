/**
 * Signal processing types
 *
 * Type definitions for signal processing operations.
 *
 * @packageDocumentation
 */

/**
 * Complex number interface
 * 
 * Represents a complex number with real and imaginary parts.
 */
export interface IComplex {
  /**
   * The real part of the complex number
   */
  readonly real: number;

  /**
   * The imaginary part of the complex number
   */
  readonly imag: number;

  /**
   * Add another complex number to this one
   * 
   * @param other The complex number to add
   * @returns A new complex number with the sum
   */
  add(other: IComplex): IComplex;

  /**
   * Subtract another complex number from this one
   * 
   * @param other The complex number to subtract
   * @returns A new complex number with the difference
   */
  subtract(other: IComplex): IComplex;

  /**
   * Multiply this complex number by another one
   * 
   * @param other The complex number to multiply by
   * @returns A new complex number with the product
   */
  multiply(other: IComplex): IComplex;

  /**
   * Divide this complex number by another one
   * 
   * @param other The complex number to divide by
   * @returns A new complex number with the quotient
   */
  divide(other: IComplex): IComplex;

  /**
   * Calculate the magnitude (absolute value) of this complex number
   * 
   * @returns The magnitude
   */
  magnitude(): number;

  /**
   * Calculate the phase (argument) of this complex number
   * 
   * @returns The phase in radians
   */
  phase(): number;

  /**
   * Calculate the complex conjugate of this complex number
   * 
   * @returns A new complex number with the conjugate
   */
  conjugate(): IComplex;
}

/**
 * Signal processing interface
 * 
 * Provides methods for signal processing operations.
 */
export interface ISignalProcessor {
  /**
   * Perform a Fast Fourier Transform (FFT) on a real-valued signal
   * 
   * @param signal The input signal (real values)
   * @returns The FFT result (complex values)
   */
  fft(signal: number[]): IComplex[];

  /**
   * Perform an Inverse Fast Fourier Transform (IFFT) on a complex-valued signal
   * 
   * @param spectrum The input spectrum (complex values)
   * @returns The IFFT result (real values)
   */
  ifft(spectrum: IComplex[]): number[];

  /**
   * Perform a convolution of two signals
   * 
   * @param signal1 The first signal
   * @param signal2 The second signal
   * @returns The convolution result
   */
  convolve(signal1: number[], signal2: number[]): number[];

  /**
   * Apply a filter to a signal
   * 
   * @param signal The input signal
   * @param filter The filter coefficients
   * @returns The filtered signal
   */
  filter(signal: number[], filter: number[]): number[];

  /**
   * Calculate the power spectrum of a signal
   * 
   * @param signal The input signal
   * @returns The power spectrum
   */
  powerSpectrum(signal: number[]): number[];

  /**
   * Calculate the cross-correlation of two signals
   * 
   * @param signal1 The first signal
   * @param signal2 The second signal
   * @returns The cross-correlation result
   */
  correlate(signal1: number[], signal2: number[]): number[];
}
