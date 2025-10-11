# MCP Orchestrator Specification

## Overview
The MCP (Model Context Protocol) Orchestrator is a **sequential agent handoff coordinator** that eliminates copy-paste between ChatGPT → Cursor → Codex → GitHub by using a file-based workflow system. This MVP focuses on solving the primary pain point: manual task handoffs and context loss between agents.

## MVP Goal
Create a simple file-based coordination system that preserves context and eliminates copy-paste between agents, reducing human coordination overhead by 70% while keeping implementation simple and reliable.

## Post-MVP Goal
Evolve into a full parallel execution system with automatic task distribution, conflict resolution, and real-time monitoring for enterprise-scale coordination.

## MVP Acceptance Criteria (Sequential Agent Handoff)

### AC1: Task Definition & Handoff
- **AC1.1** (MVP): File-based task creation system (`.mcp/tasks/pending/`)
- **AC1.2** (MVP): ChatGPT can flesh out task definitions with DoR/DoD
- **AC1.3** (MVP): Cursor can claim and work on tasks from ready queue
- **AC1.4** (MVP): Codex/ChatGPT can review completed tasks and provide feedback
- **AC1.5** (MVP): Context preserved throughout entire handoff chain

### AC2: Progress Tracking
- **AC2.1** (MVP): File-based status tracking (pending → ready → in-progress → review → done)
- **AC2.2** (MVP): Clear next action for each agent (what to work on next)
- **AC2.3** (MVP): Automatic status updates via pre-commit hooks
- **AC2.4** (MVP): Simple CLI commands to check status (`npm run mcp:status`)

### AC3: Error Handling & Feedback Loop
- **AC3.1** (MVP): Failed tests automatically create feedback files
- **AC3.2** (MVP): Review feedback flows back to implementer
- **AC3.3** (MVP): Clear error context and debugging information preserved
- **AC3.4** (MVP): Manual escalation path for complex issues

### AC4: Agent Coordination (Sequential)
- **AC4.1** (MVP): One agent works at a time (no conflicts)
- **AC4.2** (MVP): Clear handoff points between agents
- **AC4.3** (MVP): Agent knows what to do next without human intervention
- **AC4.4** (MVP): No copy-paste between agents

### AC5: Integration with Existing Workflow
- **AC5.1** (MVP): Works with existing TDD workflow
- **AC5.2** (MVP): Integrates with git pre-commit hooks
- **AC5.3** (MVP): Preserves all existing quality gates
- **AC5.4** (MVP): No disruption to current development process

## Post-MVP Acceptance Criteria (Parallel Execution System)

### AC1: Task Assignment Automation (Post-MVP)
- **AC1.1** (Post-MVP): System automatically assigns tasks to available AI agents based on task type and agent capabilities
- **AC1.2** (Post-MVP): System respects task dependencies and prevents assignment of blocked tasks
- **AC1.3** (Post-MVP): System prioritizes P0 tasks over P1/P2 tasks in assignment queue
- **AC1.4** (Post-MVP): System can assign multiple independent P1 tasks to cursor simultaneously
- **AC1.5** (Post-MVP): System maintains task assignment history and can provide audit trail

### AC2: Advanced Progress Monitoring (Post-MVP)
- **AC2.1** (Post-MVP): System tracks progress of all active tasks in real-time
- **AC2.2** (Post-MVP): System detects when tasks are blocked or stalled (>2 hours without progress)
- **AC2.3** (Post-MVP): System automatically escalates blocked tasks to human when needed
- **AC2.4** (Post-MVP): System provides progress updates every 2 hours to ChatGPT
- **AC2.5** (Post-MVP): System can handle up to 20 concurrent tasks without performance degradation

### AC3: Conflict Detection and Resolution (Post-MVP)
- **AC3.1** (Post-MVP): System detects duplicate tasks (same task_id assigned twice)
- **AC3.2** (Post-MVP): System detects dependency clashes (task assigned before dependency completed)
- **AC3.3** (Post-MVP): System detects agent idle-timeout (agent unresponsive >10 minutes)
- **AC3.4** (Post-MVP): System automatically queues dependent tasks when conflicts are detected
- **AC3.5** (Post-MVP): System escalates unresolvable conflicts to human within 5 minutes

### AC4: Advanced Agent Coordination (Post-MVP)
- **AC4.1** (Post-MVP): System maintains real-time status of all AI agents (available, busy, error)
- **AC4.2** (Post-MVP): System can handle agent failures and reassign tasks automatically within 10 seconds
- **AC4.3** (Post-MVP): System provides agent workload balancing (no single agent overloaded)
- **AC4.4** (Post-MVP): System maintains agent performance metrics and optimization
- **AC4.5** (Post-MVP): System can add/remove agents dynamically without downtime

### AC5: Enterprise Integration (Post-MVP)
- **AC5.1** (Post-MVP): System integrates with existing task queue (P0/P1/P2 priority system)
- **AC5.2** (Post-MVP): System works with existing DoR/DoD validation processes
- **AC5.3** (Post-MVP): System maintains compatibility with current PR review workflow
- **AC5.4** (Post-MVP): System preserves all existing quality gates and validation rules
- **AC5.5** (Post-MVP): System can be deployed without disrupting current development

## Definition of Done

### MVP Technical Requirements (Sequential Agent Handoff)
- ✅ **File-based task system** (`.mcp/tasks/` directory structure)
- ✅ **Task handoff scripts** for each agent (create, claim, review, complete)
- ✅ **Status tracking** via file system (pending → ready → in-progress → review → done)
- ✅ **Pre-commit hooks** for automatic status updates
- ✅ **CLI commands** for status checking and task management
- ✅ **Context preservation** throughout handoff chain
- ✅ **Error feedback loop** (failed tests → feedback files → back to implementer)
- ✅ **Simple logging** for debugging handoff issues

### MVP Quality Requirements
- ✅ **File system tests** covering handoff logic
- ✅ **CLI command tests** for all task management operations
- ✅ **Pre-commit hook tests** for automatic status updates
- ✅ **Error handling** for file system operations
- ✅ **Documentation** for agent handoff workflow
- ✅ **Setup guide** for new agents

### MVP Operational Requirements
- ✅ **No external dependencies** (file system only)
- ✅ **Git integration** via pre-commit hooks
- ✅ **Simple status checking** via CLI commands
- ✅ **Manual escalation** for complex issues

### Post-MVP Technical Requirements (Parallel Execution System)
- ✅ **Core orchestrator service** deployed and running
- ✅ **Task assignment engine** working with all AI agents
- ✅ **Progress monitoring system** tracking all active tasks
- ✅ **Conflict detection algorithm** identifying duplicate tasks, dependency clashes, and agent timeouts
- ✅ **Agent coordination layer** managing AI agent communication
- ✅ **Integration layer** connecting to existing workflow systems
- ✅ **API endpoints** for human override and monitoring
- ✅ **Events table integration** using existing schema (type, payload_json, occurred_at)
- ✅ **Static agent configuration** (agents.yaml) mapping capabilities to tasks
- ✅ **Advanced logging** for system health and debugging

### Post-MVP Quality Requirements
- ✅ **Unit tests** covering core functionality (>60% coverage)
- ✅ **Integration tests** validating AI agent communication
- ✅ **Load simulation script** (npm run test:orchestrator:load) - 100 req/min for 5 min
- ✅ **Error handling** for agent failures and task reassignment
- ✅ **Performance benchmarks** meeting SLA requirements (<5s assignment)
- ✅ **Security** for agent communication channels
- ✅ **Comprehensive documentation** for configuration and troubleshooting

### Post-MVP Operational Requirements
- ✅ **Production deployment** for enterprise environment
- ✅ **Health check endpoint** (/healthz) for system monitoring
- ✅ **Advanced alerting** for critical failures
- ✅ **Rollback capability** for emergency situations
- ✅ **Database-backed agent registry** (replacing static YAML)
- ✅ **Advanced workload balancing** and performance optimization
- ✅ **Comprehensive monitoring dashboards** and alerting
- ✅ **Backup and recovery** procedures
- ✅ **Advanced conflict resolution** and automatic queuing

## How We Validate Definition of Done

### MVP Validation (Sequential Agent Handoff)

#### Automated Validation
1. **File System Tests**: Run `npm run test:mcp` - all handoff logic tests pass
2. **CLI Command Tests**: Run `npm run test:mcp:cli` - all task management commands work
3. **Pre-commit Hook Tests**: Run `npm run test:mcp:hooks` - automatic status updates work
4. **Error Handling Tests**: Run `npm run test:mcp:errors` - feedback loop works correctly

#### Manual Validation
1. **Task Handoff Test**: 
   - Create task stub in pending/
   - ChatGPT fleshes out in ready/
   - Cursor claims and works on task
   - Codex reviews and provides feedback
   - Verify context preserved throughout

2. **Error Feedback Test**:
   - Create task with failing tests
   - Verify error feedback file created
   - Verify task moves back to ready/ with feedback
   - Verify implementer can see error context

3. **Status Tracking Test**:
   - Run `npm run mcp:status` shows correct task states
   - Verify pre-commit hook updates status
   - Verify CLI commands work for all agents

4. **Context Preservation Test**:
   - Create complex task with multiple handoffs
   - Verify all context (task definition, code, feedback, errors) preserved
   - Verify no copy-paste needed between agents

### Post-MVP Validation (Parallel Execution System)

#### Automated Validation
1. **Unit Test Suite**: Run `npm run test:orchestrator` - all tests must pass
2. **Integration Test Suite**: Run `npm run test:integration` - all AI agent communication tests pass
3. **Load Simulation Script**: Run `npm run test:orchestrator:load` - 100 req/min for 5 min, validate <5s assignment
4. **Performance Benchmarks**: Run `npm run benchmark` - all SLA requirements met
5. **Security Scan**: Run `npm run security:scan` - no vulnerabilities detected

#### Manual Validation
1. **Task Assignment Test**: 
   - Create 5 test tasks with different priorities
   - Verify system assigns P0 tasks first
   - Verify system assigns multiple P1 tasks to cursor
   - Verify system respects dependencies

2. **Progress Monitoring Test**:
   - Start 3 long-running tasks
   - Verify progress updates every 2 hours
   - Simulate task blocking and verify escalation
   - Verify human notification within 5 minutes

3. **Conflict Detection Test**:
   - Create tasks that modify same files
   - Verify system detects conflict
   - Verify system queues dependent tasks
   - Verify system escalates to human

4. **Agent Coordination Test**:
   - Simulate agent failure
   - Verify task reassignment
   - Verify workload balancing
   - Verify system recovery

#### Performance Validation (Post-MVP)
1. **Response Time**: Task assignment < 5 seconds
2. **Throughput**: Handle 20+ concurrent tasks
3. **Availability**: 99.9% uptime during business hours
4. **Scalability**: Support 100+ tasks per day
5. **Memory Usage**: < 512MB RAM under normal load

#### Integration Validation
1. **Existing Workflow**: All current processes continue working
2. **Quality Gates**: All existing validation rules preserved
3. **PR Workflow**: Review process unchanged
4. **Deployment**: No disruption to current development
5. **Rollback**: Can revert to previous system if needed

## Shared Data Schema and Contracts

### MVP Schema (File-Based Sequential Handoff)

#### Task File Schema (Markdown)
```markdown
# Task: [Task ID] - [Title]

## Status: [pending|ready|in-progress|review|done|failed]

## Priority: [P0|P1|P2]

## Agent: [cursor|codex|chatgpt|unassigned]

## Created: [timestamp]
## Last Updated: [timestamp]

## Goal
[Clear description of what needs to be done]

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Definition of Ready
- [ ] Prerequisites met
- [ ] Context provided
- [ ] Files identified

## Definition of Done
- [ ] All tests pass
- [ ] Code reviewed
- [ ] Documentation updated

## Files Affected
- src/path/to/file.ts
- tests/path/to/test.ts

## Implementation Notes
[Any specific implementation guidance]

## Review Feedback
[Feedback from Codex/ChatGPT goes here]

## Error Context
[Test failures, debugging info, error messages]

## Git Context
- Branch: [branch-name]
- Commit: [commit-hash]
- PR: [pr-number]
```

#### CLI Command Schema
```typescript
// Task Management Commands
interface MCPCommands {
  create: (title: string) => string; // Returns task ID
  prep: (taskId: string) => void; // ChatGPT fleshes out task
  claim: (taskId: string) => void; // Cursor claims task
  review: (taskId: string) => void; // Request review
  complete: (taskId: string) => void; // Mark complete
  status: () => TaskSummary[]; // Show all tasks
  next: () => Task | null; // Get next task for agent
}
```

### Post-MVP Schema (Parallel Execution System)

#### Task Schema
```typescript
interface Task {
  id: string;
  type: 'P0' | 'P1' | 'P2';
  priority: number;
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'failed' | 'blocked';
  assigned_agent: 'cursor' | 'codex' | 'chatgpt' | null;
  dependencies: string[]; // Array of task IDs
  created_at: string;
  assigned_at: string | null;
  completed_at: string | null;
  metadata: {
    goal: string;
    acceptance_criteria: string[];
    estimated_duration: number; // minutes
    risk_level: 'critical' | 'standard' | 'experimental';
  };
}
```

#### Agent Status Schema
```typescript
interface AgentStatus {
  name: 'cursor' | 'codex' | 'chatgpt';
  status: 'available' | 'busy' | 'error' | 'offline';
  current_tasks: string[]; // Array of task IDs
  capabilities: string[]; // e.g., ['backend', 'frontend', 'review']
  last_heartbeat: string;
  performance_metrics: {
    tasks_completed: number;
    average_completion_time: number; // minutes
    error_rate: number;
  };
}
```

#### Event Schema (using existing events table)
```typescript
interface OrchestratorEvent {
  type: 'task_assigned' | 'task_completed' | 'task_failed' | 'conflict_detected' | 'agent_failed' | 'task_reassigned';
  practice_id: string; // Use 'system' for orchestrator events
  actor: 'orchestrator';
  payload_json: {
    task_id: string;
    agent_name?: string;
    conflict_type?: string;
    error_message?: string;
    reassignment_reason?: string;
  };
  occurred_at: string;
}
```

#### API Contracts
```typescript
// Task Assignment API
POST /api/orchestrator/tasks
{
  "task": Task,
  "priority_override"?: number
}
Response: { "assigned_agent": string, "estimated_completion": string }

// Agent Status API
GET /api/orchestrator/agents
Response: { "agents": AgentStatus[] }

// Conflict Resolution API
POST /api/orchestrator/conflicts/resolve
{
  "conflict_id": string,
  "resolution": "reassign" | "queue" | "escalate"
}
Response: { "resolution_applied": boolean }
```

## Success Metrics

### MVP Success Metrics (Sequential Handoff)
- **Handoff Time**: < 30 seconds between agents
- **Context Preservation**: 100% of task context maintained through handoffs
- **Copy-Paste Elimination**: 0 manual copy-paste operations
- **Error Resolution**: Failed tests automatically create feedback files
- **Agent Clarity**: Each agent knows exactly what to do next
- **File System Reliability**: 99.9% file operation success rate

### Post-MVP Success Metrics (Parallel Execution)
- **Task Assignment Time**: < 5 seconds average
- **Human Intervention**: < 10% of tasks require human input
- **Parallel Execution**: 3x increase in concurrent task processing
- **Error Rate**: < 1% task assignment failures
- **System Uptime**: > 99.9% availability
- **Agent Utilization**: > 80% average across all agents
