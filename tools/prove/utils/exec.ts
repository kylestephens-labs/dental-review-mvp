// Safe command exec with {code, stdout, stderr}
// Wraps child_process.spawn/execFile with proper error handling

import { spawn, execFile as execFileCb } from 'child_process';
import { promisify } from 'util';
import { logger } from '../logger.js';

const execFileAsync = promisify(execFileCb);

export interface ExecResult {
  code: number;
  stdout: string;
  stderr: string;
  success: boolean;
}

export interface ExecOptions {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  timeout?: number;
  maxBuffer?: number;
  shell?: boolean | string;
}

/**
 * Execute a command using spawn for better control over output streams
 * @param command - The command to execute
 * @param args - Command arguments
 * @param options - Execution options
 * @returns Promise<ExecResult>
 */
export async function exec(
  command: string,
  args: string[] = [],
  options: ExecOptions = {}
): Promise<ExecResult> {
  const {
    cwd = process.cwd(),
    env = process.env,
    timeout = 300000, // 5 minutes default
    maxBuffer = 1024 * 1024, // 1MB
    shell = false,
  } = options;

  return new Promise((resolve) => {
    const startTime = Date.now();
    let stdout = '';
    let stderr = '';

    logger.info(`Executing command: ${command} ${args.join(' ')}`, {
      cwd,
      timeout,
    });

    const child = spawn(command, args, {
      cwd,
      env,
      shell,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    // Set up timeout
    const timeoutId = setTimeout(() => {
      child.kill('SIGTERM');
      logger.error(`Command timed out after ${timeout}ms`, {
        command: `${command} ${args.join(' ')}`,
        timeout,
      });
      resolve({
        code: 124, // Standard timeout exit code
        stdout,
        stderr: stderr + `\nCommand timed out after ${timeout}ms`,
        success: false,
      });
    }, timeout);

    // Capture stdout
    child.stdout?.on('data', (data) => {
      const chunk = data.toString();
      stdout += chunk;
      
      // Prevent buffer overflow
      if (stdout.length > maxBuffer) {
        child.kill('SIGTERM');
        logger.error('Command output exceeded max buffer size', {
          command: `${command} ${args.join(' ')}`,
          maxBuffer,
        });
        resolve({
          code: 125, // Custom exit code for buffer overflow
          stdout: stdout.substring(0, maxBuffer) + '\n... (truncated)',
          stderr: stderr + '\nOutput truncated due to buffer size limit',
          success: false,
        });
      }
    });

    // Capture stderr
    child.stderr?.on('data', (data) => {
      const chunk = data.toString();
      stderr += chunk;
      
      // Prevent buffer overflow
      if (stderr.length > maxBuffer) {
        child.kill('SIGTERM');
        logger.error('Command error output exceeded max buffer size', {
          command: `${command} ${args.join(' ')}`,
          maxBuffer,
        });
        resolve({
          code: 125, // Custom exit code for buffer overflow
          stdout,
          stderr: stderr.substring(0, maxBuffer) + '\n... (truncated)',
          success: false,
        });
      }
    });

    // Handle process completion
    child.on('close', (code) => {
      clearTimeout(timeoutId);
      const duration = Date.now() - startTime;
      
      const result: ExecResult = {
        code: code || 0,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        success: code === 0,
      };

      if (result.success) {
        logger.success(`Command completed successfully in ${duration}ms`, {
          command: `${command} ${args.join(' ')}`,
          duration,
          outputLength: stdout.length,
        });
      } else {
        logger.error(`Command failed with exit code ${code}`, {
          command: `${command} ${args.join(' ')}`,
          code,
          duration,
          stderr: stderr.substring(0, 500), // Truncate for logging
        });
      }

      resolve(result);
    });

    // Handle process errors
    child.on('error', (error) => {
      clearTimeout(timeoutId);
      logger.error('Command execution failed', {
        command: `${command} ${args.join(' ')}`,
        error: error.message,
      });
      
      resolve({
        code: 126, // Command not found or not executable
        stdout,
        stderr: stderr + `\nExecution error: ${error.message}`,
        success: false,
      });
    });
  });
}

/**
 * Execute a command using execFile for simpler commands
 * @param command - The command to execute
 * @param args - Command arguments
 * @param options - Execution options
 * @returns Promise<ExecResult>
 */
export async function execFile(
  command: string,
  args: string[] = [],
  options: ExecOptions = {}
): Promise<ExecResult> {
  const {
    cwd = process.cwd(),
    env = process.env,
    timeout = 300000,
    maxBuffer = 1024 * 1024,
  } = options;

  try {
    logger.info(`Executing file: ${command} ${args.join(' ')}`, {
      cwd,
      timeout,
    });

    const startTime = Date.now();
    const { stdout, stderr } = await execFileAsync(command, args, {
      cwd,
      env,
      timeout,
      maxBuffer,
    });

    const duration = Date.now() - startTime;
    const result: ExecResult = {
      code: 0,
      stdout: stdout.trim(),
      stderr: stderr.trim(),
      success: true,
    };

    logger.success(`File executed successfully in ${duration}ms`, {
      command: `${command} ${args.join(' ')}`,
      duration,
      outputLength: stdout.length,
    });

    return result;
  } catch (error: unknown) {
    const result: ExecResult = {
      code: error.code || 1,
      stdout: error.stdout || '',
      stderr: error.stderr || error.message || '',
      success: false,
    };

    logger.error('File execution failed', {
      command: `${command} ${args.join(' ')}`,
      code: result.code,
      stderr: result.stderr.substring(0, 500),
    });

    return result;
  }
}

/**
 * Execute a shell command (convenience wrapper)
 * @param command - The shell command to execute
 * @param options - Execution options
 * @returns Promise<ExecResult>
 */
export async function execShell(
  command: string,
  options: ExecOptions = {}
): Promise<ExecResult> {
  return exec(command, [], { ...options, shell: true });
}

/**
 * Check if a command exists in PATH
 * @param command - The command to check
 * @returns Promise<boolean>
 */
export async function commandExists(command: string): Promise<boolean> {
  try {
    const result = await exec('which', [command]);
    return result.success && result.stdout.trim().length > 0;
  } catch {
    return false;
  }
}
