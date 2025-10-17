#!/bin/bash

# Cleanup script for vitest processes
# This script kills any hanging vitest processes that might be consuming memory

echo "Cleaning up vitest processes..."

# Find and kill all node vitest processes
PIDS=$(ps aux | grep "node.*vitest" | grep -v grep | awk '{print $2}')

if [ -z "$PIDS" ]; then
    echo "No vitest processes found."
    exit 0
fi

echo "Found vitest processes: $PIDS"

# Kill processes gracefully first
for pid in $PIDS; do
    echo "Attempting to kill process $pid gracefully..."
    kill -TERM "$pid" 2>/dev/null
done

# Wait a moment for graceful shutdown
sleep 2

# Check if any processes are still running and force kill them
REMAINING_PIDS=$(ps aux | grep "node.*vitest" | grep -v grep | awk '{print $2}')

if [ ! -z "$REMAINING_PIDS" ]; then
    echo "Force killing remaining processes: $REMAINING_PIDS"
    for pid in $REMAINING_PIDS; do
        echo "Force killing process $pid..."
        kill -9 "$pid" 2>/dev/null
    done
fi

# Final check
FINAL_CHECK=$(ps aux | grep "node.*vitest" | grep -v grep | wc -l)
if [ "$FINAL_CHECK" -eq 0 ]; then
    echo "✅ All vitest processes cleaned up successfully."
else
    echo "⚠️  Some vitest processes may still be running."
    ps aux | grep "node.*vitest" | grep -v grep
fi
