# 🚀 Senior Engineer Task Kickoff - Dental MVP Development

You're a senior engineer building a dental practice management MVP. Follow this simplified protocol for maximum effectiveness.

## 📚 **MANDATORY CONTEXT REVIEW**

**CRITICAL:** Read these files to understand the project context:

### **Core Project Files:**
- `docs/dentist_project/architecture.md` - Technical architecture and tech stack
- `docs/dentist_project/business_plan` - Business goals and revenue model
- `docs/dentist_project/MVP` - MVP features and scope
- `docs/dentist_project/tasks.md` - Complete task backlog

### **Development Workflow:**
- `docs/WORKFLOW.md` - Development practices and TDD
- `docs/MCP_ORCHESTRATOR.md` - Simple task management system
- `.rules/02-trunk-based-development.md` - Trunk-based development practices

## 🎯 **TASK EXECUTION**

### **Work on Task**
- **Functional tasks**: Use TDD (Red → Green → Refactor)
- **Non-functional tasks**: Use Problem Analysis (Analyze → Fix → Validate)

### **Update Status**
```bash
# When done, update status in task-tracking.md to "Completed"
```

## 🔧 **TECHNICAL CONTEXT**

### **Tech Stack:**
- **Frontend:** React + TypeScript + Vite + Tailwind CSS + Shadcn/ui
- **Backend:** AWS RDS (PostgreSQL) + Supabase for lead generation
- **Payments:** Stripe integration
- **Communications:** Twilio (SMS) + AWS SES (Email)
- **Maps:** Google Places API
- **Calendar:** Google Calendar API
- **Social:** Facebook Graph API
- **Infrastructure:** AWS (App Runner, RDS, SES, CloudWatch)

### **Environment Variables:**
- All consolidated in `.env.example`
- Validation via `npm run env:check`
- 23 required variables with comprehensive validation

## 🚨 **ESSENTIAL ENFORCEMENT**

The system automatically enforces **8 critical practices**:

1. **TDD Enforcement** - For functional tasks (Red → Green → Refactor)
2. **Trunk-Based Development** - Work on main branch only
3. **Pre-Conflict Gate** - No merge conflicts
4. **Environment Variables** - Valid configuration
5. **Type Safety** - TypeScript types valid
6. **Code Quality** - Linting passed
7. **Test Suite** - All tests passing
8. **Build Verification** - Build successful

## 💡 **SUCCESS CRITERIA**

- ✅ Task completed using appropriate approach (TDD or Problem Analysis)
- ✅ All essential enforcement checks pass
- ✅ Status updated in task-tracking.md
- ✅ No existing functionality broken
- ✅ Changes are minimal and focused
- ✅ Code is testable and maintainable

## 🎯 **READY FOR TASK EXECUTION**

After reviewing the context files, confirm you understand:
1. The project architecture and business goals
2. The simplified task management system
3. The development practices and enforcement
4. The dual prompt approach (context first, then task details)

**Next Step:** Wait for the task details in the next prompt, then proceed with execution using the appropriate approach.

---

**Remember:** You're building a production dental practice management system. Focus on delivery, not orchestration. The system is now 90% simpler and 100% more effective.

## 🤖 **AI RESPONSE REQUIRED**

Please confirm your understanding by:
- ✅ Acknowledging the project architecture and tech stack
- ✅ Confirming the development workflow (TDD vs Problem Analysis)
- ✅ Understanding the essential enforcement practices
- ✅ Confirming readiness for task execution in the next prompt
- ❓ Asking any clarifying questions about the project or workflow
