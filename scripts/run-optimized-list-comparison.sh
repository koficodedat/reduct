#!/bin/bash

# This script runs benchmarks comparing the original List with the optimized List

# Ensure the benchmark package is built
echo "Building benchmark package..."
yarn workspace @reduct/benchmark build

# Compile the comparison script
echo "Compiling comparison script..."
yarn tsc packages/benchmark/examples/optimized-list-comparison.ts --outDir packages/benchmark/dist/examples --esModuleInterop --skipLibCheck

# Run the comparison
echo "Running comparison benchmarks..."
node packages/benchmark/dist/examples/optimized-list-comparison.js
