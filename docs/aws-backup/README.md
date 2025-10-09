# AWS Configuration Backup

This directory contains a complete backup of the AWS infrastructure configuration for the n8n automation platform.

## 📁 Backup Contents

### App Runner
- `n8n-prod-working-service.json` - Complete App Runner service configuration
- `n8n-vpc-connector.json` - VPC connector configuration

### RDS Database
- `n8n-database.json` - PostgreSQL database instance configuration

### ECR (Elastic Container Registry)
- `n8n-repository.json` - ECR repository configuration

### VPC & Networking
- `vpc-09e709231c8fc946d.json` - VPC configuration
- `subnets.json` - Subnet configurations
- `security-group-sg-0ca13c80fa10269ae.json` - Security group rules

### IAM
- `AppRunnerECRAccessRole.json` - IAM role configuration
- `AppRunnerECRAccessRole-policies.json` - Attached policies

### CloudWatch
- `log-groups.json` - CloudWatch log group configurations

### Configuration Files
- `environment-variables-template.env` - Template for environment variables (safe to commit)
- `restore-aws-config.sh` - Restoration status check script
- `create-secure-backup.sh` - Script to create secure backup without sensitive data

## 🔒 Security Warning

**NEVER commit sensitive information to version control!**

- Use `environment-variables-template.env` as a template
- Fill in real values in `environment-variables.env` (not committed)
- Use AWS Secrets Manager for production credentials
- Rotate AWS access keys if they were exposed

## 🔄 How to Use This Backup

### Quick Status Check
```bash
./restore-aws-config.sh
```

### Manual Restoration
1. **Review Configuration**: Check the JSON files for exact settings
2. **Recreate Resources**: Use AWS Console or CLI with the backup values
3. **Apply Environment Variables**: Use `environment-variables.env` for App Runner
4. **Verify Network**: Ensure VPC connector and security groups match

### Key Resources to Restore
- **App Runner Service**: `n8n-prod-working`
- **RDS Database**: `n8n-database` (PostgreSQL)
- **ECR Repository**: `n8n`
- **VPC Connector**: `n8n-vpc-connector`
- **Security Group**: `sg-0ca13c80fa10269ae`

## ⚠️ Important Notes

1. **Database Data**: This backup contains configuration only, not actual data
2. **Credentials**: Update passwords and keys before restoration
3. **ARNs**: Account IDs in ARNs will need to be updated for different accounts
4. **Dependencies**: Resources must be created in the correct order (VPC → RDS → ECR → App Runner)

## 📋 Restoration Order

1. VPC and subnets
2. Security groups
3. RDS database instance
4. ECR repository
5. VPC connector
6. App Runner service

## 🔗 Related Documentation

- [Setup Learnings](../learnings/aws-app-runner-n8n-setup.md)
- [AWS Infrastructure Summary](../../README.md#aws-infrastructure)

---
*Backup created: $(date)*
*Region: us-east-2*
*Account: 625246225347*
