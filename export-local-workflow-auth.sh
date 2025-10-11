#!/bin/bash
# Export Workflow from Local n8n (with authentication)
# This script helps export workflows from your local n8n instance

echo "📤 Exporting Workflow from Local n8n (with auth)"
echo "==============================================="

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

# Check if workflow exists (this will show auth requirements)
echo "🔍 Checking workflow access..."
curl -s "$LOCAL_N8N/rest/workflows/$WORKFLOW_ID" > "workflow-check.json"

if grep -q "Unauthorized" workflow-check.json; then
    echo "⚠️  Local n8n requires authentication"
    echo ""
    echo "📋 Manual Export Instructions:"
    echo "=============================="
    echo "1. Go to: $LOCAL_N8N/workflow/$WORKFLOW_ID"
    echo "2. Click the 'Settings' gear icon (top right)"
    echo "3. Click 'Export' or 'Download'"
    echo "4. Save the JSON file as 'workflow-export.json'"
    echo "5. Run: ./import-aws-workflow.sh"
    echo ""
    echo "🔍 Alternative: Copy workflow content manually"
    echo "1. Open the workflow editor"
    echo "2. Select all nodes (Ctrl+A)"
    echo "3. Copy the workflow JSON"
    echo "4. Save to 'workflow-export.json'"
    echo ""
    echo "📁 Current directory: $(pwd)"
    echo "📄 Expected file: workflow-export.json"
    
    rm -f workflow-check.json
    exit 0
fi

# If we get here, export was successful
echo "✅ Workflow exported to: workflow-export.json"
echo ""
echo "📋 Next steps:"
echo "1. Review the exported workflow"
echo "2. Import it into AWS n8n"
echo "3. Update webhook URLs if needed"
echo ""
echo "🔍 To view the workflow:"
echo "cat workflow-export.json | jq ."
