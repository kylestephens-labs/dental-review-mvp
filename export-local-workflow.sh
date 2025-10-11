#!/bin/bash
# Export Workflow from Local n8n
# This script helps export workflows from your local n8n instance

echo "📤 Exporting Workflow from Local n8n"
echo "==================================="

LOCAL_N8N="http://localhost:5678"
WORKFLOW_ID="rqeNr4X0cMs5aARH"

echo "Local n8n URL: $LOCAL_N8N"
echo "Workflow ID: $WORKFLOW_ID"
echo ""

# Check if local n8n is running
echo "🧪 Checking local n8n connection..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$LOCAL_N8N" --connect-timeout 5 --max-time 10 || echo "000")

if [ "$HTTP_CODE" != "200" ]; then
    echo "❌ Local n8n is not running or not accessible"
    echo "Please start your local n8n instance first:"
    echo "npx n8n start"
    exit 1
fi

echo "✅ Local n8n is running"
echo ""

# Export workflow
echo "📤 Exporting workflow..."
curl -s "$LOCAL_N8N/rest/workflows/$WORKFLOW_ID" > "workflow-export.json"

if [ $? -eq 0 ]; then
    echo "✅ Workflow exported to: workflow-export.json"
    echo ""
    echo "📋 Next steps:"
    echo "1. Review the exported workflow"
    echo "2. Import it into AWS n8n"
    echo "3. Update webhook URLs if needed"
    echo ""
    echo "🔍 To view the workflow:"
    echo "cat workflow-export.json | jq ."
else
    echo "❌ Failed to export workflow"
    exit 1
fi
