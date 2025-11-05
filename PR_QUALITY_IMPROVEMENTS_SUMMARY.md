# PR #1: MCP Server Quality Improvements - Complete Change Log

**PR Title:** Improve MCP Server Quality Score to 100
**Branch:** `claude/improve-mcp-server-quality-011CUfWSA8MEajAFBhws6iHD`
**Target Score:** 109/100 points
**Merged:** Nov 4, 2025

## Overview

This PR implemented comprehensive quality improvements to achieve a perfect quality score for the MCP Todoist server. The work was split across three commits to address different aspects: core quality features, SDK compatibility, and runtime execution issues.

---

## Commit 1: Core Quality Improvements (2570a41)

**Goal:** Add optional config, annotations, docs, prompts & resources (+52 points)

### 1. Optional Configuration Support (+15 points)

**File:** `src/todoist/types.ts`

**Changes:**
```typescript
// BEFORE: Required API token
export const TodoistConfigSchema = z.object({
  apiToken: z.string().min(1, "Todoist API token is required"),
});

// AFTER: Optional token with environment variable fallback
export const TodoistConfigSchema = z
  .object({
    apiToken: z
      .string()
      .optional()
      .describe(
        "Todoist API token. If not provided, will use TODOIST_API_TOKEN environment variable."
      ),
  })
  .default({});
```

**Why:** Makes configuration optional so users can rely on environment variables instead of explicit config. Improves user experience and flexibility.

---

**File:** `src/todoist/client.ts` - Constructor

**Changes:**
```typescript
// BEFORE: Direct token usage
constructor(private config: TodoistConfig) {
  this.api = new TodoistApi(config.apiToken);
}

// AFTER: Environment variable fallback with clear error
constructor(private config: TodoistConfig) {
  const apiToken = config.apiToken || process.env.TODOIST_API_TOKEN;

  if (!apiToken) {
    throw new Error(
      "Todoist API token is required. Provide it via config or set TODOIST_API_TOKEN environment variable. " +
        "Get your API token from https://todoist.com/app/settings/integrations/developer"
    );
  }

  this.api = new TodoistApi(apiToken);
}
```

**Why:** Implements the fallback logic and provides helpful error messages when token is missing from both sources.

---

**File:** `src/index.ts` - createServer function

**Changes:**
```typescript
// BEFORE: Required config parameter
export default function createServer({
  config,
}: {
  config: z.infer<typeof configSchema>;
}) { ... }

// AFTER: Optional config with default empty object
export default function createServer({
  config = {},
}: {
  config?: z.infer<typeof configSchema>;
} = {}) { ... }
```

**Why:** Makes config parameter optional at the function signature level, allowing `createServer()` to be called without any arguments.

---

**File:** `src/index.ts` - main function

**Changes:**
```typescript
// BEFORE: Manual environment variable validation
async function main() {
  const todoistApiToken = process.env.TODOIST_API_TOKEN;

  if (!todoistApiToken) {
    console.error("Environment variable TODOIST_API_TOKEN is required...");
    process.exit(1);
  }

  const server = createServer({
    config: { apiToken: todoistApiToken },
  });
  // ...
}

// AFTER: Simplified - validation moved to TodoistClient
async function main() {
  const server = createServer();
  // Config will automatically use TODOIST_API_TOKEN from environment
  // ...
}
```

**Why:** Removes duplicate validation logic. The TodoistClient constructor now handles token validation centrally.

---

### 2. Enhanced Input Documentation (+12 points)

**File:** `src/todoist/client.ts`

**Tool: todoist_get_tasks**

**Changes:** Replaced `GetTasksParamsSchema.partial().shape` with explicit schema definitions including detailed descriptions:

```typescript
{
  project_id: z.string().optional()
    .describe("Filter tasks by project ID"),
  section_id: z.string().optional()
    .describe("Filter tasks by section ID"),
  label: z.string().optional()
    .describe("Filter tasks by label name"),
  filter: z.string().optional()
    .describe("Natural language filter like 'today', 'tomorrow', 'next week', 'overdue', etc."),
  lang: z.string().optional()
    .describe("Language for date parsing (e.g., 'en', 'de', 'fr')"),
  ids: z.array(z.string()).optional()
    .describe("Filter by specific task IDs"),
  priority: z.number().min(1).max(4).optional()
    .describe("Filter by priority level (1=normal, 2=medium, 3=high, 4=urgent)"),
  limit: z.number().min(1).optional()
    .describe("Maximum number of tasks to return (default: 10)"),
}
```

**Why:** Each parameter now has a clear description explaining what it does and valid values. Improves discoverability and reduces user errors.

---

**Tool: todoist_get_projects**

**Changes:** Added descriptions for all 3 parameters:

```typescript
{
  project_ids: z.array(z.string()).optional()
    .describe("Filter by specific project IDs (returns all if not specified)"),
  include_sections: z.boolean().optional()
    .describe("Include sections for each project (default: false)"),
  include_hierarchy: z.boolean().optional()
    .describe("Include parent-child project relationships (default: false)"),
}
```

**Why:** Users understand what each option controls and what the defaults are.

---

**Tool: todoist_get_personal_label**

**Changes:**
```typescript
{
  label_id: z.string().min(1)
    .describe("The unique ID of the label to retrieve"),
}
```

**Why:** Clarifies that this requires the label's unique identifier.

---

**Tool: todoist_delete_personal_label**

**Changes:**
```typescript
{
  label_id: z.string().min(1)
    .describe("The unique ID of the label to delete (WARNING: This will remove the label from all tasks)"),
}
```

**Why:** Includes a clear warning about the destructive nature of this operation.

---

### 3. Tool Annotations (+9 points)

**File:** `src/todoist/client.ts` - addToolAnnotations method

**Changes:** Added a new private method that defines annotations for all 16 tools:

```typescript
private addToolAnnotations(server: McpServer) {
  const toolAnnotations = {
    // Read-only operations (5 tools)
    todoist_get_tasks: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
    },
    todoist_get_projects: { ... },
    todoist_get_project_sections: { ... },
    todoist_get_personal_labels: { ... },
    todoist_get_personal_label: { ... },

    // Destructive operations (2 tools)
    todoist_delete_task: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: true,
    },
    todoist_delete_personal_label: { ... },

    // Idempotent operations (11 tools)
    todoist_update_task: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
    },
    // ... and more
  };

  server.setRequestHandler("tools/list", async () => {
    const tools = Array.from((server as any)._tools?.values() || []);
    return {
      tools: tools.map((tool: any) => ({
        ...tool,
        annotations: toolAnnotations[tool.name] || {},
      })),
    };
  });
}
```

**Why:** Annotations help clients understand:
- **readOnlyHint**: Tool doesn't modify data (safe for exploratory use)
- **destructiveHint**: Tool permanently deletes/removes data (requires caution)
- **idempotentHint**: Tool can be safely called multiple times with same result

---

### 4. License Metadata (+6 points)

**File:** `package.json`

**Changes:**
```json
{
  "name": "@hoffination/mcp-todoist",
  "version": "0.1.0",
  "description": "A Model Context Protocol server for Todoist task management",
  "license": "MIT",  // <-- ADDED
  // ...
}
```

**Why:** Makes the MIT license discoverable via package metadata (LICENSE file already existed).

---

### 5. User Prompts (+5 points)

**File:** `src/todoist/client.ts` - registerPrompts method

**Changes:** Added 5 helpful workflow prompts:

**Prompt 1: daily-review**
```typescript
server.prompt(
  "daily-review",
  "Review today's tasks and plan your day",
  async () => ({
    messages: [{
      role: "user",
      content: {
        type: "text",
        text: "Show me all my tasks due today and help me prioritize them. Include any overdue tasks I should address first.",
      },
    }],
  })
);
```

**Why:** One-click access to daily task review workflow.

---

**Prompt 2: quick-add**
```typescript
server.prompt(
  "quick-add",
  "Quickly add a new task with natural language",
  async () => ({ ... })
);
```

**Why:** Streamlined task capture experience.

---

**Prompt 3: project-overview**
```typescript
server.prompt(
  "project-overview",
  "Get an overview of all projects and their tasks",
  async () => ({ ... })
);
```

**Why:** High-level view of all active projects.

---

**Prompt 4: weekly-plan**
```typescript
server.prompt(
  "weekly-plan",
  "Plan your week ahead",
  async () => ({ ... })
);
```

**Why:** Weekly planning workflow support.

---

**Prompt 5: cleanup-tasks**
```typescript
server.prompt(
  "cleanup-tasks",
  "Review and clean up old or stuck tasks",
  async () => ({ ... })
);
```

**Why:** Helps users maintain task hygiene.

---

### 6. Resources (+5 points)

**File:** `src/todoist/client.ts` - registerResources method

**Changes:** Added 6 resources exposing Todoist data:

**Resource 1: Today's tasks**
```typescript
server.resource(
  "todoist://tasks/today",
  "Today's tasks",
  "All tasks due today",
  "application/json",
  async () => {
    const tasks = await this.getTasks({ filter: "today" });
    return JSON.stringify(tasks, null, 2);
  }
);
```

**Why:** Direct access to today's tasks via URI.

---

**Resource 2: Overdue tasks**
```typescript
server.resource(
  "todoist://tasks/overdue",
  "Overdue tasks",
  "All overdue tasks",
  "application/json",
  async () => { ... }
);
```

**Why:** Quick access to overdue items.

---

**Resource 3: This week's tasks**
```typescript
server.resource(
  "todoist://tasks/week",
  "This week's tasks",
  "All tasks due this week",
  "application/json",
  async () => { ... }
);
```

**Why:** Weekly view of upcoming work.

---

**Resource 4: High priority tasks**
```typescript
server.resource(
  "todoist://tasks/priority/high",
  "High priority tasks",
  "All tasks with priority 3 (high) or 4 (urgent)",
  "application/json",
  async () => {
    const allTasks = await this.getTasks({});
    const highPriorityTasks = allTasks.filter((task) => task.priority >= 3);
    return JSON.stringify(highPriorityTasks, null, 2);
  }
);
```

**Why:** Focus on urgent items.

---

**Resource 5: All projects**
```typescript
server.resource(
  "todoist://projects",
  "All projects",
  "Complete list of all Todoist projects",
  "application/json",
  async () => { ... }
);
```

**Why:** Access to project list.

---

**Resource 6: All labels**
```typescript
server.resource(
  "todoist://labels",
  "All labels",
  "Complete list of all personal labels",
  "application/json",
  async () => { ... }
);
```

**Why:** Access to label taxonomy.

---

### 7. Bug Fixes in Move Task Logic

**File:** `src/todoist/client.ts`

**Changes:** Fixed potential undefined parent_id issues:

```typescript
// BEFORE: Non-null assertion could fail
const moveArgs = taskData.project_id
  ? { projectId: taskData.project_id }
  : taskData.section_id
    ? { sectionId: taskData.section_id }
    : { parentId: taskData.parent_id! }; // <-- ! assertion risky

// AFTER: Explicit fallback
const moveArgs = taskData.project_id
  ? { projectId: taskData.project_id }
  : taskData.section_id
    ? { sectionId: taskData.section_id }
    : taskData.parent_id
      ? { parentId: taskData.parent_id }
      : { projectId: "" }; // This should never happen due to schema validation
```

**Why:** Prevents runtime errors if parent_id is undefined. Added safety comment.

---

## Commit 2: MCP SDK 1.21.0 Compatibility (c353e3f)

**Goal:** Update to latest MCP SDK and fix breaking API changes

### 1. SDK Version Updates

**File:** `package.json`

**Changes:**
```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "1.21.0",  // was 1.17.4
    "@smithery/sdk": "1.7.4",                // was 1.6.8
  }
}
```

**Why:** Latest SDK versions include bug fixes and new features. Required to use new resource API.

---

### 2. Resource Registration API Update

**File:** `src/todoist/client.ts` - registerResources method

**Changes:** Updated from 4-parameter to metadata object format:

```typescript
// BEFORE (SDK 1.17.4):
server.resource(
  "todoist://tasks/today",
  "Today's tasks",
  "All tasks due today",
  "application/json",
  async () => {
    const tasks = await this.getTasks({ filter: "today" });
    return JSON.stringify(tasks, null, 2);
  }
);

// AFTER (SDK 1.21.0):
server.resource(
  "todoist://tasks/today",
  "todoist://tasks/today",
  {
    title: "Today's tasks",
    description: "All tasks due today",
    mimeType: "application/json",
  },
  async (uri) => {
    const tasks = await this.getTasks({ filter: "today" });
    return {
      contents: [{
        uri: uri.toString(),
        text: JSON.stringify(tasks, null, 2),
        mimeType: "application/json",
      }],
    };
  }
);
```

**Why:**
- New SDK requires URI pattern as second parameter
- Metadata moved to object (cleaner API)
- Callback receives URI parameter
- Must return `ReadResourceResult` with `contents` array instead of raw string

**Applied to all 6 resources:**
1. todoist://tasks/today
2. todoist://tasks/overdue
3. todoist://tasks/week
4. todoist://tasks/priority/high
5. todoist://projects
6. todoist://labels

---

### 3. Tool Annotations API Update

**File:** `src/todoist/client.ts`

**Changes:** Moved from custom handler to direct tool registration:

```typescript
// BEFORE: Override tools/list handler
private addToolAnnotations(server: McpServer) {
  const toolAnnotations = { ... };

  server.setRequestHandler("tools/list", async () => {
    const tools = Array.from((server as any)._tools?.values() || []);
    return {
      tools: tools.map((tool: any) => ({
        ...tool,
        annotations: toolAnnotations[tool.name] || {},
      })),
    };
  });
}

// AFTER: Pass annotations directly to server.tool()
server.tool(
  "todoist_create_task",
  "Create one or more tasks...",
  { /* schema */ },
  { readOnlyHint: false, destructiveHint: false, idempotentHint: false }, // <-- annotations
  async (params) => { ... }
);
```

**Why:**
- New SDK supports annotations as 4th parameter to `server.tool()`
- Cleaner, type-safe API
- No need for internal SDK hacks (`(server as any)._tools`)
- Removed entire `addToolAnnotations` method (108 lines)

**Applied to all 16 tools** with appropriate annotations:
- 5 GET tools: `readOnlyHint: true`
- 2 DELETE tools: `destructiveHint: true`
- 11 safe-to-repeat tools: `idempotentHint: true`

---

### 4. Build Script Improvement

**File:** `package.json` - build:stdio script

**Changes:**
```json
{
  "scripts": {
    "build:stdio": "tsc && node -e \"const fs = require('fs'); const path = require('path'); const file = 'build/index.js'; const content = fs.readFileSync(file, 'utf8'); if (!content.startsWith('#!')) { fs.writeFileSync(file, '#!/usr/bin/env node\\n' + content); } fs.chmodSync(file, '755');\""
  }
}
```

**Before:**
```bash
tsc && node -e "require('fs').chmodSync('build/index.js', '755')"
```

**After:** Adds shebang check and prepends if missing

**Why:** Ensures built binary always has proper shebang for direct execution. Prevents "command not found" errors.

---

## Commit 3: Binary Execution Fixes (b153088)

**Goal:** Fix issues when running as npx or standalone binary

### 1. Main Module Detection Improvement

**File:** `src/index.ts`

**Changes:** Replaced simple comparison with robust detection:

```typescript
// BEFORE: Simple check that fails with npx
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(...);
}

// AFTER: Comprehensive detection
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
  main().catch(...);
}
```

**Why:**
- **Problem:** When run via `npx`, `process.argv[1]` contains cache path, not actual file path
- **Solution:** Multiple detection strategies:
  1. Exact path match (traditional execution)
  2. Filename match (npx with cache paths)
  3. Package name match (npx `@hoffination/mcp-todoist`)
  4. Fallback for error cases
- **Result:** Works in all execution contexts:
  - Direct: `node build/index.js`
  - Binary: `./build/index.js`
  - NPX: `npx @hoffination/mcp-todoist`
  - Import: `import { createServer } from 'mcp-todoist'` (doesn't trigger main)

---

### 2. Import Additions

**File:** `src/index.ts`

**Changes:**
```typescript
import { fileURLToPath, pathToFileURL } from "node:url";
```

**Why:** Required for URL to file path conversions in ES modules.

---

## Summary of Impact

### Quality Score Breakdown

| Category | Points | Implementation |
|----------|--------|----------------|
| Optional Configuration | +15 | Config fallback to env vars |
| Enhanced Input Docs | +12 | Detailed descriptions on 4 tools |
| Tool Annotations | +9 | All 16 tools annotated |
| License Metadata | +6 | Added to package.json |
| User Prompts | +5 | 5 workflow prompts |
| Resources | +5 | 6 data resources |
| **Total** | **52** | **Achieved target** |

### Files Modified

1. **package.json** (3 changes across commits)
   - Added MIT license field
   - Updated SDK versions (1.17.4 → 1.21.0, 1.6.8 → 1.7.4)
   - Enhanced build:stdio script with shebang prepending

2. **src/index.ts** (2 changes)
   - Made config optional with defaults
   - Improved main module detection for npx compatibility

3. **src/todoist/client.ts** (Major refactor)
   - Added environment variable fallback in constructor
   - Added 5 user prompts
   - Added 6 resources
   - Updated resource API for SDK 1.21.0
   - Moved annotations from custom handler to direct registration
   - Enhanced documentation on 4 tools
   - Fixed move task edge cases

4. **src/todoist/types.ts** (1 change)
   - Made apiToken optional in schema

5. **pnpm-lock.yaml** (Auto-generated)
   - Updated dependencies

### Lines of Code

- **Added:** ~450 lines (prompts, resources, documentation, detection logic)
- **Removed:** ~115 lines (duplicate validation, old annotation handler)
- **Modified:** ~200 lines (API updates, parameter docs)
- **Net:** +335 lines

### Backward Compatibility

✅ **Fully maintained:**
- Existing tool names and schemas unchanged
- Environment variable behavior enhanced, not replaced
- HTTP and stdio transports both work
- All 16 tools function identically from client perspective

### Testing Requirements

Each commit was verified to:
1. **Build successfully:** `pnpm run build` and `pnpm run build:stdio`
2. **Pass linting:** `pnpm run lint:fix`
3. **Pass formatting:** `pnpm run format:fix`
4. **Work in stdio mode:** `pnpm run inspector`
5. **Work in HTTP mode:** `pnpm run dev`
6. **Execute as binary:** `./build/index.js`
7. **Execute via npx:** `npx @hoffination/mcp-todoist`

---

## Key Learnings

### Why These Changes Matter

1. **Optional Config** → Easier deployment (no config files needed)
2. **Annotations** → Clients can provide better UX (warnings for destructive ops)
3. **Documentation** → Reduces user errors and support burden
4. **Prompts** → Reduces common workflow friction
5. **Resources** → Direct data access without tool invocation
6. **SDK Updates** → Bug fixes and future-proofing
7. **Binary Fixes** → Works in all installation methods

### Development Approach

1. **Incremental commits:** Each commit focused on one concern
2. **Quality first:** Lint and format before each commit
3. **Compatibility:** New SDK features adopted without breaking changes
4. **User-centric:** Prompts and resources based on common workflows
5. **Defensive coding:** Fallbacks and error messages at every boundary

---

**Total Commits:** 3
**Total Score Gained:** 52+ points (100+ quality score achieved)
**Breaking Changes:** 0
**Bugs Fixed:** 2 (move task edge case, npx execution)
