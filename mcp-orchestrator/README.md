# MCP Orchestrator

Central coordination system for AI agent task management and automation.

## Overview

The MCP (Model Context Protocol) Orchestrator is a Node.js/TypeScript service that automatically manages task distribution, progress monitoring, and conflict resolution between AI agents (ChatGPT, cursor, codex) without requiring human intervention for routine operations.

## Features

- **Task Assignment Automation**: Automatically assigns tasks to available AI agents based on capabilities and priority
- **Progress Monitoring**: Real-time tracking of task progress and agent status
- **Conflict Detection**: Identifies and resolves task conflicts and dependencies
- **Agent Coordination**: Manages communication and workload balancing between agents
- **Health Monitoring**: Comprehensive health checks and system monitoring

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Docker (optional)

### Installation

```bash
# Install dependencies
npm install

# Copy environment configuration
cp env.example .env

# Start development server
npm run dev
```

### Available Scripts

```bash
# Development
npm run dev          # Start development server with hot reload
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint with auto-fix
npm run lint:check   # Run ESLint without auto-fix
npm run typecheck    # Run TypeScript type checking

# Testing
npm run test         # Run tests once
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage report

# Utilities
npm run clean        # Clean build directory
```

### Docker

```bash
# Build and run with Docker
docker build -t mcp-orchestrator .
docker run -p 3000:3000 mcp-orchestrator

# Or use docker-compose
docker-compose up --build
```

## API Endpoints

### Health Check
- `GET /health` - System health status
- `GET /health/ready` - Readiness check
- `GET /health/live` - Liveness check

### Orchestrator API
- `POST /api/orchestrator/tasks` - Assign a task to an agent
- `GET /api/orchestrator/agents` - Get agent statuses
- `POST /api/orchestrator/conflicts/resolve` - Resolve task conflicts

## Architecture

```
src/
├── api/           # Express route handlers
├── core/          # Core business logic
├── adapters/      # External service adapters
├── scripts/       # Utility scripts
└── __tests__/     # Test files
```

## Development

This project follows trunk-based development principles:

- All development happens on the `main` branch
- Frequent commits with comprehensive testing
- Feature flags for safe rollouts
- Automated CI/CD pipeline

### Code Quality Standards

- TypeScript with strict type checking
- ESLint + Prettier for code formatting
- Comprehensive test coverage (>60% for MVP)
- Clear commit messages following conventional commits

## Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test health.test.ts
```

## Environment Variables

See `env.example` for all available configuration options.

## License

MIT
