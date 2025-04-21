#!/bin/bash
# Script for running benchmarks and sending notifications

# Run benchmarks
echo "Running tiered optimization benchmarks..."
npm run benchmark:tiered -- --numeric-operations map --list-operations map --iterations 3 --steps 3

# Detect regressions and send notifications
echo "Detecting regressions and sending notifications..."
npm run benchmark:notification -- --channels console

# Generate dashboard
echo "Generating performance dashboard..."
npm run benchmark:dashboard

# Open dashboard in browser
echo "Opening dashboard in browser..."
open packages/benchmark/dashboard/index.html
