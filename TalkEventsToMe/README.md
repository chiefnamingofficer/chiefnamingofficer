# TalkEventsToMe

A learning project focused on integrating with EventCatalog via MCP (Model Context Protocol) server to explore event-driven architecture questions and insights.

## 🎯 Project Purpose

This project demonstrates how to leverage the [EventCatalog MCP Server](https://github.com/event-catalog/mcp-server) to interact with our organization's EventCatalog instance and get insights about our event-driven architecture directly from AI assistants like Claude, Cursor, and Windsurf.

## 🏗️ Architecture Overview

- **EventCatalog Instance**: https://eventcatalog.compassdigital.org/ (Google OAuth protected)
- **MCP Server**: @eventcatalog/mcp-server
- **Client**: Cursor IDE with MCP integration
- **Authentication**: Requires EventCatalog Scale license key

## 🚀 Setup Instructions

### Prerequisites

1. **EventCatalog Scale License**: You'll need a license key for EventCatalog Scale
   - Get a 14-day trial from [EventCatalog Cloud](https://eventcatalog.dev)
   - Replace `YOUR_EVENTCATALOG_SCALE_LICENSE_KEY` in `.mcp.json`

2. **Access to EventCatalog Instance**: Ensure you have access to https://eventcatalog.compassdigital.org/

### Installation

1. **Configure MCP Server**: The `.mcp.json` file is already configured for this project
2. **Install Dependencies**: The MCP server will be installed automatically via npx
3. **Restart Cursor**: After updating `.mcp.json`, restart Cursor to load the MCP server

### Verification

Once configured, you should see the EventCatalog MCP server available in Cursor. You can verify by asking questions about your event catalog.

## 🤖 Available MCP Tools

The EventCatalog MCP server provides the following tools:

### Tools
- `find_resources` - Find resources available in EventCatalog
- `find_resource` - Get detailed information about services, domains, events, commands, queries, or flows
- `find_producers_and_consumers` - Get producers and consumers for a service
- `get_schema` - Returns schema for services, events, commands, or queries
- `review_schema_changes` - Reviews schema changes for breaking changes
- `explain_ubiquitous_language_terms` - Explain domain-specific terminology

### Resources
- `eventcatalog://all` - All messages, domains and services
- `eventcatalog://events` - All events
- `eventcatalog://domains` - All domains
- `eventcatalog://services` - All services
- `eventcatalog://queries` - All queries
- `eventcatalog://commands` - All commands
- `eventcatalog://flows` - All flows
- `eventcatalog://teams` - All teams
- `eventcatalog://users` - All users

## 🔍 Learning Questions

Here are the key questions this project aims to explore:

### Menu Publishing Events
1. **Is there an event when a new menu gets published?**
2. **Which team owns that event?**
3. **How can I subscribe to that event?**
4. **What do I need to know in order to process that event?**
5. **What other menu service related events exist?**

### Event Registration & Discovery
6. **I have my own service, how can I register a new event with the eventcatalog?**
7. **Do I need to notify someone when I register the new event and how would they be able to subscribe to my event?**

### Architecture Insights
8. **Is there any information on our event driven architecture?**
9. **Is there an event flow you could create that shows when a menu is being published and who are all the subscribers of that event?**

### Error Handling & Reliability
10. **What if an event fails to be delivered, how would a subscriber get to know about that situation?**

## 🎓 Learning Objectives

Through this project, you'll learn:

- How to configure MCP servers for EventCatalog integration
- How to query event-driven architecture documentation programmatically
- How to discover events, schemas, and relationships in your architecture
- How to understand team ownership and responsibilities
- How to identify event flows and dependencies
- How to explore error handling and reliability patterns

## 📚 Resources

- [EventCatalog MCP Server GitHub](https://github.com/event-catalog/mcp-server)
- [EventCatalog MCP Documentation](https://www.eventcatalog.dev/docs/development/developer-tools/mcp-server/introduction)
- [Our EventCatalog Instance](https://eventcatalog.compassdigital.org/)
- [MCP Protocol Documentation](https://modelcontextprotocol.io/)

## 🔧 Troubleshooting

### Common Issues

1. **License Key Issues**: Ensure your EventCatalog Scale license key is valid and not expired
2. **Network Access**: Verify you can access the EventCatalog instance from your network
3. **OAuth Issues**: Make sure you're authenticated with Google OAuth for the EventCatalog instance
4. **MCP Server Not Loading**: Restart Cursor after modifying `.mcp.json`

### Debug Commands

```bash
# Test MCP server installation
npx -y @eventcatalog/mcp-server --help

# Verify EventCatalog accessibility
curl -I https://eventcatalog.compassdigital.org/
```

## 📝 Notes

- This project is designed for learning and exploration
- The EventCatalog instance is protected by Google OAuth
- Requires EventCatalog Scale license for full functionality
- MCP integration works with Claude, Cursor, Windsurf, and other MCP-compatible clients

## 🤝 Contributing

This is a personal learning project, but feel free to:
- Add more example questions
- Document interesting discoveries
- Share insights about event-driven architecture patterns
- Improve the setup documentation

## 📄 License

This project is for educational purposes. Please respect the licensing terms of EventCatalog and related tools.


<!---
chiefnamingofficer/chiefnamingofficer is a ✨ special ✨ repository because its `README.md` (this file) appears on your GitHub profile.
You can click the Preview link to take a look at your changes.
--->
