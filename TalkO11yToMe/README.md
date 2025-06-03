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
- **Primary Tool**: `classic-log-query.js` ✅
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

#### 🚀 **Primary Tool**: `