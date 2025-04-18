#!/bin/bash

# Run Phase Two baseline benchmarks
echo "Running Phase Two baseline benchmarks..."

# Ensure we're in the project root
cd "$(dirname "$0")/.."

# Build the benchmark package if needed
echo "Building benchmark package..."
yarn workspace @reduct/benchmark build

# Compile the baseline script
echo "Compiling baseline script..."
yarn tsc packages/benchmark/examples/phase-two-baseline.ts --outDir packages/benchmark/dist/examples --esModuleInterop --skipLibCheck

# Run the baseline benchmarks
echo "Running baseline benchmarks..."
node packages/benchmark/dist/examples/phase-two-baseline.js

echo "Baseline benchmarks completed."
