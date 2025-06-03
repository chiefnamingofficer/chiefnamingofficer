# EventCatalog MCP Learning Guide

This guide walks you through exploring your event-driven architecture using the EventCatalog MCP server integration.

## 🔧 Initial Setup

### Step 1: Get EventCatalog Scale License
1. Visit [EventCatalog Cloud](https://eventcatalog.dev)
2. Sign up for a 14-day trial
3. Get your license key
4. Replace `YOUR_EVENTCATALOG_SCALE_LICENSE_KEY` in `.mcp.json`

### Step 2: Verify Access
1. Open https://eventcatalog.compassdigital.org/ in your browser
2. Authenticate with Google OAuth
3. Ensure you can browse the catalog

### Step 3: Configure Cursor
1. Update the `.mcp.json` file with your license key
2. Restart Cursor
3. The EventCatalog MCP server should now be available

## 🎯 Learning Exercises

### Exercise 1: Discovery - What Events Exist?

**Objective**: Discover all events in your architecture

**Questions to Ask**:
```
What events are available in our EventCatalog?
```

```
Show me all events related to "menu" or "publishing"
```

**Expected Learning**: Understanding the breadth of events in your system

### Exercise 2: Event Deep Dive - Menu Publishing

**Objective**: Understand a specific event domain

**Questions to Ask**:
```
Is there an event when a new menu gets published?
```

```
What is the schema for the menu published event?
```

```
Which team owns the menu publishing event?
```

**Expected Learning**: Event ownership, schemas, and responsibilities

### Exercise 3: Service Relationships

**Objective**: Understand service interactions

**Questions to Ask**:
```
What services produce menu-related events?
```

```
What services consume menu-related events?
```

```
Show me the producers and consumers for the menu service
```

**Expected Learning**: Service dependencies and event flows

### Exercise 4: Subscription and Integration

**Objective**: Learn how to integrate with events

**Questions to Ask**:
```
How can I subscribe to menu publishing events?
```

```
What do I need to know to process the menu published event?
```

```
What are the required fields in the menu published event schema?
```

**Expected Learning**: Integration requirements and event processing

### Exercise 5: Architecture Overview

**Objective**: Get a high-level view of the architecture

**Questions to Ask**:
```
What domains exist in our event-driven architecture?
```

```
Show me all teams and their owned events
```

```
What are the main event flows in our system?
```

**Expected Learning**: Architectural patterns and team boundaries

### Exercise 6: Event Registration

**Objective**: Understand how to add new events

**Questions to Ask**:
```
How can I register a new event with EventCatalog?
```

```
What's the process for documenting a new event?
```

```
Who needs to be notified when I create a new event?
```

**Expected Learning**: Event governance and registration processes

### Exercise 7: Error Handling and Reliability

**Objective**: Understand failure scenarios

**Questions to Ask**:
```
What happens if an event fails to be delivered?
```

```
How do subscribers know about event delivery failures?
```

```
What reliability patterns do we use for event processing?
```

**Expected Learning**: Error handling patterns and reliability mechanisms

### Exercise 8: Schema Evolution

**Objective**: Understand how events change over time

**Questions to Ask**:
```
Show me different versions of the menu published event
```

```
What would happen if I changed the schema of the menu published event?
```

```
How do we handle backward compatibility for event schemas?
```

**Expected Learning**: Schema evolution and versioning strategies

## 🔍 Advanced Exploration

### Cross-Domain Analysis
```
What events connect the menu domain with the user domain?
```

```
Show me event flows that span multiple domains
```

### Performance and Monitoring
```
Are there any monitoring events or metrics related to menu publishing?
```

```
What observability events do we have in the system?
```

### Compliance and Governance
```
What events contain personal data that need special handling?
```

```
Which events are subject to regulatory compliance requirements?
```

## 📋 Learning Checklist

Track your progress through these learning objectives:

- [ ] **Discovery**: Can identify all available events
- [ ] **Ownership**: Understand which teams own which events
- [ ] **Schemas**: Can retrieve and understand event schemas
- [ ] **Dependencies**: Map service-to-service relationships
- [ ] **Integration**: Know how to subscribe to and process events
- [ ] **Registration**: Understand the event creation process
- [ ] **Governance**: Know notification and approval processes
- [ ] **Architecture**: Have a high-level view of the system
- [ ] **Reliability**: Understand error handling patterns
- [ ] **Evolution**: Know how schemas change over time

## 🚀 Next Steps

After completing this guide:

1. **Document Discoveries**: Create notes about your architecture insights
2. **Identify Gaps**: Note any missing documentation or unclear processes
3. **Plan Integration**: Use learnings to plan your own service integrations
4. **Share Knowledge**: Share insights with your team
5. **Contribute**: Improve EventCatalog documentation based on your learnings

## 💡 Tips for Success

1. **Start Simple**: Begin with basic discovery questions
2. **Be Specific**: Ask about specific events, services, or domains
3. **Follow Threads**: When you find interesting connections, explore them deeper
4. **Document Insights**: Keep notes of what you learn
5. **Ask Follow-ups**: Each answer usually leads to more questions
6. **Verify Information**: Cross-check important details with your team

## 🎓 Learning Outcomes

By the end of this guide, you should:

- Understand your organization's event-driven architecture
- Know how to discover and explore events programmatically
- Understand team responsibilities and event ownership
- Be able to plan integrations with existing events
- Know the process for creating and documenting new events
- Understand reliability and error handling patterns
- Have insights into architectural patterns and best practices

## 📝 Notes Section

Use this space to document your discoveries:

### Key Events Discovered
<!-- Add your findings here -->

### Important Schemas
<!-- Document important schemas here -->

### Team Responsibilities
<!-- Map out team ownership here -->

### Integration Opportunities
<!-- Note potential integrations here -->

### Architecture Insights
<!-- Document architectural patterns here --> 