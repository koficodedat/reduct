/**
 * Complex number implementation
 *
 * A basic implementation of complex numbers for signal processing.
 *
 * @packageDocumentation
 */

import { IComplex } from './types';

/**
 * Complex number implementation
 * 
 * A basic implementation of complex numbers for signal processing.
 */
export class Complex implements IComplex {
  /**
   * Create a new complex number
   * 
   * @param real The real part
   * @param imag The imaginary part
   */
  constructor(
    public readonly real: number,
    public readonly imag: number
  ) {}

  /**
   * Add another complex number to this one
   * 
   * @param other The complex number to add
   * @returns A new complex number with the sum
   */
  public add(other: IComplex): IComplex {
    return new Complex(
      this.real + other.real,
      this.imag + other.imag
    );
  }

  /**
   * Subtract another complex number from this one
   * 
   * @param other The complex number to subtract
   * @returns A new complex number with the difference
   */
  public subtract(other: IComplex): IComplex {
    return new Complex(
      this.real - other.real,
      this.imag - other.imag
    );
  }

  /**
   * Multiply this complex number by another one
   * 
   * @param other The complex number to multiply by
   * @returns A new complex number with the product
   */
  public multiply(other: IComplex): IComplex {
    // (a + bi) * (c + di) = (ac - bd) + (ad + bc)i
    return new Complex(
      this.real * other.real - this.imag * other.imag,
      this.real * other.imag + this.imag * other.real
    );
  }

  /**
   * Divide this complex number by another one
   * 
   * @param other The complex number to divide by
   * @returns A new complex number with the quotient
   */
  public divide(other: IComplex): IComplex {
    // (a + bi) / (c + di) = (ac + bd)/(c^2 + d^2) + (bc - ad)/(c^2 + d^2)i
    const denominator = other.real * other.real + other.imag * other.imag;
    return new Complex(
      (this.real * other.real + this.imag * other.imag) / denominator,
      (this.imag * other.real - this.real * other.imag) / denominator
    );
  }

  /**
   * Calculate the magnitude (absolute value) of this complex number
   * 
   * @returns The magnitude
   */
  public magnitude(): number {
    return Math.sqrt(this.real * this.real + this.imag * this.imag);
  }

  /**
   * Calculate the phase (argument) of this complex number
   * 
   * @returns The phase in radians
   */
  public phase(): number {
    return Math.atan2(this.imag, this.real);
  }

  /**
   * Calculate the complex conjugate of this complex number
   * 
   * @returns A new complex number with the conjugate
   */
  public conjugate(): IComplex {
    return new Complex(this.real, -this.imag);
  }

  /**
   * Convert the complex number to a string
   * 
   * @returns A string representation of the complex number
   */
  public toString(): string {
    if (this.imag === 0) {
      return `${this.real}`;
    } else if (this.real === 0) {
      return `${this.imag}i`;
    } else if (this.imag < 0) {
      return `${this.real} - ${-this.imag}i`;
    } else {
      return `${this.real} + ${this.imag}i`;
    }
  }

  /**
   * Create a complex number from polar coordinates
   * 
   * @param magnitude The magnitude
   * @param phase The phase in radians
   * @returns A new complex number
   */
  public static fromPolar(magnitude: number, phase: number): IComplex {
    return new Complex(
      magnitude * Math.cos(phase),
      magnitude * Math.sin(phase)
    );
  }

  /**
   * Create a complex number from real and imaginary parts
   * 
   * @param real The real part
   * @param imag The imaginary part
   * @returns A new complex number
   */
  public static fromCartesian(real: number, imag: number): IComplex {
    return new Complex(real, imag);
  }
}
