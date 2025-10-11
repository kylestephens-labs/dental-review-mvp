# AWS App Runner + n8n Setup Learnings

## Overview
This document captures the key learnings from setting up n8n workflow automation on AWS App Runner with PostgreSQL database connectivity, including the production deployment and OAuth2 authentication setup.

**Note**: This document covers the initial setup. For production deployment learnings including OAuth2 and VPC connectivity issues, see [aws-app-runner-vpc-connectivity-issues.md](aws-app-runner-vpc-connectivity-issues.md).

## Architecture Components
- **AWS App Runner**: Containerized application hosting
- **Amazon ECR**: Private Docker registry for n8n images
- **Amazon RDS**: PostgreSQL database for n8n data persistence
- **VPC Connector**: Network bridge between App Runner and private RDS
- **CloudWatch**: Logging and monitoring

## Critical Learnings

### 1. Silent Failures in Containerized Applications
**Problem**: n8n 1.0.0 failed silently during database connection, showing only minimal logs.

**Solution**: 
- Upgraded to n8n 1.61.0 which provides detailed error messages
- Added `N8N_LOG_LEVEL=debug` and `N8N_LOG_OUTPUT=console`
- Used `NODE_OPTIONS="--max-old-space-size=1536"` for better memory management

**Key Takeaway**: Always use recent versions of containerized applications for better error visibility.

### 2. Docker Architecture Mismatch
**Problem**: ARM64 images don't work on x86_64 App Runner instances.

**Solution**:
- Used `docker pull --platform linux/amd64 n8nio/n8n:1.61.0`
- Verified architecture with `docker inspect <image> --format '{{.Architecture}}'`
- Tagged and pushed correct architecture to ECR

**Key Takeaway**: Always verify Docker image architecture matches the target platform.

### 3. App Runner Image Source Limitations
**Problem**: App Runner only supports ECR and ECR Public, not Docker Hub directly.

**Solution**:
- Mirrored n8n image from Docker Hub to private ECR
- Used ECR authentication for App Runner access

**Key Takeaway**: Plan for ECR mirroring when using Docker Hub images with App Runner.

### 4. Database Configuration Complexity
**Problem**: RDS instance created without default database, causing connection failures.

**Solution**:
- Created `postgres` database manually: `CREATE DATABASE postgres;`
- Verified user permissions: `n8nadmin` with proper database access
- Added SSL configuration: `DB_POSTGRESDB_SSL=true` and `DB_POSTGRESDB_SSL_REJECT_UNAUTHORIZED=false`

**Key Takeaway**: Always verify database existence and user permissions when setting up RDS.

### 5. VPC Connector Network Requirements
**Problem**: App Runner couldn't reach private RDS instance despite VPC connector configuration.

**Solution**:
- Ensured VPC connector and RDS use same subnets
- Configured security groups to allow port 5432 from VPC connector
- Verified Network ACLs allow all traffic (default configuration)

**Key Takeaway**: VPC connectors require precise subnet and security group alignment.

### 6. Resource Requirements for n8n
**Problem**: n8n failed to start with insufficient memory (0.5GB).

**Solution**:
- Upgraded to 1 vCPU and 2GB memory
- Added connection timeout: `DB_POSTGRESDB_CONNECTION_TIMEOUT=60000`
- Set execution mode: `EXECUTIONS_MODE=regular`

**Key Takeaway**: n8n requires significant memory for startup, migrations, and node loading.

### 7. Environment Variable Configuration
**Critical Variables**:
```bash
# Database Configuration
DB_TYPE=postgresdb
DB_POSTGRESDB_HOST=<rds-endpoint>
DB_POSTGRESDB_PORT=5432
DB_POSTGRESDB_DATABASE=postgres
DB_POSTGRESDB_USER=<username>
DB_POSTGRESDB_PASSWORD=<password>
DB_POSTGRESDB_SSL=true
DB_POSTGRESDB_SSL_REJECT_UNAUTHORIZED=false
DB_POSTGRESDB_CONNECTION_TIMEOUT=60000

# n8n Configuration
N8N_ENCRYPTION_KEY=<secure-key>
N8N_LOG_LEVEL=debug
N8N_LOG_OUTPUT=console
EXECUTIONS_MODE=regular
NODE_OPTIONS=--max-old-space-size=1536

# Webhook Configuration
WEBHOOK_URL=https://automation.serviceboost.co
N8N_PROTOCOL=https
N8N_HOST=automation.serviceboost.co
```

### 8. Debugging Strategy
**Effective Approach**:
1. Test locally with same environment variables
2. Use debug logging to identify failure points
3. Check database connectivity from external sources
4. Verify network configuration step by step
5. Use recent application versions for better error messages

## Final Working Configuration

### App Runner Service
- **Instance**: 1 vCPU, 2GB memory
- **Image**: n8n 1.61.0 (x86_64) from ECR
- **Network**: VPC connector to private subnets
- **Health Check**: HTTP on port 5678

### Database
- **Type**: RDS PostgreSQL 15.14
- **Access**: Private with VPC connector
- **SSL**: Enabled with relaxed validation
- **Timeout**: 60 seconds

### Monitoring
- **Logs**: CloudWatch with debug level
- **Observability**: X-Ray tracing enabled
- **Health**: HTTP endpoint monitoring

## Success Metrics
- ✅ n8n starts successfully
- ✅ Database migrations complete
- ✅ Webhook endpoint responds (HTTP 200)
- ✅ Database queries execute properly
- ✅ Service remains stable

## Lessons for Future Deployments
1. Always start with recent, stable application versions
2. Test database connectivity before deploying applications
3. Use debug logging during initial setup
4. Plan for sufficient memory and CPU resources
5. Verify network configuration thoroughly
6. Document all environment variables and their purposes
7. Test locally with identical configuration before cloud deployment

## Troubleshooting Checklist
- [ ] Verify Docker image architecture
- [ ] Check database existence and permissions
- [ ] Validate VPC connector subnet configuration
- [ ] Confirm security group rules
- [ ] Test database connectivity from VPC
- [ ] Enable debug logging
- [ ] Verify all required environment variables
- [ ] Check resource allocation (CPU/memory)
- [ ] Test webhook endpoint accessibility

---
*Generated: October 9, 2025*  
*Updated: October 10, 2025*  
*Project: Dental Landing Page Automation*
