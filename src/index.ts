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

import { fileURLToPath, pathToFileURL } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import type { z } from "zod";
import { TodoistClient } from "./todoist/client.js";
import { TodoistConfigSchema } from "./todoist/types.js";

export const configSchema = TodoistConfigSchema;

export default function createServer({
  config = {},
}: {
  config?: z.infer<typeof configSchema>;
} = {}) {
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
  // Config will automatically use TODOIST_API_TOKEN from environment
  const server = createServer();

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
// When run via npx or as a binary, process.argv[1] should match this file
const isMainModule = (() => {
  if (!process.argv[1]) return false;

  try {
    const currentFile = fileURLToPath(import.meta.url);
    const execFile = process.argv[1];

    // Normalize paths for comparison
    const normalizePath = (p: string) => p.replace(/\\/g, "/");
    const normalizedCurrent = normalizePath(currentFile);
    const normalizedExec = normalizePath(execFile);

    // Check exact match or if execFile contains the filename
    return (
      normalizedCurrent === normalizedExec ||
      normalizedExec.endsWith("/index.js") ||
      normalizedExec.includes("mcp-todoist")
    );
  } catch {
    // Fallback: if execFile contains index.js or mcp-todoist, assume main module
    return (
      process.argv[1].includes("index.js") ||
      process.argv[1].includes("mcp-todoist")
    );
  }
})();

if (isMainModule) {
  main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
  });
}
