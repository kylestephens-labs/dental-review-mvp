# MCP Orchestrator Tasks

## Overview
This document breaks down the MCP Orchestrator implementation into bite-size tasks, organized by MVP (Sequential Agent Handoff) vs Post-MVP (Parallel Execution System). The MVP focuses on solving the primary pain point: eliminating copy-paste between ChatGPT → Cursor → Codex → GitHub.

## MVP Focus: Sequential Agent Handoff Coordinator
**Goal**: Eliminate copy-paste between agents using file-based workflow system
**Timeline**: 3-4 hours implementation
**Value**: 70% reduction in coordination overhead

## Post-MVP Focus: Parallel Execution System  
**Goal**: Full parallel execution with conflict resolution and monitoring
**Timeline**: 2-3 weeks implementation
**Value**: 3x increase in concurrent task processing

---

# MVP TASKS (Sequential Agent Handoff)

## Task 1 — Repository & Service Scaffold ✅ COMPLETED

**Task title and number**: T1: Create MCP Orchestrator repo scaffold
**Overview**: Initialize a Node/TypeScript service with clean architecture (api/, core/, adapters/, scripts/, tests/).
**Goal**: Provide a production-ready skeleton with linting, testing, and basic run scripts.
**Acceptance criteria**:
	•	npm run dev starts server (hello route).
	•	ESLint + Prettier configured; npm run lint passes.
	•	Vitest/Jest configured; sample test passes.
	•	Dockerfile builds; dockerized app starts.
**Definition of done**: Repo pushed; CI runs lint/test on PR.
**How cursor will validate the definition of done**: Run npm i && npm run test && npm run dev; hit / returns 200. Build Docker image and run container returns 200.
**Approximate size of task for a commit**: ~5–20 files, <2 MB.
**Status**: ✅ COMPLETED - Separate repository created at https://github.com/kylestephens-labs/mcp-orchestrator

## Task 2 — File-Based Task System (MVP Core) ✅ COMPLETED

**Task title and number**: T2: Create file-based task management system
**Overview**: Implement `.mcp/tasks/` directory structure with status tracking
**Goal**: Enable sequential agent handoff without copy-paste
**Acceptance criteria**:
	•	Directory structure: pending/, ready/, in-progress/, review/, done/, failed/
	•	Markdown task files with standardized schema
	•	Status tracking via file system moves
	•	CLI commands for task management
**Definition of done**: Agents can create, claim, and move tasks through workflow
**How cursor will validate**: npm run mcp:create, npm run mcp:claim, npm run mcp:status work
**Approximate size**: ~8–12 files, <1 MB.
**Status**: ✅ COMPLETED - File-based task system implemented with full directory structure and CLI commands

## Task 3 — Agent Handoff Scripts (MVP Core) ✅ COMPLETED

**Task title and number**: T3: Implement agent handoff scripts
**Overview**: Create CLI scripts for each agent to manage task handoffs
**Goal**: Eliminate copy-paste between ChatGPT → Cursor → Codex
**Acceptance criteria**:
	•	npm run mcp:create - Create task stub
	•	npm run mcp:prep - ChatGPT fleshes out task
	•	npm run mcp:claim - Cursor claims task
	•	npm run mcp:review - Request review from Codex/ChatGPT
	•	npm run mcp:complete - Mark task complete
	•	npm run mcp:next - Get next task for agent
**Definition of done**: All handoff commands work with file system
**How cursor will validate**: Full workflow test: create → prep → claim → review → complete
**Approximate size**: ~6–10 files, <1 MB.
**Status**: ✅ COMPLETED - All handoff scripts implemented and tested with full workflow

## Task 4 — Pre-commit Hook Integration (MVP Core) ✅ COMPLETED

**Task title and number**: T4: Add pre-commit hooks for automatic status updates
**Overview**: Integrate with git pre-commit hooks to update task status
**Goal**: Automatic status updates based on test results
**Acceptance criteria**:
	•	Pre-commit hook runs tests
	•	Updates task status based on test results
	•	Creates error feedback files on test failure
	•	Moves tasks between directories automatically
**Definition of done**: Git commits automatically update task status
**How cursor will validate**: Commit with failing tests creates error feedback
**Approximate size**: ~3–5 files, <0.5 MB.
**Status**: ✅ COMPLETED - Pre-commit hooks implemented with automatic status updates and error feedback

## Task 5 — Error Feedback Loop (MVP Core) ✅ COMPLETED

**Task title and number**: T5: Implement error feedback system
**Overview**: Create system for failed tests to flow back to implementer
**Goal**: Clear error context and debugging information
**Acceptance criteria**:
	•	Failed tests create feedback files
	•	Error context preserved in task files
	•	Tasks move back to ready/ with feedback
	•	Implementer can see error details
**Definition of done**: Error feedback flows back to implementer automatically
**How cursor will validate**: Simulate test failure and verify feedback creation
**Approximate size**: ~4–6 files, <0.5 MB.
**Status**: ✅ COMPLETED - Error feedback system implemented with analysis and retry capabilities

## Task 6 — Context Preservation (MVP Core) ✅ COMPLETED

**Task title and number**: T6: Ensure context preservation throughout handoffs
**Overview**: Maintain task definition, code, feedback, and errors in one place
**Goal**: No context loss between agent handoffs
**Acceptance criteria**:
	•	Task files contain all context
	•	Git context preserved (branch, commit, PR)
	•	Review feedback appended to task files
	•	Error context maintained
**Definition of done**: Full context preserved through entire workflow
**How cursor will validate**: Complex task with multiple handoffs maintains context
**Approximate size**: ~3–5 files, <0.5 MB.
**Status**: ✅ COMPLETED - Context preservation implemented with git integration and comprehensive task files

---

# POST-MVP TASKS (Parallel Execution System)

## Task 7 — MCP Client Integration (Post-MVP)

**Task title and number**: T7: Create MCP client in dental project
**Overview**: Set up client-side integration with orchestrator for hybrid architecture.
**Goal**: Enable dental project to submit tasks to separate orchestrator service.
**Acceptance criteria**:
	•	MCP client package in .mcp/orchestrator-client/
	•	HTTP client for orchestrator API communication
	•	TypeScript types for shared schemas
	•	Task factory for creating dental-specific tasks
**Definition of done**: Client can submit tasks and receive responses from orchestrator.
**How cursor will validate**: npm run mcp:health returns orchestrator status.
**Approximate size**: ~8–12 files, <1 MB.
**Status**: ✅ COMPLETED - Client integration implemented with task factory and shared types

## Task 8 — Task Definition Templates (Post-MVP)

**Task title and number**: T8: Create ServiceBoost task definition templates
**Overview**: Pre-defined task templates for dental MVP features with full context.
**Goal**: Standardize task creation with proper context, files, and integration points.
**Acceptance criteria**:
	•	JSON templates for all 24 MVP tasks
	•	Files affected, components affected, integration points defined
	•	Acceptance criteria and estimated duration included
	•	TDD phases (red/green/refactor) mapped for functional tasks
**Definition of done**: Templates used by MCP client for task creation.
**How cursor will validate**: npm run task:assign uses predefined templates.
**Approximate size**: ~3–5 files, <0.5 MB.
**Status**: ✅ COMPLETED - TDD task templates created with full context

## Task 9 — Retrospective Workflow (Post-MVP)

**Task title and number**: T9: Implement retrospective workflow every 3 tasks
**Overview**: Automated retrospective process for continuous improvement.
**Goal**: Ensure process optimization throughout MVP delivery with all 3 agents participating.
**Acceptance criteria**:
	•	Retrospective triggered after every 3 completed tasks
	•	All 3 agents (Cursor, Codex, ChatGPT) participate
	•	What went well, improvements, action items identified
	•	Process updates and next 3 tasks planned
**Definition of done**: npm run retrospective command works with 3 completed tasks.
**How cursor will validate**: Run retrospective with sample completed tasks.
**Approximate size**: ~4–6 files, <0.5 MB.
**Status**: ✅ COMPLETED - Retrospective workflow implemented with agent participation

## Task 10 — Shared Types: Task/Agent/Event Schemas (Post-MVP)

**Task title and number**: T10: Implement shared TypeScript interfaces & zod validators
**Overview**: Encode Task, AgentStatus, OrchestratorEvent with runtime validation.
**Goal**: Ensure strict typing + request/response validation.
**Acceptance criteria**:
	•	src/core/types.ts exports interfaces matching spec.
	•	src/core/validation.ts exports zod schemas enforcing the fields.
	•	Tests: invalid payloads rejected; valid ones parsed.
**Definition of done**: Types and validators used by API handlers.
**How cursor will validate**: npm run test covers happy/edge cases (≥ 12 tests).
**Approximate size**: ~6–10 files, <1 MB.

---

# IMPLEMENTATION PRIORITY

## MVP Implementation (3-4 hours) - START HERE
**Focus**: Sequential agent handoff coordinator  
**Value**: 70% reduction in coordination overhead  
**Tasks**: 2-6 (File system, handoff scripts, pre-commit hooks, error feedback, context preservation)

### Why Start with MVP:
- **Solves your immediate pain point**: Copy-paste between ChatGPT → Cursor → Codex
- **Fast to implement**: 3-4 hours vs 2-3 weeks
- **Immediate value**: Can use it right away for dental MVP
- **Low risk**: File-based system, no external dependencies
- **Easy to iterate**: Can improve based on real usage

## Post-MVP Implementation (2-3 weeks) - AFTER REVENUE
**Focus**: Parallel execution system with full orchestration  
**Value**: 3x increase in concurrent task processing  
**Tasks**: 7-21 (All advanced features, monitoring, conflict resolution, etc.)

### Why Post-MVP:
- **Complex implementation**: Requires significant time investment
- **Better after revenue**: Can justify the development time
- **Builds on MVP**: Uses lessons learned from sequential handoff
- **Enterprise features**: Advanced monitoring, conflict resolution, etc.

---

# REMAINING TASKS (Post-MVP - Move to separate section)

## Task 11 — Static Agent Configuration (Post-MVP)

**Task title and number**: T11: Load static agents.yaml and capabilities map
**Overview**: Support static agent registry for parallel execution.
**Goal**: Read agents.yaml at boot; provide AgentRegistry adapter.
**Acceptance criteria**:
	•	config/agents.yaml schema validated at startup.
	•	Registry exposes listAgents(), get(name), capabilitiesOf(name).
	•	Startup fails fast on invalid YAML.
**Definition of done**: Unit tests cover valid/invalid YAML.
**Validation**: Run unit tests; simulate malformed file.
**Approximate size**: 3–6 files, <0.5 MB.

⸻

Task 3 — Static Agent Configuration (agents.yaml)

Task title and number: T3: Load static agents.yaml and capabilities map
Overview: Support static agent registry for MVP.
Goal: Read agents.yaml at boot; provide AgentRegistry adapter.
Acceptance criteria:
	•	config/agents.yaml schema validated at startup.
	•	Registry exposes listAgents(), get(name), capabilitiesOf(name).
	•	Startup fails fast on invalid YAML.
Definition of done: Unit tests cover valid/invalid YAML.
Validation: Run unit tests; simulate malformed file.
Approximate size: 3–6 files, <0.5 MB.

⸻

Task 4 — Events Table Integration Adapter

Task title and number: T4: Add events persistence adapter
Overview: Write orchestrator events to existing events table (type, payload_json, occurred_at).
Goal: Provide EventsWriter.record(event) with batching-safe implementation.
Acceptance criteria:
	•	SQL adapter with parameterized inserts.
	•	Error-safe (no crash on write failure; logs error).
	•	Unit tests with test DB or sqlite mimic.
Definition of done: Event write used by major flows (assignment, conflict, reassignment).
Validation: Tests verify correct JSON shape persisted.
Approximate size: 4–7 files, <1 MB.

⸻

Task 5 — Priority Queue & Dependency Graph

Task title and number: T5: Implement in-memory priority queue with dependency guard
Overview: Respect P0>P1>P2 and block tasks with unmet deps.
Goal: TaskQueue.enqueue, dequeueEligible, requeue, peek with dependency checks.
Acceptance criteria:
	•	P0 dequeued before P1/P2.
	•	Tasks with unmet dependencies never dequeued.
	•	Unit tests: dependency chains, cycles detected.
Definition of done: Exported as TaskQueue service used by assignment engine.
Validation: Unit tests for edge cases; coverage ≥ 60% for queue module.
Approximate size: 5–8 files, <1 MB.

⸻

Task 6 — Assignment Engine (MVP)

Task title and number: T6: Implement automatic task-to-agent assignment
Overview: Match tasks to agents by capability and availability; assign multiple independent P1 tasks to Cursor.
Goal: Satisfy AC1.1–AC1.4.
Acceptance criteria:
	•	Matches by task.type/metadata to agent capabilities.
	•	Respects dependencies.
	•	Prioritizes P0, supports concurrent P1 to Cursor.
	•	Emits task_assigned event.
Definition of done: Engine integrated with queue and registry.
Validation: Unit tests simulate agents and tasks; integration test passes.
Approximate size: 6–10 files, ~2 MB.

⸻

Task 7 — Agent Heartbeat & Status Tracking

Task title and number: T7: Track agent status in real time
Overview: Maintain AgentStatus (available/busy/error/offline), last_heartbeat.
Goal: Satisfy AC4.1 basics.
Acceptance criteria:
	•	/internal/agent/heartbeat endpoint updates status.
	•	Registry exposes getStatus(name) and listStatuses().
	•	Status transitions tested.
Definition of done: Heartbeats update in memory store; basic logging.
Validation: Unit/integration tests; curl heartbeat sim.
Approximate size: 5–8 files, <1 MB.

⸻

Task 8 — Agent Failure Handling & Reassignment (≤10s)

Task title and number: T8: Implement failover/reassignment logic
Overview: On agent failure/unresponsive, reassign within 10s.
Goal: Satisfy AC4.2 and AC3.3.
Acceptance criteria:
	•	Idle-timeout configurable (default 10m); failure triggers reassignment within 10s.
	•	Emits agent_failed and task_reassigned events.
	•	Unit tests with fake clock validating timings.
Definition of done: Works in integration test with simulated agent crash.
Validation: npm run test:integration scenario.
Approximate size: 5–8 files, ~1 MB.

⸻

Task 9 — Block/Stall Detection & Escalation

Task title and number: T9: Detect blocked/stalled tasks and escalate
Overview: Identify tasks with >2h no progress; escalate to human channel.
Goal: Satisfy AC2.2–AC2.3.
Acceptance criteria:
	•	Background monitor detects in_progress with no progress signals.
	•	Sends escalation via adapter (log or webhook placeholder).
	•	Emits task_failed or escalation event; configurable thresholds.
Definition of done: Tests for stall >2h triggering escalation.
Validation: Fake timers in tests; event presence asserted.
Approximate size: 5–8 files, ~1 MB.

⸻

Task 10 — Progress Updates to ChatGPT (every 2h)

Task title and number: T10: Implement periodic progress notifier
Overview: Summarize active tasks and post update every 2 hours.
Goal: Satisfy AC2.4.
Acceptance criteria:
	•	Scheduler batches updates; dry-run adapter (stdout/webhook).
	•	Configurable cadence; default 2h.
	•	Unit tests verify schedule and payload shape.
Definition of done: Integrated with progress monitor.
Validation: Fake timers; snapshot test on payload.
Approximate size: 4–6 files, <1 MB.

⸻

Task 11 — Conflict Detection (duplicates, deps, timeouts)

Task title and number: T11: Build conflict detector module
Overview: Detect AC3.1–AC3.3 conflicts.
Goal: Raise conflicts, emit conflict_detected events.
Acceptance criteria:
	•	Duplicate task_id detection.
	•	Dependency clash detection (assigned before deps done).
	•	Agent idle-timeout surfaced as conflict too.
Definition of done: Unit tests cover all 3 conflict types.
Validation: Run tests; verify events/metrics.
Approximate size: 5–8 files, ~1 MB.

⸻

Task 12 — REST API: Task Assignment

Task title and number: T12: POST /api/orchestrator/tasks
Overview: Accepts Task + optional priority override; returns assigned agent + ETA.
Goal: Match API contract; validate with zod; include conflict-first gate validation.
Acceptance criteria:
	•	Input validation; errors return 400 with details.
	•	Conflict-first gate: git merge origin/main --no-commit before assignment.
	•	Task classification: functional vs non-functional determination.
	•	Calls assignment engine and writes event.
	•	Unit/integration tests for happy/error paths.
Definition of done: OpenAPI/Swagger doc generated; conflict gate integrated.
Validation: curl examples; tests pass; conflict detection verified.
Approximate size: 6–10 files, ~2 MB.

⸻

Task 13 — REST API: Agent Status

Task title and number: T13: GET /api/orchestrator/agents
Overview: Returns list of AgentStatus.
Goal: Match API contract.
Acceptance criteria:
	•	Endpoint returns statuses with performance_metrics.
	•	Pagination not required; basic filtering by status.
Definition of done: Tests for response schema.
Validation: curl/HTTP test.
Approximate size: 3–5 files, <0.5 MB.

⸻

Task 14 — REST API: Conflict Resolution

Task title and number: T14: POST /api/orchestrator/conflicts/resolve
Overview: Apply resolution: reassign | queue | escalate.
Goal: Match API contract.
Acceptance criteria:
	•	Validates resolution option; updates state and events.
	•	Unit tests for each resolution path.
Definition of done: Endpoint wired to detector/queue.
Validation: Tests + curl demo.
Approximate size: 4–6 files, ~1 MB.

⸻

Task 15 — Integration with Existing Priority Workflow

Task title and number: T15: Integrate P0/P1/P2 with current queues
Overview: Map legacy priority sources to orchestrator queue.
Goal: Satisfy AC5.1 and preserve quality gates.
Acceptance criteria:
	•	Adapter reading existing task source (stub if needed).
	•	Priorities preserved; P0 dominates.
Definition of done: E2E test: mixed priorities assigned correctly.
Validation: Integration test with fixtures.
Approximate size: 4–6 files, ~1 MB.

⸻

Task 16 — DoR/DoD Validation Hooks

Task title and number: T16: Enforce Definition of Ready/Done checks
Overview: Plug DoR/DoD validators pre-assign and on-complete; include task classification.
Goal: Satisfy AC5.2 & AC5.4; add functional vs non-functional classification.
Acceptance criteria:
	•	Pre-assign: reject tasks failing DoR (e.g., missing goal/AC).
	•	Task classification: determine functional vs non-functional based on keywords.
	•	Functional tasks: require testable business logic (TDD approach).
	•	Non-functional tasks: config/env/fixes (Problem Analysis approach).
	•	On complete: verify acceptance criteria list not empty; mark done.
Definition of done: Unit tests for hook outcomes; classification logic tested.
Validation: Tests with positive/negative cases; classification accuracy verified.
Approximate size: 4–6 files, ~1 MB.

⸻

Task 17 — Logging & Health

Task title and number: T17: Structured logging + /healthz + Fast CI
Overview: Add pino/winston logs; implement health endpoint; include fast CI validation.
Goal: Operational visibility, basic health probe, and 2-3 minute CI validation.
Acceptance criteria:
	•	/healthz returns 200 with build SHA & uptime.
	•	JSON logs with levels; errors include stack & context.
	•	Fast CI validation: typecheck, lint, test, build in <3 minutes.
	•	Conflict-first gate integrated into health checks.
Definition of done: Probe passes in Docker/K8s readiness; CI completes in <3 minutes.
Validation: curl, container logs; CI timing verified.
Approximate size: 3–5 files, <0.5 MB.

⸻

Task 18 — Basic Alerting & Escalation Adapter

Task title and number: T18: Alert adapter (webhook/email/Slack stub)
Overview: Centralize human escalations (blocked tasks, conflicts).
Goal: Meet Operational MVP alerting.
Acceptance criteria:
	•	AlertService.notifyCritical(event) with pluggable transport.
	•	Retry/backoff; dead-letter log on failure.
Definition of done: Unit tests; manual webhook demo.
Validation: Run local webhook receiver; assert payload.
Approximate size: 4–6 files, ~1 MB.

⸻

Task 19 — Performance Benchmarks & SLA Guard

Task title and number: T19: Benchmark scripts and <5s assignment check
Overview: npm run benchmark measuring assignment latency & throughput.
Goal: Enforce SLA: assignment < 5s.
Acceptance criteria:
	•	Script outputs p50/p95 assignment latency.
	•	Fails CI if p95 > 5s (configurable).
Definition of done: Run produces report artifact.
Validation: Execute and inspect report.
Approximate size: 3–5 files, <1 MB.

⸻

Task 20 — Load Simulation (100 req/min × 5 min)

Task title and number: T20: Implement npm run test:orchestrator:load
Overview: K6/Artillery script generating load.
Goal: Validate 100 req/min sustained for 5 minutes.
Acceptance criteria:
	•	Script parameterized; produces HTML/JSON summary.
	•	CI job optional/manual.
Definition of done: Documentation on running/reading results.
Validation: Run locally once; check summary.
Approximate size: 3–4 files, <1 MB.

⸻

Task 21 — Security Basics

Task title and number: T21: Add security scan & minimal hardening
Overview: npm run security:scan (npm audit + snyk/ossindex optional) and header hardening.
Goal: No high/critical vulns at build time.
Acceptance criteria:
	•	Script exits non-zero on high/critical.
	•	Helmet/cors configured (if HTTP).
Definition of done: CI step added.
Validation: Run scan; verify headers via curl.
Approximate size: 3–5 files, <0.5 MB.

⸻

Task 22 — Unit & Integration Test Suites

Task title and number: T22: Establish ≥60% coverage on core modules
Overview: Tests for queue, assignment, conflicts, escalation.
Goal: Meet MVP quality bar.
Acceptance criteria:
	•	Coverage report shows ≥60% lines/branches for core.
	•	Integration tests cover AI agent communication stubs.
Definition of done: CI uploads coverage artifact.
Validation: npm run test + coverage thresholds.
Approximate size: 6–12 files, ~2 MB.

⸻

Task 23 — Deployment & Rollback

Task title and number: T23: Production deployment scripts & rollback
Overview: Container build, Helm/compose, environment config.
Goal: Deploy without disrupting current development; rollback path.
Acceptance criteria:
	•	Versioned images; ENV toggles.
	•	make deploy and make rollback (or npm scripts) work.
Definition of done: Health check green post-deploy in staging.
Validation: Dry-run deploy locally; document steps.
Approximate size: 5–8 files, ~1–2 MB.

⸻

Task 24 — Setup & Troubleshooting Docs

Task title and number: T24: Author setup & runbook docs
Overview: Clear README + /docs for setup, config, troubleshooting.
Goal: Speed contributor onboarding; cover common issues.
Acceptance criteria:
	•	README with quickstart; /docs/runbook.md; /docs/troubleshooting.md.
	•	Includes validation steps from spec.
Definition of done: Docs pass a fresh setup test.
Validation: Follow docs on clean machine/container.
Approximate size: 3–5 files, <0.5 MB.

⸻

Phase 2 (Post-MVP) Tasks

Task 25 — Assignment History & Audit Trail

Task title and number: T25: Persist assignment history
Overview: Store assignment/transition history for audit.
Goal: Fulfill AC1.5.
Acceptance criteria:
	•	History table + queries; API to fetch by task_id.
	•	Events emitted for history writes.
Definition of done: Tests cover write/read.
Validation: Integration test verifies audit trail.
Approximate size: 5–8 files, ~1 MB.

⸻

Task 26 — Handle 20 Concurrent Tasks Reliably

Task title and number: T26: Concurrency tuning & backpressure
Overview: Optimize worker pools/locks to handle ≥20 concurrent tasks without degradation.
Goal: Fulfill AC2.5.
Acceptance criteria:
	•	Load test at 20+ concurrent shows stable p95 latencies.
	•	No memory bloat; RAM <512 MB.
Definition of done: Benchmark report attached.
Validation: Run load; capture metrics.
Approximate size: 3–5 files, <0.5 MB.

⸻

Task 27 — Auto-Queue Dependent Tasks on Conflict

Task title and number: T27: Advanced conflict resolution: queue deps
Overview: Automatically queues dependent tasks when conflicts found.
Goal: Fulfill AC3.4.
Acceptance criteria:
	•	Detector proposes queueing; resolver enacts.
	•	Tests: conflicting pair becomes queued correctly.
Definition of done: Event recorded; state reflects queue.
Validation: Unit/integration tests.
Approximate size: 4–6 files, ~1 MB.

⸻

Task 28 — Human Escalation within 5 Minutes

Task title and number: T28: Time-bound escalation guarantee
Overview: Ensure unresolvable conflicts escalate ≤5 minutes.
Goal: Fulfill AC3.5.
Acceptance criteria:
	•	Scheduler ensures escalation deadlines; metrics emitted.
	•	Tests with fake timers ensure ≤5m.
Definition of done: Alert payload includes context & remediation tips.
Validation: Tests + manual webhook check.
Approximate size: 3–5 files, <0.5 MB.

⸻

Task 29 — Workload Balancing

Task title and number: T29: Implement basic balancing strategy
Overview: Distribute load to avoid overloading any agent.
Goal: Fulfill AC4.3.
Acceptance criteria:
	•	Balancer strategy (e.g., least-busy, weighted by capability).
	•	Metrics show improved distribution in benchmark.
Definition of done: Configurable policy.
Validation: Simulated tasks across agents; verify balance.
Approximate size: 4–6 files, ~1 MB.

⸻

Task 30 — Agent Performance Metrics & Optimization

Task title and number: T30: Track per-agent performance metrics
Overview: Populate performance_metrics and use in assignment heuristics.
Goal: Fulfill AC4.4.
Acceptance criteria:
	•	Rolling averages for completion time, error rate.
	•	Assignment engine can weigh metrics.
Definition of done: Unit tests for metric calc.
Validation: Replay fixtures; verify metrics feed decisions.
Approximate size: 4–6 files, ~1 MB.

⸻

Task 31 — Dynamic Agent Registry (DB-backed)

Task title and number: T31: Replace YAML with DB registry
Overview: CRUD for agents; hot add/remove without downtime.
Goal: Fulfill AC4.5 + Phase 2 item.
Acceptance criteria:
	•	Migration scripts; REST endpoints for agents.
	•	Zero-downtime swap from YAML to DB.
Definition of done: Blue/green flip tested in staging.
Validation: Integration tests + manual add/remove demo.
Approximate size: 6–10 files, ~2 MB.

⸻

Task 32 — Monitoring Dashboards & Alerts

Task title and number: T32: Add dashboards (Grafana/Prom) and alert rules
Overview: Comprehensive metrics + alerting for SLOs.
Goal: Phase 2 monitoring completeness.
Acceptance criteria:
	•	Dashboards: assignment latency, queue depth, errors, escalations.
	•	Alerts for p95, failure spikes, missed heartbeats.
Definition of done: Dashboards exported to repo.
Validation: Screenshots/configs reviewed.
Approximate size: 4–6 files, ~1 MB.

⸻

Task 33 — Backup & Recovery Procedures

Task title and number: T33: Define/automate backups and recovery runbooks
Overview: Back up event store, registry, configs; restore scripts.
Goal: Meet Phase 2 operational resilience.
Acceptance criteria:
	•	Scheduled backups; test restore in staging.
	•	Runbook documents RPO/RTO assumptions.
Definition of done: Successful restore drill.
Validation: Execute restore script; verify integrity.
Approximate size: 3–5 files, ~1 MB.

⸻

How Cursor will validate the overall Definition of Done (from the spec)
	•	Add CI jobs to run:
	•	npm run test:orchestrator
	•	npm run test:integration
	•	npm run test:orchestrator:load
	•	npm run benchmark
	•	npm run security:scan
	•	Provide a scripts/validate-dod.sh that chains the above and fails if any step violates SLAs or acceptance criteria.

If you want, I can drop these tasks into a Canvas doc or split them into GitHub issues with labels (MVP vs Phase 2).

⸻

## Workflow Optimizations Applied

### 100x Workflow Integration
- **Conflict-First Gate**: All tasks now include `git merge origin/main --no-commit` validation
- **Task Classification**: Functional vs non-functional task determination
- **Fast CI**: 2-3 minute maximum CI validation with essential checks only
- **Velocity Targets**: >5 commits/day, >3 deployments/day, <1 hour lead time

### Trunk-Based Development
- **Direct Commits**: All development happens on main branch
- **Feature Flags**: Safe rollouts for incomplete work
- **Emergency Rollback**: <5 minute rollback procedures
- **Quality Gates**: Pre-commit, pre-deploy, post-deploy validation

### Hybrid Architecture
- **Separate Repository**: MCP Orchestrator in dedicated repo
- **MCP Client Integration**: Dental project communicates via HTTP client
- **Task Templates**: Pre-defined ServiceBoost MVP task definitions
- **Retrospectives**: Every 3 tasks for continuous improvement

### TDD Methodology
- **Red Phase**: Write failing tests first
- **Green Phase**: Minimal code to pass tests
- **Refactor Phase**: Improve code while keeping tests passing
- **Quality Assurance**: Comprehensive test coverage >80%

### Continuous Delivery
- **Streamlined Ceremonies**: Removed sprint planning, daily standups
- **Retrospectives Every 3 Tasks**: Cursor, Codex, ChatGPT participate
- **Process Optimization**: Continuous improvement based on real data
- **Agent Coordination**: Parallel execution with conflict prevention

---

## Task 2.5: Deterministic Parallel Streams (MVP-Focused)

**Task Title**: T2.5: Deterministic Parallel Streams (20-concurrency, SLA-safe)

**Overview**: Implement a deterministic, capability-aware scheduler and worker pool supporting ≥20 concurrent tasks with P0-first assignment, dependency blocking, and failover ≤10s, while keeping orchestrator RAM <512 MB.

**Goal**: Meet MVP ACs and Performance Validation without Phase-2 bloat. Focus on measurable, testable features that deliver immediate value.

**Acceptance Criteria** (must all pass):
- ✅ **Concurrency**: Handle 20 concurrent tasks with p95 assignment <5s at 100 req/min (5 min)
- ✅ **Priority & Capability**: P0 always precedes P1/P2; tasks routed to agents meeting required capability
- ✅ **Dependencies**: Block until all deps completed; no premature assignment
- ✅ **Multi-assign to Cursor**: ≥2 independent P1 tasks assigned in parallel to Cursor when available
- ✅ **Failover**: Agent unresponsive ≥10m → reassigned ≤10s
- ✅ **Memory**: Orchestrator RSS <512 MB during load test
- ✅ **Events**: Emit task_assigned, task_reassigned, conflict_detected, agent_failed using existing schema
- ✅ **Progress**: Summaries emitted every 2h with active/blocked counts

**Definition of Done**:
- **npm run test:orchestrator & npm run test:integration** pass, coverage ≥60% core
- **npm run test:orchestrator:load** meets p95 and no drops
- **npm run benchmark** logs memory and latency under thresholds
- **/healthz 200; /metrics** exposes required series
- **Runbook updated; config documented**

**How cursor validates DoD**: Run scripts/validate-dod.sh; fail on any threshold breach

**Technical Implementation**:

### Core Architecture (MVP-Focused)
```typescript
interface ParallelStreamConfig {
  maxConcurrentTasks: 20; // SLA requirement
  maxQueueDepth: 1000;    // Backpressure limit
  assignmentTimeout: 5000; // 5s p95 target
  memoryLimit: 512;       // MB orchestrator RAM limit
  heartbeatTimeout: 600;  // 10m agent timeout
  progressInterval: 7200; // 2h progress updates
}

interface DeterministicScheduler {
  taskQueue: PriorityQueue<Task>;
  agentPool: Map<string, Agent>;
  capabilityMatrix: CapabilityMatrix;
  dependencyTracker: DependencyTracker;
  conflictDetector: ConflictDetector;
  eventEmitter: EventEmitter;
}

// Weights: priority 0.5, capability 0.3, load 0.15, fairness 0.05 (configurable)
interface AssignmentScore {
  priorityRank: number;    // 0.5 weight
  capabilityMatch: number; // 0.3 weight  
  currentLoad: number;     // 0.15 weight
  fairnessBoost: number;   // 0.05 weight
  total: number;
}
```

### MVP Features (Deterministic & Testable)

#### 1. Deterministic Capability Matrix
```typescript
interface CapabilityMatrix {
  [agentId: string]: string[];
}

interface TaskCapability {
  required: string[];
  preferred: string[];
  priority: 0 | 1 | 2; // P0, P1, P2
  dependencies: string[]; // Task IDs
}

// Deterministic scoring (no AI/ML in MVP)
class DeterministicScheduler {
  calculateAssignmentScore(agent: Agent, task: Task): number {
    const priorityRank = this.getPriorityRank(task.priority);
    const capabilityMatch = this.calculateCapabilityMatch(agent, task);
    const currentLoad = agent.currentLoad;
    const fairnessBoost = this.calculateFairnessBoost(agent);
    
    // Weights: priority 0.5, capability 0.3, load 0.15, fairness 0.05
    return (priorityRank * 0.5) + 
           (capabilityMatch * 0.3) + 
           ((1 - currentLoad) * 0.15) + 
           (fairnessBoost * 0.05);
  }
}
```

#### 2. Deterministic Conflict Resolution
```typescript
class DeterministicConflictResolver {
  async resolveConflict(conflict: Conflict): Promise<Resolution> {
    // Deterministic strategies only
    if (conflict.type === 'file_edit') {
      return this.resolveFileEditConflict(conflict);
    }
    
    if (conflict.type === 'dependency') {
      return this.resolveDependencyConflict(conflict);
    }
    
    // Escalate everything else
    return { action: 'escalate', reason: 'Unresolvable conflict' };
  }
  
  private resolveFileEditConflict(conflict: Conflict): Resolution {
    if (conflict.isDifferentFiles) {
      return { action: 'allow_both', confidence: 0.95 };
    }
    
    if (conflict.isDifferentLines) {
      // Try git 3-way merge
      const mergeResult = this.performGitMerge(conflict);
      if (mergeResult.success) {
        return { action: 'merge', result: mergeResult, confidence: 0.85 };
      }
    }
    
    // Same line or merge failed - escalate
    return { action: 'escalate', reason: 'Same line conflict or merge failed' };
  }
}
```

#### 3. Memory & Performance Guards
```typescript
class PerformanceGuards {
  private memoryLimit = 512; // MB
  private maxQueueDepth = 1000;
  
  checkMemoryLimit(): boolean {
    const currentMemory = process.memoryUsage().rss / 1024 / 1024;
    return currentMemory < this.memoryLimit;
  }
  
  checkQueueDepth(queue: Task[]): boolean {
    return queue.length < this.maxQueueDepth;
  }
  
  // Circuit breaker for agent adapters
  async callAgentWithCircuitBreaker(agent: Agent, task: Task): Promise<Response> {
    if (this.circuitBreaker.isOpen(agent.id)) {
      throw new Error(`Circuit breaker open for agent ${agent.id}`);
    }
    
    try {
      const response = await this.callAgent(agent, task);
      this.circuitBreaker.recordSuccess(agent.id);
      return response;
    } catch (error) {
      this.circuitBreaker.recordFailure(agent.id);
      throw error;
    }
  }
}
```

#### 4. Prometheus Metrics (MVP Monitoring)
```typescript
interface PrometheusMetrics {
  // Core metrics
  assignment_latency_ms_bucket: number[];
  queue_depth: number;
  active_tasks: number;
  agent_heartbeat_age_seconds: number;
  reassignments_total: number;
  conflicts_total: number;
  
  // Memory metrics
  orchestrator_memory_usage_mb: number;
  orchestrator_memory_limit_mb: number;
  
  // Performance metrics
  task_completion_rate: number;
  p95_assignment_latency_ms: number;
  error_rate: number;
}

class MetricsCollector {
  async collectMetrics(): Promise<PrometheusMetrics> {
    return {
      assignment_latency_ms_bucket: this.getLatencyBuckets(),
      queue_depth: this.taskQueue.length,
      active_tasks: this.activeTasks.size,
      agent_heartbeat_age_seconds: this.getHeartbeatAges(),
      reassignments_total: this.reassignmentCount,
      conflicts_total: this.conflictCount,
      orchestrator_memory_usage_mb: process.memoryUsage().rss / 1024 / 1024,
      orchestrator_memory_limit_mb: 512,
      task_completion_rate: this.calculateCompletionRate(),
      p95_assignment_latency_ms: this.calculateP95Latency(),
      error_rate: this.calculateErrorRate()
    };
  }
}
```

#### 5. Event Schema Compliance
```typescript
interface OrchestratorEvent {
  id: string;
  type: 'task_assigned' | 'task_reassigned' | 'conflict_detected' | 'agent_failed';
  timestamp: Date;
  taskId?: string;
  agentId?: string;
  conflictType?: string;
  resolution?: string;
  metadata: Record<string, any>;
}

class EventEmitter {
  emitTaskAssigned(taskId: string, agentId: string): void {
    this.emit({
      id: generateId(),
      type: 'task_assigned',
      timestamp: new Date(),
      taskId,
      agentId,
      metadata: { priority: this.getTaskPriority(taskId) }
    });
  }
  
  emitConflictDetected(conflict: Conflict): void {
    this.emit({
      id: generateId(),
      type: 'conflict_detected',
      timestamp: new Date(),
      conflictType: conflict.type,
      metadata: { 
        files: conflict.files,
        agents: conflict.agents,
        severity: conflict.severity
      }
    });
  }
}
```

### Quality Gates & Safety (MVP-Focused)

#### Pre-Execution Validation
- **Memory Check**: Verify orchestrator RAM <512 MB limit
- **Queue Depth Check**: Ensure queue depth <1000 (backpressure)
- **Agent Availability**: Verify at least one agent available
- **Dependency Check**: Ensure all task dependencies are met

#### During Execution Monitoring
- **Memory Monitoring**: Track orchestrator RAM usage in real-time
- **Assignment Latency**: Monitor p95 assignment time <5s
- **Agent Heartbeats**: Track agent health every 10 minutes
- **Conflict Detection**: Detect and resolve conflicts deterministically

#### Post-Execution Analysis
- **Performance Metrics**: Calculate p95 latency, success rate, error rate
- **Memory Analysis**: Verify peak memory usage <512 MB
- **Event Audit**: Review all emitted events for completeness
- **Load Test Results**: Validate 20 concurrent tasks without degradation

### Test Fixtures & Validation

#### Synthetic Workloads
```typescript
const TEST_WORKLOADS = {
  // Mix: 40% P0, 40% P1, 20% P2
  priorityMix: {
    p0Tasks: 8,  // 40% of 20
    p1Tasks: 8,  // 40% of 20  
    p2Tasks: 4,  // 20% of 20
    totalTasks: 20
  },
  
  // Dependency chains: 1-3 levels deep
  dependencyChains: {
    chain1: ['task-1', 'task-2', 'task-3'],
    chain2: ['task-4', 'task-5'],
    chain3: ['task-6']
  },
  
  // Hot-file conflicts: 5-10% rate
  conflictRate: 0.08, // 8% of tasks
  hotFiles: ['src/core/taskManager.ts', 'src/api/orchestrator.ts']
};
```

#### Load Testing Scripts
```bash
# scripts/validate-dod.sh
#!/bin/bash
set -e

echo "Running orchestrator validation..."

# Unit tests
npm run test:orchestrator
if [ $? -ne 0 ]; then
  echo "❌ Unit tests failed"
  exit 1
fi

# Integration tests  
npm run test:integration
if [ $? -ne 0 ]; then
  echo "❌ Integration tests failed"
  exit 1
fi

# Load tests
npm run test:orchestrator:load
if [ $? -ne 0 ]; then
  echo "❌ Load tests failed"
  exit 1
fi

# Benchmark tests
npm run benchmark
if [ $? -ne 0 ]; then
  echo "❌ Benchmark tests failed"
  exit 1
fi

# Health check
curl -f http://localhost:3000/healthz || {
  echo "❌ Health check failed"
  exit 1
}

# Metrics check
curl -f http://localhost:3000/metrics || {
  echo "❌ Metrics endpoint failed"
  exit 1
}

echo "✅ All validation checks passed"
```

### Operational Procedures (MVP)

#### Startup Sequence
1. **Initialize Scheduler**: Start deterministic scheduler
2. **Register Agents**: Register available agents with capabilities
3. **Load Configuration**: Load parallel stream config
4. **Start Monitoring**: Begin memory and performance monitoring
5. **Health Check**: Verify /healthz endpoint responds

#### Runtime Operations
1. **Task Assignment**: P0-first, capability-based assignment
2. **Conflict Resolution**: Deterministic conflict resolution
3. **Agent Health**: Monitor heartbeats, reassign on failure
4. **Memory Guards**: Enforce 512 MB limit with circuit breakers
5. **Event Emission**: Emit all state changes as events

#### Shutdown Sequence
1. **Graceful Drain**: Complete active tasks, stop accepting new ones
2. **Agent Cleanup**: Notify agents of shutdown
3. **State Persistence**: Save current state for recovery
4. **Resource Cleanup**: Release memory and connections
5. **Final Metrics**: Emit final performance metrics

**Approximate Size**: ~8-12 files, ~2-3 MB
**Complexity**: Medium - Deterministic parallel execution system
**Dependencies**: Task 2 (Shared Types), Task 3 (Graph State Management)
**Timeline**: 2-3 days for full implementation and testing