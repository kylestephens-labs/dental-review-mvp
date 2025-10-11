#!/bin/bash

# MCP Orchestrator - Sequential Agent Handoff Coordinator
# Shell wrapper for TypeScript CLI

set -e

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Change to project root
cd "$PROJECT_ROOT"

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed"
    exit 1
fi

# Check if TypeScript is available
if ! command -v npx &> /dev/null; then
    echo "❌ npx is required but not available"
    exit 1
fi

# Run the TypeScript CLI
npx tsx .mcp/scripts/task-handoff.ts "$@"
