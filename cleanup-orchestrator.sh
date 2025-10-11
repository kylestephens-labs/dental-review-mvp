#!/bin/bash

# MCP Orchestrator Cleanup Script
# This script removes the MCP Orchestrator from the dental project after migration

set -e

echo "🧹 MCP Orchestrator Cleanup Script"
echo "=================================="

# Confirm before proceeding
read -p "⚠️  This will remove the mcp-orchestrator folder from the dental project. Continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Cleanup cancelled."
    exit 1
fi

# Check if mcp-orchestrator folder exists
if [ ! -d "mcp-orchestrator" ]; then
    echo "❌ Error: mcp-orchestrator folder not found"
    exit 1
fi

# Create backup
echo "💾 Creating backup..."
tar -czf "mcp-orchestrator-backup-$(date +%Y%m%d-%H%M%S).tar.gz" mcp-orchestrator/

# Remove the folder
echo "🗑️  Removing mcp-orchestrator folder..."
rm -rf mcp-orchestrator/

# Update .gitignore to exclude the backup
echo "📝 Updating .gitignore..."
if ! grep -q "mcp-orchestrator-backup" .gitignore; then
    echo "" >> .gitignore
    echo "# MCP Orchestrator backups" >> .gitignore
    echo "mcp-orchestrator-backup*.tar.gz" >> .gitignore
fi

echo "✅ Cleanup completed successfully!"
echo ""
echo "📁 Backup created: mcp-orchestrator-backup-*.tar.gz"
echo "🗑️  mcp-orchestrator folder removed"
echo "📝 .gitignore updated"
echo ""
echo "Next steps:"
echo "1. Update .mcp/config/orchestrator.json with the new repository URL"
echo "2. Test the MCP integration: npm run mcp:health"
echo "3. Commit the changes to git"
