import { z } from "zod";

/**
 * Configuration for the Todoist API client
 */
export const TodoistConfigSchema = z.object({
  apiToken: z.string().min(1, "Todoist API token is required"),
});

export type TodoistConfig = z.infer<typeof TodoistConfigSchema>;

/**
 * Todoist color options
 */
export const TodoistColorSchema = z.enum([
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
]);

export type TodoistColor = z.infer<typeof TodoistColorSchema>;

/**
 * Task priority levels (1-4)
 */
export const TaskPrioritySchema = z.number().min(1).max(4);

/**
 * Duration unit for tasks
 */
export const DurationUnitSchema = z.enum(["minute", "day"]);

/**
 * View style for projects
 */
export const ViewStyleSchema = z.enum(["list", "board"]);

/**
 * Sort direction for queries
 */
export const SortDirectionSchema = z.enum(["asc", "desc"]);

/**
 * Task creation parameters (single task)
 */
export const CreateTaskParamsSchema = z.object({
  content: z.string().min(1, "Task content is required"),
  description: z.string().optional(),
  project_id: z.string().optional(),
  section_id: z.string().optional(),
  parent_id: z.string().optional(),
  order: z.number().optional(),
  labels: z.array(z.string()).optional(),
  priority: TaskPrioritySchema.optional(),
  due_string: z.string().optional(),
  due_date: z.string().optional(),
  due_datetime: z.string().optional(),
  due_lang: z.string().optional(),
  assignee_id: z.string().optional(),
  duration: z.number().optional(),
  duration_unit: DurationUnitSchema.optional(),
  deadline_date: z.string().optional(),
  deadline_lang: z.string().optional(),
});

export type CreateTaskParams = z.infer<typeof CreateTaskParamsSchema>;

/**
 * Batch task creation parameters
 */
export const BatchCreateTaskParamsSchema = z.object({
  tasks: z.array(CreateTaskParamsSchema),
});

export type BatchCreateTaskParams = z.infer<typeof BatchCreateTaskParamsSchema>;

/**
 * Task query/filter parameters
 */
export const GetTasksParamsSchema = z.object({
  project_id: z.string().optional(),
  section_id: z.string().optional(),
  label: z.string().optional(),
  filter: z
    .string()
    .optional()
    .describe(
      "Natural language filter like 'today', 'tomorrow', 'next week', etc."
    ),
  lang: z.string().optional(),
  ids: z.array(z.string()).optional(),
  priority: TaskPrioritySchema.optional(),
  limit: z.number().min(1).default(10).optional(),
});

export type GetTasksParams = z.infer<typeof GetTasksParamsSchema>;

/**
 * Task update parameters (single task)
 */
export const UpdateTaskParamsSchema = z.object({
  task_id: z.string().optional(),
  task_name: z.string().optional(),
  content: z.string().optional(),
  description: z.string().optional(),
  project_id: z.string().optional(),
  section_id: z.string().optional(),
  labels: z.array(z.string()).optional(),
  priority: TaskPrioritySchema.optional(),
  due_string: z.string().optional(),
  due_date: z.string().optional(),
  due_datetime: z.string().optional(),
  due_lang: z.string().optional(),
  assignee_id: z.string().optional(),
  duration: z.number().optional(),
  duration_unit: DurationUnitSchema.optional(),
  deadline_date: z.string().optional(),
  deadline_lang: z.string().optional(),
});

export type UpdateTaskParams = z.infer<typeof UpdateTaskParamsSchema>;

/**
 * Batch task update parameters
 */
export const BatchUpdateTaskParamsSchema = z.object({
  tasks: z.array(UpdateTaskParamsSchema),
});

export type BatchUpdateTaskParams = z.infer<typeof BatchUpdateTaskParamsSchema>;

/**
 * Task deletion parameters
 */
export const DeleteTaskParamsSchema = z.object({
  task_id: z.string().optional(),
  task_name: z.string().optional(),
});

export type DeleteTaskParams = z.infer<typeof DeleteTaskParamsSchema>;

/**
 * Batch task deletion parameters
 */
export const BatchDeleteTaskParamsSchema = z.object({
  tasks: z.array(DeleteTaskParamsSchema),
});

export type BatchDeleteTaskParams = z.infer<typeof BatchDeleteTaskParamsSchema>;

/**
 * Task completion parameters
 */
export const CompleteTaskParamsSchema = DeleteTaskParamsSchema;
export type CompleteTaskParams = DeleteTaskParams;

/**
 * Batch task completion parameters
 */
export const BatchCompleteTaskParamsSchema = BatchDeleteTaskParamsSchema;
export type BatchCompleteTaskParams = BatchDeleteTaskParams;

/**
 * Task move parameters (single task)
 */
export const MoveTaskParamsSchema = z
  .object({
    task_id: z.string().optional(),
    task_name: z.string().optional(),
    project_id: z.string().optional(),
    section_id: z.string().optional(),
    parent_id: z.string().optional(),
  })
  .refine(
    (data) => {
      const destinations = [
        data.project_id,
        data.section_id,
        data.parent_id,
      ].filter(Boolean);
      return destinations.length === 1;
    },
    {
      message:
        "Exactly one of project_id, section_id, or parent_id must be specified",
    }
  );

export type MoveTaskParams = z.infer<typeof MoveTaskParamsSchema>;

/**
 * Batch task move parameters
 */
export const BatchMoveTaskParamsSchema = z.object({
  tasks: z.array(MoveTaskParamsSchema),
});

export type BatchMoveTaskParams = z.infer<typeof BatchMoveTaskParamsSchema>;

/**
 * Project creation parameters (single project)
 */
export const CreateProjectParamsSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  parent_id: z.string().optional(),
  parent_name: z.string().optional(),
  color: TodoistColorSchema.optional(),
  favorite: z.boolean().optional(),
  view_style: ViewStyleSchema.optional(),
  sections: z.array(z.string()).optional(),
});

export type CreateProjectParams = z.infer<typeof CreateProjectParamsSchema>;

/**
 * Batch project creation parameters
 */
export const BatchCreateProjectParamsSchema = z.object({
  projects: z.array(CreateProjectParamsSchema),
});

export type BatchCreateProjectParams = z.infer<
  typeof BatchCreateProjectParamsSchema
>;

/**
 * Project query parameters
 */
export const GetProjectsParamsSchema = z.object({
  project_ids: z.array(z.string()).optional(),
  include_sections: z.boolean().default(false).optional(),
  include_hierarchy: z.boolean().default(false).optional(),
});

export type GetProjectsParams = z.infer<typeof GetProjectsParamsSchema>;

/**
 * Project update parameters (single project)
 */
export const UpdateProjectParamsSchema = z.object({
  project_id: z.string().optional(),
  project_name: z.string().optional(),
  name: z.string().optional(),
  color: TodoistColorSchema.optional(),
  favorite: z.boolean().optional(),
  view_style: ViewStyleSchema.optional(),
});

export type UpdateProjectParams = z.infer<typeof UpdateProjectParamsSchema>;

/**
 * Batch project update parameters
 */
export const BatchUpdateProjectParamsSchema = z.object({
  projects: z.array(UpdateProjectParamsSchema),
});

export type BatchUpdateProjectParams = z.infer<
  typeof BatchUpdateProjectParamsSchema
>;

/**
 * Section query parameters
 */
export const GetProjectSectionsParamsSchema = z.object({
  project_id: z.string().optional(),
  project_name: z.string().optional(),
  include_empty: z.boolean().default(true).optional(),
});

export type GetProjectSectionsParams = z.infer<
  typeof GetProjectSectionsParamsSchema
>;

/**
 * Batch section query parameters
 */
export const BatchGetProjectSectionsParamsSchema = z.object({
  projects: z.array(
    z.object({
      project_id: z.string().optional(),
      project_name: z.string().optional(),
    })
  ),
  include_empty: z.boolean().default(true).optional(),
});

export type BatchGetProjectSectionsParams = z.infer<
  typeof BatchGetProjectSectionsParamsSchema
>;

/**
 * Section creation parameters (single section)
 */
export const CreateProjectSectionParamsSchema = z.object({
  project_id: z.string().optional(),
  project_name: z.string().optional(),
  name: z.string().min(1, "Section name is required"),
  order: z.number().optional(),
});

export type CreateProjectSectionParams = z.infer<
  typeof CreateProjectSectionParamsSchema
>;

/**
 * Batch section creation parameters
 */
export const BatchCreateProjectSectionParamsSchema = z.object({
  sections: z.array(CreateProjectSectionParamsSchema),
});

export type BatchCreateProjectSectionParams = z.infer<
  typeof BatchCreateProjectSectionParamsSchema
>;

/**
 * Personal label creation parameters (single label)
 */
export const CreatePersonalLabelParamsSchema = z.object({
  name: z.string().min(1, "Label name is required"),
  color: TodoistColorSchema.optional(),
  order: z.number().optional(),
  is_favorite: z.boolean().optional(),
});

export type CreatePersonalLabelParams = z.infer<
  typeof CreatePersonalLabelParamsSchema
>;

/**
 * Batch personal label creation parameters
 */
export const BatchCreatePersonalLabelParamsSchema = z.object({
  labels: z.array(CreatePersonalLabelParamsSchema),
});

export type BatchCreatePersonalLabelParams = z.infer<
  typeof BatchCreatePersonalLabelParamsSchema
>;

/**
 * Personal label query parameters
 */
export const GetPersonalLabelParamsSchema = z.object({
  label_id: z.string().min(1, "Label ID is required"),
});

export type GetPersonalLabelParams = z.infer<
  typeof GetPersonalLabelParamsSchema
>;

/**
 * Personal label update parameters (single label)
 */
export const UpdatePersonalLabelParamsSchema = z.object({
  label_id: z.string().optional(),
  label_name: z.string().optional(),
  name: z.string().optional(),
  color: TodoistColorSchema.optional(),
  order: z.number().optional(),
  is_favorite: z.boolean().optional(),
});

export type UpdatePersonalLabelParams = z.infer<
  typeof UpdatePersonalLabelParamsSchema
>;

/**
 * Batch personal label update parameters
 */
export const BatchUpdatePersonalLabelParamsSchema = z.object({
  labels: z.array(UpdatePersonalLabelParamsSchema),
});

export type BatchUpdatePersonalLabelParams = z.infer<
  typeof BatchUpdatePersonalLabelParamsSchema
>;

/**
 * Personal label deletion parameters
 */
export const DeletePersonalLabelParamsSchema = z.object({
  label_id: z.string().min(1, "Label ID is required"),
});

export type DeletePersonalLabelParams = z.infer<
  typeof DeletePersonalLabelParamsSchema
>;

/**
 * Shared labels query parameters
 */
export const GetSharedLabelsParamsSchema = z.object({
  omit_personal: z.boolean().default(false).optional(),
});

export type GetSharedLabelsParams = z.infer<typeof GetSharedLabelsParamsSchema>;

/**
 * Shared label rename parameters (single label)
 */
export const RenameSharedLabelParamsSchema = z.object({
  name: z.string().min(1, "Current label name is required"),
  new_name: z.string().min(1, "New label name is required"),
});

export type RenameSharedLabelParams = z.infer<
  typeof RenameSharedLabelParamsSchema
>;

/**
 * Batch shared label rename parameters
 */
export const BatchRenameSharedLabelParamsSchema = z.object({
  labels: z.array(RenameSharedLabelParamsSchema),
});

export type BatchRenameSharedLabelParams = z.infer<
  typeof BatchRenameSharedLabelParamsSchema
>;

/**
 * Shared label removal parameters (single label)
 */
export const RemoveSharedLabelParamsSchema = z.object({
  name: z.string().min(1, "Label name is required"),
});

export type RemoveSharedLabelParams = z.infer<
  typeof RemoveSharedLabelParamsSchema
>;

/**
 * Batch shared label removal parameters
 */
export const BatchRemoveSharedLabelParamsSchema = z.object({
  labels: z.array(RemoveSharedLabelParamsSchema),
});

export type BatchRemoveSharedLabelParams = z.infer<
  typeof BatchRemoveSharedLabelParamsSchema
>;

/**
 * Task label update parameters (single task)
 */
export const UpdateTaskLabelsParamsSchema = z.object({
  task_id: z.string().optional(),
  task_name: z.string().optional(),
  labels: z.array(z.string()).min(0, "Labels array is required"),
});

export type UpdateTaskLabelsParams = z.infer<
  typeof UpdateTaskLabelsParamsSchema
>;

/**
 * Batch task label update parameters
 */
export const BatchUpdateTaskLabelsParamsSchema = z.object({
  tasks: z.array(UpdateTaskLabelsParamsSchema),
});

export type BatchUpdateTaskLabelsParams = z.infer<
  typeof BatchUpdateTaskLabelsParamsSchema
>;

/**
 * Todoist API error response
 */
export const TodoistErrorSchema = z.object({
  error: z.string(),
  message: z.string(),
  status_code: z.number(),
});

export type TodoistError = z.infer<typeof TodoistErrorSchema>;

/**
 * Generic batch operation result
 */
export const BatchOperationResultSchema = z.object({
  success: z.boolean(),
  summary: z.object({
    total: z.number(),
    succeeded: z.number(),
    failed: z.number(),
  }),
  results: z.array(
    z.object({
      success: z.boolean(),
      data: z.any().optional(),
      error: z.string().optional(),
    })
  ),
});

export type BatchOperationResult = z.infer<typeof BatchOperationResultSchema>;
