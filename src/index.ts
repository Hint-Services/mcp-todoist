/**
 * Todoist MCP Server
 *
 * A Model Context Protocol server for Todoist task management.
 * This server enables AI assistants to interact with your Todoist tasks,
 * projects, labels, and sections for seamless productivity management.
 *
 * Features:
 * - Task management (create, update, complete, delete)
 * - Project organization with hierarchies
 * - Label management for categorization
 * - Section organization within projects
 * - Batch operations support
 * - Flexible filtering and search
 *
 * For more information about MCP, visit:
 * https://modelcontextprotocol.io
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import type { z } from "zod";
import { TodoistClient } from "./todoist/client.js";
import { TodoistConfigSchema } from "./todoist/types.js";

export const configSchema = TodoistConfigSchema;

export default function createServer({
  config,
}: {
  config: z.infer<typeof configSchema>;
}) {
  const server = new McpServer({
    name: "mcp-todoist",
    version: "0.1.0",
    capabilities: {
      tools: {},
      resources: {},
      prompts: {},
      streaming: true,
    },
  });

  // Create TodoistClient with provided config
  const todoistClient = new TodoistClient(config);

  // Register Todoist tools
  try {
    todoistClient.registerTodoistTools(server);
    logMessage("info", "Successfully registered all Todoist tools");
  } catch (error) {
    logMessage(
      "error",
      `Failed to register tools: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
    throw error;
  }

  return server;
}

/**
 * Helper function to send log messages to the client
 */
function logMessage(level: "info" | "warn" | "error", message: string) {
  console.error(`[${level.toUpperCase()}] ${message}`);
}

// Keep main function for stdio compatibility
async function main() {
  // Environment variable validation moved inside main()
  const todoistApiToken = process.env.TODOIST_API_TOKEN;

  if (!todoistApiToken) {
    console.error(
      "Environment variable TODOIST_API_TOKEN is required. Get your API token from https://todoist.com/app/settings/integrations/developer"
    );
    process.exit(1);
  }

  const server = createServer({
    config: {
      apiToken: todoistApiToken,
    },
  });

  try {
    // Set up communication with the MCP host using stdio transport
    const transport = new StdioServerTransport();
    await server.connect(transport);

    console.error("[INFO] MCP Server started successfully");
    console.error("MCP Server running on stdio transport");
  } catch (error) {
    console.error(
      `[ERROR] Failed to start server: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
    process.exit(1);
  }
}

// Only run main if this file is executed directly (not imported as a module)
// This allows HTTP servers to import createServer without requiring env vars
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
  });
}
