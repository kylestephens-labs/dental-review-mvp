# 🧭 MVP Delivery Working Agreement
**Team**: 1 Human + 3 AI (ChatGPT, cursor, codex)

**Purpose**: Ensure every MVP task ships quickly without rework, with clear ownership boundaries and consistent quality bars optimized for 14-day sprint delivery.

---

## 1️⃣ Roles and Responsibilities

| Role | Core Responsibilities | Boundaries |
|------|----------------------|------------|
| **Human (You)** | - Final decision authority on scope, priorities, and business logic<br>- Approve/reject deliverables based on business value<br>- Resolve conflicts between AI agents<br>- Provide context and domain expertise<br>- Set overall direction and strategy | Ultimate decision maker; can override any AI recommendation |
| **ChatGPT (PM + QA)** | - Define product intent, goals, acceptance criteria (AC), and Definition of Done (DoD)<br>- Manage task queue and sequencing with priority tags<br>- Author validation scripts/test plans<br>- Coordinate between cursor and codex<br>- Write clear, atomic prompts for cursor<br>- Single-threaded approval for scope/AC changes | Does not implement code or decide internal architecture unless explicitly blocking delivery |
| **cursor (Senior Engineer)** | - Translate task specs into code<br>- Choose implementation patterns and libraries consistent with architecture docs<br>- Write unit/integration tests based on risk level<br>- Maintain developer ergonomics (scripts, tooling)<br>- Order work by priority when multiple DoR-ready tasks exist<br>- Execute multiple tasks in parallel when independent | Does not alter scope, acceptance criteria, or business logic guarantees without written PM approval |
| **codex (Reviewer / Debugger)** | - Perform targeted code reviews with artifact-based checklists<br>- Verify functional correctness and style conformity<br>- Surface edge-case and regression risks<br>- Suggest or implement small diffs to unblock<br>- Focus on risk-based quality gates<br>- Review multiple PRs in parallel | Does not redefine requirements or product decisions. Focused on quality assurance within engineering boundaries |

---

## 2️⃣ Task Lifecycle (MVP-Optimized)

### A. Definition of Ready (DoR) - Dual Track

#### 🚀 **Fast Lane** (Small tasks, bugfixes, config changes)
- ✅ **Goal statement** (1 sentence)
- ✅ **Acceptance Criteria** (1-2 bullet points)
- ✅ **Priority tag** (P0/P1/P2)
- ✅ **Size estimate** (Small: 2-4h | Medium: 4-8h | Large: 8h+)

#### 📋 **Full Lane** (New features, integrations, complex changes)
- ✅ **Goal statement** (what problem is solved and why)
- ✅ **Acceptance Criteria** (clear, testable conditions)
- ✅ **Definition of Done**
- ✅ **Validation plan** (QA steps to verify)
- ✅ **Size estimate** (Small: 2-4h | Medium: 4-8h | Large: 8h+)
- ✅ **Dependencies** (blocking tasks, env vars, migrations)
- ✅ **Priority tag** (P0/P1/P2)
- ✅ **Risk level** (Critical/Standard/Experimental)

**✅ If any are missing, cursor requests clarification before coding.**

### B. Development
- ✅ cursor creates feature branch `feat/task-{number}-{short-name}`
- ✅ Commits small, atomic changes (≤100 MB total per task)
- ✅ All secrets use .env keys—never hard-coded
- ✅ Uses feature flags for partial or experimental features
- ✅ Updates PM on progress every 4 hours
- ✅ Orders work by priority when multiple DoR-ready tasks exist

### C. Review / Handoff

#### **Fast Lane Review** (30 minutes SLA)
1. **cursor → codex**: opens PR with:
   - Context + screenshot/CLI output
   - **Artifacts**: `npm run test` log, `npm run lint` log, screenshot filenames
   - Self-QA evidence (test log, proof of env check passing)
2. **codex → cursor**: review within 30 minutes. Comments limited to correctness and security
3. **codex → PM/QA**: signals "ready for acceptance"

#### **Full Lane Review** (1-2 hours SLA based on size)
1. **cursor → codex**: opens PR with:
   - Context + screenshot/CLI output
   - **Artifacts**: `npm run test` log, `npm run lint` log, `npm run typecheck` log, screenshot filenames
   - Self-QA evidence (test log, proof of env check passing)
   - Risk assessment if applicable
2. **codex → cursor**: review within 1-2 hours. Comments on correctness, maintainability, and security
3. **codex → PM/QA**: signals "ready for acceptance"

### D. QA Acceptance (PM)
- ✅ PM runs defined validation script or test plan
- ✅ Confirms AC and DoD met
- ✅ Approves merge to main or requests fixes
- ✅ **SLA**: 1 hour for fast lane, 2 hours for full lane

---

## 3️⃣ Definition of Done (Risk-Based)

### **P0/Critical Flows** (Stripe webhook, SMS sending, STOP handling)
- ✅ All acceptance criteria met
- ✅ Code compiles & passes all tests
- ✅ Type safety: `npm run typecheck` passes
- ✅ Lint clean (eslint, prettier)
- ✅ No TODOs, console.logs, or commented code
- ✅ **Test coverage: >80%** of changed lines
- ✅ Env vars validated (via `npm run env:check`)
- ✅ Docs/runbooks updated if behavior or setup changed
- ✅ Observability: logs + events + metrics consistent with architecture

### **P1/Standard Features** (Onboarding, connectors, tracking)
- ✅ All acceptance criteria met
- ✅ Code compiles & passes all tests
- ✅ Type safety: `npm run typecheck` passes
- ✅ Lint clean (eslint, prettier)
- ✅ No TODOs, console.logs, or commented code
- ✅ **Test coverage: >60%** of changed lines
- ✅ Env vars validated (via `npm run env:check`)
- ✅ Basic logging for debugging

### **P2/Experimental/Throwaway** (Demo features, A/B tests, temporary code)
- ✅ All acceptance criteria met
- ✅ Code compiles & passes all tests
- ✅ Type safety: `npm run typecheck` passes
- ✅ Lint clean (eslint, prettier)
- ✅ **Test coverage: >40%** of changed lines
- ✅ Basic error handling (no crashes)

### **Process (Universal)**
- ✅ PR reviewed and approved by codex
- ✅ QA sign-off by PM
- ✅ Merged to main; CI green; deployment verified

---

## 4️⃣ Code Review Guidelines (codex) - Artifact-Based

| Category | Expectation | Required Artifacts |
|----------|-------------|-------------------|
| **Correctness** | Logic matches spec; no hidden state; handles edge cases | `npm run test` log showing all tests pass |
| **Security** | No secrets, PII leaks, or missing validations | `npm run env:check` log; screenshot of no hardcoded values |
| **Reliability** | Idempotency & retries match architecture patterns | Test log showing retry logic; screenshot of error handling |
| **Performance** | No N+1 queries; O(n) loops on reasonable bounds | Screenshot of query performance; test log showing no timeouts |
| **Style/Docs** | Code readable, typed, self-documented | `npm run lint` log; screenshot of code formatting |
| **Tests** | Meaningful assertions; covers happy + failure paths | Test log showing coverage percentage; screenshot of test results |

---

## 5️⃣ QA Validation Script Template (for each task)

**You (PM/QA) attach this when handing a task to cursor:**

```markdown
# QA Validation Plan — Task <n>
**Priority**: P0/P1/P2
**Risk Level**: Critical/Standard/Experimental
**Fast Lane**: Yes/No

## Goal:
[One sentence]

## Acceptance Criteria:
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Expected Behavior (happy path):
[Description]

## Failure Modes:
[What should fail gracefully]

## Repro steps:
1. [Step 1]
2. [Step 2]
3. [Step 3]

## Expected Output:
- [Expected result 1]
- [Expected result 2]

## Automated tests required:
- [ ] Unit (coverage target: ___%)
- [ ] Integration
- [ ] CLI / Endpoint smoke

## Manual check (if any):
- [ ] curl output: `curl -sS localhost:PORT/endpoint | jq .status`
- [ ] UI screenshot: `screenshot-{task-number}-{description}.png`

## Pass Criteria: 
All assertions true; exit codes 0; screenshots match expected behavior.
```

---

## 6️⃣ Scope/AC Change Process

### **Single-Threaded PM Approval**
1. **cursor** identifies scope/AC ambiguity
2. **cursor** posts in Slack thread: `@PM Scope question: [description]`
3. **PM** responds within 30 minutes with decision
4. **PM** updates task description with new AC
5. **cursor** continues development
6. **PM** documents decision in ADR if architectural impact

### **Emergency Override**
- **PM** can override any process for critical path items
- **PM** can skip review for urgent fixes (document after)
- **PM** can direct merge to main for emergency fixes

---

## 7️⃣ Priority Tagging System

### **P0 - Critical Path** (Blocking other work)
- Stripe webhook implementation
- Database schema migrations
- Core API endpoints
- SMS sending functionality
- STOP handling

### **P1 - Standard Features** (Important but not blocking)
- Onboarding portal
- Calendar connectors
- Tracking functionality
- Weekly digest
- Error handling

### **P2 - Nice-to-Have** (Can be deferred)
- Demo microsite
- Benchmark emails
- Advanced analytics
- A/B testing features
- Performance optimizations

### **Work Ordering Rules**
1. **P0 tasks** always take priority
2. **P1 tasks** can be worked in parallel if no dependencies
3. **P2 tasks** only when P0/P1 queue is empty
4. **cursor** can work on multiple P1 tasks simultaneously if independent

---

## 8️⃣ AI Coordination Protocol (14-day sprint)

### **Continuous Communication** (AI-to-AI)
- **ChatGPT → cursor**: Task assignments with full context
- **cursor → codex**: PR requests with artifacts
- **codex → ChatGPT**: Review completion signals
- **ChatGPT → Human**: Escalation for decisions/conflicts

### **Human Check-ins** (As needed)
- **Morning**: Review overnight progress, set daily priorities
- **Evening**: Review completed work, plan next day
- **Ad-hoc**: Resolve conflicts, make scope decisions, approve major changes

### **Parallel Execution Rules**
- **Independent tasks**: cursor can work on multiple P1 tasks simultaneously
- **Dependent tasks**: cursor waits for dependencies, works on other tasks
- **Review queue**: codex processes multiple PRs in parallel
- **Conflict resolution**: Human makes final decision when AI agents disagree

---

## 9️⃣ CI / Automation (MVP-Simplified)

### **Pipeline Gates** (Essential only)
1. `env:check` - Environment variables validated
2. `typecheck` - TypeScript compilation
3. `lint` - Code style and formatting
4. `test` - Unit and integration tests

### **Trigger**: Push or PR to main
### **Fail Fast**: No partial merges if any gate fails
### **Skip Gates**: PM can override for emergency fixes

---

## 🔟 Communication Protocol (AI-to-AI)

### **Task Assignment Flow**
1. **ChatGPT** creates task with DoR and assigns to cursor
2. **cursor** acknowledges and begins work
3. **cursor** updates ChatGPT on progress every 2 hours
4. **cursor** submits PR to codex when ready
5. **codex** reviews and signals completion to ChatGPT
6. **ChatGPT** validates and signals completion to Human

### **Escalation Protocol**
- **Scope questions**: cursor → ChatGPT → Human (if needed)
- **Technical conflicts**: codex → ChatGPT → Human (if needed)
- **Priority changes**: ChatGPT → Human (immediate)
- **Blockers > 2 hours**: cursor → ChatGPT → Human (immediate)

### **Demos at End of Each Phase**
Show real data proving key metrics:
- **TTL ≤ 48h**: First practice checkout to first SMS sent
- **Onboarding ≤ 2min**: Median time from magic link to settings saved
- **CTR ≥ 45%**: SMS click-through rate
- **STOP < 1%**: Opt-out rate

---

## 1️⃣1️⃣ Lightweight Decision Records (ADRs)

### **Required for**:
- Architectural changes
- Security-impacting decisions
- Integration pattern changes
- Scope/AC changes that affect other tasks

### **Format**:
```markdown
# ADR-{date}-{short-description}
**Context**: [Why this decision was needed]
**Decision**: [What was decided]
**Consequences**: [Impact on other components]
**PM Approval**: [Date and rationale]
```

### **Not Required for**:
- Bug fixes
- Configuration changes
- Documentation updates
- Test-only changes

---

## 1️⃣2️⃣ Performance and Reliability Guardrails

### **Latency Budget**: APIs < 500ms P95
### **Error Budget**: < 1% 5xx per endpoint
### **SMS Cost**: <$0.70/week per active patient
### **Queue Depth**: Alerts if > 500 pending jobs
### **STOP Spikes**: Alarm when > 3% within 1h

---

## 1️⃣3️⃣ Enforcement Summary

| Stage | Owner | Gate | SLA |
|-------|-------|------|-----|
| Spec completeness | PM/QA | Definition of Ready checklist | Immediate |
| Implementation | cursor | Local tests, typecheck, lint | 4-hour updates |
| Review | codex | Code review rubric + artifacts | 30min-2hrs |
| Acceptance | PM/QA | Definition of Done checklist | 1-2hrs |
| Deploy | CI | All green + manual approval if prod | Immediate |

---

## 1️⃣4️⃣ Parallel Execution System

### **How AI Agents Work Simultaneously**

#### **cursor (Multi-tasking Engineer)**
- **Independent P1 tasks**: Can work on 2-3 tasks simultaneously
- **Example**: Building Stripe webhook while also working on database schema
- **Coordination**: Updates ChatGPT on progress for each task separately
- **Dependencies**: Automatically waits for blocking tasks, continues with others

#### **codex (Parallel Reviewer)**
- **Multiple PRs**: Can review 2-3 PRs simultaneously
- **Queue management**: Processes reviews in priority order (P0 → P1 → P2)
- **Artifact validation**: Reviews each PR's artifacts independently
- **Conflict detection**: Flags when PRs might conflict with each other

#### **ChatGPT (Orchestrator)**
- **Task distribution**: Assigns multiple tasks to cursor based on dependencies
- **Progress tracking**: Monitors all active tasks simultaneously
- **Conflict resolution**: Identifies when tasks might interfere
- **Human escalation**: Only involves human when decisions are needed

### **Parallel Execution Rules**
1. **P0 tasks**: Always single-threaded (critical path)
2. **P1 tasks**: Can run in parallel if no shared dependencies
3. **P2 tasks**: Can run in parallel with P1 tasks
4. **Review queue**: Processes multiple PRs simultaneously
5. **Integration conflicts**: Human resolves when AI agents disagree

---

## 1️⃣5️⃣ Missing Components for 100x Improvement

### **1. AI Orchestrator (MCP Integration)**
**What's Missing**: A central orchestrator that can coordinate all AI agents without human intervention.

**Solution**: Implement MCP (Model Context Protocol) with:
- **Task queue management**: Automatically assigns tasks based on dependencies
- **Progress monitoring**: Tracks all active work streams
- **Conflict detection**: Identifies when tasks might interfere
- **Auto-escalation**: Only involves human when decisions are needed

**Implementation**:
```typescript
// MCP Orchestrator
class AIOrchestrator {
  async assignTask(task: Task): Promise<void> {
    const availableAgents = await this.getAvailableAgents();
    const bestAgent = this.selectBestAgent(task, availableAgents);
    await this.delegateTask(task, bestAgent);
  }
  
  async monitorProgress(): Promise<void> {
    const activeTasks = await this.getActiveTasks();
    for (const task of activeTasks) {
      await this.checkProgress(task);
      if (task.isBlocked()) {
        await this.escalateToHuman(task);
      }
    }
  }
}
```

### **2. Automated Testing & Deployment Pipeline**
**What's Missing**: Fully automated testing, deployment, and rollback system.

**Solution**: Implement:
- **Automated testing**: Runs tests on every commit
- **Automated deployment**: Deploys to staging, then production
- **Automated rollback**: Reverts if metrics degrade
- **Automated monitoring**: Alerts on performance issues

**Implementation**:
```yaml
# GitHub Actions Workflow
name: AI-Driven MVP Pipeline
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Run Tests
        run: npm run test:all
      - name: Run Lint
        run: npm run lint
      - name: Run Type Check
        run: npm run typecheck
  
  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Staging
        run: npm run deploy:staging
      - name: Run Smoke Tests
        run: npm run test:smoke
      - name: Deploy to Production
        run: npm run deploy:production
      - name: Monitor Metrics
        run: npm run monitor:metrics
```

### **3. Real-time Collaboration Dashboard**
**What's Missing**: A dashboard showing all AI agents' work in real-time.

**Solution**: Build a web dashboard that shows:
- **Active tasks**: What each AI agent is working on
- **Progress bars**: Real-time progress for each task
- **Queue status**: P0/P1/P2 task queues
- **Blockers**: What's preventing progress
- **Metrics**: Real-time KPI tracking

**Implementation**:
```typescript
// Real-time Dashboard
class CollaborationDashboard {
  async renderActiveTasks(): Promise<void> {
    const tasks = await this.getActiveTasks();
    const agents = await this.getAgentStatus();
    
    // Render real-time status
    this.renderTaskBoard(tasks);
    this.renderAgentStatus(agents);
    this.renderMetrics();
  }
}
```

---

## 1️⃣6️⃣ MVP-Specific Quality Gates

### **Phase 1 (Days 1-5): Core Infrastructure**
- ✅ Stripe webhook working
- ✅ Database schema deployed
- ✅ Basic API endpoints responding
- ✅ n8n workflows can be triggered

### **Phase 2 (Days 6-10): Core Features**
- ✅ Onboarding flow complete
- ✅ SMS sending works
- ✅ Basic tracking functional
- ✅ STOP handling implemented

### **Phase 3 (Days 11-14): Polish & Launch**
- ✅ End-to-end flow working
- ✅ Error handling robust
- ✅ Performance acceptable
- ✅ Ready for pilot customers

---

**This agreement is optimized for 14-day MVP delivery while maintaining quality standards. Post-MVP, we can add back the comprehensive processes for production-grade development.**
