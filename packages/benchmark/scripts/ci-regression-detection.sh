#!/bin/bash
# Script for detecting performance regressions in CI

# Run benchmarks
echo "Running tiered optimization benchmarks..."
npm run benchmark:tiered -- --numeric-operations map --list-operations map --iterations 3 --steps 3

# Detect regressions
echo "Detecting performance regressions..."
npm run benchmark:regression -- --fail-on-regression

# Exit with the same code as the regression detection
exit $?
