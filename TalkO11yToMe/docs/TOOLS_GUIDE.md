# TalkO11yToMe Tools Guide

## 🚨 **Environment-Specific Tool Selection**

**Your Dynatrace environment type determines which primary tool to use:**

### **🆕 For Grail Environments** (`*.apps.dynatrace.com`)
→ **Primary Tool**: `grail-log-query.js` (OAuth Bearer authentication required)

### **🏛️ For Classic Environments** (`*.live.dynatrace.com`)  
→ **Primary Tool**: `classic-log-query.js` (API token authentication)

---

## Available Tools

### 🎯 **GRAIL ENVIRONMENT TOOLS**

#### 🚀 `grail-log-query.js` - **PRIMARY TOOL FOR GRAIL**
**Purpose**: Production-ready log analysis for modern Grail environments using OAuth Bearer authentication.

**Key Features**:
- ✅ **OAuth Bearer Authentication**: Uses `Authorization: Bearer` tokens (required for Grail)
- ✅ **Grail API Endpoints**: Connects to `/platform/classic/environment-api/v2/` paths
- ✅ **Auto-Detection**: Automatically detects Grail environments (`.apps.dynatrace.com`)
- ✅ **Full Grail Compatibility**: Works with modern Dynatrace platform architecture
- ✅ **Events, Problems, and Metrics**: Comprehensive data access via alternative APIs
- ✅ **Real Production Data**: Successfully retrieves actual log-related information

**Usage**:
```bash
# Comprehensive search across all APIs (OAuth required)
node tools/grail-log-query.js "error" now-2h

# Lambda-specific analysis for Grail environments
node tools/grail-log-query.js "lambda timeout" now-1h

# Service analysis with modern API endpoints
node tools/grail-log-query.js "service unavailable" now-4h
```

**Requirements**:
- **Environment**: `https://xxx.apps.dynatrace.com`
- **Authentication**: OAuth Client ID + Secret (API tokens will NOT work)
- **Node.js**: v18+ recommended

**Best for**: All Grail environment log analysis, modern Dynatrace platforms

---

### 🏛️ **CLASSIC ENVIRONMENT TOOLS**

#### 🚀 `classic-log-query.js` - **PRIMARY TOOL FOR CLASSIC**
**Purpose**: Production-ready log analysis using alternative APIs when direct log access is restricted (Classic environments).

**Key Features**:
- ✅ Events API integration for log-like events
- ✅ Problems API for error analysis  
- ✅ Lambda metrics and performance data
- ✅ Service entity analysis
- ✅ Works with existing API token authentication

**Usage**:
```bash
# Comprehensive search across all APIs
node tools/classic-log-query.js search "error" now-2h

# Lambda-specific analysis
node tools/classic-log-query.js lambda "function-name"

# Events-only search
node tools/classic-log-query.js events "timeout" now-1h

# Problems analysis
node tools/classic-log-query.js problems "database"

# Service analysis
node tools/classic-log-query.js service "payment-service"
```

**Best for**: Classic environment log analysis, API token authentication

---

### 🌐 **UNIVERSAL TOOLS** (Work with Both Environment Types)

### 📊 `classic-api-client.js` - **COMPREHENSIVE API TOOL**
**Purpose**: Full-featured Dynatrace API client for problems, metrics, and entities (non-log queries).

**Key Features**:
- ✅ Problems API with filtering and analysis
- ✅ Metrics queries with custom selectors
- ✅ Entity discovery and management
- ✅ Lambda-specific problem analysis
- ✅ Support for multiple environments (dev/staging/prod)

**Usage**:
```bash
# Get recent problems
node tools/classic-api-client.js problems 10

# Lambda-specific problems
node tools/classic-api-client.js lambda-problems now-24h

# Analyze Lambda errors
node tools/classic-api-client.js analyze-lambda-errors

# Get metrics
node tools/classic-api-client.js metrics "builtin:service.response.time" now-30m

# List entities
node tools/classic-api-client.js entities "type(SERVICE)" "displayName,entityId"
```

**Best for**: Deep API exploration, metrics analysis, entity management

---

### 🖥️ `dynatrace-monitor.js` - **REAL-TIME DASHBOARD**
**Purpose**: Visual monitoring dashboard with real-time status, trends, and actionable recommendations.

**Key Features**:
- ✅ Colorized dashboard display with visual indicators
- ✅ Dual authentication testing (API Token + OAuth)
- ✅ Problem categorization by severity and service impact
- ✅ Recent activity tracking (24h window)
- ✅ Service impact ranking with color-coded alerts
- ✅ Actionable recommendations based on current state
- ✅ Executive summary format for status reports

**Usage**:
```bash
# Run full monitoring dashboard
node tools/dynatrace-monitor.js

# Same as above (monitor is default)
node tools/dynatrace-monitor.js monitor

# Show help and features
node tools/dynatrace-monitor.js help
```

**Dashboard Sections**:
- 📡 **Authentication Status**: API Token + OAuth connectivity
- 📊 **Problem Summary**: Total, open, closed problem counts
- ⚠️ **Severity Breakdown**: Problems categorized by ERROR, WARNING, etc.
- 🏢 **Service Impact**: Top 5 most affected services ranked by problem count
- 🕐 **Recent Activity**: Last 24h of problems with time indicators
- 💡 **Recommendations**: Actionable insights based on current state

**Best for**: Daily health checks, executive status reports, trend monitoring, team standups

---

### 🔐 `dynatrace-oauth-tool.js` - **AUTHENTICATION TESTER**
**Purpose**: Simple OAuth authentication testing and verification.

**Key Features**:
- ✅ OAuth token generation testing
- ✅ Basic API connectivity verification
- ✅ Authentication troubleshooting
- ✅ Lightweight and fast

**Usage**:
```bash
# Test OAuth authentication
node tools/dynatrace-oauth-tool.js problems

# Test entity access
node tools/dynatrace-oauth-tool.js entities
```

**Best for**: Quick auth tests, troubleshooting OAuth issues

## Tool Selection Guide

### **Primary Selection by Environment:**

#### **For Grail Environments** (`*.apps.dynatrace.com`):
1. **For ALL log analysis**: → `grail-log-query.js` ⭐ **PRIMARY**
2. **For visual monitoring**: → `dynatrace-monitor.js` 
3. **For auth testing**: → `dynatrace-oauth-tool.js` (required for Grail)

#### **For Classic Environments** (`*.live.dynatrace.com`):
1. **For log analysis**: → `classic-log-query.js` ⭐ **PRIMARY**
2. **For comprehensive API**: → `classic-api-client.js`
3. **For visual monitoring**: → `dynatrace-monitor.js`
4. **For auth testing**: → `dynatrace-oauth-tool.js`

### **Secondary Selection by Use Case:**

### For Daily Monitoring:
→ **Use `dynatrace-monitor.js`** - Best overview of environment health with visual dashboard

### For Log Analysis:
- **Grail Environment**: → `grail-log-query.js` (OAuth required)
- **Classic Environment**: → `classic-log-query.js` (API token supported)

### For Problem Investigation:
- **Grail Environment**: → `grail-log-query.js` for comprehensive analysis
- **Classic Environment**: → `classic-log-query.js` for log context or `classic-api-client.js` for detailed problem analysis

### For Executive Reports:
→ **Use `dynatrace-monitor.js`** - Professional dashboard format perfect for status meetings

### For Metrics and Entities:
→ **Use `classic-api-client.js`** - More comprehensive features for these use cases (Classic environments)

### For Authentication Testing:
→ **Use `dynatrace-oauth-tool.js`** - Essential for Grail environments, optional for Classic

## Environment Setup

### **For Grail Environments** (`.apps.dynatrace.com`):
```bash
# OAuth is REQUIRED - API tokens will NOT work
DT_ENVIRONMENT=https://your-env.apps.dynatrace.com
OAUTH_CLIENT_ID=dt0s02.YOUR_CLIENT_ID
OAUTH_CLIENT_SECRET=dt0s02.YOUR_CLIENT_SECRET
OAUTH_RESOURCE_URN=urn:dynatrace:environment:your-environment-id
```

### **For Classic Environments** (`.live.dynatrace.com`):
```bash
# API Token OR OAuth both work
DT_ENVIRONMENT=https://your-env.live.dynatrace.com
API_TOKEN=dt0c01.YOUR_TOKEN_HERE
# OAuth optional for classic environments
OAUTH_CLIENT_ID=dt0s02.YOUR_CLIENT_ID
OAUTH_CLIENT_SECRET=dt0s02.YOUR_CLIENT_SECRET
OAUTH_RESOURCE_URN=urn:dtaccount:your-account-uuid
```

## Workflow Examples

### **Grail Environment Daily Workflow**
```bash
# 1. Start with comprehensive log analysis (OAuth-based)
node tools/grail-log-query.js "error" now-2h

# 2. Visual dashboard for team updates
node tools/dynatrace-monitor.js

# 3. Authentication verification if needed
node tools/dynatrace-oauth-tool.js problems
```

### **Classic Environment Daily Workflow**
```bash
# 1. Start with overview dashboard
node tools/dynatrace-monitor.js

# 2. Deep dive into specific issues
node tools/classic-log-query.js lambda "problem-service-name"

# 3. Get detailed metrics if needed
node tools/classic-api-client.js analyze-lambda-errors
```

## Migration Notes

- **Added**: `grail-log-query.js` - **Primary tool for modern Grail environments**
- **Renamed**: `working-log-query.js` → `classic-log-query.js` for clarity
- **Renamed**: `dynatrace-query.js` → `classic-api-client.js` for better functionality description
- **Enhanced**: Environment-specific tool selection guide
- **Updated**: Authentication requirements by environment type
- **Maintained**: Full backward compatibility for Classic environments
- **Impact**: Clear naming convention makes tool selection intuitive 