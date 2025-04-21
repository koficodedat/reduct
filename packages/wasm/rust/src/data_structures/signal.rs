use wasm_bindgen::prelude::*;
use js_sys::{Float64Array};
use bumpalo::Bump;
use std::f64::consts::PI;

#[cfg(feature = "simd")]
use wide::{f64x4};

/// Complex number struct for FFT calculations
#[derive(Clone, Copy, Debug)]
struct Complex {
    real: f64,
    imag: f64,
}

impl Complex {
    /// Create a new complex number
    fn new(real: f64, imag: f64) -> Self {
        Complex { real, imag }
    }

    /// Add two complex numbers
    fn add(&self, other: &Complex) -> Complex {
        Complex::new(
            self.real + other.real,
            self.imag + other.imag
        )
    }

    /// Subtract two complex numbers
    fn sub(&self, other: &Complex) -> Complex {
        Complex::new(
            self.real - other.real,
            self.imag - other.imag
        )
    }

    /// Multiply two complex numbers
    fn mul(&self, other: &Complex) -> Complex {
        Complex::new(
            self.real * other.real - self.imag * other.imag,
            self.real * other.imag + self.imag * other.real
        )
    }
}

/// Fast Fourier Transform (FFT) implementation
///
/// Takes a real-valued signal and returns the FFT result as alternating real and imaginary parts.
#[wasm_bindgen]
pub fn fft_f64(signal: &JsValue) -> Result<JsValue, JsValue> {
    // Convert input to typed array for better performance
    let signal_array = Float64Array::new(signal);
    let n = signal_array.length() as usize;
    
    // Check if the signal length is a power of 2
    if n <= 1 || (n & (n - 1)) != 0 {
        return Err(JsValue::from_str("Signal length must be a power of 2"));
    }
    
    // Allocate memory for the input data
    let bump = Bump::new();
    let mut complex_signal = bump.alloc_slice_fill_copy(n, Complex::new(0.0, 0.0));
    
    // Copy input data
    for i in 0..n {
        complex_signal[i].real = signal_array.get_index(i as u32);
    }
    
    // Perform the FFT
    let result = fft_recursive(&mut complex_signal, n);
    
    // Create a new typed array for the result (alternating real and imaginary parts)
    let result_array = Float64Array::new_with_length((n * 2) as u32);
    for i in 0..n {
        result_array.set_index((i * 2) as u32, result[i].real);
        result_array.set_index((i * 2 + 1) as u32, result[i].imag);
    }
    
    Ok(result_array.into())
}

/// Recursive implementation of the FFT algorithm
fn fft_recursive(signal: &mut [Complex], n: usize) -> Vec<Complex> {
    // Base case
    if n == 1 {
        return vec![signal[0]];
    }
    
    // Split the signal into even and odd indices
    let mut even = Vec::with_capacity(n / 2);
    let mut odd = Vec::with_capacity(n / 2);
    
    for i in 0..n/2 {
        even.push(signal[i * 2]);
        odd.push(signal[i * 2 + 1]);
    }
    
    // Recursively compute the FFT of the even and odd parts
    let even_fft = fft_recursive(&mut even, n / 2);
    let odd_fft = fft_recursive(&mut odd, n / 2);
    
    // Combine the results
    let mut result = vec![Complex::new(0.0, 0.0); n];
    
    for k in 0..n/2 {
        // Calculate the twiddle factor
        let angle = -2.0 * PI * (k as f64) / (n as f64);
        let twiddle = Complex::new(angle.cos(), angle.sin());
        
        // Calculate the FFT values
        let odd_term = odd_fft[k].mul(&twiddle);
        result[k] = even_fft[k].add(&odd_term);
        result[k + n/2] = even_fft[k].sub(&odd_term);
    }
    
    result
}

/// Convolution implementation
///
/// Takes two signals and returns their convolution.
#[wasm_bindgen]
pub fn convolve_f64(
    signal1: &JsValue,
    signal2: &JsValue,
    n1: usize,
    n2: usize
) -> Result<JsValue, JsValue> {
    // Convert inputs to typed arrays for better performance
    let signal1_array = Float64Array::new(signal1);
    let signal2_array = Float64Array::new(signal2);
    
    // Calculate the result length
    let n = n1 + n2 - 1;
    
    // Create a new typed array for the result
    let result_array = Float64Array::new_with_length(n as u32);
    
    // Allocate memory for the input data
    let bump = Bump::new();
    let signal1_values = bump.alloc_slice_fill_copy(n1, 0.0);
    let signal2_values = bump.alloc_slice_fill_copy(n2, 0.0);
    
    // Copy input data
    for i in 0..n1 {
        signal1_values[i] = signal1_array.get_index(i as u32);
    }
    for i in 0..n2 {
        signal2_values[i] = signal2_array.get_index(i as u32);
    }
    
    // Perform convolution
    #[cfg(feature = "simd")]
    {
        // Use SIMD for better performance when possible
        convolve_simd(signal1_values, signal2_values, n1, n2, &result_array);
    }
    
    #[cfg(not(feature = "simd"))]
    {
        // Fall back to scalar implementation
        convolve_scalar(signal1_values, signal2_values, n1, n2, &result_array);
    }
    
    Ok(result_array.into())
}

/// Convolution using SIMD
///
/// This function uses SIMD instructions for better performance.
#[cfg(feature = "simd")]
fn convolve_simd(
    signal1: &[f64],
    signal2: &[f64],
    n1: usize,
    n2: usize,
    result: &Float64Array
) {
    // Create a buffer for the result
    let n = n1 + n2 - 1;
    let mut result_buffer = vec![0.0; n];
    
    // Process the convolution in blocks for better cache locality
    const BLOCK_SIZE: usize = 4;
    
    for i in 0..n1 {
        let s1 = signal1[i];
        let s1_vec = f64x4::splat(s1);
        
        // Process in chunks of 4 elements
        let simd_length = (n2 / BLOCK_SIZE) * BLOCK_SIZE;
        
        for j in (0..simd_length).step_by(BLOCK_SIZE) {
            let s2_vec = f64x4::from([
                signal2[j],
                signal2[j + 1],
                signal2[j + 2],
                signal2[j + 3],
            ]);
            
            let product = s1_vec * s2_vec;
            
            // Update the result buffer
            let idx = i + j;
            let current = f64x4::from([
                result_buffer[idx],
                result_buffer[idx + 1],
                result_buffer[idx + 2],
                result_buffer[idx + 3],
            ]);
            
            let updated = current + product;
            
            result_buffer[idx] = updated.extract(0);
            result_buffer[idx + 1] = updated.extract(1);
            result_buffer[idx + 2] = updated.extract(2);
            result_buffer[idx + 3] = updated.extract(3);
        }
        
        // Process remaining elements
        for j in simd_length..n2 {
            result_buffer[i + j] += s1 * signal2[j];
        }
    }
    
    // Copy the result to the output array
    for i in 0..n {
        result.set_index(i as u32, result_buffer[i]);
    }
}

/// Convolution using scalar operations
///
/// This function is used when SIMD is not available.
#[cfg(not(feature = "simd"))]
fn convolve_scalar(
    signal1: &[f64],
    signal2: &[f64],
    n1: usize,
    n2: usize,
    result: &Float64Array
) {
    // Create a buffer for the result
    let n = n1 + n2 - 1;
    let mut result_buffer = vec![0.0; n];
    
    // Perform the convolution
    for i in 0..n1 {
        for j in 0..n2 {
            result_buffer[i + j] += signal1[i] * signal2[j];
        }
    }
    
    // Copy the result to the output array
    for i in 0..n {
        result.set_index(i as u32, result_buffer[i]);
    }
}
