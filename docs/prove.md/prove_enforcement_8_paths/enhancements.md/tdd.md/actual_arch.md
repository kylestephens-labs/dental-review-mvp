# Architecture Overview
This document serves as a critical, living template designed to equip agents with a rapid and comprehensive understanding of the TDD enforcement system's architecture, enabling efficient navigation and effective contribution from day one. Update this document as the codebase evolves.

## 1. Project Structure
This section provides a high-level overview of the TDD enforcement system's directory and file structure, categorised by architectural layer or major functional area. It is essential for quickly navigating the codebase, locating relevant files, and understanding the overall organization and separation of concerns.

```
[Project Root]/
├── tools/prove/                    # TDD Enforcement System Core
│   ├── cli.ts                     # Main entry point and CLI interface
│   ├── config.ts                  # Configuration management and validation
│   ├── context.ts                 # Context building and state management
│   ├── logger.ts                  # Structured logging system
│   ├── runner.ts                  # Check orchestration and execution
│   ├── prove.config.ts            # Default configuration values
│   ├── tdd-phase-commands.ts      # TDD phase management CLI commands
│   ├── checks/                    # Quality gate implementations
│   │   ├── base.ts                # Base check interface and utilities
│   │   ├── trunk.ts               # Trunk-based development validation
│   │   ├── deliveryMode.ts        # Task mode resolution (functional/non-functional)
│   │   ├── commit-msg-convention.ts # Commit message format validation
│   │   ├── commit-size.ts         # Commit size limits enforcement
│   │   ├── killswitch-required.ts # Feature flag kill-switch validation
│   │   ├── preConflict.ts         # Merge conflict prevention
│   │   ├── envCheck.ts            # Environment variable validation
│   │   ├── typecheck.ts           # TypeScript compilation validation
│   │   ├── lint.ts                # ESLint code quality validation
│   │   ├── tests.ts               # Test suite execution and validation
│   │   ├── coverage.ts            # Global test coverage validation
│   │   ├── diffCoverage.ts        # Changed lines coverage validation
│   │   ├── buildWeb.ts            # Web application build validation
│   │   ├── buildApi.ts            # API build validation
│   │   ├── sizeBudget.ts          # Bundle size validation
│   │   ├── security.ts            # Security vulnerability scanning
│   │   ├── contracts.ts           # API contract validation
│   │   ├── dbMigrations.ts        # Database migration validation
│   │   ├── feature-flag-lint.ts   # Feature flag usage validation
│   │   ├── tddChangedHasTests.ts  # TDD test file requirement validation
│   │   ├── tddPhaseDetection.ts   # TDD phase detection and analysis
│   │   ├── tddGreenPhase.ts       # TDD Green phase validation
│   │   ├── tddRefactorPhase.ts    # TDD Refactor phase validation
│   │   ├── tddProcessSequence.ts  # TDD process sequence validation
│   │   ├── index.ts               # Check registry and exports
│   │   └── shared/                # Shared utilities for checks
│   │       ├── error-context-enhancer.ts
│   │       ├── error-handler.ts
│   │       ├── error-messages.ts
│   │       ├── false-positive-analyzer.ts
│   │       ├── feature-flag-detector.ts
│   │       ├── flag-cache.ts
│   │       ├── flag-registry.ts
│   │       ├── pattern-cache.ts
│   │       ├── performance-monitor.ts
│   │       ├── rollout-cache.ts
│   │       ├── rollout-validator.ts
│   │       └── validation-optimizer.ts
│   ├── utils/                     # Core utilities and helpers
│   │   ├── exec.ts                # Command execution wrapper
│   │   ├── git.ts                 # Git operations and context
│   │   ├── coverage.ts            # Coverage analysis utilities
│   │   ├── runner.ts              # Runner utilities and helpers
│   │   ├── tdd-phase.ts           # TDD phase management utilities
│   │   ├── tddPhaseDetection.ts   # Phase detection algorithms
│   │   └── testEvidence.ts        # Test evidence capture and storage
│   ├── config/                    # Configuration schemas and validation
│   │   ├── config-validator.ts    # Configuration validation logic
│   │   └── schemas/               # Zod schemas for configuration
│   │       ├── check-timeouts.ts
│   │       ├── feature-flags.ts
│   │       ├── git.ts
│   │       ├── kill-switch.ts
│   │       ├── modes.ts
│   │       ├── paths.ts
│   │       ├── runner.ts
│   │       ├── thresholds.ts
│   │       └── toggles.ts
│   ├── types/                     # TypeScript type definitions
│   │   └── common.ts              # Shared type definitions
│   ├── validation/                # Validation utilities
│   │   └── problemAnalysis.ts     # Problem analysis validation
│   ├── scripts/                   # Build and maintenance scripts
│   │   ├── generate-docs.ts       # Documentation generation
│   │   └── generate-snippets.ts   # Code snippet generation
│   ├── snippets/                  # Code snippets and templates
│   │   └── snippet-source.json    # Snippet definitions
│   └── __tests__/                 # Test suite for the prove system
│       ├── checks/                # Individual check tests
│       ├── logger.test.ts         # Logger tests
│       ├── snippets.test.ts       # Snippet tests
│       ├── tdd-phase-commands.test.ts
│       ├── tdd-phase-context.test.ts
│       └── utils/                 # Utility function tests
├── docs/prove.md/                 # Comprehensive documentation
│   └── prove_enforcement_8_paths/ # Documentation structure
│       ├── cursor-kickoff-prompt.md
│       ├── prove-overview.md
│       └── enhancements/tdd.md/   # TDD-specific documentation
├── tasks/                         # Task management (when present)
│   ├── TASK.json                  # Task definition and mode
│   └── PROBLEM_ANALYSIS.md        # Problem analysis for non-functional tasks
├── .prove/                        # Runtime data and evidence
│   └── evidence.json              # Test evidence storage
└── prove-report.json              # Prove execution report
```

## 2. High-Level System Diagram
The TDD enforcement system operates as a quality gate orchestrator that validates development practices and code quality through a series of checks.

```
[Developer] --> [CLI Interface] --> [Context Builder] --> [Check Runner]
                                                           |
                                                           +--> [Critical Checks] (Serial)
                                                           |    ├── Trunk Validation
                                                           |    ├── Mode Resolution
                                                           |    ├── Commit Convention
                                                           |    ├── Kill-switch Check
                                                           |    └── Pre-conflict Check
                                                           |
                                                           +--> [Parallel Checks] (Concurrent)
                                                                ├── Environment Validation
                                                                ├── TypeScript Compilation
                                                                ├── ESLint Code Quality
                                                                ├── Test Suite Execution
                                                                ├── Feature Flag Validation
                                                                └── TDD Phase Validation
                                                                     ├── Phase Detection
                                                                     ├── Green Phase Check
                                                                     ├── Refactor Phase Check
                                                                     └── Process Sequence Check
```

## 3. Core Components

### 3.1. CLI Interface

**Name:** Prove CLI

**Description:** The main entry point for the TDD enforcement system. Provides a command-line interface for running quality gates, managing TDD phases, and executing validation checks. Supports both full and quick modes for different validation scenarios.

**Technologies:** TypeScript, Node.js, Commander.js

**Deployment:** NPM package, local development tool

### 3.2. Context Builder

**Name:** Prove Context System

**Description:** Builds and manages the execution context for all checks. Gathers git information, resolves task modes, loads configuration, and provides shared state to all validation checks.

**Technologies:** TypeScript, Git operations, File system APIs

**Deployment:** Local execution, CI/CD integration

### 3.3. Check Runner

**Name:** Quality Gate Orchestrator

**Description:** Orchestrates the execution of all quality gates. Manages serial execution of critical checks and parallel execution of safe checks. Implements fail-fast behavior and provides comprehensive reporting.

**Technologies:** TypeScript, p-limit for concurrency control

**Deployment:** Local execution, CI/CD integration

### 3.4. TDD Phase Management System

**Name:** Enhanced TDD Enforcement

**Description:** Comprehensive TDD phase validation system that enforces Red → Green → Refactor workflow. Includes phase detection, validation for each phase, and process sequence enforcement.

**Technologies:** TypeScript, Evidence-based validation, Git analysis

**Deployment:** Local execution, integrated with prove system

## 4. Data Stores

### 4.1. Test Evidence Storage

**Name:** TDD Evidence Database

**Type:** JSON file storage (.prove/evidence.json)

**Purpose:** Stores test execution evidence, phase transitions, and validation history for TDD process sequence analysis.

**Key Data:** Phase history, test results, commit hashes, timestamps, changed files

### 4.2. Configuration Storage

**Name:** Prove Configuration

**Type:** TypeScript configuration files

**Purpose:** Stores system configuration including thresholds, toggles, paths, and validation rules.

**Key Data:** Coverage thresholds, check toggles, file patterns, timeouts

### 4.3. Report Storage

**Name:** Prove Reports

**Type:** JSON file (prove-report.json)

**Purpose:** Stores execution reports with check results, timing, and error details for analysis and debugging.

**Key Data:** Check results, execution times, error messages, success status

## 5. External Integrations / APIs

**Git Operations:** Git command-line interface for repository analysis

**Purpose:** Branch detection, commit analysis, diff generation, merge conflict checking

**Integration Method:** Child process execution

**NPM Scripts:** Package.json script execution

**Purpose:** Running build, test, lint, and other validation commands

**Integration Method:** Child process execution

**File System:** Node.js file system APIs

**Purpose:** Reading configuration files, writing reports, managing evidence

**Integration Method:** Direct API calls

## 6. Deployment & Infrastructure

**Cloud Provider:** Local development, CI/CD integration

**Key Services Used:** Git repositories, NPM package registry, CI/CD platforms

**CI/CD Pipeline:** GitHub Actions, GitLab CI, Jenkins (configurable)

**Monitoring & Logging:** Structured logging with Winston, JSON output for CI integration

## 7. Security Considerations

**Authentication:** Not applicable (local development tool)

**Authorization:** File system permissions, git repository access

**Data Encryption:** Not required (local development data)

**Key Security Tools/Practices:** Input validation, command sanitization, file path validation

## 8. Development & Testing Environment

**Local Setup Instructions:** 
1. Install dependencies: `npm install`
2. Run prove: `npm run prove`
3. Run quick mode: `npm run prove:quick`
4. TDD phase commands: `npm run tdd:red|green|refactor`

**Testing Frameworks:** Vitest, Jest for unit tests

**Code Quality Tools:** ESLint, TypeScript compiler, Prettier

## 9. Future Considerations / Roadmap

**Enhanced Phase Detection:** Machine learning-based phase detection using commit patterns and code analysis

**IDE Integration:** Real-time TDD phase feedback in development environments

**Analytics Dashboard:** TDD process analytics and team performance metrics

**Custom Rules Engine:** Configurable TDD rules and project-specific validations

**Cloud Integration:** Centralized evidence storage and team collaboration features

## 10. Project Identification

**Project Name:** Enhanced TDD Enforcement System

**Repository URL:** https://github.com/kylestephens-labs/dental-review-mvp

**Primary Contact/Team:** Dental MVP Development Team

**Date of Last Update:** 2025-01-18

## 11. Glossary / Acronyms

**TDD:** Test-Driven Development - Development methodology following Red → Green → Refactor cycle

**Red Phase:** First phase of TDD where failing tests are written

**Green Phase:** Second phase of TDD where minimal code is written to make tests pass

**Refactor Phase:** Third phase of TDD where code quality is improved while preserving behavior

**Prove:** Quality gate system that enforces development practices and code quality

**Evidence:** Test execution data and phase transition information stored for analysis

**Mode Resolution:** Process of determining whether a task is functional or non-functional

**Quality Gates:** Automated checks that validate code quality and development practices

**Trunk-Based Development:** Development practice of working directly on the main branch

**Kill-switch:** Feature flag mechanism for quickly disabling features in production

**Diff Coverage:** Test coverage analysis focused only on changed lines of code

**Process Sequence:** Validation that ensures proper TDD phase progression (Red → Green → Refactor)
