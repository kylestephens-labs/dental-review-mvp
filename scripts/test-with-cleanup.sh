#!/bin/bash

# Test runner with automatic cleanup
# This script runs tests and ensures all vitest processes are cleaned up afterward

set -e

echo "🧪 Running tests with automatic cleanup..."

# Function to cleanup vitest processes
cleanup_vitest() {
    echo "🧹 Cleaning up vitest processes..."
    PIDS=$(ps aux | grep "node.*vitest" | grep -v grep | awk '{print $2}')
    
    if [ ! -z "$PIDS" ]; then
        echo "Found vitest processes: $PIDS"
        for pid in $PIDS; do
            kill -TERM "$pid" 2>/dev/null || true
        done
        sleep 2
        
        # Force kill any remaining processes
        REMAINING_PIDS=$(ps aux | grep "node.*vitest" | grep -v grep | awk '{print $2}')
        if [ ! -z "$REMAINING_PIDS" ]; then
            for pid in $REMAINING_PIDS; do
                kill -9 "$pid" 2>/dev/null || true
            done
        fi
    fi
}

# Set up trap to cleanup on exit
trap cleanup_vitest EXIT

# Run the tests
echo "Running: vitest $@"
npx vitest "$@"

# Explicit cleanup after tests complete
cleanup_vitest

echo "✅ Tests completed and processes cleaned up."
