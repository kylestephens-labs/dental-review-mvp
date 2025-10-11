#!/bin/bash
# Import Workflow to AWS n8n
# This script helps import workflows to your AWS n8n instance

echo "📥 Importing Workflow to AWS n8n"
echo "==============================="

AWS_N8N="https://uncqyimekm.us-east-2.awsapprunner.com"
WORKFLOW_FILE="workflow-export.json"

echo "AWS n8n URL: $AWS_N8N"
echo "Workflow file: $WORKFLOW_FILE"
echo ""

# Check if workflow file exists
if [ ! -f "$WORKFLOW_FILE" ]; then
    echo "❌ Workflow file '$WORKFLOW_FILE' not found"
    echo "Please run './export-local-workflow.sh' first"
    exit 1
fi

echo "✅ Workflow file found"
echo ""

# Check AWS n8n connection
echo "🧪 Checking AWS n8n connection..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$AWS_N8N" --connect-timeout 10 --max-time 15 || echo "000")

if [ "$HTTP_CODE" != "200" ]; then
    echo "❌ AWS n8n is not accessible"
    echo "Please complete the setup at: $AWS_N8N/setup"
    exit 1
fi

echo "✅ AWS n8n is accessible"
echo ""

# Show workflow details
echo "📋 Workflow to import:"
cat "$WORKFLOW_FILE" | jq '{name, active, nodes: (.nodes | length)}'

echo ""
echo "📋 Manual Import Instructions:"
echo "=============================="
echo "1. Go to: $AWS_N8N"
echo "2. Click 'Workflows' in the sidebar"
echo "3. Click 'Import from file' or 'New workflow'"
echo "4. Upload or paste the content of: $WORKFLOW_FILE"
echo "5. Update webhook URLs if needed"
echo "6. Save and activate the workflow"
echo ""
echo "🔍 Workflow content:"
echo "==================="
cat "$WORKFLOW_FILE"
