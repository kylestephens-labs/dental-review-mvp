Sure — here’s your ARCHITECTURE.md rewritten to integrate the Prove Quality Gates as a first-class subsystem in the project architecture.
This version preserves the structure of your existing architecture template while embedding the prove workflow as an architectural component alongside the frontend, backend, and CI/CD layers.

⸻

Architecture Overview

This document describes the system architecture, its key components, and the integrated Prove Quality Gates enforcement layer that governs all AI-assisted and human code delivery.
The goal is to provide any engineer or AI agent with a full picture of how the codebase is organized, deployed, and verified.

⸻

1. Project Structure

[Project Root]/
├── backend/                 # Server-side code and APIs
│   ├── src/
│   │   ├── api/             # API endpoints and controllers
│   │   ├── client/          # Business logic and service implementations
│   │   ├── models/          # Database schemas
│   │   └── utils/           # Helper functions for backend operations
│   ├── config/              # Backend configuration
│   ├── tests/               # Backend unit and integration tests
│   └── Dockerfile           # Container build for backend deployment
│
├── frontend/                # Client-side UI code
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page-level routes
│   │   ├── assets/          # Static resources
│   │   ├── services/        # API interaction layer
│   │   └── store/           # State management
│   ├── public/              # Public assets (index.html, favicon)
│   ├── tests/               # Frontend unit and E2E tests
│   └── package.json         # Frontend dependencies and scripts
│
├── common/                  # Shared code and utilities
│   ├── types/               # Shared TypeScript definitions
│   └── utils/               # Reusable helpers across layers
│
├── tools/                   # Internal engineering and QA tools
│   └── prove/               # Quality Gates enforcement layer
│       ├── cli.ts           # Entry point: runs all gates
│       ├── config.ts        # Zod config (thresholds, toggles, paths)
│       ├── context.ts       # Collects git diff, mode, env, logger once
│       ├── logger.ts        # Structured human/CI logs
│       ├── runner.ts        # Orchestrates checks (serial + parallel)
│       ├── checks/          # Individual verifiers
│       │   ├── envCheck.ts
│       │   ├── trunk.ts
│       │   ├── preConflict.ts
│       │   ├── typecheck.ts
│       │   ├── lint.ts
│       │   ├── tests.ts
│       │   ├── coverage.ts
│       │   ├── diffCoverage.ts
│       │   ├── buildWeb.ts
│       │   ├── buildApi.ts
│       │   ├── sizeBudget.ts
│       │   ├── deliveryMode.ts
│       │   └── tddChangedHasTests.ts
│       └── utils/
│           ├── exec.ts
│           ├── git.ts
│           └── fsx.ts
│
├── tasks/                   # Task classification & analysis
│   ├── TASK.json            # Defines mode: functional / non-functional
│   └── PROBLEM_ANALYSIS.md  # Required for non-functional tasks
│
├── docs/                    # Documentation (architecture, setup, QA)
│   ├── ARCHITECTURE.md
│   └── SENIOR_ENGINEER_PROMPT.md
│
├── .github/                 # GitHub Actions workflows
│   └── workflows/prove.yml  # CI job invoking npm run prove
│
├── scripts/                 # Automation utilities
├── README.md
└── package.json             # Root dependencies and "prove" script


⸻

2. High-Level System Diagram

[Developer or AI Assistant]
          |
          | commits / PRs
          v
[Prove Quality Gates CLI]  ---> [CI/CD Workflow (GitHub Actions)]
          |                              |
          |  (objective verification)    |
          v                              v
[Frontend App]  <-->  [Backend APIs]  <-->  [PostgreSQL / Supabase]
                                    \
                                     +--> [External APIs: Stripe, Twilio, Google, Facebook]

	•	All contributions—human or AI—flow through the Prove Quality Gates before merging into main.
	•	CI/CD pipelines re-run the same checks in a clean environment to guarantee deterministic verification.

⸻

3. Core Components

3.1. Frontend

Name: Web Application
Description: React + TypeScript + Vite + Tailwind (shadcn/ui) app providing the user interface for all product features.
Technologies: React, Vite, Tailwind CSS, TypeScript
Deployment: AWS App Runner → CloudFront CDN

3.2. Backend

Name: API & Services Layer
Description: Node/TypeScript backend providing business logic, API endpoints, and third-party integrations (Stripe, Twilio, Google APIs, Facebook Graph, SES).
Technologies: Node.js, Express, Supabase (RDS PostgreSQL)
Deployment: AWS App Runner, RDS, SES, CloudWatch

3.3. Prove Quality Gates (Engineering Control Layer)

Name: prove CLI subsystem
Description:
Automated enforcement framework guaranteeing every commit or PR passes the eight critical development practices.
Runs locally, in CI, and by LLM agents to ensure deterministic, mode-aware delivery.

Responsibilities:
	•	Serve as a single source of truth for code quality and workflow validation.
	•	Enforce the full gate catalogue documented in Prove Quality Gates, including:
	1.	Trunk-Based Development (main branch only)
	2.	Pre-Conflict Merge Gate
	3.	Delivery Mode Resolution (functional vs non-functional)
	4.	TDD Enforcement (functional tasks only)
	5.	Non-Functional Documentation Enforcement (`tasks/PROBLEM_ANALYSIS.md`)
	6.	Environment Variable Validation
	7.	Type Safety (tsc --noEmit)
	8.	Code Quality (eslint --max-warnings=0)
	9.	Test Suite Pass (vitest --coverage)
	10.	Diff Coverage on changed lines (functional tasks)
	11.	Build Verification (vite build or tsup)

Technologies:
Node.js, TypeScript, Zod, Vitest, ESLint, Diff-Cover, p-limit, Git CLI

Deployment:
	•	Local: via npm run prove
	•	CI: GitHub Actions job .github/workflows/prove.yml
	•	Branch protection: requires “Prove” job to pass before merge

⸻

4. Data Stores

Name	Type	Purpose
aws_rds	PostgreSQL	Primary database for application data
supabase	Managed PostgreSQL (lead capture)	Lightweight data storage for marketing/lead forms
coverage/coverage-final.json	JSON artifact	Coverage data consumed by diff-coverage check
prove-report.json	JSON artifact	Machine-readable proof of quality-gate results


⸻

5. External Integrations / APIs

Service	Purpose	Integration
Stripe	Payment processing	REST API + Stripe SDK
Twilio	SMS messaging	REST API
AWS SES	Transactional email	AWS SDK
Google Places / Calendar	Maps & calendar data	Google APIs
Facebook Graph API	Social lead integration	OAuth2 + Graph SDK


⸻

6. Deployment & Infrastructure

Cloud Provider: AWS
Core Services: App Runner, RDS, SES, CloudWatch
CI/CD: GitHub Actions — single prove workflow enforces gates pre-merge
Monitoring: CloudWatch + application metrics
Artifacts: prove-report.json uploaded for each CI run

⸻

7. Security Considerations
	•	Authentication: OAuth2/JWT; Stripe/Twilio keys managed via AWS Secrets Manager
	•	Authorization: RBAC in backend API layer
	•	Data Encryption: TLS for transit; RDS encryption at rest
	•	Security Tools: osv-scanner, npm audit (optional gates in Prove)
	•	Branch Protection: prevents merging unproved code

⸻

8. Development & Testing Environment
	•	Local setup:
	•	Clone repository
	•	Install dependencies (npm ci)
	•	Create .env.local
	•	Run:

npm run prove:quick    # Fast loop (env/typecheck/lint/test)
npm run prove          # Full quality gates


	•	Testing frameworks: Vitest, Playwright (E2E)
	•	Code quality tools: ESLint, Prettier, Zod, Diff-Cover
	•	AI agents: Cursor, Windsurf, MCP Orchestrator — all required to invoke npm run prove before completion.

⸻

9. Future Considerations / Roadmap
	•	Extend prove to support monorepo sub-packages (per-workspace adapters).
	•	Introduce dbMigrations and contracts checks once schema and OpenAPI stabilise.
	•	Add caching and incremental test runs for faster CI.
	•	Integrate prove-report.json with dashboards for visibility and trends.

⸻

10. Project Identification

Project Name: [Insert Name]
Repository: [Insert URL]
Primary Contact: [Lead Developer / Maintainer]
Last Updated: 2025-10-13

⸻

11. Glossary / Acronyms

Term	Definition
Prove	Unified CLI enforcing all quality gates.
Functional Task	A feature or fix requiring TDD (Red → Green → Refactor).
Non-Functional Task	Analysis or configuration task following Analyze → Fix → Validate.
Diff-Coverage	Percentage of changed lines covered by tests.
Pre-Conflict Gate	Dry merge check preventing conflicts with main.
LLM Agent	Any AI coding assistant (Cursor, Windsurf, MCP).
Prove Report	JSON artifact of all gate results, produced per run.


⸻

✅ Summary:
This architecture integrates the Prove Quality Gates as a formal subsystem of your development architecture.
It satisfies the original enforcement goals for all eight critical practices, provides deterministic validation for every code change, and unifies local, CI, and AI-driven workflows under one verifiable command:
npm run prove = definition of done.
