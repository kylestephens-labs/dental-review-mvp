# Prove Quality Gates

This document explains how to implement the end-to-end `prove` workflow so every AI assistant (Cursor, Windsurf, MCP agents, local scripts, etc.) has to pass the exact same quality gates before code is considered deliverable. Treat this as the contract: **no green `npm run prove`, no ship.**

## Core Principles
- **Single source of truth** – One CLI (`npm run prove`) orchestrates all checks. Local runs, CI, and LLM agents call the same entry point.
- **Objective signals** – Never trust narration from an assistant. Trust the verifier logs that the CLI emits.
- **Mode-aware enforcement** – Functional tasks must follow Red → Green → Refactor with diff-aware coverage; non-functional tasks must attach problem analysis.
- **Trunk discipline built-in** – The CLI refuses to run on non-main branches and fails if a dry-merge with `origin/main` would conflict.

## Repository Integration

### 1. Package Script
Add the script to `package.json`:
```json
{
  "scripts": {
    "prove": "tsx tools/prove/cli.ts"
  }
}
```

### 2. File Layout
```
tools/prove/
  cli.ts             # entry point: builds context, runs checks, exits 0/1
  config.ts          # zod-backed config (thresholds, toggles, paths)
  context.ts         # gathers git diff, mode, env, logger once
  logger.ts          # structured logs (CI friendly)
  runner.ts          # orchestrates checks (serial + parallel groups)
  checks/
    envCheck.ts
    trunk.ts
    preConflict.ts
    typecheck.ts
    lint.ts
    tests.ts
    coverage.ts
    diffCoverage.ts
    buildWeb.ts
    buildApi.ts       # stub until backend build exists
    sizeBudget.ts     # optional
    deliveryMode.ts   # functional vs non-functional enforcement
    tddChangedHasTests.ts
  utils/
    exec.ts           # wraps child_process, captures logs + exit codes
    git.ts            # base ref resolution, changed files, diff stats
    fsx.ts            # tiny fs helpers
prove.config.ts       # central thresholds/toggles
```

Reuse existing scripts where possible:
- `src/env-check.ts` → call directly inside `envCheck.ts`.
- `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build` → shell out via `exec.ts`.
- If you add coverage or size tooling later, wire them in through additional checks.

### 3. Shared Context Pattern
`context.ts` runs once at start:
```ts
const cfg = loadConfig();
const git = await getGitContext(cfg.git.baseRefFallback); // base ref + changed files
const mode = resolveDeliveryMode({ git, cfg });           // TASK.json, branch, labels
return { cfg, git, mode, env: process.env, isCI: !!process.env.CI, log };
```
Every check receives the same context, so we never recompute diffs or config.

### 4. Runner Orchestration
- Run critical checks serially: `trunk`, `delivery-mode`, `commit-msg-convention`, `killswitch-required`, `pre-conflict` (full mode only).
- Parallelise safe checks with [p-limit](https://www.npmjs.com/package/p-limit) to keep runtimes low.
- Add mode-specific checks for functional tasks: `tdd-changed-has-tests`, `diff-coverage`.
- Add optional checks based on configuration: `coverage`, `build-web`, `build-api`, `size-budget`.
- Exit on first failure; print reason + details; exit code 1 for CI.

```ts
const critical = ["trunk", "delivery-mode", "commit-msg-convention", "killswitch-required"];
if (!quickMode) critical.push("pre-conflict");

const parallel = ["env-check", "typecheck", "lint", "tests"];
if (mode === 'functional') parallel.push("tdd-changed-has-tests", "diff-coverage");
if (cfg.toggles.coverage) parallel.push("coverage");
if (!quickMode) parallel.push("build-web", "build-api");
if (cfg.toggles.sizeBudget && !quickMode) parallel.push("size-budget");

for (const check of criticalChecks) { ... }
await Promise.all(parallelChecks.map(runWithLimit));
```

<!-- @generated-start:check-catalogue -->
### Check Catalogue

#### Critical Checks (Serial, Fail-Fast)
| Check | ID | Description | Quick Mode |
| --- | --- | --- | --- |
| Trunk-Based Development | `trunk` | Verify working on main branch as required by trunk-based development | ✅ |
| Delivery Mode | `delivery-mode` | Read tasks/TASK.json (plan) or branch naming convention. Functional tasks → enforce TDD; non-functional → require tasks/PROBLEM_ANALYSIS.md sections (Analyze/Fix/Validate, length check) | ✅ |
| Commit Message Convention | `commit-msg-convention` | Validate conventional commit format with task ID and mode tags | ✅ |
| Kill-switch Required | `killswitch-required` | Check for kill-switch on feature commits (commits with feat: prefix) | ✅ |
| Pre-conflict Merge Check | `pre-conflict` | Verify no merge conflicts exist before proceeding | ❌ |

#### Parallel Checks (Concurrent)
| Check | ID | Description | Quick Mode |
| --- | --- | --- | --- |
| Environment Variable Validation | `env-check` | Validate all required environment variables are present and properly formatted | ✅ |
| ESLint | `lint` | Run ESLint with zero warnings policy | ✅ |
| TypeScript Type Check | `typecheck` | Run TypeScript compiler to catch type errors | ✅ |
| Test Suite | `tests` | Run Vitest test suite with coverage | ✅ |

#### Mode-Specific Checks
| Check | ID | Description | Quick Mode |
| --- | --- | --- | --- |
| TDD Changed Files Have Tests | `tdd-changed-has-tests` | Ensure all changed files have corresponding test files (functional mode only) | ✅ |
| Diff Coverage | `diff-coverage` | Ensure changed lines meet coverage threshold (functional mode only) | ✅ |

#### Optional Checks (Toggle-Controlled)
| Check | ID | Description | Quick Mode |
| --- | --- | --- | --- |
| Global Coverage | `coverage` | Ensure overall test coverage meets threshold (coverage) | ❌ |
| Web Build | `build-web` | Build the web application to verify it compiles successfully | ❌ |
| API Build | `build-api` | Build the API to verify it compiles successfully | ❌ |
| Size Budget | `size-budget` | Check that bundle size is within acceptable limits (sizeBudget) | ❌ |
| Security Audit | `security` | Run npm audit to check for high/critical vulnerabilities (security) | ❌ |
| API Contracts & Webhooks | `contracts` | Validate API specifications using redocly lint and run webhook signature tests (contracts) | ❌ |
| Database Migrations | `db-migrations` | Validate database migrations by applying them to a Testcontainers PostgreSQL instance (dbMigrations) | ❌ |

<!-- @generated-end:check-catalogue -->

<!-- @generated-start:quick-mode-checks -->
### Quick Mode Checks

When using `--quick` flag, only the following checks run:

#### Critical Checks
| Check | ID | Description | Quick Mode |
| --- | --- | --- | --- |
| Trunk-Based Development | `trunk` | Verify working on main branch as required by trunk-based development | ✅ |
| Delivery Mode | `delivery-mode` | Read tasks/TASK.json (plan) or branch naming convention. Functional tasks → enforce TDD; non-functional → require tasks/PROBLEM_ANALYSIS.md sections (Analyze/Fix/Validate, length check) | ✅ |
| Commit Message Convention | `commit-msg-convention` | Validate conventional commit format with task ID and mode tags | ✅ |
| Kill-switch Required | `killswitch-required` | Check for kill-switch on feature commits (commits with feat: prefix) | ✅ |

#### Parallel Checks
| Check | ID | Description | Quick Mode |
| --- | --- | --- | --- |
| Environment Variable Validation | `env-check` | Validate all required environment variables are present and properly formatted | ✅ |
| ESLint | `lint` | Run ESLint with zero warnings policy | ✅ |
| TypeScript Type Check | `typecheck` | Run TypeScript compiler to catch type errors | ✅ |
| Test Suite | `tests` | Run Vitest test suite with coverage | ✅ |

#### Mode-Specific Checks
| Check | ID | Description | Quick Mode |
| --- | --- | --- | --- |
| TDD Changed Files Have Tests | `tdd-changed-has-tests` | Ensure all changed files have corresponding test files (functional mode only) | ✅ |
| Diff Coverage | `diff-coverage` | Ensure changed lines meet coverage threshold (functional mode only) | ✅ |

<!-- @generated-end:quick-mode-checks -->

### Future Optional Checks
Add optional checks (`security`, `contracts`, `db-migrations`) behind config toggles so you can enable progressively without editing code.

## GitHub Actions
- Create `.github/workflows/prove.yml` (or fold into existing workflow) that:
  1. Checks out code with `fetch-depth: 0`.
  2. Runs the trunk/pre-conflict merge step (same commands as CLI).
  3. Installs dependencies.
  4. Executes `npm run prove`.
- Remove duplicated steps from `ci.yml` once `prove` covers them.
- Use branch protection to require the job (e.g., “Prove”) to pass before merge.

## Cursor, Windsurf, MCP, and Other LLMs
**Contract for every assistant:**
1. They must run `npm run prove` locally before claiming success.
2. They must paste (or summarise) the prove log in final output.
3. They must respect `tasks/TASK.json` mode (functional vs non-functional) and update tests/problem analysis accordingly.

### Cursor
- Create a shared snippet or task template instructing `cursor.json` flows to end with `npm run prove`.
- Add a [Cursor Command](https://www.cursor.com/docs/commands) named “Prove” that runs the script and streams logs so the assistant automatically includes the result.
- Store `docs/SENIOR_ENGINEER_PROMPT.md` in Cursor’s context; the existing script `scripts/enforce-prompt-compliance.sh` can be extended to check for a `PROVE_LOG` section in assistant replies.

### Windsurf & Other MCP Clients
- Update orchestrator prompts to include: “Before final response, run `npm run prove`. If it fails, stop and fix.”
- Embed a `quality-gate` tool wrapper that simply calls the CLI and returns stdout/stderr. Agents must call the tool; orchestrator rejects completions missing a green status.

### Hosted LLM Pipelines (Truly, OpenAI Assistants, etc.)
- In the automation pipeline, add a job step that shells into the workspace and executes `npm run prove`. Fail the run if the exit code is non-zero.
- Store the JSON summary emitted by `logger.ts` (e.g., `prove-report.json`) as an artifact for auditing.
- If the assistant UI cannot run commands, require human/maintainer to run the script and attach output before approve.

## Developer Workflow
1. Pull latest `main`.
2. Implement in Red → Green → Refactor cycles. Keep diffs small; coverage threshold forces you to add tests as you go.
3. Run `npm run prove`. Resolve any failing gate.
4. Commit and push to `main`. CI re-runs the same command to guard against machine drift.

## Observability & DX Tips
- **Logging**: `logger.ts` should print both human-readable lines and (optionally) JSON blocks (e.g., `::group::` / `::notice::` for GitHub). Include duration per check.
- **Caching**: Consider caching `node_modules` and vitest coverage in CI to keep runtimes down.
- **Fast loops**: Add `npm run prove:quick` (env/typecheck/lint/test + mode-specific checks) for WIP commits while the main `prove` includes the full battery.
- **Education**: Link this file from `README.md` and the prompt enforcement script so new contributors (and models) see the expectation immediately.

## Hardening Add-ons
- **Prove report artifact** – After every run, emit `tools/prove/logger.ts` output to `prove-report.json`:
  ```json
  {
    "mode": "functional",
    "checks": [
      { "id": "trunk", "ok": true, "ms": 8 },
      { "id": "delivery-mode", "ok": true, "ms": 0, "reason": "Functional mode resolved successfully" },
      { "id": "commit-msg-convention", "ok": true, "ms": 9 },
      { "id": "killswitch-required", "ok": true, "ms": 18 },
      { "id": "pre-conflict", "ok": true, "ms": 421 },
      { "id": "env-check", "ok": true, "ms": 349 },
      { "id": "tdd-changed-has-tests", "ok": true, "ms": 0 },
      { "id": "diff-coverage", "ok": false, "ms": 0, "reason": "Changed lines 72%, need 85%" },
      { "id": "coverage", "ok": false, "ms": 1, "reason": "Failed to read coverage file" },
      { "id": "lint", "ok": true, "ms": 1111 },
      { "id": "tests", "ok": false, "ms": 2076, "reason": "Tests failed with exit code 1" },
      { "id": "typecheck", "ok": false, "ms": 2895, "reason": "TypeScript type check failed" },
      { "id": "build-web", "ok": true, "ms": 5432 },
      { "id": "build-api", "ok": true, "ms": 2100 }
    ],
    "totalMs": 3380,
    "success": false
  }
  ```
  Upload the file as a CI artifact; locally, store it in `test-results/` so triage has machine-readable context.
- **`prove:quick` inner-loop** – Add `{"scripts":{"prove:quick":"tsx tools/prove/cli.ts --quick"}}`. When `--quick` is present, the runner executes only env/typecheck/lint/test + mode-specific checks; excludes pre-conflict, build, and size-budget checks.
- **Strict exit semantics** – Ensure every check returns `{ ok, reason, details }`. When a gate fails, print one concise line (`[lint] Failed: missing semi`) followed by the captured command output block for immediate debugging.
- **Mode guardrails in prompts** – Update Cursor/Windsurf snippets so they must: write or update `tasks/TASK.json`, run `npm run prove`, and paste the log before claiming completion.
- **CI config immutability** – In CI, ignore env-based threshold overrides; trust only `prove.config.ts` committed with the PR. Reject runs that attempt to lower thresholds at runtime unless the override carries a signed/approved token.

## Drop-in PR Template
```
## Task
- ID: <T-YYYY-MM-DD-###>
- Mode: functional | non-functional

## Evidence
- [ ] Attached `prove-report.json` (or CI artifact link)
- [ ] For functional: listed test names covering changed files
- [ ] For non-functional: updated `tasks/PROBLEM_ANALYSIS.md` (Analyze/Fix/Validate)

## Risk & Rollback
- Risk summary:
- Rollback plan:
```

## Labels & Mode Resolution
- Auto-apply repo labels (`mode:functional`, `mode:non-functional`) during triage.
- Delivery-mode check resolves priority: `tasks/TASK.json` → PR label → PR title tag (`[MODE:F]` or `[MODE:NF]`) → fail if none present.

## Edge Cases & Handling
- **Docs-only / Storybook tweaks** – `tdd-changed-has-tests` only inspects globs in `cfg.paths.srcGlobs`, so pure docs skips the test requirement.
- **Large refactors** – For functional refactors with minimal behavior change, either provide characterization tests or configure `diffCoverageFunctionalRefactor = 60` under specific labels (e.g., `refactor`).
- **Main-branch hotfix** – Hotfixes still pass through `npm run prove`. Developers can run `npm run prove:quick` locally to unblock urgent fixes; CI re-runs the full gate before merge.
- **New workspace/package** – Add adapter checks that shell into each workspace (e.g., `pnpm -F web lint`) so `prove` scales to monorepos without duplicating logic.

By funnelling every workflow through `npm run prove`, you turn subjective “looks done” statements into objective signals. The gate is tool-agnostic: whether the change comes from Cursor, Windsurf, MCP, or manual edits, the same verifiers run, guaranteeing consistent quality.
