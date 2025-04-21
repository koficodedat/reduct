#!/bin/bash
# Script for generating a performance dashboard

# Run benchmarks
echo "Running tiered optimization benchmarks..."
npm run benchmark:tiered -- --numeric-operations map --list-operations map --iterations 3 --steps 3

# Generate dashboard
echo "Generating performance dashboard..."
npm run benchmark:dashboard

# Open dashboard in browser
echo "Opening dashboard in browser..."
open packages/benchmark/dashboard/index.html
