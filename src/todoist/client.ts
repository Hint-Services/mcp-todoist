import {
  type AddLabelArgs,
  type AddProjectArgs,
  type AddTaskArgs,
  type GetTasksArgs,
  type Label,
  type PersonalProject,
  type Section,
  type Task,
  TodoistApi,
  type UpdateLabelArgs,
  type UpdateProjectArgs,
  type UpdateTaskArgs,
  type WorkspaceProject,
} from "@doist/todoist-api-typescript";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

// Union type for projects
type Project = PersonalProject | WorkspaceProject;

import type { TodoistConfig } from "./types.js";
import {
  BatchCompleteTaskParamsSchema,
  BatchCreatePersonalLabelParamsSchema,
  BatchCreateProjectParamsSchema,
  BatchCreateProjectSectionParamsSchema,
  BatchCreateTaskParamsSchema,
  BatchDeleteTaskParamsSchema,
  BatchGetProjectSectionsParamsSchema,
  BatchRemoveSharedLabelParamsSchema,
  BatchRenameSharedLabelParamsSchema,
  BatchUpdatePersonalLabelParamsSchema,
  BatchUpdateProjectParamsSchema,
  BatchUpdateTaskLabelsParamsSchema,
  BatchUpdateTaskParamsSchema,
  CompleteTaskParamsSchema,
  CreatePersonalLabelParamsSchema,
  CreateProjectParamsSchema,
  CreateProjectSectionParamsSchema,
  CreateTaskParamsSchema,
  DeletePersonalLabelParamsSchema,
  DeleteTaskParamsSchema,
  GetPersonalLabelParamsSchema,
  GetProjectSectionsParamsSchema,
  GetProjectsParamsSchema,
  GetSharedLabelsParamsSchema,
  GetTasksParamsSchema,
  RemoveSharedLabelParamsSchema,
  RenameSharedLabelParamsSchema,
  UpdatePersonalLabelParamsSchema,
  UpdateProjectParamsSchema,
  UpdateTaskLabelsParamsSchema,
  UpdateTaskParamsSchema,
} from "./types.js";

export class TodoistClient {
  private api: TodoistApi;

  constructor(private config: TodoistConfig) {
    this.api = new TodoistApi(config.apiToken);
  }

  /**
   * Simplified error handler for API requests
   */
  private async handleRequest<T>(request: () => Promise<T>): Promise<T> {
    try {
      return await request();
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Todoist API error: ${error.message}`);
      }
      throw new Error(`Todoist API error: ${String(error)}`);
    }
  }

  /**
   * Helper: Validate and normalize color values
   */
  private validateColor(color: string): string {
    const validColors = [
      "berry_red",
      "red",
      "orange",
      "yellow",
      "olive_green",
      "lime_green",
      "green",
      "mint_green",
      "teal",
      "sky_blue",
      "light_blue",
      "blue",
      "grape",
      "violet",
      "lavender",
      "magenta",
      "salmon",
      "charcoal",
      "grey",
      "taupe",
    ];

    if (validColors.includes(color)) {
      return color;
    }

    // Fallback to a default color if invalid
    console.warn(`Invalid color "${color}", defaulting to "grey"`);
    return "grey";
  }

  /**
   * Helper: Find task by name
   */
  private async findTaskByName(taskName: string): Promise<Task | null> {
    const response = await this.api.getTasks();
    return (
      response.results.find((task) =>
        task.content.toLowerCase().includes(taskName.toLowerCase())
      ) || null
    );
  }

  /**
   * Helper: Find project by name
   */
  private async findProjectByName(
    projectName: string
  ): Promise<Project | null> {
    const response = await this.api.getProjects();
    return (
      response.results.find((project) =>
        project.name.toLowerCase().includes(projectName.toLowerCase())
      ) || null
    );
  }

  /**
   * Helper: Find label by name
   */
  private async findLabelByName(labelName: string): Promise<Label | null> {
    const response = await this.api.getLabels();
    return (
      response.results.find(
        (label) => label.name.toLowerCase() === labelName.toLowerCase()
      ) || null
    );
  }

  /**
   * Get tasks with optional filtering
   */
  async getTasks(
    params: z.infer<typeof GetTasksParamsSchema> = {}
  ): Promise<Task[]> {
    return this.handleRequest(async () => {
      let tasks: Task[];

      // Use getTasksByFilter for natural language filters (today, overdue, etc.)
      if (params.filter) {
        const response = await this.api.getTasksByFilter({
          query: params.filter,
          lang: params.lang,
        });
        tasks = response.results;
      } else {
        // Use standard getTasks for ID-based filtering
        const apiParams: GetTasksArgs = {};

        if (params.project_id) apiParams.projectId = params.project_id;
        if (params.section_id) apiParams.sectionId = params.section_id;
        if (params.label) apiParams.label = params.label;
        if (params.ids) apiParams.ids = params.ids;

        const response = await this.api.getTasks(apiParams);
        tasks = response.results;
      }

      // Apply client-side filtering for priority
      if (params.priority) {
        tasks = tasks.filter((task) => task.priority === params.priority);
      }

      // Apply limit
      if (params.limit && tasks.length > params.limit) {
        tasks = tasks.slice(0, params.limit);
      }

      return tasks;
    });
  }

  /**
   * Create a single task
   */
  async createTask(
    params: z.infer<typeof CreateTaskParamsSchema>
  ): Promise<Task> {
    return this.handleRequest(async () => {
      const apiParams = {
        content: params.content,
        description: params.description,
        projectId: params.project_id,
        sectionId: params.section_id,
        parentId: params.parent_id,
        order: params.order,
        labels: params.labels,
        priority: params.priority,
        dueString: params.due_string,
        dueLang: params.due_lang,
        assigneeId: params.assignee_id,
        // Only set one of dueDate or dueDatetime, not both
        ...(params.due_datetime
          ? { dueDatetime: params.due_datetime }
          : params.due_date
            ? { dueDate: params.due_date }
            : {}),
        // Conditionally include duration fields together
        ...(params.duration !== undefined && params.duration_unit !== undefined
          ? {
              duration: params.duration,
              durationUnit: params.duration_unit,
            }
          : {}),
      } as AddTaskArgs;

      return await this.api.addTask(apiParams);
    });
  }

  /**
   * Update a task
   */
  async updateTask(
    taskId: string,
    params: Partial<z.infer<typeof UpdateTaskParamsSchema>>
  ): Promise<Task> {
    return this.handleRequest(async () => {
      const apiParams = {
        content: params.content,
        description: params.description,
        labels: params.labels,
        priority: params.priority,
        dueString: params.due_string,
        dueLang: params.due_lang,
        // Only set one of dueDate or dueDatetime, not both
        ...(params.due_datetime
          ? { dueDatetime: params.due_datetime }
          : params.due_date
            ? { dueDate: params.due_date }
            : {}),
        // Conditionally include duration fields together
        ...(params.duration !== undefined && params.duration_unit !== undefined
          ? {
              duration: params.duration,
              durationUnit: params.duration_unit,
            }
          : {}),
      } as UpdateTaskArgs;

      return await this.api.updateTask(taskId, apiParams);
    });
  }

  /**
   * Delete a task
   */
  async deleteTask(taskId: string): Promise<boolean> {
    return this.handleRequest(async () => {
      return await this.api.deleteTask(taskId);
    });
  }

  /**
   * Complete a task
   */
  async completeTask(taskId: string): Promise<boolean> {
    return this.handleRequest(async () => {
      return await this.api.closeTask(taskId);
    });
  }

  /**
   * Get projects
   */
  async getProjects(): Promise<Project[]> {
    return this.handleRequest(async () => {
      const response = await this.api.getProjects();
      return response.results as Project[];
    });
  }

  /**
   * Create a project
   */
  async createProject(
    params: z.infer<typeof CreateProjectParamsSchema>
  ): Promise<Project> {
    return this.handleRequest(async () => {
      const apiParams: AddProjectArgs = {
        name: params.name,
        parentId: params.parent_id,
        color: params.color,
        isFavorite: params.favorite,
        viewStyle: params.view_style,
      };

      return await this.api.addProject(apiParams);
    });
  }

  /**
   * Update a project
   */
  async updateProject(
    projectId: string,
    params: Partial<z.infer<typeof UpdateProjectParamsSchema>>
  ): Promise<Project> {
    return this.handleRequest(async () => {
      const apiParams: UpdateProjectArgs = {
        name: params.name,
        color: params.color,
        isFavorite: params.favorite,
        viewStyle: params.view_style,
      };

      return await this.api.updateProject(projectId, apiParams);
    });
  }

  /**
   * Get sections for a project
   */
  async getProjectSections(projectId: string): Promise<Section[]> {
    return this.handleRequest(async () => {
      const response = await this.api.getSections({ projectId });
      return response.results;
    });
  }

  /**
   * Create a section
   */
  async createSection(
    projectId: string,
    params: { name: string; order?: number }
  ): Promise<Section> {
    return this.handleRequest(async () => {
      return await this.api.addSection({
        name: params.name,
        projectId: projectId,
        order: params.order,
      });
    });
  }

  /**
   * Get all personal labels
   */
  async getPersonalLabels(): Promise<Label[]> {
    return this.handleRequest(async () => {
      const response = await this.api.getLabels();
      return response.results;
    });
  }

  /**
   * Get a specific personal label
   */
  async getPersonalLabel(labelId: string): Promise<Label> {
    return this.handleRequest(async () => {
      return await this.api.getLabel(labelId);
    });
  }

  /**
   * Create a personal label
   */
  async createPersonalLabel(
    params: z.infer<typeof CreatePersonalLabelParamsSchema>
  ): Promise<Label> {
    return this.handleRequest(async () => {
      return await this.api.addLabel({
        name: params.name,
        color: params.color,
        order: params.order,
        isFavorite: params.is_favorite,
      });
    });
  }

  /**
   * Update a personal label
   */
  async updatePersonalLabel(
    labelId: string,
    params: Partial<z.infer<typeof UpdatePersonalLabelParamsSchema>>
  ): Promise<Label> {
    return this.handleRequest(async () => {
      return await this.api.updateLabel(labelId, {
        name: params.name,
        color: params.color,
        order: params.order,
        isFavorite: params.is_favorite,
      });
    });
  }

  /**
   * Delete a personal label
   */
  async deletePersonalLabel(labelId: string): Promise<boolean> {
    return this.handleRequest(async () => {
      return await this.api.deleteLabel(labelId);
    });
  }

  /**
   * Register all Todoist tools with the MCP server
   */
  registerTodoistTools(server: McpServer) {
    this.registerTaskTools(server);
    this.registerProjectTools(server);
    this.registerLabelTools(server);
  }

  /**
   * Register task-related tools
   */
  private registerTaskTools(server: McpServer) {
    // Tool: Create task(s)
    server.tool(
      "todoist_create_task",
      "Create one or more tasks in Todoist. Supports both single task creation and batch operations. Include details like due dates, priorities, labels, and project assignments.",
      {
        tasks: z
          .array(CreateTaskParamsSchema)
          .optional()
          .describe("Array of tasks to create (for batch operations)"),
        content: z
          .string()
          .optional()
          .describe("Task content/title (for single task)"),
        description: z.string().optional().describe("Task description"),
        project_id: z.string().optional().describe("Project ID"),
        section_id: z.string().optional().describe("Section ID"),
        labels: z.array(z.string()).optional().describe("Label names"),
        priority: z
          .number()
          .min(1)
          .max(4)
          .optional()
          .describe("Priority (1-4)"),
        due_string: z
          .string()
          .optional()
          .describe("Natural language due date (e.g., 'tomorrow')"),
      },
      async (params) => {
        try {
          // Batch operation
          if (params.tasks && params.tasks.length > 0) {
            const results = await Promise.all(
              params.tasks.map(async (taskData) => {
                try {
                  const task = await this.createTask(taskData);
                  return { success: true, task };
                } catch (error) {
                  return {
                    success: false,
                    error:
                      error instanceof Error ? error.message : String(error),
                    taskData,
                  };
                }
              })
            );

            const successCount = results.filter((r) => r.success).length;

            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(
                    {
                      success: successCount === params.tasks.length,
                      summary: {
                        total: params.tasks.length,
                        succeeded: successCount,
                        failed: params.tasks.length - successCount,
                      },
                      results,
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          }

          // Single task operation
          if (params.content) {
            const task = await this.createTask({
              content: params.content,
              description: params.description,
              project_id: params.project_id,
              section_id: params.section_id,
              labels: params.labels,
              priority: params.priority,
              due_string: params.due_string,
            });

            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify({ success: true, task }, null, 2),
                },
              ],
            };
          }

          throw new Error("Either 'content' or 'tasks' must be provided");
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    success: false,
                    error:
                      error instanceof Error ? error.message : String(error),
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }
      }
    );

    // Tool: Get tasks
    server.tool(
      "todoist_get_tasks",
      "Retrieve tasks from Todoist with flexible filtering options. Filter by project, section, label, priority, or use natural language filters like 'today', 'tomorrow', 'overdue'.",
      GetTasksParamsSchema.partial().shape,
      async (params) => {
        try {
          const tasks = await this.getTasks(params);

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    success: true,
                    tasks,
                    count: tasks.length,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    success: false,
                    error:
                      error instanceof Error ? error.message : String(error),
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }
      }
    );

    // Tool: Update task(s)
    server.tool(
      "todoist_update_task",
      "Update one or more existing tasks in Todoist. Supports both single task updates and batch operations. Can update by task ID or search by task name.",
      {
        tasks: z
          .array(UpdateTaskParamsSchema)
          .optional()
          .describe("Array of tasks to update (for batch operations)"),
        task_id: z.string().optional().describe("Task ID to update"),
        task_name: z
          .string()
          .optional()
          .describe("Task name to search for (if ID not provided)"),
        content: z.string().optional().describe("New task content"),
        description: z.string().optional().describe("New description"),
        labels: z.array(z.string()).optional().describe("New labels"),
        priority: z.number().min(1).max(4).optional().describe("New priority"),
      },
      async (params) => {
        try {
          // Batch operation
          if (params.tasks && params.tasks.length > 0) {
            const response = await this.api.getTasks();
            const allTasks = response.results;

            const results = await Promise.all(
              params.tasks.map(async (taskData) => {
                try {
                  let taskId = taskData.task_id;

                  if (!taskId && taskData.task_name) {
                    const matchingTask = allTasks.find((task: Task) =>
                      task.content
                        .toLowerCase()
                        .includes(taskData.task_name?.toLowerCase() || "")
                    );

                    if (!matchingTask) {
                      return {
                        success: false,
                        error: `Task not found: ${taskData.task_name}`,
                        taskData,
                      };
                    }

                    taskId = matchingTask.id;
                  }

                  if (!taskId) {
                    return {
                      success: false,
                      error: "Either task_id or task_name must be provided",
                      taskData,
                    };
                  }

                  const task = await this.updateTask(taskId, taskData);
                  return { success: true, task };
                } catch (error) {
                  return {
                    success: false,
                    error:
                      error instanceof Error ? error.message : String(error),
                    taskData,
                  };
                }
              })
            );

            const successCount = results.filter((r) => r.success).length;

            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(
                    {
                      success: successCount === params.tasks.length,
                      summary: {
                        total: params.tasks.length,
                        succeeded: successCount,
                        failed: params.tasks.length - successCount,
                      },
                      results,
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          }

          // Single task operation
          let taskId = params.task_id;

          if (!taskId && params.task_name) {
            const task = await this.findTaskByName(params.task_name);
            if (!task) {
              throw new Error(`Task not found: ${params.task_name}`);
            }
            taskId = task.id;
          }

          if (!taskId) {
            throw new Error("Either task_id or task_name must be provided");
          }

          const task = await this.updateTask(taskId, params);

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({ success: true, task }, null, 2),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    success: false,
                    error:
                      error instanceof Error ? error.message : String(error),
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }
      }
    );

    // Tool: Delete task(s)
    server.tool(
      "todoist_delete_task",
      "Delete one or more tasks from Todoist. Supports both single task deletion and batch operations. Can delete by task ID or search by task name.",
      {
        tasks: z
          .array(DeleteTaskParamsSchema)
          .optional()
          .describe("Array of tasks to delete (for batch operations)"),
        task_id: z.string().optional().describe("Task ID to delete"),
        task_name: z
          .string()
          .optional()
          .describe("Task name to search for (if ID not provided)"),
      },
      async (params) => {
        try {
          // Batch operation
          if (params.tasks && params.tasks.length > 0) {
            const response = await this.api.getTasks();
            const allTasks = response.results;

            const results = await Promise.all(
              params.tasks.map(async (taskData) => {
                try {
                  let taskId = taskData.task_id;

                  if (!taskId && taskData.task_name) {
                    const matchingTask = allTasks.find((task) =>
                      task.content
                        .toLowerCase()
                        .includes(taskData.task_name?.toLowerCase() || "")
                    );

                    if (!matchingTask) {
                      return {
                        success: false,
                        error: `Task not found: ${taskData.task_name}`,
                        taskData,
                      };
                    }

                    taskId = matchingTask.id;
                  }

                  if (!taskId) {
                    return {
                      success: false,
                      error: "Either task_id or task_name must be provided",
                      taskData,
                    };
                  }

                  await this.deleteTask(taskId);
                  return { success: true, task_id: taskId };
                } catch (error) {
                  return {
                    success: false,
                    error:
                      error instanceof Error ? error.message : String(error),
                    taskData,
                  };
                }
              })
            );

            const successCount = results.filter((r) => r.success).length;

            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(
                    {
                      success: successCount === params.tasks.length,
                      summary: {
                        total: params.tasks.length,
                        succeeded: successCount,
                        failed: params.tasks.length - successCount,
                      },
                      results,
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          }

          // Single task operation
          let taskId = params.task_id;

          if (!taskId && params.task_name) {
            const task = await this.findTaskByName(params.task_name);
            if (!task) {
              throw new Error(`Task not found: ${params.task_name}`);
            }
            taskId = task.id;
          }

          if (!taskId) {
            throw new Error("Either task_id or task_name must be provided");
          }

          await this.deleteTask(taskId);

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  { success: true, task_id: taskId },
                  null,
                  2
                ),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    success: false,
                    error:
                      error instanceof Error ? error.message : String(error),
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }
      }
    );

    // Tool: Complete task(s)
    server.tool(
      "todoist_complete_task",
      "Mark one or more tasks as complete in Todoist. Supports both single task completion and batch operations. Can complete by task ID or search by task name.",
      {
        tasks: z
          .array(CompleteTaskParamsSchema)
          .optional()
          .describe("Array of tasks to complete (for batch operations)"),
        task_id: z.string().optional().describe("Task ID to complete"),
        task_name: z
          .string()
          .optional()
          .describe("Task name to search for (if ID not provided)"),
      },
      async (params) => {
        try {
          // Batch operation
          if (params.tasks && params.tasks.length > 0) {
            const response = await this.api.getTasks();
            const allTasks = response.results;

            const results = await Promise.all(
              params.tasks.map(async (taskData) => {
                try {
                  let taskId = taskData.task_id;

                  if (!taskId && taskData.task_name) {
                    const matchingTask = allTasks.find((task) =>
                      task.content
                        .toLowerCase()
                        .includes(taskData.task_name?.toLowerCase() || "")
                    );

                    if (!matchingTask) {
                      return {
                        success: false,
                        error: `Task not found: ${taskData.task_name}`,
                        taskData,
                      };
                    }

                    taskId = matchingTask.id;
                  }

                  if (!taskId) {
                    return {
                      success: false,
                      error: "Either task_id or task_name must be provided",
                      taskData,
                    };
                  }

                  await this.completeTask(taskId);
                  return { success: true, task_id: taskId };
                } catch (error) {
                  return {
                    success: false,
                    error:
                      error instanceof Error ? error.message : String(error),
                    taskData,
                  };
                }
              })
            );

            const successCount = results.filter((r) => r.success).length;

            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(
                    {
                      success: successCount === params.tasks.length,
                      summary: {
                        total: params.tasks.length,
                        succeeded: successCount,
                        failed: params.tasks.length - successCount,
                      },
                      results,
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          }

          // Single task operation
          let taskId = params.task_id;

          if (!taskId && params.task_name) {
            const task = await this.findTaskByName(params.task_name);
            if (!task) {
              throw new Error(`Task not found: ${params.task_name}`);
            }
            taskId = task.id;
          }

          if (!taskId) {
            throw new Error("Either task_id or task_name must be provided");
          }

          await this.completeTask(taskId);

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  { success: true, task_id: taskId },
                  null,
                  2
                ),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    success: false,
                    error:
                      error instanceof Error ? error.message : String(error),
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }
      }
    );
  }

  /**
   * Register project-related tools
   */
  private registerProjectTools(server: McpServer) {
    // Tool: Get projects
    server.tool(
      "todoist_get_projects",
      "Retrieve all projects from Todoist. Optionally include sections and hierarchy information to understand parent-child project relationships.",
      GetProjectsParamsSchema.partial().shape,
      async (params) => {
        try {
          let projects = await this.getProjects();

          // Filter by specific project IDs if provided
          if (params.project_ids && params.project_ids.length > 0) {
            projects = projects.filter((p) =>
              params.project_ids?.includes(p.id)
            );
          }

          // Include sections if requested
          if (params.include_sections) {
            const projectsWithSections: Array<
              Project & { sections: Section[] }
            > = await Promise.all(
              projects.map(async (project) => {
                const sections = await this.getProjectSections(project.id);
                return { ...project, sections };
              })
            );
            projects = projectsWithSections as Project[];
          }

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    success: true,
                    projects,
                    count: projects.length,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    success: false,
                    error:
                      error instanceof Error ? error.message : String(error),
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }
      }
    );

    // Tool: Create project(s)
    server.tool(
      "todoist_create_project",
      "Create one or more projects in Todoist. Supports both single project creation and batch operations. Can create nested projects and optionally add sections during creation.",
      {
        projects: z
          .array(CreateProjectParamsSchema)
          .optional()
          .describe("Array of projects to create (for batch operations)"),
        name: z
          .string()
          .optional()
          .describe("Project name (for single project)"),
        parent_id: z.string().optional().describe("Parent project ID"),
        color: z.string().optional().describe("Project color"),
        favorite: z.boolean().optional().describe("Mark as favorite"),
      },
      async (params) => {
        try {
          // Batch operation
          if (params.projects && params.projects.length > 0) {
            const results = await Promise.all(
              params.projects.map(async (projectData) => {
                try {
                  // Handle parent_name if provided
                  if (projectData.parent_name && !projectData.parent_id) {
                    const parentProject = await this.findProjectByName(
                      projectData.parent_name
                    );
                    if (parentProject) {
                      projectData.parent_id = parentProject.id;
                    }
                  }

                  const project = await this.createProject(projectData);

                  // Create sections if provided
                  if (projectData.sections && projectData.sections.length > 0) {
                    await Promise.all(
                      projectData.sections.map((sectionName) =>
                        this.createSection(project.id, { name: sectionName })
                      )
                    );
                  }

                  return { success: true, project };
                } catch (error) {
                  return {
                    success: false,
                    error:
                      error instanceof Error ? error.message : String(error),
                    projectData,
                  };
                }
              })
            );

            const successCount = results.filter((r) => r.success).length;

            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(
                    {
                      success: successCount === params.projects.length,
                      summary: {
                        total: params.projects.length,
                        succeeded: successCount,
                        failed: params.projects.length - successCount,
                      },
                      results,
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          }

          // Single project operation
          if (params.name) {
            const createParams: z.infer<typeof CreateProjectParamsSchema> = {
              name: params.name,
              parent_id: params.parent_id,
              favorite: params.favorite,
              ...(params.color
                ? // biome-ignore lint/suspicious/noExplicitAny: necessary for type compatibility with Zod TodoistColor enum
                  { color: this.validateColor(params.color) as any }
                : {}),
            };
            const project = await this.createProject(createParams);

            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify({ success: true, project }, null, 2),
                },
              ],
            };
          }

          throw new Error("Either 'name' or 'projects' must be provided");
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    success: false,
                    error:
                      error instanceof Error ? error.message : String(error),
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }
      }
    );

    // Tool: Update project(s)
    server.tool(
      "todoist_update_project",
      "Update one or more existing projects in Todoist. Supports both single project updates and batch operations. Can update by project ID or search by project name.",
      {
        projects: z
          .array(UpdateProjectParamsSchema)
          .optional()
          .describe("Array of projects to update (for batch operations)"),
        project_id: z.string().optional().describe("Project ID to update"),
        project_name: z
          .string()
          .optional()
          .describe("Project name to search for (if ID not provided)"),
        name: z.string().optional().describe("New project name"),
        color: z.string().optional().describe("New color"),
        favorite: z.boolean().optional().describe("New favorite status"),
        view_style: z
          .enum(["list", "board"])
          .optional()
          .describe("Project view style"),
      },
      async (params) => {
        try {
          // Batch operation
          if (params.projects && params.projects.length > 0) {
            const allProjects = await this.getProjects();

            const results = await Promise.all(
              params.projects.map(async (projectData) => {
                try {
                  let projectId = projectData.project_id;

                  if (!projectId && projectData.project_name) {
                    const matchingProject = allProjects.find((project) =>
                      project.name
                        .toLowerCase()
                        .includes(projectData.project_name?.toLowerCase() || "")
                    );

                    if (!matchingProject) {
                      return {
                        success: false,
                        error: `Project not found: ${projectData.project_name}`,
                        projectData,
                      };
                    }

                    projectId = matchingProject.id;
                  }

                  if (!projectId) {
                    return {
                      success: false,
                      error:
                        "Either project_id or project_name must be provided",
                      projectData,
                    };
                  }

                  const project = await this.updateProject(
                    projectId,
                    projectData
                  );
                  return { success: true, project };
                } catch (error) {
                  return {
                    success: false,
                    error:
                      error instanceof Error ? error.message : String(error),
                    projectData,
                  };
                }
              })
            );

            const successCount = results.filter((r) => r.success).length;

            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(
                    {
                      success: successCount === params.projects.length,
                      summary: {
                        total: params.projects.length,
                        succeeded: successCount,
                        failed: params.projects.length - successCount,
                      },
                      results,
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          }

          // Single project operation
          let projectId = params.project_id;

          if (!projectId && params.project_name) {
            const project = await this.findProjectByName(params.project_name);
            if (!project) {
              throw new Error(`Project not found: ${params.project_name}`);
            }
            projectId = project.id;
          }

          if (!projectId) {
            throw new Error(
              "Either project_id or project_name must be provided"
            );
          }

          const updateParams: Partial<
            z.infer<typeof UpdateProjectParamsSchema>
          > = {
            name: params.name,
            favorite: params.favorite,
            view_style: params.view_style,
            ...(params.color
              ? // biome-ignore lint/suspicious/noExplicitAny: necessary for type compatibility with Zod TodoistColor enum
                { color: this.validateColor(params.color) as any }
              : {}),
          };
          const project = await this.updateProject(projectId, updateParams);

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({ success: true, project }, null, 2),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    success: false,
                    error:
                      error instanceof Error ? error.message : String(error),
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }
      }
    );

    // Tool: Get project sections
    server.tool(
      "todoist_get_project_sections",
      "Retrieve sections from one or more projects in Todoist. Sections help organize tasks within a project. Supports batch operations.",
      {
        projects: z
          .array(
            z.object({
              project_id: z.string().optional(),
              project_name: z.string().optional(),
            })
          )
          .optional()
          .describe("Array of projects to get sections from (batch)"),
        project_id: z.string().optional().describe("Project ID"),
        project_name: z
          .string()
          .optional()
          .describe("Project name (if ID not provided)"),
      },
      async (params) => {
        try {
          // Batch operation
          if (params.projects && params.projects.length > 0) {
            const allProjects = await this.getProjects();

            const results = await Promise.all(
              params.projects.map(async (projectData) => {
                try {
                  let projectId = projectData.project_id;

                  if (!projectId && projectData.project_name) {
                    const matchingProject = allProjects.find((project) =>
                      project.name
                        .toLowerCase()
                        .includes(projectData.project_name?.toLowerCase() || "")
                    );

                    if (!matchingProject) {
                      return {
                        success: false,
                        error: `Project not found: ${projectData.project_name}`,
                        projectData,
                      };
                    }

                    projectId = matchingProject.id;
                  }

                  if (!projectId) {
                    return {
                      success: false,
                      error:
                        "Either project_id or project_name must be provided",
                      projectData,
                    };
                  }

                  const sections = await this.getProjectSections(projectId);
                  return { success: true, project_id: projectId, sections };
                } catch (error) {
                  return {
                    success: false,
                    error:
                      error instanceof Error ? error.message : String(error),
                    projectData,
                  };
                }
              })
            );

            const successCount = results.filter((r) => r.success).length;

            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(
                    {
                      success: successCount === params.projects.length,
                      summary: {
                        total: params.projects.length,
                        succeeded: successCount,
                        failed: params.projects.length - successCount,
                      },
                      results,
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          }

          // Single project operation
          let projectId = params.project_id;

          if (!projectId && params.project_name) {
            const project = await this.findProjectByName(params.project_name);
            if (!project) {
              throw new Error(`Project not found: ${params.project_name}`);
            }
            projectId = project.id;
          }

          if (!projectId) {
            throw new Error(
              "Either project_id or project_name must be provided"
            );
          }

          const sections = await this.getProjectSections(projectId);

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  { success: true, sections, count: sections.length },
                  null,
                  2
                ),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    success: false,
                    error:
                      error instanceof Error ? error.message : String(error),
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }
      }
    );

    // Tool: Create project section(s)
    server.tool(
      "todoist_create_project_section",
      "Create one or more sections within Todoist projects. Sections help organize tasks. Supports both single section creation and batch operations.",
      {
        sections: z
          .array(CreateProjectSectionParamsSchema)
          .optional()
          .describe("Array of sections to create (for batch operations)"),
        project_id: z
          .string()
          .optional()
          .describe("Project ID (for single section)"),
        project_name: z
          .string()
          .optional()
          .describe("Project name (if ID not provided)"),
        name: z.string().optional().describe("Section name"),
        order: z.number().optional().describe("Section order"),
      },
      async (params) => {
        try {
          // Batch operation
          if (params.sections && params.sections.length > 0) {
            const allProjects = await this.getProjects();

            const results = await Promise.all(
              params.sections.map(async (sectionData) => {
                try {
                  let projectId = sectionData.project_id;

                  if (!projectId && sectionData.project_name) {
                    const matchingProject = allProjects.find((project) =>
                      project.name
                        .toLowerCase()
                        .includes(sectionData.project_name?.toLowerCase() || "")
                    );

                    if (!matchingProject) {
                      return {
                        success: false,
                        error: `Project not found: ${sectionData.project_name}`,
                        sectionData,
                      };
                    }

                    projectId = matchingProject.id;
                  }

                  if (!projectId) {
                    return {
                      success: false,
                      error:
                        "Either project_id or project_name must be provided",
                      sectionData,
                    };
                  }

                  const section = await this.createSection(projectId, {
                    name: sectionData.name,
                    order: sectionData.order,
                  });
                  return { success: true, section };
                } catch (error) {
                  return {
                    success: false,
                    error:
                      error instanceof Error ? error.message : String(error),
                    sectionData,
                  };
                }
              })
            );

            const successCount = results.filter((r) => r.success).length;

            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(
                    {
                      success: successCount === params.sections.length,
                      summary: {
                        total: params.sections.length,
                        succeeded: successCount,
                        failed: params.sections.length - successCount,
                      },
                      results,
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          }

          // Single section operation
          let projectId = params.project_id;

          if (!projectId && params.project_name) {
            const project = await this.findProjectByName(params.project_name);
            if (!project) {
              throw new Error(`Project not found: ${params.project_name}`);
            }
            projectId = project.id;
          }

          if (!projectId || !params.name) {
            throw new Error(
              "project_id (or project_name) and name must be provided"
            );
          }

          const section = await this.createSection(projectId, {
            name: params.name,
            order: params.order,
          });

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({ success: true, section }, null, 2),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    success: false,
                    error:
                      error instanceof Error ? error.message : String(error),
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }
      }
    );
  }

  /**
   * Register label-related tools
   */
  private registerLabelTools(server: McpServer) {
    // Tool: Get personal labels
    server.tool(
      "todoist_get_personal_labels",
      "Retrieve all personal labels from Todoist. Labels help categorize and organize tasks across projects.",
      {},
      async () => {
        try {
          const labels = await this.getPersonalLabels();

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    success: true,
                    labels,
                    count: labels.length,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    success: false,
                    error:
                      error instanceof Error ? error.message : String(error),
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }
      }
    );

    // Tool: Get specific personal label
    server.tool(
      "todoist_get_personal_label",
      "Retrieve a specific personal label by its ID from Todoist.",
      GetPersonalLabelParamsSchema.shape,
      async (params) => {
        try {
          const label = await this.getPersonalLabel(params.label_id);

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({ success: true, label }, null, 2),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    success: false,
                    error:
                      error instanceof Error ? error.message : String(error),
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }
      }
    );

    // Tool: Create personal label(s)
    server.tool(
      "todoist_create_personal_label",
      "Create one or more personal labels in Todoist. Supports both single label creation and batch operations. Labels can have colors and be marked as favorites.",
      {
        labels: z
          .array(CreatePersonalLabelParamsSchema)
          .optional()
          .describe("Array of labels to create (for batch operations)"),
        name: z.string().optional().describe("Label name (for single label)"),
        color: z.string().optional().describe("Label color"),
        is_favorite: z.boolean().optional().describe("Mark as favorite"),
      },
      async (params) => {
        try {
          // Batch operation
          if (params.labels && params.labels.length > 0) {
            const results = await Promise.all(
              params.labels.map(async (labelData) => {
                try {
                  const label = await this.createPersonalLabel(labelData);
                  return { success: true, label };
                } catch (error) {
                  return {
                    success: false,
                    error:
                      error instanceof Error ? error.message : String(error),
                    labelData,
                  };
                }
              })
            );

            const successCount = results.filter((r) => r.success).length;

            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(
                    {
                      success: successCount === params.labels.length,
                      summary: {
                        total: params.labels.length,
                        succeeded: successCount,
                        failed: params.labels.length - successCount,
                      },
                      results,
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          }

          // Single label operation
          if (params.name) {
            const createParams: z.infer<
              typeof CreatePersonalLabelParamsSchema
            > = {
              name: params.name,
              is_favorite: params.is_favorite,
              ...(params.color
                ? // biome-ignore lint/suspicious/noExplicitAny: necessary for type compatibility with Zod TodoistColor enum
                  { color: this.validateColor(params.color) as any }
                : {}),
            };
            const label = await this.createPersonalLabel(createParams);

            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify({ success: true, label }, null, 2),
                },
              ],
            };
          }

          throw new Error("Either 'name' or 'labels' must be provided");
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    success: false,
                    error:
                      error instanceof Error ? error.message : String(error),
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }
      }
    );

    // Tool: Update personal label(s)
    server.tool(
      "todoist_update_personal_label",
      "Update one or more existing personal labels in Todoist. Supports both single label updates and batch operations. Can update by label ID or search by label name.",
      {
        labels: z
          .array(UpdatePersonalLabelParamsSchema)
          .optional()
          .describe("Array of labels to update (for batch operations)"),
        label_id: z.string().optional().describe("Label ID to update"),
        label_name: z
          .string()
          .optional()
          .describe("Label name to search for (if ID not provided)"),
        name: z.string().optional().describe("New label name"),
        color: z.string().optional().describe("New color"),
        order: z.number().optional().describe("Label order"),
        is_favorite: z.boolean().optional().describe("New favorite status"),
      },
      async (params) => {
        try {
          // Batch operation
          if (params.labels && params.labels.length > 0) {
            const allLabels = await this.getPersonalLabels();

            const results = await Promise.all(
              params.labels.map(async (labelData) => {
                try {
                  let labelId = labelData.label_id;

                  if (!labelId && labelData.label_name) {
                    const matchingLabel = allLabels.find(
                      (label) =>
                        label.name.toLowerCase() ===
                        (labelData.label_name?.toLowerCase() || "")
                    );

                    if (!matchingLabel) {
                      return {
                        success: false,
                        error: `Label not found: ${labelData.label_name}`,
                        labelData,
                      };
                    }

                    labelId = matchingLabel.id;
                  }

                  if (!labelId) {
                    return {
                      success: false,
                      error: "Either label_id or label_name must be provided",
                      labelData,
                    };
                  }

                  const label = await this.updatePersonalLabel(
                    labelId,
                    labelData
                  );
                  return { success: true, label };
                } catch (error) {
                  return {
                    success: false,
                    error:
                      error instanceof Error ? error.message : String(error),
                    labelData,
                  };
                }
              })
            );

            const successCount = results.filter((r) => r.success).length;

            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(
                    {
                      success: successCount === params.labels.length,
                      summary: {
                        total: params.labels.length,
                        succeeded: successCount,
                        failed: params.labels.length - successCount,
                      },
                      results,
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          }

          // Single label operation
          let labelId = params.label_id;

          if (!labelId && params.label_name) {
            const label = await this.findLabelByName(params.label_name);
            if (!label) {
              throw new Error(`Label not found: ${params.label_name}`);
            }
            labelId = label.id;
          }

          if (!labelId) {
            throw new Error("Either label_id or label_name must be provided");
          }

          const updateParams: Partial<
            z.infer<typeof UpdatePersonalLabelParamsSchema>
          > = {
            name: params.name,
            order: params.order,
            is_favorite: params.is_favorite,
            ...(params.color
              ? // biome-ignore lint/suspicious/noExplicitAny: necessary for type compatibility with Zod TodoistColor enum
                { color: this.validateColor(params.color) as any }
              : {}),
          };
          const label = await this.updatePersonalLabel(labelId, updateParams);

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({ success: true, label }, null, 2),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    success: false,
                    error:
                      error instanceof Error ? error.message : String(error),
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }
      }
    );

    // Tool: Delete personal label
    server.tool(
      "todoist_delete_personal_label",
      "Delete a personal label from Todoist. This will remove the label from all tasks that use it.",
      DeletePersonalLabelParamsSchema.shape,
      async (params) => {
        try {
          await this.deletePersonalLabel(params.label_id);

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  { success: true, label_id: params.label_id },
                  null,
                  2
                ),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    success: false,
                    error:
                      error instanceof Error ? error.message : String(error),
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }
      }
    );

    // Note: Shared labels operations require different API endpoints
    // that may not be fully supported in the TypeScript SDK yet
    // Leaving placeholders for future implementation
  }
}
