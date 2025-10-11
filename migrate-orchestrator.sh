#!/bin/bash

# MCP Orchestrator Migration Script
# This script helps migrate the MCP Orchestrator to a separate repository

set -e

echo "🚀 MCP Orchestrator Migration Script"
echo "====================================="

# Check if repository URL is provided
if [ -z "$1" ]; then
    echo "❌ Error: Please provide the GitHub repository URL"
    echo "Usage: ./migrate-orchestrator.sh <repository-url>"
    echo "Example: ./migrate-orchestrator.sh https://github.com/yourusername/mcp-orchestrator.git"
    exit 1
fi

REPO_URL=$1
REPO_NAME="mcp-orchestrator"
TEMP_DIR="/tmp/mcp-orchestrator-migration"

echo "📦 Repository URL: $REPO_URL"
echo "📁 Temporary directory: $TEMP_DIR"

# Clean up any existing temp directory
if [ -d "$TEMP_DIR" ]; then
    echo "🧹 Cleaning up existing temp directory..."
    rm -rf "$TEMP_DIR"
fi

# Create temp directory
echo "📁 Creating temporary directory..."
mkdir -p "$TEMP_DIR"

# Clone the repository
echo "📥 Cloning repository..."
git clone "$REPO_URL" "$TEMP_DIR"

# Copy MCP Orchestrator files
echo "📋 Copying MCP Orchestrator files..."
cp -r mcp-orchestrator/* "$TEMP_DIR/"

# Copy hidden files
echo "📋 Copying hidden files..."
cp mcp-orchestrator/.eslintrc.js "$TEMP_DIR/"
cp mcp-orchestrator/.gitignore "$TEMP_DIR/"
cp mcp-orchestrator/.prettierrc "$TEMP_DIR/"

# Navigate to temp directory
cd "$TEMP_DIR"

# Initialize git if needed
if [ ! -d ".git" ]; then
    echo "🔧 Initializing git repository..."
    git init
    git remote add origin "$REPO_URL"
fi

# Add all files
echo "📝 Adding files to git..."
git add .

# Create initial commit
echo "💾 Creating initial commit..."
git commit -m "feat: initial MCP Orchestrator implementation

- Complete Node.js/TypeScript service with clean architecture
- Express server with health checks and API endpoints
- Task management and agent coordination
- Docker support and comprehensive testing
- All acceptance criteria met: npm run dev, lint, test, Docker build

Task 1 Complete: MCP Orchestrator Repository Scaffold"

# Push to repository
echo "🚀 Pushing to repository..."
git branch -M main
git push -u origin main

echo "✅ Migration completed successfully!"
echo ""
echo "Next steps:"
echo "1. Open the new repository in Cursor: $TEMP_DIR"
echo "2. Test the setup: npm install && npm run test"
echo "3. Update the dental project's orchestrator URL in .mcp/config/orchestrator.json"
echo "4. Remove the old mcp-orchestrator folder from the dental project"
echo ""
echo "Repository location: $TEMP_DIR"
echo "GitHub URL: $REPO_URL"
