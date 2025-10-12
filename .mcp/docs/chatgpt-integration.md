# ChatGPT Integration

## Overview

The ChatGPT Integration automatically fills out task details using OpenAI's GPT-4 API. It analyzes project context files and generates comprehensive task specifications including overview, goal, acceptance criteria, definition of ready/done, and implementation notes.

## Features

- ✅ **Real ChatGPT API Integration**: Uses OpenAI's GPT-4 for intelligent task analysis
- ✅ **Graceful Fallback**: Provides structured fallback details when API key is missing
- ✅ **Project Context Analysis**: Reads architecture, business goals, and technical requirements
- ✅ **Structured Output**: Generates consistent JSON-formatted task details
- ✅ **Error Handling**: Robust error handling with fallback mechanisms

## Setup

### 1. Get OpenAI API Key

1. Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create a new API key
3. Copy the key (starts with `sk-`)

### 2. Set Environment Variable

```bash
# Add to your .env file
OPENAI_API_KEY=sk-your-api-key-here

# Or export in your shell
export OPENAI_API_KEY=sk-your-api-key-here
```

### 3. Test Integration

```bash
# Test with fallback (no API key needed)
npm run test:chatgpt

# Test with real ChatGPT API (requires API key)
OPENAI_API_KEY=sk-your-key npm run test:chatgpt
```

## Usage

### Automatic Integration

The ChatGPT integration runs automatically during the MCP workflow:

```bash
# Create a task
npm run mcp:create "User Authentication System" P1

# Prepare the task (ChatGPT integration runs here)
npm run mcp:prep task-abc123-def456
```

### Manual Integration

You can also run the integration manually:

```bash
# Fill out task details for a specific task
npm run chatgpt:fill-task task-abc123-def456
```

## How It Works

### 1. Project Context Analysis

The integration reads these project files:
- `docs/dentist_project/architecture.md` - Technical architecture
- `docs/dentist_project/business_plan` - Business goals and strategy
- `docs/dentist_project/MVP` - MVP features and scope
- `docs/dentist_project/tasks.md` - Task requirements and specifications

### 2. ChatGPT Prompt

The system sends a structured prompt to GPT-4:

```
You are a senior software engineer analyzing a task for a dental practice management MVP.

PROJECT CONTEXT:
[All project files concatenated]

TASK TO ANALYZE:
Title: "User Authentication System"
Priority: P1

Please analyze this task and generate comprehensive task details in JSON format...
```

### 3. Response Processing

ChatGPT returns structured JSON with:
- `overview`: Brief description of what the task accomplishes
- `goal`: Clear statement of what we want to achieve
- `acceptanceCriteria`: Specific, testable criteria
- `definitionOfReady`: Prerequisites for starting
- `definitionOfDone`: Completion criteria
- `filesAffected`: Files that will be created/modified
- `implementationNotes`: Technical implementation details

### 4. Fallback Behavior

If the API key is missing or the API call fails:
- Uses predefined templates based on task type
- Provides basic but complete task structure
- Logs helpful instructions for enabling the API

## Example Output

### With ChatGPT API

```json
{
  "overview": "Implement secure user authentication system with JWT tokens and role-based access control",
  "goal": "Create a robust authentication system that allows users to register, login, and access protected resources based on their role",
  "acceptanceCriteria": [
    "Users can register with email and password",
    "Users can login and receive JWT token",
    "Protected routes require valid JWT token",
    "Role-based access control (admin, dentist, patient)",
    "Password reset functionality works",
    "Session management handles token expiration"
  ],
  "definitionOfReady": [
    "Supabase auth configuration is set up",
    "JWT secret is configured in environment variables",
    "User roles schema is designed",
    "Protected route middleware is planned"
  ],
  "definitionOfDone": [
    "Authentication API endpoints are implemented",
    "Frontend login/register forms are working",
    "JWT token validation middleware is working",
    "Role-based access control is implemented",
    "Password reset flow is complete",
    "All tests pass",
    "Documentation is updated"
  ],
  "filesAffected": [
    "src/lib/auth.ts",
    "src/components/auth/LoginForm.tsx",
    "src/components/auth/RegisterForm.tsx",
    "src/middleware/auth.ts",
    "src/types/user.ts"
  ],
  "implementationNotes": "Use Supabase Auth for backend authentication, implement JWT tokens for session management, create role-based middleware for protected routes, ensure ADA compliance for forms."
}
```

### With Fallback

```json
{
  "overview": "User Authentication System",
  "goal": "Implement User Authentication System as specified in tasks.md",
  "acceptanceCriteria": [
    "Implementation follows architecture specifications",
    "Code is tested and working",
    "Documentation updated if needed"
  ],
  "definitionOfReady": [
    "Task requirements are clear from docs/dentist_project/tasks.md",
    "Architecture context is understood",
    "Start and End requirements are parsed",
    "Implementation approach is determined"
  ],
  "definitionOfDone": [
    "All Start/End requirements from tasks.md are met",
    "Implementation follows project architecture",
    "Code compiles and passes tests",
    "Files are created/modified as specified",
    "Documentation updated if needed"
  ],
  "filesAffected": [],
  "implementationNotes": "Task Analysis:\n- Architecture: React + Vite frontend, AWS RDS (PostgreSQL) for core business data, Supabase for lead generation, Stripe payment processing, Twilio SMS/communication, AWS SES email, Google services integration\n- Business Goals: Dental practice management, Appointment booking system, Lead intake and management, Payment processing\n- Technical Requirements: Environment variable management, Input validation, Error handling, Test-driven development\n- MVP Features: Booking system\n\nThis task is critical for the dental MVP as it ensures all external service integrations are properly configured before deployment."
}
```

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | OpenAI API key for ChatGPT integration | No (falls back to templates) |

### Customization

You can customize the integration by modifying:

1. **Project Context Files** (in `chatgpt-integration.ts`):
   ```typescript
   this.projectContextFiles = [
     'docs/dentist_project/architecture.md',
     'docs/dentist_project/business_plan',
     'docs/dentist_project/MVP',
     'docs/dentist_project/tasks.md'
   ];
   ```

2. **ChatGPT Prompt** (in `generateTaskDetailsWithChatGPT()`):
   - Modify the prompt to change how ChatGPT analyzes tasks
   - Adjust temperature and max_tokens for different response styles

3. **Fallback Templates** (in `generateFallbackTaskDetails()`):
   - Customize the fallback behavior when API is unavailable

## Troubleshooting

### Common Issues

1. **"Missing credentials" error**
   - Solution: Set `OPENAI_API_KEY` environment variable

2. **"No response from ChatGPT" error**
   - Solution: Check API key validity and network connection

3. **"Invalid response structure" error**
   - Solution: ChatGPT returned malformed JSON - falls back to templates

4. **Task details incomplete**
   - Solution: Check that project context files exist and are readable

### Debug Mode

Enable debug logging by setting:
```bash
export DEBUG=chatgpt-integration
```

## Cost Considerations

- **GPT-4 API**: ~$0.03 per 1K tokens (input) + ~$0.06 per 1K tokens (output)
- **Typical cost per task**: $0.01-0.05 depending on project context size
- **Fallback mode**: Free (no API calls)

## Security

- API keys are stored in environment variables (never committed)
- No sensitive project data is sent to OpenAI
- All API calls are logged for audit purposes

## Future Enhancements

- [ ] Support for different GPT models (GPT-3.5-turbo for cost savings)
- [ ] Caching of responses to reduce API calls
- [ ] Integration with other AI providers (Anthropic, Google)
- [ ] Custom prompts per task type
- [ ] Batch processing for multiple tasks
