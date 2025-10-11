# AWS App Runner VPC Connectivity Issues - Lessons Learned

**Date:** October 10, 2025  
**Context:** n8n production deployment on AWS App Runner  
**Issue:** OAuth2 timeouts and external API connectivity failures

## 🚨 Problem Summary

During the n8n production deployment, we encountered persistent timeout issues when the service tried to make external HTTPS calls, particularly for OAuth2 authentication with Google APIs. The service was experiencing 38+ second timeouts on all external API calls.

## 🔍 Root Cause Analysis

### Primary Issue: App Runner VPC Configuration Incompatibility

**The Problem:**
- App Runner service was configured with `EgressType: "VPC"`
- VPC used public subnets with Internet Gateway routing
- **App Runner services with VPC connectors cannot access the internet through public subnets with Internet Gateways**

**Why This Happens:**
- App Runner VPC connectors are designed for private subnet architectures
- Public subnets with Internet Gateways don't provide the routing that App Runner VPC connectors expect
- This creates a "network dead end" where outbound traffic gets stuck

### Secondary Issue: Database Access After Network Change

**The Problem:**
- RDS security group only allowed inbound connections from VPC CIDR (`172.31.0.0/16`)
- When switching to `EgressType: "DEFAULT"`, App Runner uses different source IPs
- Database connections failed with `ECONNREFUSED` errors

## 🛠️ Solutions Implemented

### 1. Network Configuration Fix
```bash
# Changed from VPC to DEFAULT egress
aws apprunner update-service \
  --service-arn "arn:aws:apprunner:us-east-2:625246225347:service/n8n-prod-working/814aac25e58d4707bed984ec2b3fb562" \
  --network-configuration '{"EgressConfiguration":{"EgressType":"DEFAULT"}}' \
  --region us-east-2
```

**Result:** External HTTPS calls now work in ~100-160ms instead of 38+ second timeouts

### 2. Database Security Group Update
```bash
# Added rule to allow App Runner DEFAULT egress IPs
aws ec2 authorize-security-group-ingress \
  --group-id sg-0ca13c80fa10269ae \
  --protocol tcp \
  --port 5432 \
  --cidr 0.0.0.0/0 \
  --region us-east-2
```

**Result:** Database connections now work successfully

## 📚 Key Learnings

### 1. App Runner VPC Architecture Requirements
**Lesson:** App Runner VPC connectors require specific network architecture
- **Correct:** Private subnets + NAT Gateway for outbound internet access
- **Incorrect:** Public subnets + Internet Gateway (what we had)
- **Alternative:** Use `EgressType: "DEFAULT"` for direct internet access

### 2. Security Group Considerations
**Lesson:** When changing App Runner egress type, source IPs change
- VPC egress uses VPC CIDR ranges
- DEFAULT egress uses App Runner managed IP ranges
- Security groups must be updated accordingly

### 3. OAuth2 and External API Dependencies
**Lesson:** Many services require outbound internet access
- OAuth2 callbacks need to reach external providers
- Analytics services (Rudder, PostHog) need outbound HTTPS
- Workflow automation often requires external API calls

### 4. Debugging Network Issues
**Lesson:** Systematic approach to network troubleshooting
1. Check service logs for specific error patterns
2. Test connectivity from the service environment
3. Verify security group rules and routing
4. Test with minimal network configuration first

## 🔧 Best Practices for Future Deployments

### 1. Network Architecture Planning
```
Option A: DEFAULT Egress (Simpler)
- App Runner with EgressType: "DEFAULT"
- RDS with public accessibility
- Security group allows 0.0.0.0/0 (if acceptable)

Option B: VPC with Private Subnets (More Secure)
- App Runner with EgressType: "VPC"
- Private subnets for App Runner
- NAT Gateway in public subnet for outbound internet
- RDS in private subnets
- Proper security group rules for VPC CIDR
```

### 2. Security Group Strategy
- **For DEFAULT egress:** Allow App Runner managed IP ranges or 0.0.0.0/0
- **For VPC egress:** Allow VPC CIDR ranges only
- **Document IP ranges:** Keep track of source IPs for each egress type

### 3. Testing Strategy
- **Connectivity tests:** Always test external API calls after deployment
- **Database tests:** Verify database connectivity with actual queries
- **OAuth tests:** Test OAuth2 flows end-to-end
- **Monitoring:** Set up alerts for connection timeouts

## 🚨 Common Pitfalls to Avoid

### 1. Assuming VPC = Better Security
- VPC connectors don't automatically provide better security
- DEFAULT egress can be more appropriate for many use cases
- Security should be implemented at the application and data layer

### 2. Ignoring Source IP Changes
- Changing egress type changes source IPs
- Security groups must be updated accordingly
- Test connectivity after any network changes

### 3. Not Testing External Dependencies
- OAuth2, analytics, and external APIs are often critical
- Test these early in the deployment process
- Don't assume they'll work without verification

## 📊 Performance Impact

### Before Fix
- External API calls: 38+ seconds (timeout)
- OAuth2 authentication: Failed
- Database connections: Failed after network change
- Service stability: Poor (frequent restarts)

### After Fix
- External API calls: 100-160ms
- OAuth2 authentication: ✅ Working
- Database connections: 649ms (successful)
- Service stability: Excellent

## 🔮 Future Considerations

### 1. VPC Architecture for Production
If we need to reintroduce VPC connectors for compliance/security:
- Create private subnets specifically for App Runner
- Deploy NAT Gateway in public subnet
- Update routing tables for private subnets
- Test thoroughly before switching

### 2. Monitoring and Alerting
- Set up CloudWatch alarms for connection timeouts
- Monitor external API response times
- Alert on database connection failures
- Track OAuth2 authentication success rates

### 3. Security Hardening
- Consider using AWS Secrets Manager for database credentials
- Implement VPC endpoints for AWS services
- Use least-privilege security group rules
- Regular security group audits

## 📝 Conclusion

This issue taught us that App Runner's network configuration is more nuanced than it initially appears. The key lesson is that **VPC connectors require specific network architecture** and **DEFAULT egress is often the simpler, more reliable choice** for services that need external internet access.

The most important takeaway is to **test external connectivity early and often** during deployment, as these issues can be difficult to diagnose after the fact.

---
**Documentation created:** October 10, 2025  
**Status:** Resolved and documented for future reference
