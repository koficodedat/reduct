/**
 * Example demonstrating WebAssembly-accelerated neural network operations
 */
import { NeuralNetworkAccelerator, ActivationFunction, NeuralNetworkLayer } from '../src/accelerators/data-structures/neural-network';
import { isWebAssemblySupported } from '../src/core/feature-detection';

console.log('WebAssembly-Accelerated Neural Network Example');
console.log('===========================================');

// Check if WebAssembly is supported
console.log(`WebAssembly supported: ${isWebAssemblySupported()}`);

// Create a neural network accelerator
const nnAccelerator = new NeuralNetworkAccelerator();

// Create test data for XOR problem
console.log('\nCreating test data for XOR problem...');
const inputs = [
  [0, 0],
  [0, 1],
  [1, 0],
  [1, 1],
];
const targets = [
  [0],
  [1],
  [1],
  [0],
];
console.log('Inputs:');
inputs.forEach(input => console.log(`  [${input.join(', ')}]`));
console.log('Targets:');
targets.forEach(target => console.log(`  [${target.join(', ')}]`));

// Initialize a simple neural network with one hidden layer
console.log('\nInitializing neural network...');
const inputSize = 2;
const hiddenSize = 4;
const outputSize = 1;

// Initialize weights and biases
console.time('Initialize Weights (WASM)');
const hiddenWeights = nnAccelerator.initWeightsXavier(inputSize, hiddenSize);
const outputWeights = nnAccelerator.initWeightsXavier(hiddenSize, outputSize);
console.timeEnd('Initialize Weights (WASM)');

console.time('Initialize Biases (WASM)');
const hiddenBiases = nnAccelerator.initBiasesZero(hiddenSize);
const outputBiases = nnAccelerator.initBiasesZero(outputSize);
console.timeEnd('Initialize Biases (WASM)');

// Define the neural network layers
const layers: NeuralNetworkLayer[] = [
  {
    weights: hiddenWeights,
    biases: hiddenBiases,
    activation: ActivationFunction.Sigmoid,
  },
  {
    weights: outputWeights,
    biases: outputBiases,
    activation: ActivationFunction.Sigmoid,
  },
];

// Train the neural network
console.log('\nTraining neural network...');
const epochs = 10000;
const learningRate = 0.5;
let loss = 0;

console.time('Training (WASM)');
for (let epoch = 0; epoch < epochs; epoch++) {
  let epochLoss = 0;
  
  for (let i = 0; i < inputs.length; i++) {
    // Forward pass
    const hiddenOutput = nnAccelerator.forward(
      inputs[i],
      layers[0].weights,
      layers[0].biases,
      ActivationFunction.Sigmoid,
    );
    
    const output = nnAccelerator.forward(
      hiddenOutput,
      layers[1].weights,
      layers[1].biases,
      ActivationFunction.Sigmoid,
    );
    
    // Calculate loss
    const sampleLoss = nnAccelerator.mseLoss(output, targets[i]);
    epochLoss += sampleLoss;
    
    // Backpropagation for output layer
    const outputBackprop = nnAccelerator.backprop(
      hiddenOutput,
      layers[1].weights,
      layers[1].biases,
      targets[i],
      learningRate,
      ActivationFunction.Sigmoid,
    );
    
    // Update output layer
    layers[1].weights = outputBackprop.weights;
    layers[1].biases = outputBackprop.biases;
    
    // Calculate hidden layer targets (simplified backpropagation)
    const hiddenTargets: number[] = [];
    for (let j = 0; j < hiddenSize; j++) {
      let error = 0;
      for (let k = 0; k < outputSize; k++) {
        const outputError = output[k] - targets[i][k];
        const outputActivationDerivative = output[k] * (1 - output[k]);
        error += outputError * outputActivationDerivative * outputBackprop.weights[k * hiddenSize + j];
      }
      hiddenTargets.push(hiddenOutput[j] - error);
    }
    
    // Backpropagation for hidden layer
    const hiddenBackprop = nnAccelerator.backprop(
      inputs[i],
      layers[0].weights,
      layers[0].biases,
      hiddenTargets,
      learningRate,
      ActivationFunction.Sigmoid,
    );
    
    // Update hidden layer
    layers[0].weights = hiddenBackprop.weights;
    layers[0].biases = hiddenBackprop.biases;
  }
  
  loss = epochLoss / inputs.length;
  
  // Print progress
  if ((epoch + 1) % 1000 === 0 || epoch === 0) {
    console.log(`Epoch ${epoch + 1}/${epochs}, Loss: ${loss.toFixed(6)}`);
  }
  
  // Early stopping
  if (loss < 0.001) {
    console.log(`Converged at epoch ${epoch + 1}/${epochs}, Loss: ${loss.toFixed(6)}`);
    break;
  }
}
console.timeEnd('Training (WASM)');

// Test the trained neural network
console.log('\nTesting trained neural network...');
console.time('Forward Multi-Layer (WASM)');
const predictions = inputs.map(input => nnAccelerator.forwardMultiLayer(input, layers));
console.timeEnd('Forward Multi-Layer (WASM)');

console.log('Predictions:');
for (let i = 0; i < inputs.length; i++) {
  console.log(`Input: [${inputs[i].join(', ')}], Target: ${targets[i][0]}, Prediction: ${predictions[i][0].toFixed(4)}`);
}

// Calculate final loss
console.time('MSE Loss (WASM)');
const finalLoss = nnAccelerator.mseLoss(
  predictions.flat(),
  targets.flat(),
);
console.timeEnd('MSE Loss (WASM)');
console.log(`Final Loss: ${finalLoss.toFixed(6)}`);

// Create a larger neural network for performance testing
console.log('\nPerformance testing with larger neural network...');
const largeInputSize = 100;
const largeHiddenSize = 50;
const largeOutputSize = 10;

// Generate random input
const largeInput = Array.from({ length: largeInputSize }, () => Math.random());

// Initialize large network
console.time('Initialize Large Network (WASM)');
const largeHiddenWeights = nnAccelerator.initWeightsXavier(largeInputSize, largeHiddenSize);
const largeHiddenBiases = nnAccelerator.initBiasesZero(largeHiddenSize);
const largeOutputWeights = nnAccelerator.initWeightsXavier(largeHiddenSize, largeOutputSize);
const largeOutputBiases = nnAccelerator.initBiasesZero(largeOutputSize);
console.timeEnd('Initialize Large Network (WASM)');

// Define the large neural network layers
const largeLayers: NeuralNetworkLayer[] = [
  {
    weights: largeHiddenWeights,
    biases: largeHiddenBiases,
    activation: ActivationFunction.ReLU,
  },
  {
    weights: largeOutputWeights,
    biases: largeOutputBiases,
    activation: ActivationFunction.Sigmoid,
  },
];

// Forward pass through large network
console.log('\nForward pass through large network...');
console.time('Forward Large Network (WASM)');
const largeOutput = nnAccelerator.forwardMultiLayer(largeInput, largeLayers);
console.timeEnd('Forward Large Network (WASM)');
console.log(`Output size: ${largeOutput.length}`);
console.log(`First 5 outputs: ${largeOutput.slice(0, 5).map(v => v.toFixed(4)).join(', ')}`);

// Compare with JavaScript implementation
console.log('\nComparison with JavaScript Implementation:');
console.log('--------------------------------------');

// Forward pass using JavaScript
console.time('Forward Large Network (JS)');
const forwardMultiLayerJs = (inputs: number[], layers: NeuralNetworkLayer[]): number[] => {
  let currentOutput = [...inputs];

  for (const layer of layers) {
    const numFeatures = currentOutput.length;
    const numOutputs = layer.biases.length;
    const weights = layer.weights;
    const biases = layer.biases;
    const activation = typeof layer.activation === 'string'
      ? layer.activation
      : layer.activation;
    
    const layerOutput: number[] = [];
    
    for (let j = 0; j < numOutputs; j++) {
      let sum = biases[j];
      
      for (let i = 0; i < numFeatures; i++) {
        sum += currentOutput[i] * weights[j * numFeatures + i];
      }
      
      // Apply activation function
      let activated: number;
      if (activation === ActivationFunction.Sigmoid || activation === 'sigmoid') {
        activated = 1 / (1 + Math.exp(-sum));
      } else if (activation === ActivationFunction.ReLU || activation === 'relu') {
        activated = sum > 0 ? sum : 0;
      } else if (activation === ActivationFunction.Tanh || activation === 'tanh') {
        activated = Math.tanh(sum);
      } else if (activation === ActivationFunction.LeakyReLU || activation === 'leaky_relu') {
        activated = sum > 0 ? sum : 0.01 * sum;
      } else {
        throw new Error('Invalid activation function');
      }
      
      layerOutput.push(activated);
    }
    
    currentOutput = layerOutput;
  }
  
  return currentOutput;
};

const largeOutputJs = forwardMultiLayerJs(largeInput, largeLayers);
console.timeEnd('Forward Large Network (JS)');
console.log(`Output size (JS): ${largeOutputJs.length}`);
console.log(`First 5 outputs (JS): ${largeOutputJs.slice(0, 5).map(v => v.toFixed(4)).join(', ')}`);

// Calculate difference
let maxDiff = 0;
for (let i = 0; i < largeOutput.length; i++) {
  const diff = Math.abs(largeOutput[i] - largeOutputJs[i]);
  maxDiff = Math.max(maxDiff, diff);
}
console.log(`Maximum difference between WASM and JS: ${maxDiff.toFixed(8)}`);

console.log('\nWebAssembly-accelerated neural network example completed.');
