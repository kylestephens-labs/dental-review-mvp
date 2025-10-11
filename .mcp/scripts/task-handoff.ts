#!/usr/bin/env node

import { HandoffCoordinator } from '../tools/handoff-coordinator.js';

const coordinator = new HandoffCoordinator();

async function main() {
  const command = process.argv[2];
  const args = process.argv.slice(3);

  try {
    switch (command) {
      case 'create':
        if (args.length === 0) {
          console.error('Usage: npm run mcp:create "Task Title" [P0|P1|P2]');
          process.exit(1);
        }
        const title = args[0];
        const priority = (args[1] as 'P0' | 'P1' | 'P2') || 'P1';
        await coordinator.createTask(title, priority);
        break;

      case 'prep':
        if (args.length === 0) {
          console.error('Usage: npm run mcp:prep <task-id>');
          process.exit(1);
        }
        await coordinator.prepTask(args[0]);
        break;

      case 'claim':
        if (args.length < 2) {
          console.error('Usage: npm run mcp:claim <task-id> <agent>');
          console.error('Agents: cursor, codex, chatgpt');
          process.exit(1);
        }
        const agent = args[1] as 'cursor' | 'codex' | 'chatgpt';
        await coordinator.claimTask(args[0], agent);
        break;

      case 'review':
        if (args.length === 0) {
          console.error('Usage: npm run mcp:review <task-id>');
          process.exit(1);
        }
        await coordinator.requestReview(args[0]);
        break;

      case 'complete':
        if (args.length === 0) {
          console.error('Usage: npm run mcp:complete <task-id>');
          process.exit(1);
        }
        await coordinator.completeTask(args[0]);
        break;

      case 'fail':
        if (args.length < 2) {
          console.error('Usage: npm run mcp:fail <task-id> "Error description"');
          process.exit(1);
        }
        await coordinator.failTask(args[0], args[1]);
        break;

      case 'feedback':
        if (args.length < 2) {
          console.error('Usage: npm run mcp:feedback <task-id> "Feedback text"');
          process.exit(1);
        }
        await coordinator.addFeedback(args[0], args[1]);
        break;

      case 'status':
        await coordinator.getStatus();
        break;

      case 'next':
        if (args.length === 0) {
          console.error('Usage: npm run mcp:next <agent>');
          console.error('Agents: cursor, codex, chatgpt');
          process.exit(1);
        }
        await coordinator.getNextTask(args[0] as 'cursor' | 'codex' | 'chatgpt');
        break;

      case 'git':
        if (args.length < 3) {
          console.error('Usage: npm run mcp:git <task-id> <branch> <commit> [pr]');
          process.exit(1);
        }
        await coordinator.updateGitContext(args[0], args[1], args[2], args[3]);
        break;

      case 'review-feedback':
        if (args.length === 0) {
          console.error('Usage: npm run mcp:review-feedback <task-id>');
          process.exit(1);
        }
        await coordinator.reviewCodexFeedback(args[0]);
        break;

      case 'resolve-feedback':
        if (args.length === 0) {
          console.error('Usage: npm run mcp:resolve-feedback <task-id>');
          process.exit(1);
        }
        await coordinator.resolveFeedback(args[0]);
        break;

      case 'audit':
        await coordinator.auditWorkflowCompliance();
        break;

      default:
        console.log('MCP Orchestrator - Sequential Agent Handoff Coordinator');
        console.log('');
        console.log('Available commands:');
        console.log('  create "Title" [P0|P1|P2]  - Create new task');
        console.log('  prep <task-id>            - Move task to ready queue');
        console.log('  claim <task-id> <agent>   - Claim task for agent');
        console.log('  review <task-id>          - Request review');
        console.log('  complete <task-id>         - Mark task complete');
        console.log('  fail <task-id> "error"     - Mark task failed');
        console.log('  feedback <task-id> "text" - Add feedback');
        console.log('  status                    - Show task status');
        console.log('  next <agent>              - Get next task for agent');
        console.log('  git <task-id> <branch> <commit> [pr] - Update git context');
        console.log('');
        console.log('Agents: cursor, codex, chatgpt');
        console.log('Priorities: P0 (critical), P1 (normal), P2 (low)');
        break;
    }
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
