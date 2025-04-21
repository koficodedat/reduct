import { WasmAccelerator } from '../wasm-accelerator';
import { PerformanceProfile, AcceleratorOptions } from '../accelerator';
import { WebAssemblyFeature } from '../../core/feature-detection';

/**
 * Activation functions for neural networks
 */
export enum ActivationFunction {
  Sigmoid = 0,
  ReLU = 1,
  Tanh = 2,
  LeakyReLU = 3,
}

/**
 * Neural network layer interface
 */
export interface NeuralNetworkLayer {
  /** The weights of the layer */
  weights: number[];
  /** The biases of the layer */
  biases: number[];
  /** The activation function of the layer */
  activation: ActivationFunction | string;
}

/**
 * Neural network backpropagation result interface
 */
export interface BackpropagationResult {
  /** The updated weights */
  weights: number[];
  /** The updated biases */
  biases: number[];
}

/**
 * Neural network accelerator
 * 
 * Provides optimized implementations of neural network operations
 * using WebAssembly.
 */
export class NeuralNetworkAccelerator extends WasmAccelerator {
  /**
   * Create a new neural network accelerator
   * @param options Options for the accelerator
   */
  constructor(options: AcceleratorOptions = {}) {
    super('data-structures', 'neural-network', 'operations', {
      ...options,
      requiredFeatures: [WebAssemblyFeature.BASIC],
    });
  }

  /**
   * Forward propagation for a single layer neural network
   * 
   * @param inputs The input data
   * @param weights The weights
   * @param biases The biases
   * @param activation The activation function
   * @returns The output of the neural network
   */
  public forward(
    inputs: number[],
    weights: number[],
    biases: number[],
    activation: ActivationFunction,
  ): number[] {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return this.forwardJs(inputs, weights, biases, activation);
    }

    try {
      // Check if the arrays contain only numbers
      if (!this.isNumericArray(inputs) || !this.isNumericArray(weights) || !this.isNumericArray(biases)) {
        return this.forwardJs(inputs, weights, biases, activation);
      }

      // Validate dimensions
      const numFeatures = inputs.length;
      const numOutputs = biases.length;

      if (weights.length !== numFeatures * numOutputs) {
        throw new Error('Invalid weights dimensions');
      }

      // Convert to Float64Array for better performance
      const inputsTypedArray = new Float64Array(inputs);
      const weightsTypedArray = new Float64Array(weights);
      const biasesTypedArray = new Float64Array(biases);
      
      // Call the WebAssembly implementation
      const result = module.neural_network_forward_f64(
        inputsTypedArray,
        weightsTypedArray,
        biasesTypedArray,
        activation,
      );
      
      // Convert the result back to a regular array
      return Array.from(new Float64Array(result));
    } catch (error) {
      // Fall back to native implementation
      console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      return this.forwardJs(inputs, weights, biases, activation);
    }
  }

  /**
   * Forward propagation for a multi-layer neural network
   * 
   * @param inputs The input data
   * @param layers The layers of the neural network
   * @returns The output of the neural network
   */
  public forwardMultiLayer(inputs: number[], layers: NeuralNetworkLayer[]): number[] {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return this.forwardMultiLayerJs(inputs, layers);
    }

    try {
      // Check if the arrays contain only numbers
      if (!this.isNumericArray(inputs)) {
        return this.forwardMultiLayerJs(inputs, layers);
      }

      // Validate layers
      if (layers.length === 0) {
        throw new Error('No layers provided');
      }

      // Convert to Float64Array for better performance
      const inputsTypedArray = new Float64Array(inputs);
      
      // Prepare arrays for weights, biases, and activations
      const weightsArray = layers.map(layer => new Float64Array(layer.weights));
      const biasesArray = layers.map(layer => new Float64Array(layer.biases));
      const activationsArray = layers.map(layer => {
        if (typeof layer.activation === 'string') {
          return layer.activation;
        } else {
          return this.getActivationName(layer.activation);
        }
      });
      
      // Call the WebAssembly implementation
      const result = module.neural_network_forward_multi_layer_f64(
        inputsTypedArray,
        weightsArray,
        biasesArray,
        activationsArray,
      );
      
      // Convert the result back to a regular array
      return Array.from(new Float64Array(result));
    } catch (error) {
      // Fall back to native implementation
      console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      return this.forwardMultiLayerJs(inputs, layers);
    }
  }

  /**
   * Backpropagation for a single layer neural network
   * 
   * @param inputs The input data
   * @param weights The weights
   * @param biases The biases
   * @param targets The target outputs
   * @param learningRate The learning rate
   * @param activation The activation function
   * @returns The updated weights and biases
   */
  public backprop(
    inputs: number[],
    weights: number[],
    biases: number[],
    targets: number[],
    learningRate: number,
    activation: ActivationFunction,
  ): BackpropagationResult {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return this.backpropJs(inputs, weights, biases, targets, learningRate, activation);
    }

    try {
      // Check if the arrays contain only numbers
      if (
        !this.isNumericArray(inputs) ||
        !this.isNumericArray(weights) ||
        !this.isNumericArray(biases) ||
        !this.isNumericArray(targets)
      ) {
        return this.backpropJs(inputs, weights, biases, targets, learningRate, activation);
      }

      // Validate dimensions
      const numFeatures = inputs.length;
      const numOutputs = biases.length;

      if (weights.length !== numFeatures * numOutputs) {
        throw new Error('Invalid weights dimensions');
      }

      if (targets.length !== numOutputs) {
        throw new Error('Targets dimension mismatch');
      }

      // Convert to Float64Array for better performance
      const inputsTypedArray = new Float64Array(inputs);
      const weightsTypedArray = new Float64Array(weights);
      const biasesTypedArray = new Float64Array(biases);
      const targetsTypedArray = new Float64Array(targets);
      
      // Call the WebAssembly implementation
      const result = module.neural_network_backprop_f64(
        inputsTypedArray,
        weightsTypedArray,
        biasesTypedArray,
        targetsTypedArray,
        learningRate,
        activation,
      );
      
      // Convert the result to a BackpropagationResult
      return {
        weights: Array.from(new Float64Array(result.weights as any)),
        biases: Array.from(new Float64Array(result.biases as any)),
      };
    } catch (error) {
      // Fall back to native implementation
      console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      return this.backpropJs(inputs, weights, biases, targets, learningRate, activation);
    }
  }

  /**
   * Calculate the mean squared error loss
   * 
   * @param predictions The predicted values
   * @param targets The target values
   * @returns The mean squared error
   */
  public mseLoss(predictions: number[], targets: number[]): number {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return this.mseLossJs(predictions, targets);
    }

    try {
      // Check if the arrays contain only numbers
      if (!this.isNumericArray(predictions) || !this.isNumericArray(targets)) {
        return this.mseLossJs(predictions, targets);
      }

      // Validate dimensions
      if (predictions.length !== targets.length) {
        throw new Error('Predictions and targets must have the same length');
      }

      // Convert to Float64Array for better performance
      const predictionsTypedArray = new Float64Array(predictions);
      const targetsTypedArray = new Float64Array(targets);
      
      // Call the WebAssembly implementation
      return module.neural_network_mse_loss_f64(predictionsTypedArray, targetsTypedArray);
    } catch (error) {
      // Fall back to native implementation
      console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      return this.mseLossJs(predictions, targets);
    }
  }

  /**
   * Calculate the binary cross-entropy loss
   * 
   * @param predictions The predicted values
   * @param targets The target values
   * @returns The binary cross-entropy loss
   */
  public binaryCrossEntropyLoss(predictions: number[], targets: number[]): number {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return this.binaryCrossEntropyLossJs(predictions, targets);
    }

    try {
      // Check if the arrays contain only numbers
      if (!this.isNumericArray(predictions) || !this.isNumericArray(targets)) {
        return this.binaryCrossEntropyLossJs(predictions, targets);
      }

      // Validate dimensions
      if (predictions.length !== targets.length) {
        throw new Error('Predictions and targets must have the same length');
      }

      // Convert to Float64Array for better performance
      const predictionsTypedArray = new Float64Array(predictions);
      const targetsTypedArray = new Float64Array(targets);
      
      // Call the WebAssembly implementation
      return module.neural_network_binary_cross_entropy_loss_f64(predictionsTypedArray, targetsTypedArray);
    } catch (error) {
      // Fall back to native implementation
      console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      return this.binaryCrossEntropyLossJs(predictions, targets);
    }
  }

  /**
   * Initialize weights using Xavier/Glorot initialization
   * 
   * @param inputSize The input size
   * @param outputSize The output size
   * @returns The initialized weights
   */
  public initWeightsXavier(inputSize: number, outputSize: number): number[] {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return this.initWeightsXavierJs(inputSize, outputSize);
    }

    try {
      // Validate dimensions
      if (inputSize <= 0 || outputSize <= 0) {
        throw new Error('Input size and output size must be greater than 0');
      }
      
      // Call the WebAssembly implementation
      const result = module.neural_network_init_weights_xavier_f64(inputSize, outputSize);
      
      // Convert the result back to a regular array
      return Array.from(new Float64Array(result));
    } catch (error) {
      // Fall back to native implementation
      console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      return this.initWeightsXavierJs(inputSize, outputSize);
    }
  }

  /**
   * Initialize biases to zero
   * 
   * @param outputSize The output size
   * @returns The initialized biases
   */
  public initBiasesZero(outputSize: number): number[] {
    // Check if the module is loaded
    const module = this.getModule();
    if (!module) {
      return this.initBiasesZeroJs(outputSize);
    }

    try {
      // Validate dimensions
      if (outputSize <= 0) {
        throw new Error('Output size must be greater than 0');
      }
      
      // Call the WebAssembly implementation
      const result = module.neural_network_init_biases_zero_f64(outputSize);
      
      // Convert the result back to a regular array
      return Array.from(new Float64Array(result));
    } catch (error) {
      // Fall back to native implementation
      console.warn('WebAssembly acceleration failed, falling back to native implementation:', error);
      return this.initBiasesZeroJs(outputSize);
    }
  }

  /**
   * Execute the accelerated operation
   * @param _input The input for the operation
   * @returns The result of the operation
   */
  public execute(_input: any): any {
    throw new Error('Method not implemented. Use specific operation methods instead.');
  }

  /**
   * Get the performance profile of the neural network accelerator
   * @returns The performance profile
   */
  public getPerformanceProfile(): PerformanceProfile {
    return {
      estimatedSpeedup: 15.0,
      effectiveInputSize: 100,
    };
  }

  /**
   * Check if an array contains only numbers
   * 
   * @param array The array to check
   * @returns True if the array contains only numbers
   */
  private isNumericArray(array: any[]): boolean {
    return array.every(value => typeof value === 'number');
  }

  /**
   * Get the activation function name from the enum
   * 
   * @param activation The activation function enum
   * @returns The activation function name
   */
  private getActivationName(activation: ActivationFunction): string {
    switch (activation) {
      case ActivationFunction.Sigmoid:
        return 'sigmoid';
      case ActivationFunction.ReLU:
        return 'relu';
      case ActivationFunction.Tanh:
        return 'tanh';
      case ActivationFunction.LeakyReLU:
        return 'leaky_relu';
      default:
        throw new Error('Invalid activation function');
    }
  }

  /**
   * Apply activation function
   * 
   * @param x The input value
   * @param activation The activation function
   * @returns The activated value
   */
  private applyActivation(x: number, activation: ActivationFunction): number {
    switch (activation) {
      case ActivationFunction.Sigmoid:
        return 1 / (1 + Math.exp(-x));
      case ActivationFunction.ReLU:
        return x > 0 ? x : 0;
      case ActivationFunction.Tanh:
        return Math.tanh(x);
      case ActivationFunction.LeakyReLU:
        return x > 0 ? x : 0.01 * x;
      default:
        throw new Error('Invalid activation function');
    }
  }

  /**
   * Calculate the derivative of the activation function
   * 
   * @param x The input value
   * @param activation The activation function
   * @returns The derivative of the activation function
   */
  private applyActivationDerivative(x: number, y: number, activation: ActivationFunction): number {
    switch (activation) {
      case ActivationFunction.Sigmoid:
        return y * (1 - y);
      case ActivationFunction.ReLU:
        return x > 0 ? 1 : 0;
      case ActivationFunction.Tanh:
        return 1 - y * y;
      case ActivationFunction.LeakyReLU:
        return x > 0 ? 1 : 0.01;
      default:
        throw new Error('Invalid activation function');
    }
  }

  /**
   * Forward propagation for a single layer neural network using JavaScript
   * 
   * @param inputs The input data
   * @param weights The weights
   * @param biases The biases
   * @param activation The activation function
   * @returns The output of the neural network
   */
  private forwardJs(
    inputs: number[],
    weights: number[],
    biases: number[],
    activation: ActivationFunction,
  ): number[] {
    const numFeatures = inputs.length;
    const numOutputs = biases.length;

    if (weights.length !== numFeatures * numOutputs) {
      throw new Error('Invalid weights dimensions');
    }

    const outputs: number[] = [];

    for (let j = 0; j < numOutputs; j++) {
      let sum = biases[j];

      for (let i = 0; i < numFeatures; i++) {
        sum += inputs[i] * weights[j * numFeatures + i];
      }

      outputs.push(this.applyActivation(sum, activation));
    }

    return outputs;
  }

  /**
   * Forward propagation for a multi-layer neural network using JavaScript
   * 
   * @param inputs The input data
   * @param layers The layers of the neural network
   * @returns The output of the neural network
   */
  private forwardMultiLayerJs(inputs: number[], layers: NeuralNetworkLayer[]): number[] {
    if (layers.length === 0) {
      throw new Error('No layers provided');
    }

    let currentOutput = [...inputs];

    for (const layer of layers) {
      const activation = typeof layer.activation === 'string'
        ? this.getActivationFromName(layer.activation)
        : layer.activation;

      currentOutput = this.forwardJs(currentOutput, layer.weights, layer.biases, activation);
    }

    return currentOutput;
  }

  /**
   * Get the activation function enum from the name
   * 
   * @param name The activation function name
   * @returns The activation function enum
   */
  private getActivationFromName(name: string): ActivationFunction {
    switch (name.toLowerCase()) {
      case 'sigmoid':
        return ActivationFunction.Sigmoid;
      case 'relu':
        return ActivationFunction.ReLU;
      case 'tanh':
        return ActivationFunction.Tanh;
      case 'leaky_relu':
        return ActivationFunction.LeakyReLU;
      default:
        throw new Error(`Invalid activation function name: ${name}`);
    }
  }

  /**
   * Backpropagation for a single layer neural network using JavaScript
   * 
   * @param inputs The input data
   * @param weights The weights
   * @param biases The biases
   * @param targets The target outputs
   * @param learningRate The learning rate
   * @param activation The activation function
   * @returns The updated weights and biases
   */
  private backpropJs(
    inputs: number[],
    weights: number[],
    biases: number[],
    targets: number[],
    learningRate: number,
    activation: ActivationFunction,
  ): BackpropagationResult {
    const numFeatures = inputs.length;
    const numOutputs = biases.length;

    if (weights.length !== numFeatures * numOutputs) {
      throw new Error('Invalid weights dimensions');
    }

    if (targets.length !== numOutputs) {
      throw new Error('Targets dimension mismatch');
    }

    // Forward pass
    const outputs: number[] = [];
    const preActivations: number[] = [];

    for (let j = 0; j < numOutputs; j++) {
      let sum = biases[j];

      for (let i = 0; i < numFeatures; i++) {
        sum += inputs[i] * weights[j * numFeatures + i];
      }

      preActivations.push(sum);
      outputs.push(this.applyActivation(sum, activation));
    }

    // Backpropagation
    const updatedWeights = [...weights];
    const updatedBiases = [...biases];

    for (let j = 0; j < numOutputs; j++) {
      // Calculate error derivative with respect to output
      const error = outputs[j] - targets[j];

      // Calculate derivative of activation function
      const activationDerivative = this.applyActivationDerivative(
        preActivations[j],
        outputs[j],
        activation,
      );

      // Calculate delta
      const delta = error * activationDerivative;

      // Update biases
      updatedBiases[j] = biases[j] - learningRate * delta;

      // Update weights
      for (let i = 0; i < numFeatures; i++) {
        const weightIndex = j * numFeatures + i;
        updatedWeights[weightIndex] = weights[weightIndex] - learningRate * delta * inputs[i];
      }
    }

    return {
      weights: updatedWeights,
      biases: updatedBiases,
    };
  }

  /**
   * Calculate the mean squared error loss using JavaScript
   * 
   * @param predictions The predicted values
   * @param targets The target values
   * @returns The mean squared error
   */
  private mseLossJs(predictions: number[], targets: number[]): number {
    if (predictions.length !== targets.length) {
      throw new Error('Predictions and targets must have the same length');
    }

    if (predictions.length === 0) {
      return 0;
    }

    let sumSquaredError = 0;

    for (let i = 0; i < predictions.length; i++) {
      const error = predictions[i] - targets[i];
      sumSquaredError += error * error;
    }

    return sumSquaredError / predictions.length;
  }

  /**
   * Calculate the binary cross-entropy loss using JavaScript
   * 
   * @param predictions The predicted values
   * @param targets The target values
   * @returns The binary cross-entropy loss
   */
  private binaryCrossEntropyLossJs(predictions: number[], targets: number[]): number {
    if (predictions.length !== targets.length) {
      throw new Error('Predictions and targets must have the same length');
    }

    if (predictions.length === 0) {
      return 0;
    }

    let sumLoss = 0;

    for (let i = 0; i < predictions.length; i++) {
      // Clip predictions to avoid log(0)
      const p = Math.max(Math.min(predictions[i], 1 - 1e-15), 1e-15);
      const t = targets[i];

      sumLoss += t * Math.log(p) + (1 - t) * Math.log(1 - p);
    }

    return -sumLoss / predictions.length;
  }

  /**
   * Initialize weights using Xavier/Glorot initialization using JavaScript
   * 
   * @param inputSize The input size
   * @param outputSize The output size
   * @returns The initialized weights
   */
  private initWeightsXavierJs(inputSize: number, outputSize: number): number[] {
    if (inputSize <= 0 || outputSize <= 0) {
      throw new Error('Input size and output size must be greater than 0');
    }

    const stdDev = Math.sqrt(2 / (inputSize + outputSize));
    const weights: number[] = [];

    for (let i = 0; i < inputSize * outputSize; i++) {
      // Generate random number from standard normal distribution
      const u1 = Math.random();
      const u2 = Math.random();

      // Box-Muller transform
      const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);

      // Scale by standard deviation
      weights.push(z0 * stdDev);
    }

    return weights;
  }

  /**
   * Initialize biases to zero using JavaScript
   * 
   * @param outputSize The output size
   * @returns The initialized biases
   */
  private initBiasesZeroJs(outputSize: number): number[] {
    if (outputSize <= 0) {
      throw new Error('Output size must be greater than 0');
    }

    return Array(outputSize).fill(0);
  }
}
