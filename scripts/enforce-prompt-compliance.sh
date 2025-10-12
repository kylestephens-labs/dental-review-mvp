#!/bin/bash

# MCP Orchestrator Prompt Compliance Enforcement
# Ensures Cursor follows the complete prompt protocol before task execution

set -e

# Function to display colored output
log_info() {
  echo -e "\033[0;34m[INFO]\033[0m $1"
}

log_success() {
  echo -e "\033[0;32m[SUCCESS]\033[0m $1"
}

log_warn() {
  echo -e "\033[0;33m[WARN]\033[0m $1"
}

log_error() {
  echo -e "\033[0;31m[ERROR]\033[0m $1" >&2
}

# Check if required context files exist and are readable
check_context_files() {
  local missing_files=()
  local required_files=(
    "docs/dentist_project/architecture.md"
    "docs/dentist_project/business_plan"
    "docs/dentist_project/MVP"
    "docs/dentist_project/tasks.md"
    "docs/ mcp/mcp-orchestrator-spec.md"
    ".mcp/README.md"
    ".rules/00-100x-workflow.md"
    ".rules/02-trunk-based-development.md"
    "docs/mvp-working-agreement.md"
  )
  
  log_info "Checking required context files..."
  
  for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
      missing_files+=("$file")
    fi
  done
  
  if [ ${#missing_files[@]} -ne 0 ]; then
    log_error "Missing required context files:"
    for file in "${missing_files[@]}"; do
      echo "  - $file"
    done
    exit 1
  fi
  
  log_success "All required context files exist"
}

# Generate context verification questions
generate_context_questions() {
  log_info "Generating context verification questions..."
  
  cat > ".mcp/context-verification.md" << 'EOF'
# Context Verification Questions

**CRITICAL:** You must answer these questions to prove you've read the required context files.

## Architecture & Business Context Questions

1. **Architecture.md**: What database should be used for core business data (practices, patients, visits)?
   - [ ] AWS RDS PostgreSQL
   - [ ] Supabase PostgreSQL
   - [ ] Other: ___________

2. **Architecture.md**: What should Supabase contain?
   - [ ] All core business tables
   - [ ] Only lead generation data
   - [ ] Only authentication data
   - [ ] Other: ___________

3. **Business Plan**: What is the target market for this dental MVP?
   - [ ] Individual dentists
   - [ ] Dental practice chains
   - [ ] Dental software companies
   - [ ] Other: ___________

4. **MVP**: What is the primary revenue model?
   - [ ] Subscription-based
   - [ ] One-time purchase
   - [ ] Commission-based
   - [ ] Other: ___________

5. **Tasks.md**: What is the current task you're working on?
   - [ ] SQL migration 001: core tables
   - [ ] Stripe integration
   - [ ] Twilio SMS setup
   - [ ] Other: ___________

## MCP Orchestrator Questions

6. **MCP Spec**: What is the correct task lifecycle?
   - [ ] pending → ready → in-progress → review → completed
   - [ ] pending → in-progress → completed
   - [ ] ready → in-progress → review → completed
   - [ ] Other: ___________

7. **MCP README**: Who fills out task details automatically?
   - [ ] Cursor
   - [ ] ChatGPT
   - [ ] Codex
   - [ ] Manual entry
   - [ ] Other: ___________

## Development Practices Questions

8. **100x Workflow**: What is the conflict-first gate?
   - [ ] Check for merge conflicts before starting
   - [ ] Check for code conflicts
   - [ ] Check for environment conflicts
   - [ ] Other: ___________

9. **Trunk-based Development**: How should commits be made?
   - [ ] Direct to main branch
   - [ ] Through feature branches
   - [ ] Through pull requests only
   - [ ] Other: ___________

## Architecture Compliance Questions

10. **Architecture.md**: What is the correct database architecture?
    - [ ] All data in Supabase
    - [ ] All data in AWS RDS
    - [ ] Core business data in RDS, lead generation in Supabase
    - [ ] Other: ___________

**VERIFICATION REQUIRED:** You must answer ALL questions correctly to proceed with task execution.
EOF
  
  log_success "Context verification questions generated"
}

# Verify context understanding
verify_context_understanding() {
  log_info "Verifying context understanding..."
  
  if [ ! -f ".mcp/context-verification.md" ]; then
    log_error "Context verification file not found. Run generate_context_questions first."
    exit 1
  fi
  
  log_warn "CRITICAL: You must answer the context verification questions before proceeding."
  log_warn "Open .mcp/context-verification.md and answer all questions correctly."
  
  echo ""
  echo "Press Enter when you've answered all questions..."
  read -r
  
  log_info "Checking if context verification is complete..."
  
  # Check if verification file has been updated with answers
  if grep -q "\[x\]" ".mcp/context-verification.md"; then
    log_success "Context verification appears complete"
  else
    log_error "Context verification incomplete. Please answer all questions."
    exit 1
  fi
}

# Enforce prompt compliance before task execution
enforce_prompt_compliance() {
  local task_id="$1"
  
  if [ -z "$task_id" ]; then
    log_error "Task ID required for prompt compliance enforcement"
    exit 1
  fi
  
  log_info "Enforcing prompt compliance for task: $task_id"
  
  # Step 1: Check context files
  check_context_files
  
  # Step 2: Generate verification questions
  generate_context_questions
  
  # Step 3: Verify understanding
  verify_context_understanding
  
  # Step 4: Check architecture compliance
  check_architecture_compliance "$task_id"
  
  log_success "Prompt compliance enforcement complete"
}

# Check architecture compliance for specific task
check_architecture_compliance() {
  local task_id="$1"
  
  log_info "Checking architecture compliance for task: $task_id"
  
  # Read task file to understand what's being implemented
  local task_file=".mcp/tasks/in-progress/${task_id}.md"
  if [ ! -f "$task_file" ]; then
    task_file=".mcp/tasks/ready/${task_id}.md"
  fi
  
  if [ ! -f "$task_file" ]; then
    log_error "Task file not found: $task_file"
    exit 1
  fi
  
  # Check if task involves database operations
  if grep -qi "database\|sql\|table\|migration" "$task_file"; then
    log_info "Task involves database operations - checking architecture compliance"
    
    # Verify RDS vs Supabase usage
    if grep -qi "supabase" "$task_file" && ! grep -qi "lead.*generation\|leads" "$task_file"; then
      log_error "ARCHITECTURE VIOLATION: Task appears to use Supabase for core business data"
      log_error "According to architecture.md, Supabase should only contain lead generation data"
      log_error "Core business data should be in AWS RDS"
      exit 1
    fi
  fi
  
  log_success "Architecture compliance check passed"
}

# Main execution
main() {
  case "$1" in
    "check")
      check_context_files
      ;;
    "generate")
      generate_context_questions
      ;;
    "verify")
      verify_context_understanding
      ;;
    "enforce")
      enforce_prompt_compliance "$2"
      ;;
    *)
      log_info "Usage: $0 [check|generate|verify|enforce <task-id>]"
      log_info "  check    - Check if required context files exist"
      log_info "  generate - Generate context verification questions"
      log_info "  verify   - Verify context understanding"
      log_info "  enforce  - Enforce prompt compliance for specific task"
      exit 1
      ;;
  esac
}

# Run main function
main "$@"
