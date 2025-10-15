[![smithery badge](https://smithery.ai/badge/@Hint-Services/mcp-todoist)](https://smithery.ai/server/@Hint-Services/mcp-todoist)
[![npm version](https://img.shields.io/npm/v/mcp-todoist)](https://www.npmjs.com/package/mcp-todoist)

# Todoist MCP Server

A Model Context Protocol (MCP) server that connects AI assistants to Todoist for seamless task management. This server enables AI assistants to create, read, update, and complete tasks, manage projects, organize sections, and work with labels in your Todoist account.

## Why This Tool?

Todoist is one of the most popular task management platforms, helping millions of people organize their work and life. This MCP server brings the power of AI-assisted task management to your workflow, enabling:

- **Natural Language Task Creation**: Create tasks using conversational language
- **Intelligent Organization**: AI can help organize your tasks into projects and sections
- **Smart Prioritization**: Automatically set priorities and due dates based on context
- **Batch Operations**: Perform multiple operations efficiently
- **Context-Aware Management**: AI can understand your task context and suggest improvements

## Features

- **Comprehensive Todoist Integration**: Full access to tasks, projects, sections, and labels via the official API
- **Type-Safe Implementation**: Written in TypeScript with comprehensive type definitions
- **Input Validation**: Robust validation for all API inputs using Zod schemas
- **Error Handling**: Graceful error handling with informative messages
- **Batch Operations**: Support for creating, updating, and managing multiple items at once
- **MCP Integration**: Full compatibility with Claude, Cursor, Windsurf, Cline, and other MCP hosts

## Available Tools

### Task Management

- **todoist_create_task**: Create one or more tasks with full parameter support
  - Set content, description, due dates, priorities
  - Assign to projects and sections
  - Add labels and parent tasks
  - Support for duration and deadline fields

- **todoist_get_tasks**: Retrieve tasks with flexible filtering
  - Filter by project, section, label, or priority
  - Use natural language filters ('today', 'tomorrow', 'overdue')
  - Pagination support

- **todoist_update_task**: Update existing tasks by ID or name
  - Modify any task property
  - Support for batch updates

- **todoist_delete_task**: Delete tasks by ID or name
  - Support for batch deletion

- **todoist_complete_task**: Mark tasks as complete
  - Support for batch completion

### Project Management

- **todoist_get_projects**: Retrieve all projects with optional hierarchy
  - Include sections for each project
  - Filter by specific project IDs

- **todoist_create_project**: Create new projects
  - Set colors, view styles (list/board)
  - Create nested projects with parent_id
  - Mark as favorite
  - Optionally create sections during project creation

- **todoist_update_project**: Update existing projects
  - Modify name, color, favorite status, view style
  - Update by ID or search by name

### Section Management

- **todoist_get_project_sections**: Get sections from one or more projects
  - Support for batch retrieval
  - Find by project ID or name

- **todoist_create_project_section**: Create sections within projects
  - Set section name and order
  - Support for batch creation

### Label Management

- **todoist_get_personal_labels**: Retrieve all personal labels

- **todoist_get_personal_label**: Get a specific label by ID

- **todoist_create_personal_label**: Create new labels
  - Set color and favorite status
  - Define label order
  - Support for batch creation

- **todoist_update_personal_label**: Update existing labels
  - Modify name, color, order, favorite status
  - Update by ID or search by name

- **todoist_delete_personal_label**: Remove labels from your account

## Use Cases

### For Personal Productivity
- **Daily Planning**: AI can help organize your day by creating and prioritizing tasks
- **Inbox Processing**: Quickly process task ideas into organized projects
- **Review & Reflection**: AI can analyze your task patterns and suggest improvements

### For Knowledge Workers
- **Meeting Follow-up**: Automatically create action items from meeting notes
- **Project Planning**: Break down large projects into manageable tasks and sections
- **Workload Management**: Balance tasks across projects based on priorities and deadlines

### For Team Collaboration
- **Task Delegation**: Assign tasks to team members
- **Project Organization**: Create consistent project structures across teams
- **Progress Tracking**: Monitor task completion and project status

## Installation

### Using Smithery (Recommended)

The easiest way to install Todoist MCP is using Smithery:

```bash
# For Claude Desktop
npx -y @smithery/cli install @Hint-Services/mcp-todoist --client claude

# For Cursor
npx -y @smithery/cli install @Hint-Services/mcp-todoist --client cursor

# For Windsurf
npx -y @smithery/cli install @Hint-Services/mcp-todoist --client windsurf

# For Cline
npx -y @smithery/cli install @Hint-Services/mcp-todoist --client cline
```

### Manual Installation

```bash
npm install mcp-todoist
```

## Configuration

Add the server to your MCP settings file with the following configuration:

```json
{
  "mcpServers": {
    "todoist": {
      "command": "npx",
      "args": ["-y", "mcp-todoist"],
      "env": {
        "TODOIST_API_TOKEN": "your-todoist-api-token"
      }
    }
  }
}
```

### Required Environment Variables

- `TODOIST_API_TOKEN`: Your Todoist API token ([get it here](https://todoist.com/app/settings/integrations/developer))

### Getting Your API Token

1. Visit [Todoist Settings > Integrations > Developer](https://todoist.com/app/settings/integrations/developer)
2. Sign in to your Todoist account
3. Scroll to the "API token" section
4. Copy your API token
5. **Important**: Never share your API token or commit it to source control

## Example Workflows

### Creating a Task

```json
{
  "tool": "todoist_create_task",
  "arguments": {
    "content": "Review quarterly goals",
    "description": "Analyze Q4 performance and set Q1 objectives",
    "due_string": "tomorrow at 2pm",
    "priority": 3,
    "labels": ["work", "planning"]
  }
}
```

### Getting Today's Tasks

```json
{
  "tool": "todoist_get_tasks",
  "arguments": {
    "filter": "today"
  }
}
```

### Creating a Project with Sections

```json
{
  "tool": "todoist_create_project",
  "arguments": {
    "name": "Website Redesign",
    "color": "blue",
    "view_style": "board",
    "sections": ["Design", "Development", "Testing"]
  }
}
```

### Batch Task Creation

```json
{
  "tool": "todoist_create_task",
  "arguments": {
    "tasks": [
      {
        "content": "Design homepage mockup",
        "due_string": "Monday",
        "priority": 4
      },
      {
        "content": "Set up development environment",
        "due_string": "Tuesday"
      },
      {
        "content": "Create component library",
        "due_string": "Wednesday"
      }
    ]
  }
}
```

### Updating Tasks by Name

```json
{
  "tool": "todoist_update_task",
  "arguments": {
    "task_name": "Review quarterly goals",
    "priority": 4,
    "due_string": "today"
  }
}
```

### Completing Multiple Tasks

```json
{
  "tool": "todoist_complete_task",
  "arguments": {
    "tasks": [
      { "task_name": "Morning standup" },
      { "task_name": "Email review" },
      { "task_name": "Code review" }
    ]
  }
}
```

## Project Structure

```
mcp-todoist/
├── src/
│   ├── index.ts          # Main MCP server entry point
│   └── todoist/          # Todoist integration
│       ├── client.ts     # Todoist client implementation
│       └── types.ts      # TypeScript type definitions
├── docs/                 # Documentation
├── package.json          # Project configuration
└── tsconfig.json         # TypeScript configuration
```

## For Developers

### Development Commands

- `pnpm install` - Install dependencies
- `pnpm run build` - Build the project for HTTP streaming (default)
- `pnpm run dev` - Run in development mode with hot reloading
- `pnpm run inspector` - Launch MCP inspector for testing (stdio mode)
- `pnpm run test` - Run tests
- `pnpm run lint:fix` - Fix linting issues
- `pnpm run format:fix` - Format code

### Deployment Options

#### HTTP Streaming (Recommended)
```bash
pnpm run build:http
pnpm run start:http
```

#### Traditional stdio (Legacy)
```bash
pnpm run build:stdio
pnpm run start:stdio
```

The HTTP streaming interface offers better performance and simplified deployment without requiring Docker, while maintaining full backwards compatibility with the traditional stdio interface.

### API Reference

The server implements 14 Todoist tools organized into four categories:

#### Task Tools
- `todoist_create_task`
- `todoist_get_tasks`
- `todoist_update_task`
- `todoist_delete_task`
- `todoist_complete_task`

#### Project Tools
- `todoist_get_projects`
- `todoist_create_project`
- `todoist_update_project`
- `todoist_get_project_sections`
- `todoist_create_project_section`

#### Label Tools
- `todoist_get_personal_labels`
- `todoist_get_personal_label`
- `todoist_create_personal_label`
- `todoist_update_personal_label`
- `todoist_delete_personal_label`

For detailed API documentation, see the [Todoist API v1 Documentation](https://todoist.com/api/v1).

## Privacy & Security

- Your API token is used only to authenticate with Todoist's official API
- No data is stored or cached by this MCP server
- All communication is directly between your client and Todoist's servers
- Follow Todoist's privacy policy and terms of service

## Troubleshooting

### API Token Issues
- Ensure your API token is valid and not expired
- Check that you're using the correct environment variable name: `TODOIST_API_TOKEN`
- Verify your Todoist account has API access enabled

### Tasks Not Appearing
- Confirm you're querying the correct project or using the right filters
- Check that tasks haven't been completed or deleted
- Verify project and section IDs are correct

### Connection Issues
- Check your internet connection
- Verify Todoist services are operational
- Ensure you're using the latest version of the MCP server

### Common Errors
- **"Task not found"**: The task name search couldn't find a matching task
- **"Project not found"**: Invalid project ID or name
- **"Invalid color"**: Use valid Todoist color names (e.g., "blue", "red", "green")

## Learn More

For further information, refer to:

- [Todoist API v1 Documentation](https://todoist.com/api/v1): Official API documentation
- [Model Context Protocol Documentation](https://modelcontextprotocol.io): MCP architecture and design principles
- [Smithery - MCP Server Registry](https://smithery.ai/docs): Guidelines for publishing MCP servers
- [MCP TypeScript SDK Documentation](https://modelcontextprotocol.io/typescript): Comprehensive TypeScript SDK documentation

## About Hint Services

> "The future is already here, it's just unevenly distributed"
>
> — William Gibson, Author

Hint Services is a boutique consultancy with a mission to develop and expand how user interfaces leverage artificial intelligence technology. We architect ambition at the intersection of AI and User Experience, founded and led by Ben Hofferber.

We offer specialized AI workshops for design teams looking to embrace AI tools without becoming developers. [Learn more about our training and workshops](https://hint.services/training-workshops).
