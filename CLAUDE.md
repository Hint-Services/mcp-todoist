# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Todoist MCP is a Model Context Protocol (MCP) server that connects AI assistants to Todoist for seamless task management. It enables comprehensive access to tasks, projects, sections, and labels in your Todoist account, allowing AI assistants to create, read, update, complete, and organize your tasks and projects.

## Key Commands

### Development
- `pnpm install` - Install dependencies
- `pnpm run build` - Build the project for HTTP streaming (default)
- `pnpm run dev` - Run in development mode with hot reloading via Smithery CLI
- `pnpm run watch` - Watch mode for automatic recompilation
- `pnpm run debug:watch` - Debug mode with watch

### Build Commands
- `pnpm run build:http` - Build for HTTP streaming interface (recommended)
- `pnpm run build:stdio` - Build for traditional stdio interface (legacy)

### Start Commands
- `pnpm run start` - Start HTTP streaming server (default)
- `pnpm run start:http` - Start HTTP streaming server
- `pnpm run start:stdio` - Start stdio server for backwards compatibility

### Development with Different Interfaces
- `pnpm run dev` - HTTP streaming development with hot reloading
- `pnpm run dev:stdio` - Traditional stdio development with inspector

### Code Quality
- `pnpm run lint:fix` - Fix linting issues with Biome
- `pnpm run format:fix` - Format code with Biome
- `pnpm run clean` - Clean build artifacts

### Debugging
- `pnpm run inspector` - Launch MCP inspector for testing tools (stdio mode)
- `pnpm run logs` - View last 20 lines of MCP logs
- `pnpm run debug` - Run with Node.js debugger attached

## Architecture Overview

The project follows a clean modular architecture:

### Core Components
- **`src/index.ts`**: MCP server factory function and stdio compatibility. Exports `createServer()` for HTTP streaming and maintains `main()` for stdio transport. Handles server lifecycle, environment configuration, and graceful shutdown.
- **`src/todoist/client.ts`**: Encapsulates all Todoist API interactions using the official `@doist/todoist-api-typescript` SDK. Implements centralized error handling and tool registration for 14 MCP tools.
- **`src/todoist/types.ts`**: TypeScript type definitions and Zod schemas for Todoist API parameters and configuration.

### Available MCP Tools

#### Task Management (5 tools)
1. **`todoist_create_task`**: Create one or more tasks with full parameter support
2. **`todoist_get_tasks`**: Retrieve tasks with flexible filtering (project, section, label, priority, natural language filters)
3. **`todoist_update_task`**: Update existing tasks by ID or name (supports batch operations)
4. **`todoist_delete_task`**: Delete tasks by ID or name (supports batch operations)
5. **`todoist_complete_task`**: Mark tasks as complete (supports batch operations)

#### Project Management (5 tools)
6. **`todoist_get_projects`**: Retrieve all projects with optional hierarchy and sections
7. **`todoist_create_project`**: Create new projects with colors, view styles, and optional sections
8. **`todoist_update_project`**: Update existing projects by ID or name
9. **`todoist_get_project_sections`**: Get sections from one or more projects
10. **`todoist_create_project_section`**: Create sections within projects (supports batch operations)

#### Label Management (5 tools)
11. **`todoist_get_personal_labels`**: Retrieve all personal labels
12. **`todoist_get_personal_label`**: Get a specific label by ID
13. **`todoist_create_personal_label`**: Create new labels with colors and favorite status
14. **`todoist_update_personal_label`**: Update existing labels by ID or name
15. **`todoist_delete_personal_label`**: Remove labels from account

### Key Design Patterns
- **Dual Interface Support**: HTTP streaming (default) and stdio (legacy) transport support
- **Factory Pattern**: `createServer()` function enables HTTP streaming with config injection
- **Todoist-focused design**: Comprehensive task management with full CRUD operations
- **Environment-based configuration**: API access via `TODOIST_API_TOKEN` environment variable
- **Fail-fast initialization**: Server won't start without required API token configuration
- **Centralized error handling**: All API requests go through `handleRequest` wrapper with comprehensive error handling
- **Type safety**: Zod schemas for runtime validation of all tool inputs
- **Official SDK**: Uses `@doist/todoist-api-typescript` v5.6.4 for reliable API interactions
- **Batch Operations**: All tools support batch operations where applicable
- **Name-based lookups**: Tools can operate using names instead of IDs for better UX
- **Color validation**: Helper method validates and normalizes Todoist color values

### Development Notes
- **HTTP Streaming Interface**: Uses Smithery CLI for development and deployment
- **Backwards Compatibility**: Maintains stdio interface for existing integrations
- Uses Biome for linting and formatting (configured in `biome.json`)
- TypeScript target: ES2020 with Node16 module resolution
- Pre-build hooks ensure code quality before compilation
- MCP Inspector available for testing tool interactions (stdio mode)
- Vitest configured for comprehensive testing of API client and types
- Uses official `@doist/todoist-api-typescript` SDK instead of raw HTTP client
- **API Version**: Todoist API v1 (latest)
- **Build Outputs**: `.smithery/index.cjs` for HTTP streaming, `build/` for stdio transport

### Important Implementation Details
- **Response Unwrapping**: Todoist API v5 SDK returns `{ results: T[], nextCursor: string | null }` - code extracts `.results` array
- **Union Types**: Projects use `type Project = PersonalProject | WorkspaceProject` union
- **Readonly Types**: `AddTaskArgs` and `UpdateTaskArgs` are readonly - use type assertions `as AddTaskArgs`
- **Conditional Fields**: Due dates and durations use conditional spread operators to handle mutually exclusive fields
- **Color Handling**: Colors validated via `validateColor()` helper with fallback to "grey"
- **Optional Chaining**: Always use `|| ""` fallback when calling `.toLowerCase()` on optional strings
