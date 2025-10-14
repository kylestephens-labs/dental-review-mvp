# Problem Analysis Template

> **For Non-Functional Tasks** - Follow the 100x Workflow: Analyze → Identify root cause → Fix directly → Validate
> 
> **Reference**: See `.rules/00-100x-workflow.md` for complete methodology and examples

## Analyze

**What is the problem?**
- Describe the current issue or situation
- What symptoms are you observing?
- What is the impact on the system/users?

**Example**: "The current authentication system lacks proper user session management and secure token handling. Users are experiencing frequent logouts and potential security vulnerabilities due to improper token storage and validation mechanisms."

## Identify Root Cause

**Why is this happening?**
- What is the underlying cause of the problem?
- What specific component or configuration is failing?
- What dependencies or external factors are involved?

**Example**: "Root cause is improper token storage in localStorage instead of httpOnly cookies, combined with missing token validation middleware and no session refresh mechanism."

## Fix Directly

**What needs to be changed?**
- List the specific changes required
- Include configuration updates, code changes, or process modifications
- Be specific about files, settings, or components to modify

**Example**: "Implement a robust JWT-based authentication system with:
- Secure token storage using httpOnly cookies
- Proper token validation middleware  
- Session management with refresh tokens
- Password hashing using bcrypt
- Rate limiting for login attempts"

## Validate

**How will you verify the fix works?**
- What tests or checks will confirm the problem is resolved?
- How will you ensure no regressions were introduced?
- What monitoring or verification steps are needed?

**Example**: "Validation steps:
- Unit tests for authentication middleware
- Integration tests for login/logout flows
- Security audit of token handling
- Performance testing under load
- User acceptance testing for session persistence"

---

## Non-Functional Task Examples

### Build Configuration Issues
- **Analyze**: Build failing with TypeScript errors
- **Root Cause**: Missing type definitions or incorrect tsconfig
- **Fix**: Update dependencies or fix configuration
- **Validate**: Run `npm run typecheck` and `npm run build`

### Environment Setup Problems  
- **Analyze**: Application not connecting to database
- **Root Cause**: Missing or incorrect environment variables
- **Fix**: Update `.env` files with correct credentials
- **Validate**: Test database connection and verify data access

### Documentation Updates
- **Analyze**: Missing or outdated documentation
- **Root Cause**: Changes made without updating docs
- **Fix**: Update relevant documentation files
- **Validate**: Review docs for accuracy and completeness

---

**Remember**: Non-functional tasks focus on configuration, environment, documentation, and one-time fixes rather than testable business logic.
