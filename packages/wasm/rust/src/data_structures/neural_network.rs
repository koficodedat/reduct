use wasm_bindgen::prelude::*;
use js_sys::{Array, Float64Array, Object, Reflect};
use bumpalo::Bump;

#[cfg(feature = "simd")]
use wide::{f64x4, CmpLt};

/// Activation functions for neural networks
#[wasm_bindgen]
pub enum ActivationFunction {
    Sigmoid,
    ReLU,
    Tanh,
    LeakyReLU,
}

/// Forward propagation for a single layer neural network
///
/// Takes input data, weights, biases, and activation function, and returns the output.
/// This is much faster than using JavaScript, especially for large networks.
#[wasm_bindgen]
pub fn neural_network_forward_f64(
    inputs: &JsValue,
    weights: &JsValue,
    biases: &JsValue,
    activation: ActivationFunction,
) -> Result<JsValue, JsValue> {
    // Convert inputs to typed arrays for better performance
    let inputs_array = Float64Array::new(inputs);
    let weights_array = Float64Array::new(weights);
    let biases_array = Float64Array::new(biases);
    
    // Get dimensions
    let num_samples = inputs_array.length() as usize;
    let num_outputs = biases_array.length() as usize;
    
    // Validate dimensions
    if num_samples == 0 || num_outputs == 0 {
        return Err(JsValue::from_str("Empty inputs or biases"));
    }
    
    // Calculate number of features
    let num_features = weights_array.length() as usize / num_outputs;
    
    if weights_array.length() as usize != num_features * num_outputs {
        return Err(JsValue::from_str("Invalid weights dimensions"));
    }
    
    // Create output array
    let output_array = Float64Array::new_with_length(num_outputs as u32);
    
    // Allocate memory for the input data
    let bump = Bump::new();
    let inputs_values = bump.alloc_slice_fill_copy(num_samples, 0.0);
    let weights_values = bump.alloc_slice_fill_copy(weights_array.length() as usize, 0.0);
    let biases_values = bump.alloc_slice_fill_copy(num_outputs, 0.0);
    
    // Copy input data
    for i in 0..num_samples {
        inputs_values[i] = inputs_array.get_index(i as u32);
    }
    
    // Copy weights
    for i in 0..weights_array.length() as usize {
        weights_values[i] = weights_array.get_index(i as u32);
    }
    
    // Copy biases
    for i in 0..num_outputs {
        biases_values[i] = biases_array.get_index(i as u32);
    }
    
    // Calculate outputs
    for j in 0..num_outputs {
        let mut sum = biases_values[j];
        
        #[cfg(feature = "simd")]
        {
            let simd_length = num_samples - (num_samples % 4);
            let mut sum_vec = f64x4::splat(0.0);
            
            // Process in chunks of 4 elements
            for i in (0..simd_length).step_by(4) {
                let inputs_vec = f64x4::from([
                    inputs_values[i],
                    inputs_values[i + 1],
                    inputs_values[i + 2],
                    inputs_values[i + 3],
                ]);
                
                let weights_vec = f64x4::from([
                    weights_values[j * num_features + i],
                    weights_values[j * num_features + i + 1],
                    weights_values[j * num_features + i + 2],
                    weights_values[j * num_features + i + 3],
                ]);
                
                sum_vec = sum_vec + (inputs_vec * weights_vec);
            }
            
            sum += sum_vec.reduce_add();
            
            // Process remaining elements
            for i in simd_length..num_samples {
                sum += inputs_values[i] * weights_values[j * num_features + i];
            }
        }
        
        #[cfg(not(feature = "simd"))]
        {
            for i in 0..num_samples {
                sum += inputs_values[i] * weights_values[j * num_features + i];
            }
        }
        
        // Apply activation function
        let activated = match activation {
            ActivationFunction::Sigmoid => 1.0 / (1.0 + (-sum).exp()),
            ActivationFunction::ReLU => if sum > 0.0 { sum } else { 0.0 },
            ActivationFunction::Tanh => sum.tanh(),
            ActivationFunction::LeakyReLU => if sum > 0.0 { sum } else { 0.01 * sum },
        };
        
        output_array.set_index(j as u32, activated);
    }
    
    Ok(output_array.into())
}

/// Forward propagation for a multi-layer neural network
///
/// Takes input data, weights, biases, and activation functions, and returns the output.
/// This is much faster than using JavaScript, especially for large networks.
#[wasm_bindgen]
pub fn neural_network_forward_multi_layer_f64(
    inputs: &JsValue,
    weights_array: &JsValue,
    biases_array: &JsValue,
    activations_array: &JsValue,
) -> Result<JsValue, JsValue> {
    // Convert inputs to typed array for better performance
    let inputs_typed = Float64Array::new(inputs);
    let num_samples = inputs_typed.length() as usize;
    
    // Convert arrays of arrays to JavaScript arrays
    let weights_js = Array::from(weights_array);
    let biases_js = Array::from(biases_array);
    let activations_js = Array::from(activations_array);
    
    // Get number of layers
    let num_layers = weights_js.length() as usize;
    
    if biases_js.length() as usize != num_layers || activations_js.length() as usize != num_layers {
        return Err(JsValue::from_str("Inconsistent number of layers"));
    }
    
    // Initialize current layer output with inputs
    let mut current_output = inputs_typed;
    
    // Process each layer
    for layer in 0..num_layers {
        // Get weights, biases, and activation for this layer
        let weights = Float64Array::new(&weights_js.get(layer as u32));
        let biases = Float64Array::new(&biases_js.get(layer as u32));
        let activation_value = activations_js.get(layer as u32);
        
        // Convert activation value to enum
        let activation = if activation_value.as_string().unwrap_or_default() == "sigmoid" {
            ActivationFunction::Sigmoid
        } else if activation_value.as_string().unwrap_or_default() == "relu" {
            ActivationFunction::ReLU
        } else if activation_value.as_string().unwrap_or_default() == "tanh" {
            ActivationFunction::Tanh
        } else if activation_value.as_string().unwrap_or_default() == "leaky_relu" {
            ActivationFunction::LeakyReLU
        } else {
            return Err(JsValue::from_str("Invalid activation function"));
        };
        
        // Calculate layer output
        let layer_output = neural_network_forward_f64(&current_output, &weights, &biases, activation)?;
        
        // Update current output
        current_output = Float64Array::new(&layer_output);
    }
    
    Ok(current_output.into())
}

/// Backpropagation for a single layer neural network
///
/// Takes input data, weights, biases, targets, learning rate, and activation function,
/// and returns the updated weights and biases.
/// This is much faster than using JavaScript, especially for large networks.
#[wasm_bindgen]
pub fn neural_network_backprop_f64(
    inputs: &JsValue,
    weights: &JsValue,
    biases: &JsValue,
    targets: &JsValue,
    learning_rate: f64,
    activation: ActivationFunction,
) -> Result<JsValue, JsValue> {
    // Convert inputs to typed arrays for better performance
    let inputs_array = Float64Array::new(inputs);
    let weights_array = Float64Array::new(weights);
    let biases_array = Float64Array::new(biases);
    let targets_array = Float64Array::new(targets);
    
    // Get dimensions
    let num_samples = inputs_array.length() as usize;
    let num_outputs = biases_array.length() as usize;
    
    // Validate dimensions
    if num_samples == 0 || num_outputs == 0 {
        return Err(JsValue::from_str("Empty inputs or biases"));
    }
    
    if targets_array.length() as usize != num_outputs {
        return Err(JsValue::from_str("Targets dimension mismatch"));
    }
    
    // Calculate number of features
    let num_features = weights_array.length() as usize / num_outputs;
    
    if weights_array.length() as usize != num_features * num_outputs {
        return Err(JsValue::from_str("Invalid weights dimensions"));
    }
    
    // Create output arrays for updated weights and biases
    let updated_weights = Float64Array::new_with_length(weights_array.length());
    let updated_biases = Float64Array::new_with_length(biases_array.length());
    
    // Allocate memory for the input data
    let bump = Bump::new();
    let inputs_values = bump.alloc_slice_fill_copy(num_samples, 0.0);
    let weights_values = bump.alloc_slice_fill_copy(weights_array.length() as usize, 0.0);
    let biases_values = bump.alloc_slice_fill_copy(num_outputs, 0.0);
    let targets_values = bump.alloc_slice_fill_copy(num_outputs, 0.0);
    
    // Copy input data
    for i in 0..num_samples {
        inputs_values[i] = inputs_array.get_index(i as u32);
    }
    
    // Copy weights
    for i in 0..weights_array.length() as usize {
        weights_values[i] = weights_array.get_index(i as u32);
    }
    
    // Copy biases
    for i in 0..num_outputs {
        biases_values[i] = biases_array.get_index(i as u32);
    }
    
    // Copy targets
    for i in 0..num_outputs {
        targets_values[i] = targets_array.get_index(i as u32);
    }
    
    // Forward pass to calculate outputs and store for backpropagation
    let mut outputs = vec![0.0; num_outputs];
    let mut pre_activations = vec![0.0; num_outputs];
    
    for j in 0..num_outputs {
        let mut sum = biases_values[j];
        
        for i in 0..num_samples {
            sum += inputs_values[i] * weights_values[j * num_features + i];
        }
        
        pre_activations[j] = sum;
        
        // Apply activation function
        outputs[j] = match activation {
            ActivationFunction::Sigmoid => 1.0 / (1.0 + (-sum).exp()),
            ActivationFunction::ReLU => if sum > 0.0 { sum } else { 0.0 },
            ActivationFunction::Tanh => sum.tanh(),
            ActivationFunction::LeakyReLU => if sum > 0.0 { sum } else { 0.01 * sum },
        };
    }
    
    // Backpropagation
    for j in 0..num_outputs {
        // Calculate error derivative with respect to output
        let error = outputs[j] - targets_values[j];
        
        // Calculate derivative of activation function
        let activation_derivative = match activation {
            ActivationFunction::Sigmoid => outputs[j] * (1.0 - outputs[j]),
            ActivationFunction::ReLU => if pre_activations[j] > 0.0 { 1.0 } else { 0.0 },
            ActivationFunction::Tanh => 1.0 - outputs[j] * outputs[j],
            ActivationFunction::LeakyReLU => if pre_activations[j] > 0.0 { 1.0 } else { 0.01 },
        };
        
        // Calculate delta
        let delta = error * activation_derivative;
        
        // Update biases
        let updated_bias = biases_values[j] - learning_rate * delta;
        updated_biases.set_index(j as u32, updated_bias);
        
        // Update weights
        for i in 0..num_samples {
            let weight_index = j * num_features + i;
            let updated_weight = weights_values[weight_index] - learning_rate * delta * inputs_values[i];
            updated_weights.set_index(weight_index as u32, updated_weight);
        }
    }
    
    // Create result object
    let result = Object::new();
    Reflect::set(&result, &JsValue::from_str("weights"), &updated_weights)?;
    Reflect::set(&result, &JsValue::from_str("biases"), &updated_biases)?;
    
    Ok(result.into())
}

/// Calculate the mean squared error loss
///
/// Takes predictions and targets, and returns the mean squared error.
/// This is much faster than using JavaScript, especially for large arrays.
#[wasm_bindgen]
pub fn neural_network_mse_loss_f64(predictions: &JsValue, targets: &JsValue) -> f64 {
    // Convert inputs to typed arrays for better performance
    let predictions_array = Float64Array::new(predictions);
    let targets_array = Float64Array::new(targets);
    
    // Get dimensions
    let length = std::cmp::min(predictions_array.length(), targets_array.length()) as usize;
    
    // Early return for empty arrays
    if length == 0 {
        return 0.0;
    }
    
    // Allocate memory for the input data
    let bump = Bump::new();
    let predictions_values = bump.alloc_slice_fill_copy(length, 0.0);
    let targets_values = bump.alloc_slice_fill_copy(length, 0.0);
    
    // Copy input data
    for i in 0..length {
        predictions_values[i] = predictions_array.get_index(i as u32);
        targets_values[i] = targets_array.get_index(i as u32);
    }
    
    // Calculate mean squared error
    let mut sum_squared_error = 0.0;
    
    #[cfg(feature = "simd")]
    {
        let simd_length = length - (length % 4);
        let mut sum_squared_error_vec = f64x4::splat(0.0);
        
        // Process in chunks of 4 elements
        for i in (0..simd_length).step_by(4) {
            let predictions_vec = f64x4::from([
                predictions_values[i],
                predictions_values[i + 1],
                predictions_values[i + 2],
                predictions_values[i + 3],
            ]);
            
            let targets_vec = f64x4::from([
                targets_values[i],
                targets_values[i + 1],
                targets_values[i + 2],
                targets_values[i + 3],
            ]);
            
            let error_vec = predictions_vec - targets_vec;
            let squared_error_vec = error_vec * error_vec;
            
            sum_squared_error_vec = sum_squared_error_vec + squared_error_vec;
        }
        
        sum_squared_error = sum_squared_error_vec.reduce_add();
        
        // Process remaining elements
        for i in simd_length..length {
            let error = predictions_values[i] - targets_values[i];
            sum_squared_error += error * error;
        }
    }
    
    #[cfg(not(feature = "simd"))]
    {
        for i in 0..length {
            let error = predictions_values[i] - targets_values[i];
            sum_squared_error += error * error;
        }
    }
    
    // Return mean squared error
    sum_squared_error / length as f64
}

/// Calculate the binary cross-entropy loss
///
/// Takes predictions and targets, and returns the binary cross-entropy loss.
/// This is much faster than using JavaScript, especially for large arrays.
#[wasm_bindgen]
pub fn neural_network_binary_cross_entropy_loss_f64(predictions: &JsValue, targets: &JsValue) -> f64 {
    // Convert inputs to typed arrays for better performance
    let predictions_array = Float64Array::new(predictions);
    let targets_array = Float64Array::new(targets);
    
    // Get dimensions
    let length = std::cmp::min(predictions_array.length(), targets_array.length()) as usize;
    
    // Early return for empty arrays
    if length == 0 {
        return 0.0;
    }
    
    // Allocate memory for the input data
    let bump = Bump::new();
    let predictions_values = bump.alloc_slice_fill_copy(length, 0.0);
    let targets_values = bump.alloc_slice_fill_copy(length, 0.0);
    
    // Copy input data
    for i in 0..length {
        predictions_values[i] = predictions_array.get_index(i as u32);
        targets_values[i] = targets_array.get_index(i as u32);
    }
    
    // Calculate binary cross-entropy loss
    let mut sum_loss = 0.0;
    
    for i in 0..length {
        // Clip predictions to avoid log(0)
        let p = predictions_values[i].max(1e-15).min(1.0 - 1e-15);
        let t = targets_values[i];
        
        sum_loss += t * p.ln() + (1.0 - t) * (1.0 - p).ln();
    }
    
    // Return negative mean loss
    -sum_loss / length as f64
}

/// Initialize weights using Xavier/Glorot initialization
///
/// Takes input size, output size, and returns initialized weights.
/// This is much faster than using JavaScript, especially for large networks.
#[wasm_bindgen]
pub fn neural_network_init_weights_xavier_f64(input_size: usize, output_size: usize) -> Result<JsValue, JsValue> {
    // Validate dimensions
    if input_size == 0 || output_size == 0 {
        return Err(JsValue::from_str("Input size and output size must be greater than 0"));
    }
    
    // Calculate standard deviation for Xavier initialization
    let std_dev = (2.0 / (input_size + output_size) as f64).sqrt();
    
    // Create weights array
    let weights = Float64Array::new_with_length((input_size * output_size) as u32);
    
    // Initialize weights
    for i in 0..(input_size * output_size) {
        // Generate random number from standard normal distribution
        let u1 = js_sys::Math::random();
        let u2 = js_sys::Math::random();
        
        // Box-Muller transform
        let z0 = (-2.0 * u1.ln()).sqrt() * (2.0 * std::f64::consts::PI * u2).cos();
        
        // Scale by standard deviation
        let weight = z0 * std_dev;
        
        weights.set_index(i as u32, weight);
    }
    
    Ok(weights.into())
}

/// Initialize biases to zero
///
/// Takes output size and returns initialized biases.
/// This is much faster than using JavaScript, especially for large networks.
#[wasm_bindgen]
pub fn neural_network_init_biases_zero_f64(output_size: usize) -> Result<JsValue, JsValue> {
    // Validate dimensions
    if output_size == 0 {
        return Err(JsValue::from_str("Output size must be greater than 0"));
    }
    
    // Create biases array
    let biases = Float64Array::new_with_length(output_size as u32);
    
    // Initialize biases to zero
    for i in 0..output_size {
        biases.set_index(i as u32, 0.0);
    }
    
    Ok(biases.into())
}
