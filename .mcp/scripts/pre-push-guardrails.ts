#!/usr/bin/env tsx

import { TaskManager } from '../tools/task-manager.js';
import * as path from 'path';

/**
 * Pre-push guardrails to check for unresolved Codex feedback
 */
async function checkUnresolvedFeedback(): Promise<void> {
  console.log('🔍 Checking for unresolved Codex feedback...');
  
  const taskManager = new TaskManager(path.resolve('.mcp/tasks'));
  
  // Get all completed tasks
  const completedTasks = await taskManager.getTasksByStatus('completed');
  
  const unresolvedTasks: string[] = [];
  
  for (const task of completedTasks) {
    if (task.reviewFeedback && !task.feedbackResolved) {
      unresolvedTasks.push(task.id);
    }
  }
  
  if (unresolvedTasks.length > 0) {
    console.error('🚫 GitHub push blocked - Unresolved Codex feedback detected:');
    console.error('');
    
    for (const taskId of unresolvedTasks) {
      const task = await taskManager.getTask(taskId);
      if (task) {
        console.error(`  📋 Task: ${task.title} (${taskId})`);
        console.error(`  📁 Location: .mcp/tasks/completed/${taskId}.md`);
        console.error(`  ⚠️  Action Required: Address Codex feedback before pushing`);
        console.error('');
      }
    }
    
    console.error('💡 To resolve:');
    console.error('  1. Address the Codex feedback in each task');
    console.error('  2. Run: npm run mcp:resolve-feedback <task-id>');
    console.error('  3. Then retry: git push');
    console.error('');
    console.error('🚫 Push blocked to maintain code quality standards');
    
    process.exit(1);
  }
  
  console.log('✅ All Codex feedback resolved - GitHub push allowed');
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  checkUnresolvedFeedback().catch(error => {
    console.error('❌ Pre-push guardrails check failed:', error.message);
    process.exit(1);
  });
}

export { checkUnresolvedFeedback };
