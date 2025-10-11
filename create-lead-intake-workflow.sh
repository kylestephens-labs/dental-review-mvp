#!/bin/bash
# Create n8n Lead Intake Workflow
# This script creates the webhook workflow for lead processing

set -e

echo "🔧 Creating n8n Lead Intake Workflow"
echo "===================================="

# ==== CONFIGURATION ====
N8N_BASE="https://uncqyimekm.us-east-2.awsapprunner.com"  # Using App Runner URL for now
BASIC_USER="admin"
REGION="us-east-2"
S_BASIC="n8n/basic_auth_password"     # Secrets Manager name for Basic Auth password
SVC_SECRET_NAME="n8n/serviceboost_secret"

echo "n8n Base URL: $N8N_BASE"
echo "Basic User: $BASIC_USER"
echo "Region: $REGION"
echo ""

# Pull secrets
echo "🔐 Retrieving secrets from AWS Secrets Manager..."
BASIC_PASS=$(aws secretsmanager get-secret-value --secret-id "$S_BASIC" --region "$REGION" --query SecretString --output text)
SVC_SECRET=$(aws secretsmanager get-secret-value --secret-id "$SVC_SECRET_NAME" --region "$REGION" --query SecretString --output text)

echo "✅ Secrets retrieved successfully"
echo ""

# Test n8n connection
echo "🧪 Testing n8n connection..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -u "${BASIC_USER}:${BASIC_PASS}" "${N8N_BASE}/rest/workflows" --connect-timeout 10 --max-time 15 || echo "000")

if [ "$HTTP_CODE" != "200" ]; then
    echo "❌ Failed to connect to n8n. HTTP Code: $HTTP_CODE"
    echo "Please check:"
    echo "1. n8n service is running"
    echo "2. Basic auth credentials are correct"
    echo "3. Network connectivity"
    exit 1
fi

echo "✅ n8n connection successful"
echo ""

# Create workflow JSON
echo "📝 Creating workflow JSON..."
cat > lead-intake-workflow.json <<'EOF'
{
  "name": "Lead Intake → Notify (prod)",
  "nodes": [
    {
      "parameters": {
        "path": "webhook/lead-intake-notify",
        "responseMode": "responseNode",
        "options": { "responseData": "allEntries" }
      },
      "id": "Webhook_Entry",
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [200, 300],
      "webhookId": ""
    },
    {
      "parameters": {
        "conditions": {
          "string": [
            {
              "value1": "={{ $json[\"headers\"][\"x-serviceboost-secret\"] }}",
              "operation": "equal",
              "value2": "={{ $env.SERVICEBOOST_SECRET }}"
            }
          ]
        }
      },
      "id": "IF_Secret_OK",
      "name": "IF Secret OK?",
      "type": "n8n-nodes-base.if",
      "typeVersion": 2,
      "position": [460, 300]
    },
    {
      "parameters": {
        "responseBody": "={{ { status: 'ok', receivedAt: $now } }}",
        "responseCode": 200
      },
      "id": "Respond_200",
      "name": "Respond 200",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1,
      "position": [720, 240]
    },
    {
      "parameters": {
        "responseBody": "={{ { status: 'unauthorized' } }}",
        "responseCode": 401
      },
      "id": "Respond_401",
      "name": "Respond 401",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1,
      "position": [720, 360]
    }
  ],
  "connections": {
    "Webhook": { "main": [[ { "node": "IF Secret OK?", "type": "main", "index": 0 } ]] },
    "IF Secret OK?": {
      "main": [
        [ { "node": "Respond 200", "type": "main", "index": 0 } ],
        [ { "node": "Respond 401", "type": "main", "index": 0 } ]
      ]
    }
  },
  "active": false
}
EOF

echo "✅ Workflow JSON created"
echo ""

# Create the workflow
echo "🚀 Creating workflow in n8n..."
CREATE_OUT=$(curl -s -u "${BASIC_USER}:${BASIC_PASS}" -H "Content-Type: application/json" -X POST "${N8N_BASE}/rest/workflows" -d @lead-intake-workflow.json)

if [ $? -ne 0 ]; then
    echo "❌ Failed to create workflow"
    exit 1
fi

WF_ID=$(echo "$CREATE_OUT" | jq -r '.id')

if [ "$WF_ID" = "null" ] || [ -z "$WF_ID" ]; then
    echo "❌ Failed to get workflow ID"
    echo "Response: $CREATE_OUT"
    exit 1
fi

echo "✅ Workflow created with ID: $WF_ID"
echo ""

# Activate the workflow
echo "⚡ Activating workflow..."
ACTIVATE_OUT=$(curl -s -u "${BASIC_USER}:${BASIC_PASS}" -H "Content-Type: application/json" -X PATCH "${N8N_BASE}/rest/workflows/${WF_ID}" -d '{"active": true}')

if [ $? -ne 0 ]; then
    echo "❌ Failed to activate workflow"
    exit 1
fi

echo "✅ Workflow activated successfully!"
echo ""

# Show workflow details
echo "📋 Workflow Details:"
echo "$ACTIVATE_OUT" | jq '{id,name,active}'

echo ""
echo "🎉 Lead Intake Workflow Created Successfully!"
echo ""
echo "📋 Workflow Information:"
echo "========================"
echo "Workflow ID: $WF_ID"
echo "Name: Lead Intake → Notify (prod)"
echo "Status: Active"
echo "Webhook URL: ${N8N_BASE}/webhook/lead-intake-notify"
echo ""
echo "🧪 Test the webhook:"
echo "curl -X POST '${N8N_BASE}/webhook/lead-intake-notify' \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -H 'x-serviceboost-secret: $SVC_SECRET' \\"
echo "  -d '{\"test\": \"data\"}'"
echo ""
echo "🔐 ServiceBoost Secret: $SVC_SECRET"
