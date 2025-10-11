# Archived Parallel Orchestration System

This directory contains the original parallel orchestration system designed for complex multi-agent coordination.

## Files Archived:
- orchestrator-client/ - HTTP client for external orchestrator
- orchestrator-mcp.ts - API-based task management
- scrum-mcp.ts - Complex parallel workflow management
- scrum-tdd-workflow.json - Parallel execution workflow

## Why Archived:
- Architecture mismatch with new Sequential Agent Handoff MVP
- Too complex for immediate needs
- Can be restored for Post-MVP parallel execution

## New Implementation:
See ../tools/ and ../scripts/ for new file-based sequential system

## Restoration Instructions:
If you need to restore the parallel system:
1. Move files back from archive/parallel-orchestrator/
2. Update package.json scripts
3. Re-enable orchestrator-client integration
4. Update workflows to use parallel execution

## MVP vs Post-MVP:
- **MVP (Current)**: File-based sequential handoff coordinator
- **Post-MVP (Archived)**: Parallel execution with conflict resolution
