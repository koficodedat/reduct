#!/bin/bash
# Script for running automatic bisection

# Run bisection
echo "Running automatic bisection..."
npm run benchmark:bisection -- \
  --benchmark-command "npm run benchmark:tiered -- --numeric-operations map --list-operations map --iterations 3 --steps 3" \
  --regression-detection-command "npm run benchmark:regression -- --output packages/benchmark/regression-report.json --fail-on-regression"

# Open bisection results
echo "Opening bisection results..."
cat packages/benchmark/bisection-results.md
