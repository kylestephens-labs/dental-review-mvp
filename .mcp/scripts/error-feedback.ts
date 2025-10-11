#!/usr/bin/env node

import { HandoffCoordinator } from '../tools/handoff-coordinator.js';
import * as fs from 'fs/promises';
import * as path from 'path';

const coordinator = new HandoffCoordinator();

async function main() {
  const command = process.argv[2];
  const args = process.argv.slice(3);

  try {
    switch (command) {
      case 'test-failure':
        if (args.length < 2) {
          console.error('Usage: npm run mcp:error test-failure <task-id> "Error description"');
          process.exit(1);
        }
        await coordinator.failTask(args[0], args[1]);
        break;

      case 'add-feedback':
        if (args.length < 2) {
          console.error('Usage: npm run mcp:error add-feedback <task-id> "Feedback text"');
          process.exit(1);
        }
        await coordinator.addFeedback(args[0], args[1]);
        break;

      case 'analyze-error':
        if (args.length === 0) {
          console.error('Usage: npm run mcp:error analyze-error <task-id>');
          process.exit(1);
        }
        await analyzeError(args[0]);
        break;

      case 'retry-task':
        if (args.length === 0) {
          console.error('Usage: npm run mcp:error retry-task <task-id>');
          process.exit(1);
        }
        await retryTask(args[0]);
        break;

      case 'list-failed':
        await listFailedTasks();
        break;

      default:
        console.log('MCP Error Feedback System');
        console.log('');
        console.log('Available commands:');
        console.log('  test-failure <task-id> "error"  - Mark task as failed with error');
        console.log('  add-feedback <task-id> "text"  - Add feedback to task');
        console.log('  analyze-error <task-id>         - Analyze error context');
        console.log('  retry-task <task-id>           - Move failed task back to ready');
        console.log('  list-failed                    - List all failed tasks');
        break;
    }
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

async function analyzeError(taskId: string): Promise<void> {
  console.log(`🔍 Analyzing error for task: ${taskId}`);
  
  const task = await coordinator['taskManager'].getTask(taskId);
  if (!task) {
    throw new Error(`Task ${taskId} not found`);
  }

  if (task.status !== 'failed') {
    console.log(`ℹ️  Task ${taskId} is not in failed status (current: ${task.status})`);
    return;
  }

  console.log('\n📋 Task Details:');
  console.log(`  Title: ${task.title}`);
  console.log(`  Priority: ${task.priority}`);
  console.log(`  Agent: ${task.agent}`);
  console.log(`  Created: ${task.created}`);
  console.log(`  Last Updated: ${task.lastUpdated}`);

  if (task.errorContext) {
    console.log('\n❌ Error Context:');
    console.log(task.errorContext);
  }

  if (task.reviewFeedback) {
    console.log('\n💬 Review Feedback:');
    console.log(task.reviewFeedback);
  }

  if (task.filesAffected.length > 0) {
    console.log('\n📁 Files Affected:');
    task.filesAffected.forEach(file => console.log(`  - ${file}`));
  }

  // Analyze error patterns
  console.log('\n🔍 Error Analysis:');
  const errorContext = task.errorContext.toLowerCase();
  
  if (errorContext.includes('test')) {
    console.log('  🧪 Test-related error detected');
    console.log('  💡 Suggestion: Check test implementation and assertions');
  }
  
  if (errorContext.includes('import') || errorContext.includes('module')) {
    console.log('  📦 Import/module error detected');
    console.log('  💡 Suggestion: Check import paths and dependencies');
  }
  
  if (errorContext.includes('type') || errorContext.includes('typescript')) {
    console.log('  🔷 TypeScript error detected');
    console.log('  💡 Suggestion: Check type definitions and interfaces');
  }
  
  if (errorContext.includes('syntax')) {
    console.log('  📝 Syntax error detected');
    console.log('  💡 Suggestion: Check code syntax and formatting');
  }

  console.log('\n🚀 Next Steps:');
  console.log('  1. Review error context above');
  console.log('  2. Fix the identified issues');
  console.log('  3. Run: npm run mcp:error retry-task ' + taskId);
  console.log('  4. Continue with implementation');
}

async function retryTask(taskId: string): Promise<void> {
  console.log(`🔄 Retrying failed task: ${taskId}`);
  
  const task = await coordinator['taskManager'].getTask(taskId);
  if (!task) {
    throw new Error(`Task ${taskId} not found`);
  }

  if (task.status !== 'failed') {
    console.log(`ℹ️  Task ${taskId} is not in failed status (current: ${task.status})`);
    return;
  }

  // Clear error context and move back to ready
  await coordinator['taskManager'].updateTask(taskId, { 
    errorContext: '',
    status: 'ready'
  });
  
  // Move file to ready directory
  await coordinator['taskManager'].moveTask(taskId, 'ready');
  
  console.log(`✅ Task ${taskId} moved back to ready queue`);
  console.log(`📁 Location: .mcp/tasks/ready/${taskId}.md`);
  console.log(`🚀 Ready for rework`);
}

async function listFailedTasks(): Promise<void> {
  console.log('\n❌ Failed Tasks\n');
  
  const tasks = await coordinator['taskManager'].listTasks('failed');
  
  if (tasks.length === 0) {
    console.log('🎉 No failed tasks found!');
    return;
  }

  tasks.forEach((task, index) => {
    console.log(`${index + 1}. ${task.id}: ${task.title}`);
    console.log(`   Priority: ${task.priority}`);
    console.log(`   Agent: ${task.agent}`);
    console.log(`   Failed: ${task.lastUpdated}`);
    
    if (task.errorContext) {
      const errorPreview = task.errorContext.length > 100 
        ? task.errorContext.substring(0, 100) + '...'
        : task.errorContext;
      console.log(`   Error: ${errorPreview}`);
    }
    
    console.log('');
  });

  console.log('💡 Use "npm run mcp:error analyze-error <task-id>" to get detailed analysis');
  console.log('💡 Use "npm run mcp:error retry-task <task-id>" to retry a failed task');
}

main();
