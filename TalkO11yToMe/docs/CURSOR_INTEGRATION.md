# Cursor IDE Integration Guide

Transform your development workflow with AI-powered observability using TalkO11yToMe and Cursor IDE.

## 🚀 Quick Start

### **1. Project Setup in Cursor**

```bash
# Open TalkO11yToMe in Cursor
cursor /path/to/TalkO11yToMe

# Ensure environment is configured
cp env/env.template env/.env.dev
# Edit .env.dev with your Dynatrace credentials
```

### **2. Essential First Steps**
1. **Index the codebase**: Let Cursor understand your tools and documentation
2. **Test connectivity**: Run a quick health check
3. **Configure environment**: Set up your Dynatrace environment type
4. **Learn the workflow**: Start with basic AI analysis

## 🧠 AI-Powered Development Workflows

### **Morning Standup Routine**

**Cursor AI Prompt:**
```
I'm starting my day. Please run our Dynatrace monitoring dashboard and give me:

1. Current system health status
2. Any overnight issues that need attention
3. Top 3 priorities for today based on the data
4. Any Lambda functions showing degraded performance

Run: node tools/dynatrace-monitor.js
```

**Expected AI Actions:**
- ✅ Execute monitoring dashboard
- ✅ Analyze results with visual formatting
- ✅ Prioritize issues by severity and business impact
- ✅ Provide actionable recommendations

### **Pre-Deployment Health Check**

**Cursor AI Prompt:**
```
I'm about to deploy changes to [service-name]. Please:

1. Check current health of related services
2. Look for any existing problems that might interfere
3. Analyze recent performance trends
4. Give me a go/no-go recommendation

Focus on: [specific-lambda-functions or services]

Run: node tools/grail-log-query.js "service-name" now-2h
Run: node tools/dynatrace-monitor.js
```

### **Incident Response Workflow**

**When an alert comes in:**
```
🚨 INCIDENT: [Brief description]

Please help me investigate:

1. Run comprehensive problem analysis
2. Identify root cause indicators
3. Check for related Lambda function errors
4. Suggest immediate remediation steps
5. Create an action plan

Start with: node tools/grail-log-query.js "error" now-1h
Then: node tools/classic-api-client.js problems 20
```

### **Performance Debugging Session**

**When performance issues arise:**
```
I'm debugging slow response times in [service-name]. Please:

1. Analyze recent performance data
2. Look for Lambda timeout issues
3. Check for database connection problems
4. Identify performance bottlenecks
5. Suggest optimization strategies

Commands:
node tools/grail-log-query.js "timeout" now-4h
node tools/classic-api-client.js lambda-problems now-12h
```

## 🎯 Advanced AI Analysis Patterns

### **Root Cause Analysis Pattern**

**Multi-Step Investigation:**
```
STEP 1: Get the overview
"Run node tools/dynatrace-monitor.js and summarize the current state"

STEP 2: Deep dive into problems
"Run node tools/classic-api-client.js problems 25 and categorize by service impact"

STEP 3: Analyze specific services
"Run node tools/grail-log-query.js '[service-name]' now-6h and look for patterns"

STEP 4: Generate recommendations
"Based on all this data, create a comprehensive incident response plan"
```

### **Security Analysis Pattern**

**Vulnerability Assessment:**
```
SECURITY REVIEW: Please analyze our environment for security concerns:

1. Check for authentication failures
2. Look for suspicious Lambda function errors
3. Identify potential security vulnerabilities
4. Review access patterns and anomalies
5. Create a security action plan

Commands:
node tools/grail-log-query.js "auth" now-24h
node tools/grail-log-query.js "unauthorized" now-24h
node tools/classic-api-client.js problems 50
```

### **Capacity Planning Pattern**

**Performance Trending:**
```
CAPACITY PLANNING: Help me understand our resource utilization:

1. Analyze Lambda function performance trends
2. Identify scaling bottlenecks
3. Look for resource exhaustion patterns
4. Predict future capacity needs
5. Recommend infrastructure improvements

Run multiple time ranges:
node tools/grail-log-query.js "high load" now-7d
node tools/classic-api-client.js lambda-problems now-7d
```

## 🛠️ Cursor-Specific Best Practices

### **1. Environment Management**

**Use Cursor's environment variable support:**
```bash
# In Cursor terminal
export $(cat env/.env.dev | xargs)
echo $DT_ENVIRONMENT  # Verify environment is loaded
```

**Environment switching:**
```bash
# Quick environment switching
alias dt-dev="export $(cat env/.env.dev | xargs)"
alias dt-prod="export $(cat env/.env.prod | xargs)"
```

### **2. Efficient Prompt Patterns**

**Template for Structured Analysis:**
```
ANALYSIS REQUEST: [Problem Description]

CONTEXT:
- Environment: [Grail/Classic]
- Service: [service-name]
- Time Range: [duration]
- Severity: [High/Medium/Low]

COMMANDS TO RUN:
[Specific tool commands]

ANALYSIS NEEDED:
1. [Specific analysis point]
2. [Specific analysis point]
3. [Specific analysis point]

OUTPUT FORMAT:
- Executive Summary
- Technical Details
- Recommended Actions
- Follow-up Items
```

### **3. Code Integration Workflows**

**Pre-Commit Health Check:**
```
Before I commit these changes, please check if they might impact:

1. Services we're modifying: [list services]
2. Current system health
3. Any ongoing incidents
4. Recent performance trends

Run: node tools/dynatrace-monitor.js
Then: node tools/grail-log-query.js "[service-keywords]" now-2h

Give me a commit readiness assessment.
```

**Post-Deploy Verification:**
```
I just deployed [changes]. Please monitor and verify:

1. No new errors introduced
2. Performance metrics remain stable
3. No increase in problem frequency
4. All related services functioning normally

Monitor for 15 minutes, then give me a deployment success report.

Use: node tools/dynatrace-monitor.js (run now and in 15 minutes)
```

## 📋 Ready-to-Use Templates

### **Daily Health Check Template**
```
🌅 DAILY HEALTH CHECK

Please run our morning monitoring routine:

1. node tools/dynatrace-monitor.js
2. Analyze overnight activity
3. Identify top 3 priorities for today
4. Check Lambda function health
5. Look for any security concerns

Provide:
- ✅ Overall health status (Green/Yellow/Red)
- 📊 Key metrics summary
- ⚠️ Issues requiring attention
- 🎯 Recommended focus areas
```

### **Incident Investigation Template**
```
🚨 INCIDENT INVESTIGATION: [Incident ID/Description]

TIME: [When incident occurred]
IMPACT: [User/service impact]
INITIAL SYMPTOMS: [What was observed]

INVESTIGATION STEPS:
1. node tools/grail-log-query.js "[keywords]" [time-range]
2. node tools/classic-api-client.js problems 30
3. node tools/dynatrace-monitor.js

ANALYSIS REQUIRED:
- Root cause identification
- Impact assessment
- Timeline reconstruction
- Remediation recommendations
- Prevention strategies

FORMAT:
📋 Executive Summary
🔍 Technical Analysis
⚡ Immediate Actions
📈 Long-term Improvements
```

### **Performance Review Template**
```
📊 PERFORMANCE REVIEW: [Service/Period]

SCOPE: [Services or time period to analyze]
GOALS: [What we're trying to understand]

COMMANDS:
1. node tools/grail-log-query.js "[performance-keywords]" now-7d
2. node tools/classic-api-client.js lambda-problems now-7d
3. node tools/dynatrace-monitor.js

ANALYSIS FRAMEWORK:
- Performance trends
- Error patterns
- Resource utilization
- User impact
- Optimization opportunities

DELIVERABLES:
- Performance scorecard
- Trend analysis
- Optimization roadmap
- Resource requirements
```

## 🔄 Integration Workflows

### **Development Lifecycle Integration**

**1. Feature Development**
```bash
# Start feature development
cursor [project-directory]

# AI Prompt: "Check current system health before I start development"
# AI runs: node tools/dynatrace-monitor.js
```

**2. Code Review Preparation**
```bash
# AI Prompt: "Analyze recent performance data for services I'm modifying"
# AI provides context for code review discussions
```

**3. Testing Phase**
```bash
# AI Prompt: "Monitor system during testing and alert if issues arise"
# AI tracks metrics during test execution
```

**4. Deployment Readiness**
```bash
# AI Prompt: "Run pre-deployment health check and give go/no-go recommendation"
# AI provides deployment readiness assessment
```

### **Monitoring Integration**

**Continuous Monitoring Setup:**
```bash
# Set up Cursor tasks for regular monitoring
# .vscode/tasks.json (works with Cursor)
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Dynatrace Health Check",
      "type": "shell",
      "command": "node",
      "args": ["tools/dynatrace-monitor.js"],
      "group": "build",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "shared"
      }
    }
  ]
}
```

## 🎯 Real-World Scenarios

### **Scenario 1: Lambda Function Debugging**

**Problem**: Lambda function experiencing intermittent timeouts

**Cursor Workflow:**
1. **Initial Investigation**: "Analyze Lambda timeout patterns in the last 24 hours"
2. **Deep Dive**: "Look for correlations between timeouts and other system events"
3. **Solution Development**: "Help me identify code changes that might resolve this"
4. **Verification**: "Monitor the function after deployment to confirm fix"

### **Scenario 2: Security Incident Response**

**Problem**: Suspicious authentication failures detected

**Cursor Workflow:**
1. **Immediate Assessment**: "Analyze authentication failure patterns and assess threat level"
2. **Impact Analysis**: "Determine which services and users are affected"
3. **Containment**: "Help me implement immediate security measures"
4. **Investigation**: "Trace the source and timeline of the security event"

### **Scenario 3: Performance Optimization**

**Problem**: Overall system performance degradation

**Cursor Workflow:**
1. **Baseline Analysis**: "Establish performance baselines for the last 30 days"
2. **Bottleneck Identification**: "Identify the top 5 performance bottlenecks"
3. **Optimization Planning**: "Create an optimization roadmap with priorities"
4. **Implementation Tracking**: "Monitor improvements as changes are deployed"

## 💡 Tips for Success

### **1. Context Management**
- Keep Cursor's context window fresh with recent data
- Use specific time ranges for more relevant results
- Reference previous analysis to build on insights

### **2. Prompt Engineering**
- Be specific about what analysis you need
- Provide context about your environment and goals
- Ask for structured outputs (summaries, action items, etc.)

### **3. Workflow Optimization**
- Create reusable prompt templates for common scenarios
- Use Cursor's command palette for quick tool access
- Set up keyboard shortcuts for frequent operations

### **4. Team Collaboration**
- Share analysis results through Cursor's collaboration features
- Create shared prompt libraries for team consistency
- Document common workflows for team onboarding

---

**🎉 Ready to supercharge your development workflow?** Start with the [Daily Health Check Template](#daily-health-check-template) and customize it for your team's needs!

For more detailed tool usage, see the [Tools Guide](TOOLS_GUIDE.md) and [Technical Solution](DYNATRACE_LOGS_SOLUTION.md) documentation. 