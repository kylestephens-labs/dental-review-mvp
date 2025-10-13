got it — here’s the full, updated tiny-steps plan with your revisions baked in. Each task is atomic, testable, and single-concern. Run them one at a time with Cursor.

⸻

Phase 0 — Bootstrap the scaffold

T1 — Create tools/prove skeleton

Goal: Establish folders & empty files.
Do: Create tools/prove/{checks,utils} and files: cli.ts, runner.ts, context.ts, config.ts, logger.ts, prove.config.ts.
Test: ls tools/prove shows files.
Done when: Repo compiles (or at least no TS import errors).

T2 — Add package.json script

Goal: Single entry point.
Do: Add "prove": "tsx tools/prove/cli.ts" to root package.json.
Test: npm run prove prints a stub message.
Done when: Command runs without errors.

⸻

Phase 1 — Core runtime (no gates yet)

T3 — Implement logger.ts

Goal: Uniform logs for human/CI (+ optional JSON).
Do: Add header/info/success/error/result, PROVE_JSON=1 support.
Test: Log from cli.ts.
Done when: Logs render; JSON mode prints valid JSON blocks.

T4 — Implement config.ts + prove.config.ts (Zod)

Goal: Central config with defaults (thresholds/toggles/paths/git).
Do: Load/validate and export config object.
Test: Print config in cli.ts.
Done when: Config loads without error.

T5 — Implement utils/exec.ts

Goal: Safe command exec with {code, stdout, stderr}.
Do: Wrap child_process.spawn/execFile.
Test: Call exec("node -v").
Done when: Non-zero exit codes propagate.

T6 — Implement utils/git.ts

Goal: Centralize git info.
Do: getCurrentBranch(), getBaseRef(fallback='origin/main'), getChangedFiles(baseRef).
Test: Log outputs.
Done when: Returns expected values.

T7 — Implement context.ts

Goal: Build shared context once.
Do: Assemble { cfg, baseRef, changedFiles, isCI, log }.
Test: npm run prove prints context summary line.
Done when: Checks can import context.

T8 — Implement runner.ts (skeleton)

Goal: Orchestrator placeholder.
Do: runAll(ctx) prints “no checks yet”.
Test: npm run prove runs clean.
Done when: Ready to register checks later.

⸻

Phase 2 — Trunk discipline + merge safety

T9 — Check: trunk.ts

Goal: Enforce work on main.
Do: Fail if getCurrentBranch() !== 'main'.
Test: On temp branch → fails; on main → passes.
Done when: Deterministic fail/pass.

T10 — Check: preConflict.ts

Goal: Dry-merge with origin/main.
Do: git fetch; git merge --no-commit --no-ff origin/main; merge --abort in finally; fail on conflict.
Test: Create fake conflict; expect failure.
Done when: Works both ways.

T10a — Pre-push guard: prove:quick hook

Goal: Prevent slow/broken pushes; keep feedback ≤ 2–3 minutes.
Do: Add .husky/pre-push running npm run prove:quick (env + typecheck + lint + unit).
Test: Introduce lint error, git push → blocked; fix → push succeeds.
Done when: Hook blocks bad pushes locally.

T10b — Commit size gate: commit-size.ts

Goal: Keep changes tiny (TBD core).
Do: New check in Prove: fail if git diff --shortstat origin/main...HEAD exceeds configurable LOC (e.g., 300 LOC).
Test: Create big change → npm run prove fails with message “diff > limit”.
Done when: Gate enforces small, frequent commits.

T10c — Commit message convention gate: commit-msg-convention.ts

Goal: Traceability + task mode clarity.
Do: Check latest commit message matches (<feat|fix|chore|refactor>): ... [T-YYYY-MM-DD-###] [MODE:F|NF].
Test: Bad message → fail; good → pass.
Done when: Convention enforced.

T10d — Feature-flag registry + linter

Goal: Make WIP safe on main (TBD cornerstone).
Do:
	•	Create frontend/src/flags.ts & backend/src/flags.ts with typed flag registry (name, owner, expiry, default).
	•	Add ESLint rule (custom or simple script in Prove) to require any usage of isEnabled('new_flag') to reference a registered flag and to fail if new flag lacks owner/expiry.
Test: Use unknown flag → fail; add to registry → pass.
Done when: Flags cannot be ad-hoc.

T10e — Kill-switch guard: killswitch-required.ts

Goal: Guarantee reversible releases.
Do: If commit message includes feat: and touches production code, require a flag or config toggle referenced in diff (simple regex across changed files for isEnabled( or KILL_SWITCH_).
Test: New feature without flag → fail; with flag → pass.
Done when: Every feature ships with a kill switch.

T10f — Post-push fast CI lane: prove-fast.yml

Goal: 2–3 minute CI on push to main.
Do: Add a lean workflow running prove:quick only (no E2E, no heavy steps).
Test: Push to main → CI finishes ≤ ~3 minutes.
Done when: Lane exists and is fast.

T10g — Nightly full prove

Goal: Depth without slowing trunk.
Do: Add a nightly cron job running full npm run prove (diff-coverage, build, optional security/size/coverage).
Test: Failing gate appears in nightly; morning triage sees artifact.
Done when: Nightly full battery runs.

T10h — Auto-rollback on red fast lane

Goal: Rapid recovery (safety first).
Do: In prove-fast.yml, if job fails on a push to main, run a step that reverts the last commit (or triggers a CD rollback to previous image) behind a protected bot token (or just fail with instructions if auto-revert is too spicy).
Test: Break main → workflow attempts rollback or posts instructions with exact git command.
Done when: There’s a documented, automated path to green.

T10i — Production smoke after deploy: post-deploy-smoke

Goal: Close the loop quickly.
Do: After deploy, run a tiny Playwright smoke (health, login, one CRUD).
Test: Force 500 on /health in staging → job fails.
Done when: Smokes run and report.

T10j — Merge protection strategy note

Goal: Reconcile “direct commits to main” vs. enforcement.
Do: Document your policy in ARCHITECTURE.md:
	•	Short-lived PRs (minutes), branch protection requires “Prove” before merge.

⸻

Phase 3 — Mode awareness (functional vs non-functional)

T11 — Add tasks/TASK.json

Goal: Source of truth for mode.
Do: Commit default { "mode": "functional" }.
Test: File exists, valid JSON.
Done when: Present in repo.

T11b — PR label/title fallback for mode (new)

Goal: Resolve mode without file edits.
Do: In mode resolver, support PR label mode:functional|mode:non-functional or title tag [MODE:F|NF] when TASK.json missing.
Test: Remove TASK.json, label PR, CI resolves mode.
Done when: Mode resolves via fallback.

T12 — Check: deliveryMode.ts (revised)

Goal: Enforce correct practice by mode.
Do:
	•	If functional → just resolve mode (TDD outcomes enforced elsewhere).
	•	If non-functional → require tasks/PROBLEM_ANALYSIS.md with ## Analyze, ## Fix, ## Validate and ≥200 chars (trimmed).
Test: Non-functional without doc → fails; with doc → passes.
Done when: Fails without adequate analysis.

⸻

Phase 4 — Environment & static quality

T13 — Check: envCheck.ts

Goal: Validate required env vars.
Do: Shell to npm run env:check (or minimal zod script).
Test: Remove a var; expect failure.
Done when: Deterministic.

T14 — Check: typecheck.ts

Goal: Type safety via tsc --noEmit.
Do: Execute npm run typecheck.
Test: Introduce TS error; fail.
Done when: OK.

T15 — Check: lint.ts

Goal: Code quality.
Do: npm run lint --max-warnings=0.
Test: Add lint issue; fail.
Done when: OK.

⸻

Phase 5 — Tests & coverage

T16 — Check: tests.ts

Goal: Run unit/integration tests.
Do: npm run test (vitest); surface stdout on fail.
Test: Create failing test; fail.
Done when: OK.

T17 — Produce coverage artifact

Goal: Ensure coverage/coverage-final.json exists.
Do: Configure vitest to output JSON coverage.
Test: Run tests; file exists.
Done when: Artifact present.

T17a — Check: coverage.ts (new, optional global)

Goal: Enforce global coverage % (matches file layout).
Do: If toggles.coverage, parse summary or shell to tool enforcing ≥ cfg.thresholds.globalCoverage (e.g., 80%).
Test: Lower global coverage to 70% → fail; raise threshold or add tests → pass.
Done when: Works when toggled on; skipped otherwise.

T18 — Check: tddChangedHasTests.ts

Goal: For functional tasks, code changes must include test changes.
Do: If mode=functional and any cfg.paths.srcGlobs changed, assert a file in cfg.paths.testGlobs changed.
Test: Edit src/** without tests → fail.
Done when: OK.

T19 — Check: diffCoverage.ts

Goal: Changed lines meet threshold (e.g., 85%).
Do: Use npx diff-cover coverage/coverage-final.json --fail-under=<cfg.thresholds.diffCoverageFunctional>.
Test: Reduce coverage on changed lines → fail.
Done when: OK.

T19b — Mode-aware diff-coverage (new)

Goal: Only enforce diff-coverage on functional tasks.
Do: If ctx.mode !== "functional", skip with reason.
Test: Non-functional PR with code changes → skipped; functional → enforced.
Done when: Conditional behavior verified.

⸻

Phase 6 — Build & size

T20 — Check: buildWeb.ts

Goal: Verify frontend build.
Do: npm run build (Vite).
Test: Break build; fail.
Done when: OK.

T21 — Check: buildApi.ts (stub)

Goal: Placeholder for backend build.
Do: Return success with “skipped (no server build)”.
Test: npm run prove shows “skipped”.
Done when: OK.

T22 — Check: sizeBudget.ts (optional)

Goal: Enforce bundle budgets.
Do: If toggled, run size-limit.
Test: Add heavy dep; fail.
Done when: OK/skipped per toggle.

⸻

Phase 7 — Runner orchestration

T23 — Wire concurrency limiter (revised)

Goal: Bounded parallelism via p-limit.
Do:
	•	Install p-limit.
	•	Serial: trunk, pre-conflict, delivery-mode.
	•	Parallel: all others under limit(cfg.runnerConcurrency || 4).
	•	Fail fast with deterministic first failure.
Test: Add simulated slow checks; measure runtime respects cap; fail one parallel check → correct failure.
Done when: Concurrency + ordering confirmed.

⸻

Phase 8 — CLI exit semantics

T24 — Finalize cli.ts exit codes

Goal: Deterministic exit + clear failure reasons.
Do: Print header; run; on failure print [check] reason and captured output; process.exit(1); else success + process.exit(0).
Test: Trigger any failing check; verify exit 1.
Done when: OK.

⸻

Phase 9 — CI integration

T25 — Create .github/workflows/prove.yml

Goal: CI runs the same CLI.
Do: Checkout (fetch-depth: 0), setup Node 20, npm ci, (optional Playwright deps), npm run prove.
Test: Open PR; workflow runs; mirrors local results.
Done when: Required job passes/fails correctly.

T26 — Enable branch protection (manual)

Goal: Enforce gating pre-merge.
Do: Require status check “Prove”; require PRs; disable force-push.
Test: Attempt merging red PR → blocked.
Done when: Rules saved.

⸻

Phase 10 — Mode artifacts (non-functional path)

T27 — Add tasks/PROBLEM_ANALYSIS.md template

Goal: Doc for non-functional work.
Do: Template with ## Analyze, ## Fix, ## Validate.
Test: Non-functional task without adequate doc → delivery-mode fails; with content → passes.
Done when: Template committed; enforcement proven.

⸻

Phase 11 — Developer experience

T28 — Add prove:quick

Goal: Faster inner loop.
Do: CLI flag --quick to run env/typecheck/lint/tests only.
Test: npm run prove:quick vs npm run prove.
Done when: Both paths work.

T29 — Emit prove-report.json

Goal: Machine-readable proof.
Do: Logger writes { mode, checks:[{id, ok, ms, reason?}] }.
Test: File created locally and uploaded in CI as artifact.
Done when: Present and accurate.

⸻

Phase 12 — Docs alignment

T30 — Update ARCHITECTURE.md (revised)

Goal: Gate list mirrors reality.
Do: List: Trunk, Pre-conflict, Env, Typecheck, Lint, Tests, Global Coverage (opt), Diff-Coverage (functional), Build, (opt Size/Security/Contracts/DB), Problem Analysis enforcement (non-functional).
Test: Cross-check with runner.ts + config.
Done when: No contradictions.

T30b — Update prove-overview.md (new)

Goal: Keep overview synced with code.
Do: Include diff-coverage and Problem Analysis enforcement; mention optional global coverage.
Test: Matches runner & config.
Done when: Consistent.

⸻

Phase 13 — Optional hardening

T31 — Security gate (toggle)

Goal: Block high/critical vulns.
Do: Run osv-scanner or npm audit --audit-level=high.
Test: Introduce vulnerable dep; fail.
Done when: OK/skipped per toggle.

T32 — Contracts & webhooks (toggle)

Goal: Prevent API shape drift.
Do: redocly lint + webhook signature tests (Stripe/Twilio).
Test: Break spec; fail.
Done when: OK/skipped per toggle.

T33 — DB migrations (toggle)

Goal: Safe schema changes.
Do: Testcontainers Postgres up/down.
Test: Bad migration → fail.
Done when: OK/skipped per toggle.

⸻

Phase 14 — Agent compliance

T34 — Cursor/Windsurf/MCP snippets

Goal: Agents follow the contract.
Do: Snippets must: set TASK.json or label, obey mode rules, run npm run prove, paste logs.
Test: Run a Cursor task; proof included; failure blocks.
Done when: Agents comply by default.

⸻

If you want, I can output micro-prompts for any subset (e.g., T12, T17a, T23, T30/T30b) so you can paste them into Cursor exactly as “one task at a time.”

### misc notes

-Need to revisit the feature flag lint and commit size

