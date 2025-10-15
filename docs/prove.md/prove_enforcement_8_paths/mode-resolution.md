# Mode Resolution Strategy

## Overview

The Prove Quality Gates system uses a priority-based approach to determine delivery mode (functional vs non-functional) for any given task. The `tasks/TASK.json` file serves as the canonical artifact, updated automatically by orchestrators per task.

## Priority Chain

Mode resolution follows this priority order (highest to lowest):

1. **`PROVE_MODE` Environment Variable** (fast-path for orchestrators)
   - `PROVE_MODE=functional` or `PROVE_MODE=non-functional`
   - Used by orchestrators to bypass file I/O when possible

2. **`tasks/TASK.json`** (canonical artifact)
   - Updated automatically by orchestrators per task
   - Committed alongside code changes for audit trail
   - Contains metadata: `mode`, `updatedAt`, `source`, `note`

3. **PR Labels** (fallback for manual PRs)
   - `mode:functional` or `mode:non-functional`
   - Applied during PR creation/review

4. **PR Title Tags** (fallback for manual PRs)
   - `[MODE:F]` or `[MODE:NF]` in PR title
   - Quick way to specify mode without labels

5. **Default** (safety net)
   - Falls back to `functional` if no mode is found
   - Ensures system never fails due to missing mode

## Orchestrator Workflow

When an orchestrator (Cursor, MCP, Windsurf, etc.) receives a task:

1. **Extract mode** from task prompt/brief
2. **Update `tasks/TASK.json`** with:
   ```json
   {
     "mode": "functional|non-functional",
     "updatedAt": "2025-01-18T12:00:00Z",
     "source": "orchestrator",
     "note": "Mode extracted from task prompt: [brief description]"
   }
   ```
3. **Proceed with work** following the specified mode
4. **Commit both code changes AND updated TASK.json**

## Benefits

- **Deterministic**: Mode is captured in version control
- **Auditable**: Full history of mode decisions per task
- **Replayable**: Humans/CI can run `npm run prove` without orchestration context
- **Flexible**: Supports both automated and manual workflows
- **Robust**: Multiple fallback mechanisms prevent system failures

## Implementation Notes

- `tasks/TASK.json` is treated as **disposable per task** - overwritten on each handoff
- File updates are **atomic** - single `JSON.stringify()` operation
- **No manual checks required** - orchestrators handle updates automatically
- **CI-friendly** - works in isolation without agent metadata

## Example Usage

```bash
# Orchestrator sets mode via env var (fast-path)
PROVE_MODE=functional npm run prove

# Or relies on tasks/TASK.json (canonical)
npm run prove

# Both approaches work identically
```
