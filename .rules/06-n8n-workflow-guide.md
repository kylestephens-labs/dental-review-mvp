# n8n Workflow Guide

## Purpose
Simple automation workflows for handling intake form submissions and lead processing in the dental landing template project.

## Scope
- Intake form submission workflows
- Lead notification workflows
- Email/SMS automation
- Data processing and routing
- Error handling and retries

## Workflow Design Principles

### 1. Simple and Focused
- Each workflow should have one clear purpose
- Keep workflows simple and easy to understand
- Avoid overly complex logic

### 2. Error Handling
- Always include error handling nodes
- Implement retry logic for external API calls
- Log errors for debugging

### 3. Data Validation
- Validate input data at the start of workflows
- Use appropriate data types and formats
- Handle missing or invalid data gracefully

## Common Workflow Patterns

### 1. Intake Form Processing Workflow

**Purpose**: Process form submissions and trigger notifications

**Workflow Structure**:
```
Webhook Trigger → Validate Data → Store in Database → Send Notifications → Log Success
                     ↓
                Error Handler → Log Error → Send Alert
```

**Node Configuration**:

**Webhook Trigger**:
```json
{
  "name": "Form Submission Webhook",
  "type": "n8n-nodes-base.webhook",
  "parameters": {
    "httpMethod": "POST",
    "path": "dental-intake",
    "responseMode": "responseNode"
  }
}
```

**Data Validation**:
```json
{
  "name": "Validate Form Data",
  "type": "n8n-nodes-base.function",
  "parameters": {
    "functionCode": "// Validate required fields\nconst data = $input.first().json;\n\nif (!data.name || !data.appointmentType || !data.consent) {\n  throw new Error('Missing required fields');\n}\n\nif (!data.phone && !data.email) {\n  throw new Error('Either phone or email is required');\n}\n\n// Sanitize data\nconst sanitizedData = {\n  name: data.name.trim(),\n  phone: data.phone ? data.phone.replace(/[^\\d\\s\\-\\+\\(\\)]/g, '') : null,\n  email: data.email ? data.email.toLowerCase().trim() : null,\n  appointmentType: data.appointmentType.trim(),\n  preferredDate: data.preferredDate || null,\n  preferredTime: data.preferredTime || null,\n  notes: data.notes ? data.notes.trim() : null,\n  consent: data.consent,\n  siteId: data.siteId,\n  timestamp: new Date().toISOString()\n};\n\nreturn { json: sanitizedData };"
  }
}
```

**Database Storage**:
```json
{
  "name": "Store Lead in Supabase",
  "type": "n8n-nodes-base.httpRequest",
  "parameters": {
    "method": "POST",
    "url": "https://your-project.supabase.co/rest/v1/leads",
    "headers": {
      "apikey": "{{ $env.SUPABASE_ANON_KEY }}",
      "Authorization": "Bearer {{ $env.SUPABASE_ANON_KEY }}",
      "Content-Type": "application/json",
      "Prefer": "return=minimal"
    },
    "body": "={{ JSON.stringify($json) }}"
  }
}
```

**Email Notification**:
```json
{
  "name": "Send Email Notification",
  "type": "n8n-nodes-base.emailSend",
  "parameters": {
    "fromEmail": "noreply@yourdomain.com",
    "toEmail": "{{ $env.BUSINESS_EMAIL }}",
    "subject": "New Lead: {{ $json.name }} - {{ $json.appointmentType }}",
    "text": "New lead received:\n\nName: {{ $json.name }}\nPhone: {{ $json.phone || 'N/A' }}\nEmail: {{ $json.email || 'N/A' }}\nAppointment Type: {{ $json.appointmentType }}\nPreferred Date: {{ $json.preferredDate || 'N/A' }}\nPreferred Time: {{ $json.preferredTime || 'N/A' }}\nNotes: {{ $json.notes || 'N/A' }}\n\nSubmitted: {{ $json.timestamp }}"
  }
}
```

### 2. SMS Notification Workflow

**Purpose**: Send SMS notifications for urgent appointments

**Workflow Structure**:
```
Webhook Trigger → Check Urgency → Send SMS → Log Result
                     ↓
                Error Handler → Log Error
```

**SMS Configuration**:
```json
{
  "name": "Send SMS Notification",
  "type": "n8n-nodes-base.twilio",
  "parameters": {
    "operation": "send",
    "from": "{{ $env.TWILIO_PHONE_NUMBER }}",
    "to": "{{ $env.BUSINESS_PHONE }}",
    "message": "🚨 URGENT: New dental appointment request from {{ $json.name }} - {{ $json.appointmentType }}. Call: {{ $json.phone || $json.email }}"
  }
}
```

### 3. Lead Follow-up Workflow

**Purpose**: Send automated follow-up messages to leads

**Workflow Structure**:
```
Schedule Trigger → Get Recent Leads → Send Follow-up → Update Status
```

**Schedule Configuration**:
```json
{
  "name": "Daily Follow-up Check",
  "type": "n8n-nodes-base.cron",
  "parameters": {
    "rule": {
      "interval": [
        {
          "field": "cronExpression",
          "expression": "0 9 * * *"
        }
      ]
    }
  }
}
```

**Follow-up Email**:
```json
{
  "name": "Send Follow-up Email",
  "type": "n8n-nodes-base.emailSend",
  "parameters": {
    "fromEmail": "{{ $env.BUSINESS_EMAIL }}",
    "toEmail": "{{ $json.email }}",
    "subject": "Thank you for your interest - {{ $env.BUSINESS_NAME }}",
    "text": "Hi {{ $json.name }},\n\nThank you for your interest in our dental services. We received your request for {{ $json.appointmentType }} and will contact you soon to schedule your appointment.\n\nIf you have any questions, please don't hesitate to call us at {{ $env.BUSINESS_PHONE }}.\n\nBest regards,\n{{ $env.BUSINESS_NAME }} Team"
  }
}
```

## Error Handling Patterns

### 1. Retry Logic
```json
{
  "name": "Retry on Failure",
  "type": "n8n-nodes-base.function",
  "parameters": {
    "functionCode": "// Retry logic for external API calls\nconst maxRetries = 3;\nconst retryDelay = 1000; // 1 second\n\nlet attempt = 0;\nwhile (attempt < maxRetries) {\n  try {\n    // Make API call\n    const result = await $http.request({\n      method: 'POST',\n      url: 'https://api.example.com/endpoint',\n      data: $input.first().json\n    });\n    \n    return { json: result.data };\n  } catch (error) {\n    attempt++;\n    if (attempt >= maxRetries) {\n      throw error;\n    }\n    \n    // Wait before retry\n    await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));\n  }\n}"
  }
}
```

### 2. Error Logging
```json
{
  "name": "Log Error",
  "type": "n8n-nodes-base.function",
  "parameters": {
    "functionCode": "// Log error details\nconst error = $input.first().json;\n\nconsole.log('Workflow Error:', {\n  timestamp: new Date().toISOString(),\n  workflow: 'dental-intake-processing',\n  error: error.message,\n  stack: error.stack,\n  input: $input.first().json\n});\n\n// Send error alert if critical\nif (error.message.includes('database') || error.message.includes('critical')) {\n  // Trigger alert workflow\n  return { json: { alert: true, error: error.message } };\n}\n\nreturn { json: { logged: true } };"
  }
}
```

## Environment Variables

### Required Environment Variables
```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# SMS (Optional)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Business Information
BUSINESS_NAME=Your Dental Practice
BUSINESS_EMAIL=info@yourdentalpractice.com
BUSINESS_PHONE=+1234567890
```

## Testing Workflows

### 1. Test Data
```json
{
  "name": "Test Lead Data",
  "phone": "+1234567890",
  "email": "test@example.com",
  "appointmentType": "Cleaning",
  "preferredDate": "2024-01-15",
  "preferredTime": "10:00 AM",
  "notes": "Regular cleaning appointment",
  "consent": true,
  "siteId": "test-site-123"
}
```

### 2. Workflow Testing
1. **Manual Testing**: Use the test data above to trigger workflows
2. **Error Testing**: Test with invalid data to ensure error handling works
3. **Load Testing**: Test with multiple simultaneous submissions
4. **Integration Testing**: Verify all external services work correctly

## Monitoring and Maintenance

### 1. Workflow Monitoring
- Monitor workflow execution logs
- Set up alerts for failed workflows
- Track success rates and performance

### 2. Regular Maintenance
- Review and update workflows monthly
- Test all workflows after any changes
- Update environment variables as needed
- Monitor external service status

### 3. Performance Optimization
- Optimize workflow execution time
- Reduce unnecessary API calls
- Implement caching where appropriate
- Monitor resource usage

## Best Practices

1. **Keep It Simple**: Start with basic workflows and add complexity gradually
2. **Test Thoroughly**: Always test workflows before deploying
3. **Handle Errors**: Implement proper error handling and logging
4. **Monitor Performance**: Track workflow execution and optimize as needed
5. **Document Everything**: Document workflow purposes and configurations
6. **Regular Updates**: Keep workflows updated and maintained

## Troubleshooting

### Common Issues
1. **Webhook Not Triggering**: Check webhook URL and authentication
2. **Database Connection Failed**: Verify Supabase credentials and permissions
3. **Email Not Sending**: Check SMTP configuration and credentials
4. **Workflow Timeout**: Optimize workflow or increase timeout settings

### Debug Steps
1. Check workflow execution logs
2. Verify environment variables
3. Test individual nodes
4. Check external service status
5. Review error messages and stack traces
