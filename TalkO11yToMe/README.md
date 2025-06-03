# TalkO11yToMe: Learning MCP Servers with Dynatrace Integration

Welcome to your MCP (Model Context Protocol) learning journey! This project will help you understand MCP servers, their use cases, and specifically how to integrate with Dynatrace tenants for powerful observability-driven AI workflows.

## 🚨 **IMPORTANT: Grail vs Classic Environment Support**

**Your Dynatrace environment type determines which tools and configuration you need:**

### **🆕 Grail Environment** (Recommended - Modern Platform)
- **URL Pattern**: `https://xxx.apps.dynatrace.com`
- **Authentication**: OAuth Bearer tokens **required**
- **API Endpoints**: `/platform/classic/environment-api/v2/`
- **Primary Tool**: `grail-log-query.js` ✅
- **MCP Server**: ❌ Not yet supported

### **🏛️ Classic Environment** (Legacy Platform)  
- **URL Pattern**: `https://xxx.live.dynatrace.com`
- **Authentication**: API tokens OR OAuth
- **API Endpoints**: `/api/v2/`
- **Primary Tool**: `working-log-query.js` ✅
- **MCP Server**: ✅ Supported

**📖 See [Environment Detection Guide](#environment-detection) below for setup details.**

## 📚 Table of Contents

1. [What is MCP?](#what-is-mcp)
2. [Understanding MCP Architecture](#understanding-mcp-architecture)
3. [Dynatrace MCP Server](#dynatrace-mcp-server)
4. [Setup Instructions](#setup-instructions)
5. [Working Tools](#working-tools)
6. [Quick Start Demo](#quick-start-demo)
7. [Real-World Use Cases](#real-world-use-cases)
8. [Resources](#resources)

## 🤖 What is MCP?

The Model Context Protocol (MCP) is an open standard that enables AI systems (like Claude, Cursor, VS Code Copilot) to securely connect to the tools and data your business already uses. Think of it as a "universal adapter" for AI.

### Key Benefits:
- **Standardized Integration**: No more custom integrations for each AI tool
- **Secure Data Access**: Controlled access to your systems
- **Real-time Context**: AI gets up-to-date information from your production systems
- **Extensible**: Easy to add new capabilities and data sources

## 🏗️ Understanding MCP Architecture

MCP consists of three main components:

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    Host     │◄───┤   Client    │◄───┤   Server    │
│ (AI Agent)  │    │(Translator) │    │ (Data/Tool) │
└─────────────┘    └─────────────┘    └─────────────┘
```

- **Host**: Your AI application (Claude Desktop, VS Code, etc.)
- **Client**: Handles communication and translates requests
- **Server**: Provides specific functionality (Dynatrace data, file access, APIs, etc.)

### MCP Features:

1. **Tools**: Functions that AI can call (query metrics, create alerts, etc.)
2. **Resources**: Data sources AI can read (logs, dashboards, configurations)
3. **Prompts**: Templates for common AI interactions

## 🔍 Dynatrace MCP Server

The official Dynatrace MCP server enables AI assistants to interact with your Dynatrace environment for real-time observability insights.

### Capabilities:
- **Problem Management**: List and analyze production problems
- **Security Issues**: Access vulnerability and security problem details
- **DQL Queries**: Execute Dynatrace Query Language for logs and events
- **Slack Integration**: Send alerts via Slack connectors
- **Workflow Automation**: Set up notification workflows
- **Entity Ownership**: Get ownership information for services

### Use Cases:
- **Real-time Debugging**: Get production context while coding
- **Incident Response**: AI-assisted troubleshooting with live data
- **Security Analysis**: Correlate code vulnerabilities with production issues
- **Performance Optimization**: Query metrics and logs in natural language

## 🚀 Setup Instructions

### Prerequisites
- Node.js 18+ (we use v20.19.2 LTS)
- Access to Dynatrace tenant(s)
- Dynatrace API token OR OAuth client credentials
- AI client (Cursor IDE recommended)

### Environment Configuration

1. **Copy the environment template:**
```bash
cp env/env.template env/.env.dev
```

2. **Edit `env/.env.dev` with your credentials:**
```bash
# Dynatrace Environment
DT_ENVIRONMENT=https://your-environment-id.live.dynatrace.com

# API Token (simpler setup)
API_TOKEN=dt0c01.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX.YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY

# OAuth (optional - for official MCP server)
OAUTH_CLIENT_ID=dt0s02.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
OAUTH_CLIENT_SECRET=dt0s02.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX.YYYYYYYYYYYYYYYYYYYYYYYYYYYY
OAUTH_RESOURCE_URN=urn:dynatrace:environment:your-environment-id
```

## 🔧 Working Tools

This project includes several working tools for Dynatrace integration:

### 🎯 **For Grail Environments** (`*.apps.dynatrace.com`)

#### 🚀 **Primary Tool**: `grail-log-query.js`
**OAuth-based log analysis for modern Grail environments**

```bash
# Comprehensive search using OAuth Bearer authentication
node tools/grail-log-query.js "error" now-2h

# Lambda-specific analysis for Grail environments
node tools/grail-log-query.js "lambda timeout" now-1h

# Service analysis with Grail API endpoints
node tools/grail-log-query.js "service unavailable" now-4h
```

**✅ Grail-Specific Features:**
- Uses OAuth Bearer authentication (`Authorization: Bearer`)
- Connects to `/platform/classic/environment-api/v2/` endpoints
- Auto-detects Grail environments (`.apps.dynatrace.com`)
- Full compatibility with modern Dynatrace platform

### 🏛️ **For Classic Environments** (`*.live.dynatrace.com`)

#### 🚀 **Primary Tool**: `classic-log-query.js`

### 🖥️ Dashboard Tool: `dynatrace-monitor.js`
**Real-time monitoring dashboard with visual status and recommendations**

```bash
# Run comprehensive monitoring dashboard
node tools/dynatrace-monitor.js

# Shows: authentication status, problem summary, service impact, recent activity, recommendations
```

### 🚀 Primary Tool: `classic-log-query.js`
**Production-ready log analysis using alternative APIs**

```bash
# Comprehensive search across all APIs
node tools/classic-log-query.js search "error" now-2h

# Lambda-specific analysis
node tools/classic-log-query.js lambda "function-name"

# Events-only search
node tools/classic-log-query.js events "timeout" now-1h
```

### 📊 Comprehensive Tool: `classic-api-client.js`
**Full-featured API client for problems, metrics, and entities**

```bash
# Get recent problems
node tools/classic-api-client.js problems 10

# Analyze Lambda errors
node tools/classic-api-client.js analyze-lambda-errors

# Get metrics
node tools/classic-api-client.js metrics "builtin:service.response.time" now-30m
```

### 🔐 Testing Tool: `dynatrace-oauth-tool.js`
**Simple OAuth authentication testing**

```bash
# Test OAuth authentication
node tools/dynatrace-oauth-tool.js problems
```

**📖 For detailed tool documentation, see: [`docs/TOOLS_GUIDE.md`](docs/TOOLS_GUIDE.md)**

## 🎯 Quick Start Demo

### Option 1: Cursor IDE Demo (Recommended)
Follow the step-by-step demo in [`docs/cursor-mcp-demo.md`](docs/cursor-mcp-demo.md) to:
- Use Cursor AI with your working Dynatrace tools
- Experience MCP-like functionality immediately
- Analyze your production environment with AI assistance

### Option 2: Direct Tool Usage
```bash
# 1. Test your connection
node tools/classic-log-query.js search "error" now-1h

# 2. Analyze problems
node tools/classic-api-client.js problems 5

# 3. Get Lambda insights
node tools/classic-log-query.js lambda "your-function-name"
```

## 🌍 Real-World Use Cases

### 1. **AI-Powered Incident Response**
```
"Our users are reporting 503 errors. Pull recent problems from our load balancer services and correlate with error rate metrics. What's causing this issue?"
```

### 2. **Performance-Driven Code Reviews**
```
"This function handles user authentication. Can you show me the current performance metrics and any related errors from our production auth service?"
```

### 3. **Proactive Monitoring Setup**
```
"I just deployed a new microservice. Help me analyze similar services to understand what monitoring and alerts I should set up."
```

### 4. **Data-Driven Architecture Decisions**
```
"We're considering splitting our monolith. Can you analyze the service dependencies and performance characteristics to recommend which components to extract first?"
```

## 📚 Additional Documentation

- **[`docs/TOOLS_GUIDE.md`](docs/TOOLS_GUIDE.md)** - Detailed tool usage and selection guide
- **[`docs/DYNATRACE_LOGS_SOLUTION.md`](docs/DYNATRACE_LOGS_SOLUTION.md)** - Log querying solution and troubleshooting
- **[`docs/cursor-mcp-demo.md`](docs/cursor-mcp-demo.md)** - Step-by-step MCP demonstration with Cursor

## 🎯 Environment Detection

### **Step 1: Identify Your Environment Type**

Check your Dynatrace URL:
```bash
# Grail Environment (Modern)
✅ https://abc123.apps.dynatrace.com

# Classic Environment (Legacy)
⚠️ https://abc123.live.dynatrace.com
```

### **Step 2: Configure Authentication**

**For Grail Environments:**
```bash
# OAuth is REQUIRED - API tokens will NOT work
DT_ENVIRONMENT=https://your-environment-id.apps.dynatrace.com
OAUTH_CLIENT_ID=dt0s02.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
OAUTH_CLIENT_SECRET=dt0s02.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX.YYYYYYYYYYYYYYYYYYYYYYYY
OAUTH_RESOURCE_URN=urn:dynatrace:environment:your-environment-id
```

**For Classic Environments:**
```bash
# API Token OR OAuth both work
DT_ENVIRONMENT=https://your-environment-id.live.dynatrace.com
API_TOKEN=dt0c01.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX.YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY
# OAuth optional for classic environments
```

### **Step 3: Use Correct Tool**

```bash
# For Grail environments (.apps.dynatrace.com)
node tools/grail-log-query.js "error" now-1h

# For Classic environments (.live.dynatrace.com)  
node tools/classic-log-query.js search "error" now-1h
```

## 🔧 Troubleshooting

### Common Issues:

**❌ OAuth Scope Restrictions**
- **Issue**: Direct DQL log queries return 403 Forbidden
- **Solution**: Use the `classic-log-query.js` tool which uses alternative APIs

**❌ Node.js Version Compatibility** 
- **Issue**: `Unexpected token '||='` error
- **Solution**: Upgrade to Node.js v16+ (we use v20.19.2 LTS)

**❌ Environment File Not Found**
- **Issue**: Tools can't find `.env.dev`
- **Solution**: Copy from `env/env.template` and add your credentials

## 🎯 Next Steps

1. **Complete the setup** by configuring your `.env.dev` file
2. **Test your connection** with `node tools/classic-log-query.js search "error" now-1h`
3. **Try the Cursor demo** following [`docs/cursor-mcp-demo.md`](docs/cursor-mcp-demo.md)
4. **Explore advanced use cases** with your AI client of choice

---

**🚀 Happy Learning!** This project demonstrates MCP concepts while providing practical Dynatrace observability integration that works today. 