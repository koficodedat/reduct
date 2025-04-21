#!/bin/bash
# Script for running benchmarks, sending notifications, and generating dashboards

# Run benchmarks
echo "Running tiered optimization benchmarks..."
npm run benchmark:tiered -- --numeric-operations map --list-operations map --iterations 3 --steps 3

# Detect regressions and send notifications
echo "Detecting regressions and sending notifications..."
npm run benchmark:notification -- --channels console

# Generate performance dashboard
echo "Generating performance dashboard..."
npm run benchmark:dashboard

# Generate notification dashboard
echo "Generating notification dashboard..."
npm run benchmark:notification-dashboard

# Open dashboards in browser
echo "Opening dashboards in browser..."
open packages/benchmark/dashboard/index.html
open packages/benchmark/notification-dashboard/index.html
