#!/bin/bash
# Supabase Database Deployment Script
# This script handles deploying database migrations to Supabase

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if Supabase CLI is installed
check_supabase_cli() {
    if ! command -v supabase &> /dev/null; then
        print_error "Supabase CLI is not installed. Please install it first:"
        echo "npm install -g supabase"
        exit 1
    fi
    print_success "Supabase CLI is installed"
}

# Function to check if we're logged in
check_auth() {
    if ! supabase projects list &> /dev/null; then
        print_error "Not authenticated with Supabase. Please login first:"
        echo "supabase login"
        exit 1
    fi
    print_success "Authenticated with Supabase"
}

# Function to show current project status
show_project_status() {
    print_status "Current Supabase project status:"
    supabase status
    echo ""
}

# Function to deploy migrations to remote
deploy_migrations() {
    print_status "Deploying migrations to remote Supabase project..."
    
    # Check if there are pending migrations
    local pending_migrations=$(supabase migration list --local | grep -c "pending" || echo "0")
    
    if [ "$pending_migrations" -eq 0 ]; then
        print_warning "No pending migrations found"
        return 0
    fi
    
    print_status "Found $pending_migrations pending migrations"
    
    # Deploy migrations
    if supabase db push; then
        print_success "Migrations deployed successfully!"
    else
        print_error "Failed to deploy migrations"
        exit 1
    fi
}

# Function to verify deployment
verify_deployment() {
    print_status "Verifying deployment..."
    
    # Check if we can connect to remote database
    if supabase db remote commit; then
        print_success "Remote database is accessible"
    else
        print_warning "Could not verify remote database connection"
    fi
}

# Function to show deployment summary
show_deployment_summary() {
    print_status "Deployment Summary:"
    echo "  • Local migrations: $(supabase migration list --local | wc -l)"
    echo "  • Remote migrations: $(supabase migration list --remote | wc -l)"
    echo "  • Project: $(supabase projects list | grep '●' | awk '{print $4}')"
    echo ""
}

# Main deployment function
main() {
    echo "🚀 Supabase Database Deployment Pipeline"
    echo "========================================"
    echo ""
    
    # Pre-flight checks
    check_supabase_cli
    check_auth
    
    # Show current status
    show_project_status
    
    # Deploy migrations
    deploy_migrations
    
    # Verify deployment
    verify_deployment
    
    # Show summary
    show_deployment_summary
    
    print_success "Deployment completed successfully! 🎉"
}

# Handle command line arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "status")
        show_project_status
        ;;
    "verify")
        verify_deployment
        ;;
    "help"|"-h"|"--help")
        echo "Supabase Database Deployment Script"
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  deploy  - Deploy migrations to remote (default)"
        echo "  status  - Show current project status"
        echo "  verify  - Verify remote deployment"
        echo "  help    - Show this help message"
        echo ""
        echo "Examples:"
        echo "  $0 deploy    # Deploy all pending migrations"
        echo "  $0 status    # Show project status"
        echo "  $0 verify    # Verify remote deployment"
        ;;
    *)
        print_error "Unknown command: $1"
        echo "Use '$0 help' for usage information"
        exit 1
        ;;
esac
