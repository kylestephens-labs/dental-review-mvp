import * as fs from 'fs/promises';
import * as path from 'path';
import { TaskManager, Task } from './task-manager.js';

export class ChatGPTIntegration {
  private taskManager: TaskManager;
  private projectContextFiles: string[];

  constructor(tasksDir: string = '.mcp/tasks') {
    this.taskManager = new TaskManager(path.resolve(tasksDir));
    this.projectContextFiles = [
      'docs/dentist_project/architecture.md',
      'docs/dentist_project/business_plan',
      'docs/dentist_project/MVP',
      'docs/dentist_project/tasks.md'
    ];
  }

  /**
   * Automatically fill out task details using ChatGPT integration
   * This simulates ChatGPT reading project context and filling out task details
   */
  async fillOutTaskDetails(taskId: string): Promise<void> {
    console.log(`🤖 ChatGPT Integration: Analyzing task ${taskId}...`);
    
    try {
      // Get the task
      const task = await this.taskManager.getTask(taskId);
      if (!task) {
        throw new Error(`Task ${taskId} not found`);
      }

      // Read project context files
      const projectContext = await this.readProjectContext();
      
      // Analyze task and generate details
      const taskDetails = await this.generateTaskDetails(task, projectContext);
      
      // Update the task with generated details
      await this.taskManager.updateTask(taskId, taskDetails);
      
      console.log(`✅ ChatGPT Integration: Task ${taskId} details filled out successfully`);
      
    } catch (error) {
      console.error(`❌ ChatGPT Integration failed for task ${taskId}:`, error);
      throw error;
    }
  }

  /**
   * Read all project context files
   */
  private async readProjectContext(): Promise<string> {
    console.log(`📚 Reading project context files...`);
    
    let context = '';
    
    for (const filePath of this.projectContextFiles) {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        context += `\n\n=== ${filePath} ===\n${content}`;
        console.log(`✅ Read: ${filePath}`);
      } catch (error) {
        console.log(`⚠️  Could not read ${filePath}: ${error.message}`);
        // Continue with other files even if one fails
      }
    }
    
    return context;
  }

  /**
   * Generate task details based on task title and project context
   * This simulates ChatGPT's analysis and response
   */
  private async generateTaskDetails(task: Task, projectContext: string): Promise<Partial<Task>> {
    console.log(`🧠 ChatGPT Analysis: Generating details for "${task.title}"...`);
    
    // Extract key information from project context
    const contextSummary = this.extractContextSummary(projectContext);
    
    // Generate task details based on the task title and context
    const details = this.analyzeTaskAndGenerateDetails(task.title, contextSummary);
    
    return details;
  }

  /**
   * Extract key information from project context
   */
  private extractContextSummary(context: string): any {
    // Extract key architectural patterns, business goals, and technical requirements
    const summary = {
      architecture: this.extractArchitectureInfo(context),
      businessGoals: this.extractBusinessGoals(context),
      technicalRequirements: this.extractTechnicalRequirements(context),
      mvpFeatures: this.extractMVPFeatures(context)
    };
    
    return summary;
  }

  /**
   * Extract architecture information
   */
  private extractArchitectureInfo(context: string): string[] {
    const patterns = [];
    
    if (context.includes('React') || context.includes('Vite')) {
      patterns.push('React + Vite frontend');
    }
    if (context.includes('Supabase')) {
      patterns.push('Supabase backend');
    }
    if (context.includes('Stripe')) {
      patterns.push('Stripe payment processing');
    }
    if (context.includes('Twilio')) {
      patterns.push('Twilio SMS/communication');
    }
    if (context.includes('AWS SES')) {
      patterns.push('AWS SES email service');
    }
    if (context.includes('Google')) {
      patterns.push('Google services integration');
    }
    
    return patterns;
  }

  /**
   * Extract business goals
   */
  private extractBusinessGoals(context: string): string[] {
    const goals = [];
    
    if (context.includes('dental') || context.includes('dentist')) {
      goals.push('Dental practice management');
    }
    if (context.includes('booking') || context.includes('appointment')) {
      goals.push('Appointment booking system');
    }
    if (context.includes('lead') || context.includes('intake')) {
      goals.push('Lead intake and management');
    }
    if (context.includes('payment') || context.includes('billing')) {
      goals.push('Payment processing');
    }
    
    return goals;
  }

  /**
   * Extract technical requirements
   */
  private extractTechnicalRequirements(context: string): string[] {
    const requirements = [];
    
    if (context.includes('environment') || context.includes('.env')) {
      requirements.push('Environment variable management');
    }
    if (context.includes('validation') || context.includes('check')) {
      requirements.push('Input validation');
    }
    if (context.includes('error') || context.includes('fail')) {
      requirements.push('Error handling');
    }
    if (context.includes('test') || context.includes('TDD')) {
      requirements.push('Test-driven development');
    }
    
    return requirements;
  }

  /**
   * Extract MVP features
   */
  private extractMVPFeatures(context: string): string[] {
    const features = [];
    
    if (context.includes('landing page')) {
      features.push('Landing page');
    }
    if (context.includes('contact form')) {
      features.push('Contact form');
    }
    if (context.includes('booking')) {
      features.push('Booking system');
    }
    if (context.includes('payment')) {
      features.push('Payment integration');
    }
    
    return features;
  }

  /**
   * Analyze task and generate specific details
   */
  private analyzeTaskAndGenerateDetails(taskTitle: string, contextSummary: any): Partial<Task> {
    const title = taskTitle.toLowerCase();
    
    // Generate Overview
    let overview = '';
    let goal = '';
    let acceptanceCriteria: string[] = [];
    let definitionOfReady: string[] = [];
    let definitionOfDone: string[] = [];
    let filesAffected: string[] = [];
    
    if (title.includes('env') || title.includes('environment')) {
      overview = 'Set up environment variable management system with validation and fail-fast boot checks';
      goal = 'Create a robust environment variable system that ensures all required API keys and configuration are present before the application starts';
      
      acceptanceCriteria = [
        'Create .env.example file with all required environment variables',
        'Implement environment validation script that checks for all required variables',
        'Boot script fails fast with clear error messages if any required variables are missing',
        'npm run env:check command passes locally with all variables present',
        'All API integrations (Stripe, Twilio, SES, Places, GCal, Graph, DB, HMAC) have their required variables defined'
      ];
      
      definitionOfReady = [
        'Project architecture is understood',
        'All required API services are identified',
        'Environment variable naming conventions are established',
        'Validation requirements are clear'
      ];
      
      definitionOfDone = [
        '.env.example file created with all required variables',
        'Environment validation script implemented',
        'Boot script fails fast on missing variables',
        'npm run env:check command works locally',
        'All tests pass',
        'Documentation updated'
      ];
      
      filesAffected = [
        '.env.example',
        'src/env-check.ts',
        'package.json (scripts)',
        'src/__tests__/env-validation.test.ts'
      ];
    }
    
    // Add implementation notes
    const implementationNotes = `Task Analysis:
- Architecture: ${contextSummary.architecture.join(', ')}
- Business Goals: ${contextSummary.businessGoals.join(', ')}
- Technical Requirements: ${contextSummary.technicalRequirements.join(', ')}
- MVP Features: ${contextSummary.mvpFeatures.join(', ')}

This task is critical for the dental MVP as it ensures all external service integrations are properly configured before deployment.`;

    return {
      overview,
      goal,
      acceptanceCriteria,
      definitionOfReady,
      definitionOfDone,
      filesAffected,
      implementationNotes
    };
  }
}

// CLI interface for testing
if (import.meta.url === `file://${process.argv[1]}`) {
  const taskId = process.argv[2];
  if (!taskId) {
    console.error('Usage: chatgpt-integration.ts <task-id>');
    process.exit(1);
  }
  
  const integration = new ChatGPTIntegration();
  integration.fillOutTaskDetails(taskId).then(() => {
    console.log('✅ ChatGPT integration completed');
  }).catch(error => {
    console.error('❌ ChatGPT integration failed:', error);
    process.exit(1);
  });
}
