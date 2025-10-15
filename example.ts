#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { TodoistApi } from "@doist/todoist-api-typescript";

// Task tools

const CREATE_TASK_TOOL: Tool = {
  name: "todoist_create_task",
  description: "Create one or more tasks in Todoist with full parameter support",
  inputSchema: {
    type: "object",
    properties: {
      tasks: {
        type: "array",
        description: "Array of tasks to create (for batch operations)",
        items: {
          type: "object",
          properties: {
            content: {
              type: "string",
              description: "The content/title of the task (required)"
            },
            description: {
              type: "string",
              description: "Detailed description of the task (optional)"
            },
            project_id: {
              type: "string",
              description: "ID of the project to add the task to (optional)"
            },
            section_id: {
              type: "string",
              description: "ID of the section to add the task to (optional)"
            },
            parent_id: {
              type: "string",
              description: "ID of the parent task for subtasks (optional)"
            },
            order: {
              type: "number",
              description: "Position in the project or parent task (optional)"
            },
            labels: {
              type: "array",
              items: { type: "string" },
              description: "Array of label names to apply to the task (optional)"
            },
            priority: {
              type: "number",
              description: "Task priority from 1 (normal) to 4 (urgent) (optional)",
              enum: [1, 2, 3, 4]
            },
            due_string: {
              type: "string",
              description: "Natural language due date like 'tomorrow', 'next Monday' (optional)"
            },
            due_date: {
              type: "string",
              description: "Due date in YYYY-MM-DD format (optional)"
            },
            due_datetime: {
              type: "string",
              description: "Due date and time in RFC3339 format (optional)"
            },
            due_lang: {
              type: "string",
              description: "2-letter language code for due date parsing (optional)"
            },
            assignee_id: {
              type: "string",
              description: "User ID to assign the task to (optional)"
            },
            duration: {
              type: "number",
              description: "The duration amount of the task (optional)"
            },
            duration_unit: {
              type: "string",
              description: "The duration unit ('minute' or 'day') (optional)",
              enum: ["minute", "day"]
            },
            deadline_date: {
              type: "string", 
              description: "Deadline date in YYYY-MM-DD format (optional)"
            },
            deadline_lang: {
              type: "string",
              description: "2-letter language code for deadline parsing (optional)"
            }
          },
          required: ["content"]
        }
      },
      // For backward compatibility - single task parameters
      content: {
        type: "string",
        description: "The content/title of the task (for single task creation)"
      },
      description: {
        type: "string",
        description: "Detailed description of the task (optional)"
      },
      project_id: {
        type: "string",
        description: "ID of the project to add the task to (optional)"
      },
      section_id: {
        type: "string",
        description: "ID of the section to add the task to (optional)"
      },
      parent_id: {
        type: "string",
        description: "ID of the parent task for subtasks (optional)"
      },
      order: {
        type: "number",
        description: "Position in the project or parent task (optional)"
      },
      labels: {
        type: "array",
        items: { type: "string" },
        description: "Array of label names to apply to the task (optional)"
      },
      priority: {
        type: "number",
        description: "Task priority from 1 (normal) to 4 (urgent) (optional)",
        enum: [1, 2, 3, 4]
      },
      due_string: {
        type: "string",
        description: "Natural language due date like 'tomorrow', 'next Monday' (optional)"
      },
      due_date: {
        type: "string",
        description: "Due date in YYYY-MM-DD format (optional)"
      },
      due_datetime: {
        type: "string",
        description: "Due date and time in RFC3339 format (optional)"
      },
      due_lang: {
        type: "string",
        description: "2-letter language code for due date parsing (optional)"
      },
      assignee_id: {
        type: "string",
        description: "User ID to assign the task to (optional)"
      },
      duration: {
        type: "number",
        description: "The duration amount of the task (optional)"
      },
      duration_unit: {
        type: "string",
        description: "The duration unit ('minute' or 'day') (optional)",
        enum: ["minute", "day"]
      },
      deadline_date: {
        type: "string", 
        description: "Deadline date in YYYY-MM-DD format (optional)"
      },
      deadline_lang: {
        type: "string",
        description: "2-letter language code for deadline parsing (optional)"
      }
    }
  }
};

const GET_TASKS_TOOL: Tool = {
  name: "todoist_get_tasks",
  description: "Get a list of tasks from Todoist with various filters - handles both single and batch retrieval",
  inputSchema: {
    type: "object",
    properties: {
      project_id: {
        type: "string",
        description: "Filter tasks by project ID (optional)"
      },
      section_id: {
        type: "string",
        description: "Filter tasks by section ID (optional)"
      },
      label: {
        type: "string",
        description: "Filter tasks by label name (optional)"
      },
      filter: {
        type: "string",
        description: "Natural language filter like 'today', 'tomorrow', 'next week', 'priority 1', 'overdue' (optional)"
      },
      lang: {
        type: "string",
        description: "IETF language tag defining what language filter is written in (optional)"
      },
      ids: {
        type: "array",
        items: { type: "string" },
        description: "Array of specific task IDs to retrieve (optional)"
      },
      priority: {
        type: "number",
        description: "Filter by priority level (1-4) (optional)",
        enum: [1, 2, 3, 4]
      },
      limit: {
        type: "number",
        description: "Maximum number of tasks to return (optional, client-side filtering)",
        default: 10
      }
    }
  }
};

const UPDATE_TASK_TOOL: Tool = {
  name: "todoist_update_task",
  description: "Update one or more tasks in Todoist with full parameter support",
  inputSchema: {
    type: "object",
    properties: {
      tasks: {
        type: "array",
        description: "Array of tasks to update (for batch operations)",
        items: {
          type: "object",
          properties: {
            task_id: {
              type: "string",
              description: "ID of the task to update (preferred)"
            },
            task_name: {
              type: "string",
              description: "Name/content of the task to search for (if ID not provided)"
            },
            content: {
              type: "string",
              description: "New content/title for the task (optional)"
            },
            description: {
              type: "string",
              description: "New description for the task (optional)"
            },
            project_id: {
              type: "string",
              description: "Move task to this project ID (optional)"
            },
            section_id: {
              type: "string",
              description: "Move task to this section ID (optional)"
            },
            labels: {
              type: "array",
              items: { type: "string" },
              description: "New array of label names for the task (optional)"
            },
            priority: {
              type: "number",
              description: "New priority level from 1 (normal) to 4 (urgent) (optional)",
              enum: [1, 2, 3, 4]
            },
            due_string: {
              type: "string",
              description: "New due date in natural language (optional)"
            },
            due_date: {
              type: "string",
              description: "New due date in YYYY-MM-DD format (optional)"
            },
            due_datetime: {
              type: "string",
              description: "New due date and time in RFC3339 format (optional)"
            },
            due_lang: {
              type: "string",
              description: "2-letter language code for due date parsing (optional)"
            },
            assignee_id: {
              type: "string",
              description: "New user ID to assign the task to (optional)"
            },
            duration: {
              type: "number",
              description: "New duration amount of the task (optional)"
            },
            duration_unit: {
              type: "string",
              description: "New duration unit ('minute' or 'day') (optional)",
              enum: ["minute", "day"]
            },
            deadline_date: {
              type: "string", 
              description: "New deadline date in YYYY-MM-DD format (optional)"
            },
            deadline_lang: {
              type: "string",
              description: "2-letter language code for deadline parsing (optional)"
            }
          },
          anyOf: [
            { required: ["task_id"] },
            { required: ["task_name"] }
          ]
        }
      },
      // For backward compatibility - single task parameters
      task_id: {
        type: "string",
        description: "ID of the task to update (preferred)"
      },
      task_name: {
        type: "string",
        description: "Name/content of the task to search for (if ID not provided)"
      },
      content: {
        type: "string",
        description: "New content/title for the task (optional)"
      },
      description: {
        type: "string",
        description: "New description for the task (optional)"
      },
      project_id: {
        type: "string",
        description: "Move task to this project ID (optional)"
      },
      section_id: {
        type: "string",
        description: "Move task to this section ID (optional)"
      },
      labels: {
        type: "array",
        items: { type: "string" },
        description: "New array of label names for the task (optional)"
      },
      priority: {
        type: "number",
        description: "New priority level from 1 (normal) to 4 (urgent) (optional)",
        enum: [1, 2, 3, 4]
      },
      due_string: {
        type: "string",
        description: "New due date in natural language (optional)"
      },
      due_date: {
        type: "string",
        description: "New due date in YYYY-MM-DD format (optional)"
      },
      due_datetime: {
        type: "string",
        description: "New due date and time in RFC3339 format (optional)"
      },
      due_lang: {
        type: "string",
        description: "2-letter language code for due date parsing (optional)"
      },
      assignee_id: {
        type: "string",
        description: "New user ID to assign the task to (optional)"
      },
      duration: {
        type: "number",
        description: "New duration amount of the task (optional)"
      },
      duration_unit: {
        type: "string",
        description: "New duration unit ('minute' or 'day') (optional)",
        enum: ["minute", "day"]
      },
      deadline_date: {
        type: "string", 
        description: "New deadline date in YYYY-MM-DD format (optional)"
      },
      deadline_lang: {
        type: "string",
        description: "2-letter language code for deadline parsing (optional)"
      }
    },
    anyOf: [
      { required: ["tasks"] },
      { required: ["task_id"] },
      { required: ["task_name"] }
    ]
  }
};

const DELETE_TASK_TOOL: Tool = {
  name: "todoist_delete_task",
  description: "Delete one or more tasks from Todoist",
  inputSchema: {
    type: "object",
    properties: {
      tasks: {
        type: "array",
        description: "Array of tasks to delete (for batch operations)",
        items: {
          type: "object",
          properties: {
            task_id: {
              type: "string",
              description: "ID of the task to delete (preferred)"
            },
            task_name: {
              type: "string",
              description: "Name/content of the task to search for and delete (if ID not provided)"
            }
          },
          anyOf: [
            { required: ["task_id"] },
            { required: ["task_name"] }
          ]
        }
      },
      // For backward compatibility - single task parameters
      task_id: {
        type: "string",
        description: "ID of the task to delete (preferred)"
      },
      task_name: {
        type: "string",
        description: "Name/content of the task to search for and delete (if ID not provided)"
      }
    },
    anyOf: [
      { required: ["tasks"] },
      { required: ["task_id"] },
      { required: ["task_name"] }
    ]
  }
};

const COMPLETE_TASK_TOOL: Tool = {
  name: "todoist_complete_task",
  description: "Mark one or more tasks as complete in Todoist",
  inputSchema: {
    type: "object",
    properties: {
      tasks: {
        type: "array",
        description: "Array of tasks to mark as complete (for batch operations)",
        items: {
          type: "object",
          properties: {
            task_id: {
              type: "string",
              description: "ID of the task to complete (preferred)"
            },
            task_name: {
              type: "string",
              description: "Name/content of the task to search for and complete (if ID not provided)"
            }
          },
          anyOf: [
            { required: ["task_id"] },
            { required: ["task_name"] }
          ]
        }
      },
      // For backward compatibility - single task parameters
      task_id: {
        type: "string",
        description: "ID of the task to complete (preferred)"
      },
      task_name: {
        type: "string",
        description: "Name/content of the task to search for and complete (if ID not provided)"
      }
    },
    anyOf: [
      { required: ["tasks"] },
      { required: ["task_id"] },
      { required: ["task_name"] }
    ]
  }
};

// Project Tools

const GET_PROJECTS_TOOL: Tool = {
  name: "todoist_get_projects",
  description: "Get projects with optional filtering and hierarchy information",
  inputSchema: {
    type: "object",
    properties: {
      project_ids: {
        type: "array",
        items: { type: "string" },
        description: "Optional: Specific project IDs to retrieve"
      },
      include_sections: {
        type: "boolean",
        description: "Optional: Include sections within each project",
        default: false
      },
      include_hierarchy: {
        type: "boolean", 
        description: "Optional: Include full parent-child relationships",
        default: false
      }
    }
  }
};

const CREATE_PROJECT_TOOL: Tool = {
  name: "todoist_create_project",
  description: "Create one or more projects with support for nested hierarchies",
  inputSchema: {
    type: "object",
    properties: {
      projects: {
        type: "array",
        description: "Array of projects to create (for batch operations)",
        items: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "Name of the project"
            },
            parent_id: {
              type: "string",
              description: "Parent project ID (optional)"
            },
            parent_name: {
              type: "string",
              description: "Name of the parent project (will be created or found automatically)"
            },
            color: {
              type: "string",
              description: "Color of the project (optional)",
              enum: ["berry_red", "red", "orange", "yellow", "olive_green", "lime_green", "green", 
                     "mint_green", "teal", "sky_blue", "light_blue", "blue", "grape", "violet", 
                     "lavender", "magenta", "salmon", "charcoal", "grey", "taupe"]
            },
            favorite: {
              type: "boolean",
              description: "Whether the project is a favorite (optional)"
            },
            view_style: {
              type: "string",
              description: "View style of the project (optional)",
              enum: ["list", "board"]
            },
            sections: {
              type: "array",
              items: { type: "string" },
              description: "Sections to create within this project (optional)"
            }
          },
          required: ["name"]
        }
      },
      // For backward compatibility - single project parameters
      name: {
        type: "string",
        description: "Name of the project (for single project creation)"
      },
      parent_id: {
        type: "string",
        description: "Parent project ID (optional)"
      },
      color: {
        type: "string",
        description: "Color of the project (optional)",
        enum: ["berry_red", "red", "orange", "yellow", "olive_green", "lime_green", "green", 
               "mint_green", "teal", "sky_blue", "light_blue", "blue", "grape", "violet", 
               "lavender", "magenta", "salmon", "charcoal", "grey", "taupe"]
      },
      favorite: {
        type: "boolean",
        description: "Whether the project is a favorite (optional)"
      },
      view_style: {
        type: "string",
        description: "View style of the project (optional)",
        enum: ["list", "board"]
      }
    },
    anyOf: [
      { required: ["projects"] },
      { required: ["name"] }
    ]
  }
};

const UPDATE_PROJECT_TOOL: Tool = {
  name: "todoist_update_project",
  description: "Update one or more projects in Todoist",
  inputSchema: {
    type: "object",
    properties: {
      projects: {
        type: "array",
        description: "Array of projects to update (for batch operations)",
        items: {
          type: "object",
          properties: {
            project_id: {
              type: "string",
              description: "ID of the project to update (preferred)"
            },
            project_name: {
              type: "string",
              description: "Name of the project to update (if ID not provided)"
            },
            name: {
              type: "string",
              description: "New name for the project (optional)"
            },
            color: {
              type: "string",
              description: "New color for the project (optional)",
              enum: ["berry_red", "red", "orange", "yellow", "olive_green", "lime_green", "green", 
                     "mint_green", "teal", "sky_blue", "light_blue", "blue", "grape", "violet", 
                     "lavender", "magenta", "salmon", "charcoal", "grey", "taupe"]
            },
            favorite: {
              type: "boolean",
              description: "Whether the project should be a favorite (optional)"
            },
            view_style: {
              type: "string",
              description: "View style of the project (optional)",
              enum: ["list", "board"]
            }
          },
          anyOf: [
            { required: ["project_id"] },
            { required: ["project_name"] }
          ]
        }
      },
      // For backward compatibility - single project parameters
      project_id: {
        type: "string",
        description: "ID of the project to update"
      },
      name: {
        type: "string",
        description: "New name for the project (optional)"
      },
      color: {
        type: "string",
        description: "New color for the project (optional)",
        enum: ["berry_red", "red", "orange", "yellow", "olive_green", "lime_green", "green", 
               "mint_green", "teal", "sky_blue", "light_blue", "blue", "grape", "violet", 
               "lavender", "magenta", "salmon", "charcoal", "grey", "taupe"]
      },
      favorite: {
        type: "boolean",
        description: "Whether the project should be a favorite (optional)"
      },
      view_style: {
        type: "string",
        description: "View style of the project (optional)",
        enum: ["list", "board"]
      }
    },
    anyOf: [
      { required: ["projects"] },
      { required: ["project_id"] }
    ]
  }
};

const GET_PROJECT_SECTIONS_TOOL: Tool = {
  name: "todoist_get_project_sections",
  description: "Get sections from one or more projects in Todoist",
  inputSchema: {
    type: "object",
    properties: {
      projects: {
        type: "array",
        description: "Array of projects to get sections from (for batch operations)",
        items: {
          type: "object",
          properties: {
            project_id: {
              type: "string",
              description: "ID of the project to get sections from (preferred)"
            },
            project_name: {
              type: "string",
              description: "Name of the project to get sections from (if ID not provided)"
            }
          },
          anyOf: [
            { required: ["project_id"] },
            { required: ["project_name"] }
          ]
        }
      },
      // For backward compatibility - single project parameter
      project_id: {
        type: "string",
        description: "ID of the project to get sections from"
      },
      project_name: {
        type: "string",
        description: "Name of the project to get sections from (if ID not provided)"
      },
      include_empty: {
        type: "boolean",
        description: "Whether to include sections with no tasks",
        default: true
      }
    },
    anyOf: [
      { required: ["projects"] },
      { required: ["project_id"] },
      { required: ["project_name"] }
    ]
  }
};

const CREATE_PROJECT_SECTION_TOOL: Tool = {
  name: "todoist_create_project_section",
  description: "Create one or more sections in Todoist projects",
  inputSchema: {
    type: "object",
    properties: {
      sections: {
        type: "array",
        description: "Array of sections to create (for batch operations)",
        items: {
          type: "object",
          properties: {
            project_id: {
              type: "string",
              description: "ID of the project to create the section in"
            },
            project_name: {
              type: "string",
              description: "Name of the project to create the section in (if ID not provided)"
            },
            name: {
              type: "string",
              description: "Name of the section"
            },
            order: {
              type: "number",
              description: "Order of the section (optional)"
            }
          },
          required: ["name"],
          anyOf: [
            { required: ["project_id"] },
            { required: ["project_name"] }
          ]
        }
      },
      // For backward compatibility - single section parameters
      project_id: {
        type: "string",
        description: "ID of the project"
      },
      name: {
        type: "string",
        description: "Name of the section"
      },
      order: {
        type: "number",
        description: "Order of the section (optional)"
      }
    },
    anyOf: [
      { required: ["sections"] },
      { required: ["project_id", "name"] }
    ]
  }
};

// Personal Label Tools

const GET_PERSONAL_LABELS_TOOL: Tool = {
  name: "todoist_get_personal_labels",
  description: "Get all personal labels from Todoist",
  inputSchema: {
    type: "object",
    properties: {}
  }
};

const CREATE_PERSONAL_LABEL_TOOL: Tool = {
  name: "todoist_create_personal_label",
  description: "Create one or more personal labels in Todoist",
  inputSchema: {
    type: "object",
    properties: {
      labels: {
        type: "array",
        description: "Array of labels to create (for batch operations)",
        items: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "Name of the label"
            },
            color: {
              type: "string",
              description: "Color of the label (optional)",
              enum: ["berry_red", "red", "orange", "yellow", "olive_green", "lime_green", "green", 
                     "mint_green", "teal", "sky_blue", "light_blue", "blue", "grape", "violet", 
                     "lavender", "magenta", "salmon", "charcoal", "grey", "taupe"]
            },
            order: {
              type: "number",
              description: "Order of the label (optional)"
            },
            is_favorite: {
              type: "boolean",
              description: "Whether the label is a favorite (optional)"
            }
          },
          required: ["name"]
        }
      },
      // For backward compatibility - single label parameters
      name: {
        type: "string",
        description: "Name of the label"
      },
      color: {
        type: "string",
        description: "Color of the label (optional)",
        enum: ["berry_red", "red", "orange", "yellow", "olive_green", "lime_green", "green", 
               "mint_green", "teal", "sky_blue", "light_blue", "blue", "grape", "violet", 
               "lavender", "magenta", "salmon", "charcoal", "grey", "taupe"]
      },
      order: {
        type: "number",
        description: "Order of the label (optional)"
      },
      is_favorite: {
        type: "boolean",
        description: "Whether the label is a favorite (optional)"
      }
    },
    anyOf: [
      { required: ["labels"] },
      { required: ["name"] }
    ]
  }
};

const GET_PERSONAL_LABEL_TOOL: Tool = {
  name: "todoist_get_personal_label",
  description: "Get a personal label by ID",
  inputSchema: {
    type: "object",
    properties: {
      label_id: {
        type: "string",
        description: "ID of the label to retrieve"
      }
    },
    required: ["label_id"]
  }
};

const UPDATE_PERSONAL_LABEL_TOOL: Tool = {
  name: "todoist_update_personal_label",
  description: "Update one or more existing personal labels in Todoist",
  inputSchema: {
    type: "object",
    properties: {
      labels: {
        type: "array",
        description: "Array of labels to update (for batch operations)",
        items: {
          type: "object",
          properties: {
            label_id: {
              type: "string",
              description: "ID of the label to update (preferred)"
            },
            label_name: {
              type: "string",
              description: "Name of the label to search for and update (if ID not provided)"
            },
            name: {
              type: "string",
              description: "New name for the label (optional)"
            },
            color: {
              type: "string",
              description: "New color for the label (optional)",
              enum: ["berry_red", "red", "orange", "yellow", "olive_green", "lime_green", "green", 
                     "mint_green", "teal", "sky_blue", "light_blue", "blue", "grape", "violet", 
                     "lavender", "magenta", "salmon", "charcoal", "grey", "taupe"]
            },
            order: {
              type: "number",
              description: "New order for the label (optional)"
            },
            is_favorite: {
              type: "boolean",
              description: "Whether the label is a favorite (optional)"
            }
          },
          anyOf: [
            { required: ["label_id"] },
            { required: ["label_name"] }
          ]
        }
      },
      // For backward compatibility - single label parameters
      label_id: {
        type: "string",
        description: "ID of the label to update"
      },
      label_name: {
        type: "string",
        description: "Name of the label to search for and update (if ID not provided)"
      },
      name: {
        type: "string",
        description: "New name for the label (optional)"
      },
      color: {
        type: "string",
        description: "New color for the label (optional)",
        enum: ["berry_red", "red", "orange", "yellow", "olive_green", "lime_green", "green", 
               "mint_green", "teal", "sky_blue", "light_blue", "blue", "grape", "violet", 
               "lavender", "magenta", "salmon", "charcoal", "grey", "taupe"]
      },
      order: {
        type: "number",
        description: "New order for the label (optional)"
      },
      is_favorite: {
        type: "boolean",
        description: "Whether the label is a favorite (optional)"
      }
    },
    anyOf: [
      { required: ["labels"] },
      { anyOf: [{ required: ["label_id"] }, { required: ["label_name"] }] }
    ]
  }
};

const DELETE_PERSONAL_LABEL_TOOL: Tool = {
  name: "todoist_delete_personal_label",
  description: "Delete a personal label from Todoist",
  inputSchema: {
    type: "object",
    properties: {
      label_id: {
        type: "string",
        description: "ID of the label to delete"
      }
    },
    required: ["label_id"]
  }
};

// Shared Label Tools

const GET_SHARED_LABELS_TOOL: Tool = {
  name: "todoist_get_shared_labels",
  description: "Get all shared labels from Todoist",
  inputSchema: {
    type: "object",
    properties: {
      omit_personal: {
        type: "boolean",
        description: "Whether to exclude the names of the user's personal labels from the results (default: false)"
      }
    }
  }
};

const RENAME_SHARED_LABELS_TOOL: Tool = {
  name: "todoist_rename_shared_labels",
  description: "Rename one or more shared labels in Todoist",
  inputSchema: {
    type: "object",
    properties: {
      labels: {
        type: "array",
        description: "Array of label rename operations (for batch operations)",
        items: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "The name of the existing label to rename"
            },
            new_name: {
              type: "string",
              description: "The new name for the label"
            }
          },
          required: ["name", "new_name"]
        }
      },
      // For backward compatibility - single label parameters
      name: {
        type: "string",
        description: "The name of the existing label to rename"
      },
      new_name: {
        type: "string",
        description: "The new name for the label"
      }
    },
    anyOf: [
      { required: ["labels"] },
      { required: ["name", "new_name"] }
    ]
  }
};

const REMOVE_SHARED_LABELS_TOOL: Tool = {
  name: "todoist_remove_shared_labels",
  description: "Remove one or more shared labels from Todoist tasks",
  inputSchema: {
    type: "object",
    properties: {
      labels: {
        type: "array",
        description: "Array of shared label names to remove (for batch operations)",
        items: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "The name of the label to remove"
            }
          },
          required: ["name"]
        }
      },
      // For backward compatibility - single label parameter
      name: {
        type: "string",
        description: "The name of the label to remove"
      }
    },
    anyOf: [
      { required: ["labels"] },
      { required: ["name"] }
    ]
  }
};

// Task Label Tool

const UPDATE_TASK_LABELS_TOOL: Tool = {
  name: "todoist_update_task_labels",
  description: "Update the labels of one or more tasks in Todoist",
  inputSchema: {
    type: "object",
    properties: {
      tasks: {
        type: "array",
        description: "Array of tasks to update labels for (for batch operations)",
        items: {
          type: "object",
          properties: {
            task_id: {
              type: "string",
              description: "ID of the task to update labels for (preferred)"
            },
            task_name: {
              type: "string",
              description: "Name/content of the task to search for and update labels (if ID not provided)"
            },
            labels: {
              type: "array",
              items: { type: "string" },
              description: "Array of label names to set for the task"
            }
          },
          required: ["labels"],
          anyOf: [
            { required: ["task_id"] },
            { required: ["task_name"] }
          ]
        }
      },
      // For backward compatibility - single task parameters
      task_id: {
        type: "string",
        description: "ID of the task to update labels for (preferred)"
      },
      task_name: {
        type: "string",
        description: "Name/content of the task to search for and update labels (if ID not provided)"
      },
      labels: {
        type: "array",
        items: { type: "string" },
        description: "Array of label names to set for the task"
      }
    },
    anyOf: [
      { required: ["tasks"] },
      { required: ["labels"], anyOf: [{ required: ["task_id"] }, { required: ["task_name"] }] }
    ]
  }
};

// Server implementation

const server = new Server(
  {
    name: "todoist-mcp-server",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

// Check for API token

const TODOIST_API_TOKEN = process.env.TODOIST_API_TOKEN!;
if (!TODOIST_API_TOKEN) {
  console.error("Error: TODOIST_API_TOKEN environment variable is required");
  process.exit(1);
}

// Initialize Todoist client

const todoistClient = new TodoistApi(TODOIST_API_TOKEN);

// Task Tools TypeGuards

function isCreateTaskArgs(args: unknown): args is {
  content?: string;
  description?: string;
  project_id?: string;
  section_id?: string;
  parent_id?: string;
  order?: number;
  labels?: string[];
  priority?: number;
  due_string?: string;
  due_date?: string;
  due_datetime?: string;
  due_lang?: string;
  assignee_id?: string;
  duration?: number;
  duration_unit?: string;
  deadline_date?: string;
  deadline_lang?: string;
  tasks?: Array<{
    content: string;
    description?: string;
    project_id?: string;
    section_id?: string;
    parent_id?: string;
    order?: number;
    labels?: string[];
    priority?: number;
    due_string?: string;
    due_date?: string;
    due_datetime?: string;
    due_lang?: string;
    assignee_id?: string;
    duration?: number;
    duration_unit?: string;
    deadline_date?: string;
    deadline_lang?: string;
  }>;
} {
  if (typeof args !== "object" || args === null) {
    return false;
  }
  
  // Check if it's a batch operation
  if ("tasks" in args && Array.isArray((args as any).tasks)) {
    return (args as any).tasks.every((task: any) => 
      typeof task === "object" && 
      task !== null && 
      "content" in task && 
      typeof task.content === "string"
    );
  }
  
  // Check if it's a single task operation
  return "content" in args && typeof (args as any).content === "string";
}

function isGetTasksArgs(args: unknown): args is {
  project_id?: string;
  section_id?: string;
  label?: string;
  filter?: string;
  lang?: string;
  ids?: string[];
  priority?: number;
  limit?: number;
} {
  return (
    typeof args === "object" &&
    args !== null
  );
}

function isUpdateTaskArgs(args: unknown): args is {
  task_id?: string;
  task_name?: string;
  content?: string;
  description?: string;
  project_id?: string;
  section_id?: string;
  labels?: string[];
  priority?: number;
  due_string?: string;
  due_date?: string;
  due_datetime?: string;
  due_lang?: string;
  assignee_id?: string;
  duration?: number;
  duration_unit?: string;
  deadline_date?: string;
  deadline_lang?: string;
  tasks?: Array<{
    task_id?: string;
    task_name?: string;
    content?: string;
    description?: string;
    project_id?: string;
    section_id?: string;
    labels?: string[];
    priority?: number;
    due_string?: string;
    due_date?: string;
    due_datetime?: string;
    due_lang?: string;
    assignee_id?: string;
    duration?: number;
    duration_unit?: string;
    deadline_date?: string;
    deadline_lang?: string;
  }>;
} {
  if (typeof args !== "object" || args === null) {
    return false;
  }
  
  // Check if it's a batch operation
  if ("tasks" in args && Array.isArray((args as any).tasks)) {
    return (args as any).tasks.every((task: any) => 
      typeof task === "object" && 
      task !== null && 
      (("task_id" in task && typeof task.task_id === "string") || 
       ("task_name" in task && typeof task.task_name === "string"))
    );
  }
  
  // Check if it's a single task operation
  return (
    ("task_id" in args && typeof (args as any).task_id === "string") ||
    ("task_name" in args && typeof (args as any).task_name === "string")
  );
}

function isDeleteTaskArgs(args: unknown): args is {
  task_id?: string;
  task_name?: string;
  tasks?: Array<{
    task_id?: string;
    task_name?: string;
  }>;
} {
  if (typeof args !== "object" || args === null) {
    return false;
  }
  
  // Check if it's a batch operation
  if ("tasks" in args && Array.isArray((args as any).tasks)) {
    return (args as any).tasks.every((task: any) => 
      typeof task === "object" && 
      task !== null && 
      (("task_id" in task && typeof task.task_id === "string") || 
       ("task_name" in task && typeof task.task_name === "string"))
    );
  }
  
  // Check if it's a single task operation
  return (
    ("task_id" in args && typeof (args as any).task_id === "string") ||
    ("task_name" in args && typeof (args as any).task_name === "string")
  );
}

function isCompleteTaskArgs(args: unknown): args is {
  task_id?: string;
  task_name?: string;
  tasks?: Array<{
    task_id?: string;
    task_name?: string;
  }>;
} {
  if (typeof args !== "object" || args === null) {
    return false;
  }
  
  // Check if it's a batch operation
  if ("tasks" in args && Array.isArray((args as any).tasks)) {
    return (args as any).tasks.every((task: any) => 
      typeof task === "object" && 
      task !== null && 
      (("task_id" in task && typeof task.task_id === "string") || 
       ("task_name" in task && typeof task.task_name === "string"))
    );
  }
  
  // Check if it's a single task operation
  return (
    ("task_id" in args && typeof (args as any).task_id === "string") ||
    ("task_name" in args && typeof (args as any).task_name === "string")
  );
}

// Project Tools TypeGuards

function isGetProjectsArgs(args: unknown): args is {
  project_ids?: string[];
  include_sections?: boolean;
  include_hierarchy?: boolean;
} {
  return (
    typeof args === "object" && 
    args !== null
  );
}

function isCreateProjectArgs(args: unknown): args is {
  name?: string;
  parent_id?: string;
  color?: string;
  favorite?: boolean;
  view_style?: string;
  projects?: Array<{
    name: string;
    parent_id?: string;
    parent_name?: string;
    color?: string;
    favorite?: boolean;
    view_style?: string;
    sections?: string[];
  }>;
} {
  if (typeof args !== "object" || args === null) {
    return false;
  }
  
  // Check if it's a batch operation
  if ("projects" in args && Array.isArray((args as any).projects)) {
    return (args as any).projects.every((project: any) => 
      typeof project === "object" && 
      project !== null && 
      "name" in project && 
      typeof project.name === "string"
    );
  }
  
  // Check if it's a single project operation
  return "name" in args && typeof (args as any).name === "string";
}

function isUpdateProjectArgs(args: unknown): args is {
  project_id?: string;
  name?: string;
  color?: string;
  favorite?: boolean;
  view_style?: string;
  projects?: Array<{
    project_id?: string;
    project_name?: string;
    name?: string;
    color?: string;
    favorite?: boolean;
    view_style?: string;
  }>;
} {
  if (typeof args !== "object" || args === null) {
    return false;
  }
  
  // Check if it's a batch operation
  if ("projects" in args && Array.isArray((args as any).projects)) {
    return (args as any).projects.every((project: any) => 
      typeof project === "object" && 
      project !== null && 
      (("project_id" in project && typeof project.project_id === "string") || 
       ("project_name" in project && typeof project.project_name === "string"))
    );
  }
  
  // Check if it's a single project operation
  return "project_id" in args && typeof (args as any).project_id === "string";
}

function isGetProjectSectionsArgs(args: unknown): args is {
  project_id?: string;
  project_name?: string;
  include_empty?: boolean;
  projects?: Array<{
    project_id?: string;
    project_name?: string;
  }>;
} {
  if (typeof args !== "object" || args === null) {
    return false;
  }
  
  // Check if it's a batch operation
  if ("projects" in args && Array.isArray((args as any).projects)) {
    return (args as any).projects.every((project: any) => 
      typeof project === "object" && 
      project !== null && 
      (("project_id" in project && typeof project.project_id === "string") || 
       ("project_name" in project && typeof project.project_name === "string"))
    );
  }
  
  // Check if it's a single project operation
  return (
    ("project_id" in args && typeof (args as any).project_id === "string") ||
    ("project_name" in args && typeof (args as any).project_name === "string")
  );
}

function isCreateProjectSectionArgs(args: unknown): args is {
  project_id?: string;
  project_name?: string;
  name?: string;
  order?: number;
  sections?: Array<{
    project_id?: string;
    project_name?: string;
    name: string;
    order?: number;
  }>;
} {
  if (typeof args !== "object" || args === null) {
    return false;
  }
  
  // Check if it's a batch operation
  if ("sections" in args && Array.isArray((args as any).sections)) {
    return (args as any).sections.every((section: any) => 
      typeof section === "object" && 
      section !== null && 
      "name" in section && 
      typeof section.name === "string" &&
      (
        (section.project_id === undefined || typeof section.project_id === "string") &&
        (section.project_name === undefined || typeof section.project_name === "string") &&
        (section.order === undefined || typeof section.order === "number") &&
        (section.project_id !== undefined || section.project_name !== undefined)
      )
    );
  }
  
  // Check if it's a single section operation
  return (
    "project_id" in args && 
    typeof (args as any).project_id === "string" &&
    "name" in args && 
    typeof (args as any).name === "string" &&
    ((args as any).order === undefined || typeof (args as any).order === "number")
  );
}

// Label Tools TypeGuards

function isGetPersonalLabelsArgs(args: unknown): args is {} {
  return typeof args === "object" && args !== null;
}

function isCreatePersonalLabelArgs(args: unknown): args is {
  name?: string;
  color?: string;
  order?: number;
  is_favorite?: boolean;
  labels?: Array<{
    name: string;
    color?: string;
    order?: number;
    is_favorite?: boolean;
  }>;
} {
  if (typeof args !== "object" || args === null) {
    return false;
  }
  
  // Check if it's a batch operation
  if ("labels" in args && Array.isArray((args as any).labels)) {
    return (args as any).labels.every((label: any) => 
      typeof label === "object" && 
      label !== null && 
      "name" in label && 
      typeof label.name === "string" &&
      (label.color === undefined || typeof label.color === "string") &&
      (label.order === undefined || typeof label.order === "number") &&
      (label.is_favorite === undefined || typeof label.is_favorite === "boolean")
    );
  }
  
  // Check if it's a single label operation
  return (
    "name" in args && 
    typeof (args as any).name === "string" &&
    ((args as any).color === undefined || typeof (args as any).color === "string") &&
    ((args as any).order === undefined || typeof (args as any).order === "number") &&
    ((args as any).is_favorite === undefined || typeof (args as any).is_favorite === "boolean")
  );
}

function isGetPersonalLabelArgs(args: unknown): args is {
  label_id: string;
} {
  return (
    typeof args === "object" &&
    args !== null &&
    "label_id" in args &&
    typeof (args as { label_id: string }).label_id === "string"
  );
}

function isUpdatePersonalLabelArgs(args: unknown): args is {
  label_id?: string;
  label_name?: string;
  name?: string;
  color?: string;
  order?: number;
  is_favorite?: boolean;
  labels?: Array<{
    label_id?: string;
    label_name?: string;
    name?: string;
    color?: string;
    order?: number;
    is_favorite?: boolean;
  }>;
} {
  if (typeof args !== "object" || args === null) {
    return false;
  }
  
  // Check if it's a batch operation
  if ("labels" in args && Array.isArray((args as any).labels)) {
    return (args as any).labels.every((label: any) => 
      typeof label === "object" && 
      label !== null && 
      (
        (label.label_id !== undefined && typeof label.label_id === "string") ||
        (label.label_name !== undefined && typeof label.label_name === "string")
      ) &&
      (label.name === undefined || typeof label.name === "string") &&
      (label.color === undefined || typeof label.color === "string") &&
      (label.order === undefined || typeof label.order === "number") &&
      (label.is_favorite === undefined || typeof label.is_favorite === "boolean")
    );
  }
  
  // Check if it's a single label operation
  return (
    (
      ("label_id" in args && typeof (args as any).label_id === "string") ||
      ("label_name" in args && typeof (args as any).label_name === "string")
    ) &&
    ((args as any).name === undefined || typeof (args as any).name === "string") &&
    ((args as any).color === undefined || typeof (args as any).color === "string") &&
    ((args as any).order === undefined || typeof (args as any).order === "number") &&
    ((args as any).is_favorite === undefined || typeof (args as any).is_favorite === "boolean")
  );
}

function isDeletePersonalLabelArgs(args: unknown): args is {
  label_id: string;
} {
  return (
    typeof args === "object" &&
    args !== null &&
    "label_id" in args &&
    typeof (args as { label_id: string }).label_id === "string"
  );
}

// Shared Label Tools Typeguards

function isGetSharedLabelsArgs(args: unknown): args is {
  omit_personal?: boolean;
} {
  if (typeof args !== "object" || args === null) {
    return false;
  }
  
  return (
    !("omit_personal" in args) || 
    typeof (args as any).omit_personal === "boolean"
  );
}

function isRenameSharedLabelsArgs(args: unknown): args is {
  name?: string;
  new_name?: string;
  labels?: Array<{
    name: string;
    new_name: string;
  }>;
} {
  if (typeof args !== "object" || args === null) {
    return false;
  }
  
  // Check if it's a batch operation
  if ("labels" in args && Array.isArray((args as any).labels)) {
    return (args as any).labels.every((label: any) => 
      typeof label === "object" && 
      label !== null && 
      "name" in label && 
      typeof label.name === "string" &&
      "new_name" in label && 
      typeof label.new_name === "string"
    );
  }
  
  // Check if it's a single label operation
  return (
    "name" in args && 
    typeof (args as any).name === "string" &&
    "new_name" in args && 
    typeof (args as any).new_name === "string"
  );
}

function isRemoveSharedLabelsArgs(args: unknown): args is {
  name?: string;
  labels?: Array<{
    name: string;
  }>;
} {
  if (typeof args !== "object" || args === null) {
    return false;
  }
  
  // Check if it's a batch operation
  if ("labels" in args && Array.isArray((args as any).labels)) {
    return (args as any).labels.every((label: any) => 
      typeof label === "object" && 
      label !== null && 
      "name" in label && 
      typeof label.name === "string"
    );
  }
  
  // Check if it's a single label operation
  return (
    "name" in args && 
    typeof (args as any).name === "string"
  );
}

// Task Label Typeguard

function isUpdateTaskLabelsArgs(args: unknown): args is {
  task_id?: string;
  task_name?: string;
  labels?: string[];
  tasks?: Array<{
    task_id?: string;
    task_name?: string;
    labels: string[];
  }>;
} {
  if (typeof args !== "object" || args === null) {
    return false;
  }
  
  // Check if it's a batch operation
  if ("tasks" in args && Array.isArray((args as any).tasks)) {
    return (args as any).tasks.every((task: any) => 
      typeof task === "object" && 
      task !== null && 
      "labels" in task && 
      Array.isArray(task.labels) &&
      (
        (task.task_id === undefined || typeof task.task_id === "string") &&
        (task.task_name === undefined || typeof task.task_name === "string") &&
        (task.task_id !== undefined || task.task_name !== undefined)
      )
    );
  }
  
  // Check if it's a single task operation
  return (
    "labels" in args && 
    Array.isArray((args as any).labels) &&
    (
      (("task_id" in args) && typeof (args as any).task_id === "string") ||
      (("task_name" in args) && typeof (args as any).task_name === "string")
    )
  );
}

// List tools Schema

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    CREATE_TASK_TOOL,
    GET_TASKS_TOOL,
    UPDATE_TASK_TOOL,
    DELETE_TASK_TOOL,
    COMPLETE_TASK_TOOL,

    GET_PROJECTS_TOOL,
    CREATE_PROJECT_TOOL,
    UPDATE_PROJECT_TOOL,
    GET_PROJECT_SECTIONS_TOOL,
    CREATE_PROJECT_SECTION_TOOL,

    GET_PERSONAL_LABELS_TOOL,
    CREATE_PERSONAL_LABEL_TOOL,
    GET_PERSONAL_LABEL_TOOL,
    UPDATE_PERSONAL_LABEL_TOOL,
    DELETE_PERSONAL_LABEL_TOOL,

    GET_SHARED_LABELS_TOOL,
    RENAME_SHARED_LABELS_TOOL,
    REMOVE_SHARED_LABELS_TOOL,
    
    UPDATE_TASK_LABELS_TOOL
  ],
}));

// All Tool handlers

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;

    if (!args) {
      throw new Error("No arguments provided");
    }

    // Task Handlers    

    if (name === "todoist_create_task") {
      if (!isCreateTaskArgs(args)) {
        throw new Error("Invalid arguments for todoist_create_task");
      }
    
      try {
        // Handle batch task creation
        if (args.tasks && args.tasks.length > 0) {
          const results = await Promise.all(args.tasks.map(async (taskData) => {
            try {
              // Map our parameters to the Todoist API format
              const apiParams: any = {
                content: taskData.content,
                description: taskData.description,
                projectId: taskData.project_id,
                sectionId: taskData.section_id,
                parentId: taskData.parent_id,
                order: taskData.order,
                labels: taskData.labels,
                priority: taskData.priority,
                dueString: taskData.due_string,
                dueDate: taskData.due_date,
                dueDateTime: taskData.due_datetime,
                dueLang: taskData.due_lang,
                assigneeId: taskData.assignee_id,
              };
              
              // Handle duration parameters
              if (taskData.duration && taskData.duration_unit) {
                apiParams.duration = {
                  amount: taskData.duration,
                  unit: taskData.duration_unit
                };
              }
              
              // Handle deadline parameters
              if (taskData.deadline_date) {
                apiParams.deadlineDate = taskData.deadline_date;
              }
              if (taskData.deadline_lang) {
                apiParams.deadlineLang = taskData.deadline_lang;
              }
              
              const task = await todoistClient.addTask(apiParams);
              return {
                success: true,
                task
              };
            } catch (error) {
              return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
                taskData
              };
            }
          }));
    
          const successCount = results.filter(r => r.success).length;
          
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: successCount === args.tasks.length,
                summary: {
                  total: args.tasks.length,
                  succeeded: successCount,
                  failed: args.tasks.length - successCount
                },
                results
              }, null, 2)
            }],
            isError: successCount < args.tasks.length
          };
        } 
        // Handle single task creation
        else if (args.content) {
          // Map our parameters to the Todoist API format
          const apiParams: any = {
            content: args.content,
            description: args.description,
            projectId: args.project_id,
            sectionId: args.section_id,
            parentId: args.parent_id,
            order: args.order,
            labels: args.labels,
            priority: args.priority,
            dueString: args.due_string,
            dueDate: args.due_date,
            dueDateTime: args.due_datetime,
            dueLang: args.due_lang,
            assigneeId: args.assignee_id,
          };
          
          // Handle duration parameters
          if (args.duration && args.duration_unit) {
            apiParams.duration = {
              amount: args.duration,
              unit: args.duration_unit
            };
          }
          
          // Handle deadline parameters
          if (args.deadline_date) {
            apiParams.deadlineDate = args.deadline_date;
          }
          if (args.deadline_lang) {
            apiParams.deadlineLang = args.deadline_lang;
          }
          
          const task = await todoistClient.addTask(apiParams);
          
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: true,
                task
              }, null, 2)
            }],
            isError: false
          };
        } else {
          throw new Error("Either 'content' or 'tasks' must be provided");
        }
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    }

    if (name === "todoist_get_tasks") {
      if (!isGetTasksArgs(args)) {
        throw new Error("Invalid arguments for todoist_get_tasks");
      }
    
      try {
        // Build API request parameters
        const requestParams: any = {};
        
        if (args.project_id) {
          requestParams.project_id = args.project_id;
        }
        
        if (args.section_id) {
          requestParams.section_id = args.section_id;
        }
        
        if (args.label) {
          requestParams.label = args.label;
        }
        
        if (args.filter) {
          requestParams.filter = args.filter;
        }
        
        if (args.lang) {
          requestParams.lang = args.lang;
        }
        
        if (args.ids && args.ids.length > 0) {
          requestParams.ids = args.ids;
        }
    
        // Get tasks with a single API call using appropriate filters
        const allTasks = await todoistClient.getTasks(requestParams);
        
        // Apply any additional client-side filtering
        let filteredTasks = allTasks;
        
        // Apply priority filter (API doesn't support this directly)
        if (args.priority) {
          filteredTasks = filteredTasks.filter(task => task.priority === args.priority);
        }
        
        // Apply limit
        if (args.limit && args.limit > 0 && filteredTasks.length > args.limit) {
          filteredTasks = filteredTasks.slice(0, args.limit);
        }
        
        // Format response as JSON for easier LLM parsing
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              tasks: filteredTasks,
              count: filteredTasks.length
            }, null, 2)
          }],
          isError: false,
        };
        
      } catch (error) {
        console.error('Error in todoist_get_tasks:', error);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true,
        };
      }
    }

    if (name === "todoist_update_task") {
      if (!isUpdateTaskArgs(args)) {
        throw new Error("Invalid arguments for todoist_update_task");
      }
    
      try {
        // Process batch update
        if (args.tasks && args.tasks.length > 0) {
          // Get all tasks in one API call to efficiently search by name
          const allTasks = await todoistClient.getTasks();
          
          const results = await Promise.all(args.tasks.map(async (taskData) => {
            try {
              // Determine task ID - either directly provided or find by name
              let taskId = taskData.task_id;
              
              if (!taskId && taskData.task_name) {
                const matchingTask = allTasks.find(task => 
                  task.content.toLowerCase().includes(taskData.task_name!.toLowerCase())
                );
                
                if (!matchingTask) {
                  return {
                    success: false,
                    error: `Task not found: ${taskData.task_name}`,
                    taskData
                  };
                }
                
                taskId = matchingTask.id;
              }
              
              if (!taskId) {
                return {
                  success: false,
                  error: "Either task_id or task_name must be provided",
                  taskData
                };
              }
    
              // Build update parameters
              const updateData: any = {};
              if (taskData.content !== undefined) updateData.content = taskData.content;
              if (taskData.description !== undefined) updateData.description = taskData.description;
              if (taskData.project_id !== undefined) updateData.projectId = taskData.project_id;
              if (taskData.section_id !== undefined) updateData.sectionId = taskData.section_id;
              if (taskData.labels !== undefined) updateData.labels = taskData.labels;
              if (taskData.priority !== undefined) updateData.priority = taskData.priority;
              if (taskData.due_string !== undefined) updateData.dueString = taskData.due_string;
              if (taskData.due_date !== undefined) updateData.dueDate = taskData.due_date;
              if (taskData.due_datetime !== undefined) updateData.dueDateTime = taskData.due_datetime;
              if (taskData.due_lang !== undefined) updateData.dueLang = taskData.due_lang;
              if (taskData.assignee_id !== undefined) updateData.assigneeId = taskData.assignee_id;
              
              // Handle duration
              if (taskData.duration !== undefined && taskData.duration_unit !== undefined) {
                updateData.duration = {
                  amount: taskData.duration,
                  unit: taskData.duration_unit
                };
              } else if (taskData.duration === null) {
                updateData.duration = null; // Remove duration
              }
              
              // Handle deadline
              if (taskData.deadline_date !== undefined) {
                updateData.deadlineDate = taskData.deadline_date;
              }
              if (taskData.deadline_lang !== undefined) {
                updateData.deadlineLang = taskData.deadline_lang;
              }
    
              // Perform the update
              await todoistClient.updateTask(taskId, updateData);
              
              return {
                success: true,
                taskId: taskId,
                updated: updateData
              };
            } catch (error) {
              return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
                taskData
              };
            }
          }));
    
          const successCount = results.filter(r => r.success).length;
          
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: successCount === args.tasks.length,
                summary: {
                  total: args.tasks.length,
                  succeeded: successCount,
                  failed: args.tasks.length - successCount
                },
                results
              }, null, 2)
            }],
            isError: successCount < args.tasks.length
          };
        }
        // Process single task update
        else {
          // Determine task ID - either directly provided or find by name
          let taskId = args.task_id;
          
          if (!taskId && args.task_name) {
            const tasks = await todoistClient.getTasks();
            const matchingTask = tasks.find(task => 
              task.content.toLowerCase().includes(args.task_name!.toLowerCase())
            );
            
            if (!matchingTask) {
              return {
                content: [{
                  type: "text",
                  text: JSON.stringify({
                    success: false,
                    error: `Task not found: ${args.task_name}`
                  }, null, 2)
                }],
                isError: true
              };
            }
            
            taskId = matchingTask.id;
          }
          
          if (!taskId) {
            throw new Error("Either task_id or task_name must be provided");
          }
    
          // Build update parameters
          const updateData: any = {};
          if (args.content !== undefined) updateData.content = args.content;
          if (args.description !== undefined) updateData.description = args.description;
          if (args.project_id !== undefined) updateData.projectId = args.project_id;
          if (args.section_id !== undefined) updateData.sectionId = args.section_id;
          if (args.labels !== undefined) updateData.labels = args.labels;
          if (args.priority !== undefined) updateData.priority = args.priority;
          if (args.due_string !== undefined) updateData.dueString = args.due_string;
          if (args.due_date !== undefined) updateData.dueDate = args.due_date;
          if (args.due_datetime !== undefined) updateData.dueDateTime = args.due_datetime;
          if (args.due_lang !== undefined) updateData.dueLang = args.due_lang;
          if (args.assignee_id !== undefined) updateData.assigneeId = args.assignee_id;
          
          // Handle duration
          if (args.duration !== undefined && args.duration_unit !== undefined) {
            updateData.duration = {
              amount: args.duration,
              unit: args.duration_unit
            };
          } else if (args.duration === null) {
            updateData.duration = null; // Remove duration
          }
          
          // Handle deadline
          if (args.deadline_date !== undefined) {
            updateData.deadlineDate = args.deadline_date;
          }
          if (args.deadline_lang !== undefined) {
            updateData.deadlineLang = args.deadline_lang;
          }
    
          // Perform the update
          const updatedTask = await todoistClient.updateTask(taskId, updateData);
          
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: true,
                task: updatedTask
              }, null, 2)
            }],
            isError: false
          };
        }
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    }

    if (name === "todoist_delete_task") {
      if (!isDeleteTaskArgs(args)) {
        throw new Error("Invalid arguments for todoist_delete_task");
      }
    
      try {
        // Process batch deletion
        if (args.tasks && args.tasks.length > 0) {
          // Get all tasks in one API call to efficiently search by name
          const allTasks = await todoistClient.getTasks();
          
          const results = await Promise.all(args.tasks.map(async (taskData) => {
            try {
              // Determine task ID - either directly provided or find by name
              let taskId = taskData.task_id;
              let taskContent = '';
              
              if (!taskId && taskData.task_name) {
                const matchingTask = allTasks.find(task => 
                  task.content.toLowerCase().includes(taskData.task_name!.toLowerCase())
                );
                
                if (!matchingTask) {
                  return {
                    success: false,
                    error: `Task not found: ${taskData.task_name}`,
                    task_name: taskData.task_name
                  };
                }
                
                taskId = matchingTask.id;
                taskContent = matchingTask.content;
              }
              
              if (!taskId) {
                return {
                  success: false,
                  error: "Either task_id or task_name must be provided",
                  taskData
                };
              }
    
              // Delete the task
              await todoistClient.deleteTask(taskId);
              
              return {
                success: true,
                task_id: taskId,
                content: taskContent || `Task ID: ${taskId}`
              };
            } catch (error) {
              return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
                taskData
              };
            }
          }));
    
          const successCount = results.filter(r => r.success).length;
          
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: successCount === args.tasks.length,
                summary: {
                  total: args.tasks.length,
                  succeeded: successCount,
                  failed: args.tasks.length - successCount
                },
                results
              }, null, 2)
            }],
            isError: successCount < args.tasks.length
          };
        }
        // Process single task deletion
        else {
          // Determine task ID - either directly provided or find by name
          let taskId = args.task_id;
          let taskContent = '';
          
          if (!taskId && args.task_name) {
            const tasks = await todoistClient.getTasks();
            const matchingTask = tasks.find(task => 
              task.content.toLowerCase().includes(args.task_name!.toLowerCase())
            );
            
            if (!matchingTask) {
              return {
                content: [{
                  type: "text",
                  text: JSON.stringify({
                    success: false,
                    error: `Task not found: ${args.task_name}`
                  }, null, 2)
                }],
                isError: true
              };
            }
            
            taskId = matchingTask.id;
            taskContent = matchingTask.content;
          }
          
          if (!taskId) {
            throw new Error("Either task_id or task_name must be provided");
          }
    
          // Delete the task
          await todoistClient.deleteTask(taskId);
          
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: true,
                message: `Successfully deleted task${taskContent ? ': "' + taskContent + '"' : ' with ID: ' + taskId}`
              }, null, 2)
            }],
            isError: false
          };
        }
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    }

    if (name === "todoist_complete_task") {
      if (!isCompleteTaskArgs(args)) {
        throw new Error("Invalid arguments for todoist_complete_task");
      }
    
      try {
        // Process batch completion
        if (args.tasks && args.tasks.length > 0) {
          // Get all tasks in one API call to efficiently search by name
          const allTasks = await todoistClient.getTasks();
          
          const results = await Promise.all(args.tasks.map(async (taskData) => {
            try {
              // Determine task ID - either directly provided or find by name
              let taskId = taskData.task_id;
              let taskContent = '';
              
              if (!taskId && taskData.task_name) {
                const matchingTask = allTasks.find(task => 
                  task.content.toLowerCase().includes(taskData.task_name!.toLowerCase())
                );
                
                if (!matchingTask) {
                  return {
                    success: false,
                    error: `Task not found: ${taskData.task_name}`,
                    task_name: taskData.task_name
                  };
                }
                
                taskId = matchingTask.id;
                taskContent = matchingTask.content;
              }
              
              if (!taskId) {
                return {
                  success: false,
                  error: "Either task_id or task_name must be provided",
                  taskData
                };
              }
    
              // Complete the task
              await todoistClient.closeTask(taskId);
              
              return {
                success: true,
                task_id: taskId,
                content: taskContent || `Task ID: ${taskId}`
              };
            } catch (error) {
              return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
                taskData
              };
            }
          }));
    
          const successCount = results.filter(r => r.success).length;
          
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: successCount === args.tasks.length,
                summary: {
                  total: args.tasks.length,
                  succeeded: successCount,
                  failed: args.tasks.length - successCount
                },
                results
              }, null, 2)
            }],
            isError: successCount < args.tasks.length
          };
        }
        // Process single task completion
        else {
          // Determine task ID - either directly provided or find by name
          let taskId = args.task_id;
          let taskContent = '';
          
          if (!taskId && args.task_name) {
            const tasks = await todoistClient.getTasks();
            const matchingTask = tasks.find(task => 
              task.content.toLowerCase().includes(args.task_name!.toLowerCase())
            );
            
            if (!matchingTask) {
              return {
                content: [{
                  type: "text",
                  text: JSON.stringify({
                    success: false,
                    error: `Task not found: ${args.task_name}`
                  }, null, 2)
                }],
                isError: true
              };
            }
            
            taskId = matchingTask.id;
            taskContent = matchingTask.content;
          }
          
          if (!taskId) {
            throw new Error("Either task_id or task_name must be provided");
          }
    
          // Complete the task
          await todoistClient.closeTask(taskId);
          
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: true,
                message: `Successfully completed task${taskContent ? ': "' + taskContent + '"' : ' with ID: ' + taskId}`
              }, null, 2)
            }],
            isError: false
          };
        }
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    }

    // Project Handlers

    if (name === "todoist_get_projects") {
      if (!isGetProjectsArgs(args)) {
        throw new Error("Invalid arguments for todoist_get_projects");
      }
    
      try {
        // Get all projects in a single API call
        const projects = await todoistClient.getProjects();
        
        // Create a response object
        const response: any = {
          success: true,
          projects: projects
        };
    
        // Handle specific project IDs if provided
        if (args.project_ids && args.project_ids.length > 0) {
          response.projects = projects.filter(project => 
            args.project_ids!.includes(project.id)
          );
        }
    
        // Add section information if requested
        if (args.include_sections) {
          const projectSections = await Promise.all(
            response.projects.map(async (project: any) => {
              try {
                const sections = await todoistClient.getSections(project.id);
                return {
                  ...project,
                  sections: sections
                };
              } catch (error) {
                return {
                  ...project,
                  sections: [],
                  sections_error: error instanceof Error ? error.message : String(error)
                };
              }
            })
          );
          response.projects = projectSections;
        }
    
        // Add hierarchy information if requested
        if (args.include_hierarchy) {
          // Create a map for quick project lookup
          const projectMap = new Map();
          response.projects.forEach((project: any) => {
            projectMap.set(project.id, {
              ...project,
              children: []
            });
          });
    
          // Build the hierarchy
          const rootProjects: any[] = [];
          response.projects.forEach((project: any) => {
            const projectWithHierarchy = projectMap.get(project.id);
            
            if (project.parentId) {
              const parent = projectMap.get(project.parentId);
              if (parent) {
                parent.children.push(projectWithHierarchy);
              } else {
                rootProjects.push(projectWithHierarchy);
              }
            } else {
              rootProjects.push(projectWithHierarchy);
            }
          });
    
          response.hierarchy = rootProjects;
        }
    
        return {
          content: [{
            type: "text",
            text: JSON.stringify(response, null, 2)
          }],
          isError: false,
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true,
        };
      }
    }

    if (name === "todoist_create_project") {
      if (!isCreateProjectArgs(args)) {
        throw new Error("Invalid arguments for todoist_create_project");
      }
    
      try {
        // Handle batch project creation
        if (args.projects && args.projects.length > 0) {
          // First get all existing projects to handle parent_name references
          const existingProjects = await todoistClient.getProjects();
          const projectNameToIdMap = new Map<string, string>();
          existingProjects.forEach(project => {
            projectNameToIdMap.set(project.name.toLowerCase(), project.id);
          });
          
          // Keep track of newly created projects as well
          const newProjectMap = new Map<string, string>();
          
          const results = await Promise.all(args.projects.map(async (projectData) => {
            try {
              // Determine parent ID from name or ID
              let parentId = projectData.parent_id;
              
              if (!parentId && projectData.parent_name) {
                // Look for parent in existing projects
                parentId = projectNameToIdMap.get(projectData.parent_name.toLowerCase());
                
                // Or look in newly created projects
                if (!parentId) {
                  parentId = newProjectMap.get(projectData.parent_name.toLowerCase());
                }
                
                if (!parentId) {
                  return {
                    success: false,
                    error: `Parent project not found: ${projectData.parent_name}`,
                    projectData
                  };
                }
              }
              
              // Create the project
              const projectParams: any = {
                name: projectData.name,
                color: projectData.color,
                viewStyle: projectData.view_style
              };
              
              if (parentId) {
                projectParams.parentId = parentId;
              }
              
              if (projectData.favorite !== undefined) {
                projectParams.isFavorite = projectData.favorite;
              }
              
              const project = await todoistClient.addProject(projectParams);
              
              // Save to our map for potential children
              newProjectMap.set(project.name.toLowerCase(), project.id);
              
              // Create sections if specified
              const sections: Array<any> = []; // Fix: Explicitly define the type
              if (projectData.sections && projectData.sections.length > 0) {
                for (const sectionName of projectData.sections) {
                  try {
                    const section = await todoistClient.addSection({
                      name: sectionName,
                      projectId: project.id
                    });
                    sections.push(section);
                  } catch (error) {
                    sections.push({
                      name: sectionName,
                      error: error instanceof Error ? error.message : String(error)
                    });
                  }
                }
              }
              
              return {
                success: true,
                project,
                sections: sections.length > 0 ? sections : undefined
              };
            } catch (error) {
              return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
                projectData
              };
            }
          }));
          
          const successCount = results.filter(r => r.success).length;
          
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: successCount === args.projects.length,
                summary: {
                  total: args.projects.length,
                  succeeded: successCount,
                  failed: args.projects.length - successCount
                },
                results
              }, null, 2)
            }],
            isError: successCount < args.projects.length
          };
        }
        // Handle single project creation (backward compatibility)
        else {
          const projectParams: any = {
            name: args.name,
            parentId: args.parent_id,
            color: args.color
          };
          
          if (args.view_style) {
            projectParams.viewStyle = args.view_style;
          }
          
          if (args.favorite !== undefined) {
            projectParams.isFavorite = args.favorite;
          }
          
          const project = await todoistClient.addProject(projectParams);
          
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: true,
                project
              }, null, 2)
            }],
            isError: false
          };
        }
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    }

    if (name === "todoist_update_project") {
      if (!isUpdateProjectArgs(args)) {
        throw new Error("Invalid arguments for todoist_update_project");
      }
    
      try {
        // Handle batch project update
        if (args.projects && args.projects.length > 0) {
          // Get all projects to find by name if needed
          const allProjects = await todoistClient.getProjects();
          
          const results = await Promise.all(args.projects.map(async (projectData) => {
            try {
              // Determine project ID - either directly provided or find by name
              let projectId = projectData.project_id;
              let projectDetails = null;
              
              if (!projectId && projectData.project_name) {
                const matchingProject = allProjects.find(project => 
                  project.name.toLowerCase().includes(projectData.project_name!.toLowerCase())
                );
                
                if (!matchingProject) {
                  return {
                    success: false,
                    error: `Project not found: ${projectData.project_name}`,
                    projectData
                  };
                }
                
                projectId = matchingProject.id;
                projectDetails = matchingProject;
              } else if (projectId) {
                projectDetails = allProjects.find(p => p.id === projectId);
              }
              
              if (!projectId) {
                return {
                  success: false,
                  error: "Either project_id or project_name must be provided",
                  projectData
                };
              }
    
              // Build update parameters
              const updateData: any = {};
              if (projectData.name !== undefined) updateData.name = projectData.name;
              if (projectData.color !== undefined) updateData.color = projectData.color;
              if (projectData.favorite !== undefined) updateData.isFavorite = projectData.favorite;
              if (projectData.view_style !== undefined) updateData.viewStyle = projectData.view_style;
    
              // Perform the update
              const updatedProject = await todoistClient.updateProject(projectId, updateData);
              
              return {
                success: true,
                project_id: projectId,
                original_name: projectDetails?.name || "Unknown",
                updated: updatedProject
              };
            } catch (error) {
              return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
                projectData
              };
            }
          }));
    
          const successCount = results.filter(r => r.success).length;
          
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: successCount === args.projects.length,
                summary: {
                  total: args.projects.length,
                  succeeded: successCount,
                  failed: args.projects.length - successCount
                },
                results
              }, null, 2)
            }],
            isError: successCount < args.projects.length
          };
        }
        // Process single project update (backward compatibility)
        else {
          // Build update data
          const updateData: any = {};
          if (args.name !== undefined) updateData.name = args.name;
          if (args.color !== undefined) updateData.color = args.color;
          if (args.favorite !== undefined) updateData.isFavorite = args.favorite;
          if (args.view_style !== undefined) updateData.viewStyle = args.view_style;
    
          // Perform the update
          const updatedProject = await todoistClient.updateProject(args.project_id!, updateData);
          
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: true,
                project: updatedProject
              }, null, 2)
            }],
            isError: false
          };
        }
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    }
    
    if (name === "todoist_get_project_sections") {
      if (!isGetProjectSectionsArgs(args)) {
        throw new Error("Invalid arguments for todoist_get_project_sections");
      }
    
      try {
        // Process batch project sections retrieval
        if (args.projects && args.projects.length > 0) {
          // Get all projects in one API call to efficiently search by name
          const allProjects = await todoistClient.getProjects();
          
          const results = await Promise.all(args.projects.map(async (projectData) => {
            try {
              // Determine project ID - either directly provided or find by name
              let projectId = projectData.project_id;
              let projectName = "";
              
              if (!projectId && projectData.project_name) {
                const matchingProject = allProjects.find(project => 
                  project.name.toLowerCase().includes(projectData.project_name!.toLowerCase())
                );
                
                if (!matchingProject) {
                  return {
                    success: false,
                    error: `Project not found: ${projectData.project_name}`,
                    project_name: projectData.project_name
                  };
                }
                
                projectId = matchingProject.id;
                projectName = matchingProject.name;
              }
              
              if (!projectId) {
                return {
                  success: false,
                  error: "Either project_id or project_name must be provided",
                  projectData
                };
              }
    
              // Get all sections for this project
              const sections = await todoistClient.getSections(projectId);
              
              // Optionally get tasks for each section to determine if empty
              let sectionsWithTaskCount = sections;
              if (args.include_empty === false) {
                const projectTasks = await todoistClient.getTasks({ projectId });
                
                sectionsWithTaskCount = sections.filter(section => {
                  const sectionTasks = projectTasks.filter(task => task.sectionId === section.id);
                  return sectionTasks.length > 0;
                });
              }
              
              return {
                success: true,
                project_id: projectId,
                project_name: projectName || `Project ID: ${projectId}`,
                sections: sectionsWithTaskCount,
                count: sectionsWithTaskCount.length
              };
            } catch (error) {
              return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
                projectData
              };
            }
          }));
    
          const successCount = results.filter(r => r.success).length;
          
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: successCount === args.projects.length,
                summary: {
                  total: args.projects.length,
                  succeeded: successCount,
                  failed: args.projects.length - successCount
                },
                results
              }, null, 2)
            }],
            isError: successCount < args.projects.length
          };
        }
        // Process single project sections retrieval
        else {
          // Determine project ID - either directly provided or find by name
          let projectId = args.project_id;
          let projectName = "";
          
          if (!projectId && args.project_name) {
            const projects = await todoistClient.getProjects();
            const matchingProject = projects.find(project => 
              project.name.toLowerCase().includes(args.project_name!.toLowerCase())
            );
            
            if (!matchingProject) {
              return {
                content: [{
                  type: "text",
                  text: JSON.stringify({
                    success: false,
                    error: `Project not found: ${args.project_name}`
                  }, null, 2)
                }],
                isError: true
              };
            }
            
            projectId = matchingProject.id;
            projectName = matchingProject.name;
          }
          
          if (!projectId) {
            throw new Error("Either project_id or project_name must be provided");
          }
    
          // Get all sections for this project
          const sections = await todoistClient.getSections(projectId);
          
          // Optionally filter empty sections
          let sectionsResult = sections;
          if (args.include_empty === false) {
            const projectTasks = await todoistClient.getTasks({ projectId });
            
            sectionsResult = sections.filter(section => {
              const sectionTasks = projectTasks.filter(task => task.sectionId === section.id);
              return sectionTasks.length > 0;
            });
          }
          
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: true,
                project_id: projectId,
                project_name: projectName || undefined,
                sections: sectionsResult,
                count: sectionsResult.length
              }, null, 2)
            }],
            isError: false
          };
        }
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    }

    if (name === "todoist_create_project_section") {
      if (!isCreateProjectSectionArgs(args)) {
        throw new Error("Invalid arguments for todoist_create_project_section");
      }
    
      try {
        // Handle batch section creation
        if (args.sections && args.sections.length > 0) {
          // Get all projects in one API call to efficiently search by name if needed
          const allProjects = await todoistClient.getProjects();
          const projectNameToIdMap = new Map<string, string>();
          
          allProjects.forEach(project => {
            projectNameToIdMap.set(project.name.toLowerCase(), project.id);
          });
          
          const results = await Promise.all(args.sections.map(async (sectionData) => {
            try {
              // Determine project ID - either directly provided or find by name
              let projectId = sectionData.project_id;
              let projectName = "";
              
              if (!projectId && sectionData.project_name) {
                const matchingProject = allProjects.find(project => 
                  project.name.toLowerCase().includes(sectionData.project_name!.toLowerCase())
                );
                
                if (!matchingProject) {
                  return {
                    success: false,
                    error: `Project not found: ${sectionData.project_name}`,
                    section_name: sectionData.name
                  };
                }
                
                projectId = matchingProject.id;
                projectName = matchingProject.name;
              }
              
              if (!projectId) {
                return {
                  success: false,
                  error: "Either project_id or project_name must be provided",
                  section_name: sectionData.name
                };
              }
    
              // Create the section
              const section = await todoistClient.addSection({
                projectId: projectId,
                name: sectionData.name,
                order: sectionData.order
              });
              
              return {
                success: true,
                section,
                project_name: projectName || undefined
              };
            } catch (error) {
              return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
                section_data: sectionData
              };
            }
          }));
    
          const successCount = results.filter(r => r.success).length;
          
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: successCount === args.sections.length,
                summary: {
                  total: args.sections.length,
                  succeeded: successCount,
                  failed: args.sections.length - successCount
                },
                results
              }, null, 2)
            }],
            isError: successCount < args.sections.length
          };
        }
        // Process single section creation (backward compatibility)
        else {
          const section = await todoistClient.addSection({
            projectId: args.project_id!,
            name: args.name!,
            order: args.order
          });
          
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: true,
                section
              }, null, 2)
            }],
            isError: false
          };
        }
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    }

    // Personal Label Handlers

    if (name === "todoist_get_personal_labels") {
      if (!isGetPersonalLabelsArgs(args)) {
        throw new Error("Invalid arguments for todoist_get_personal_labels");
      }
      const labels = await todoistClient.getLabels();
      return {
        content: [{ 
          type: "text", 
          text: JSON.stringify(labels, null, 2)
        }],
        isError: false,
      };
    }

    if (name === "todoist_create_personal_label") {
      if (!isCreatePersonalLabelArgs(args)) {
        throw new Error("Invalid arguments for todoist_create_personal_label");
      }
    
      try {
        // Handle batch label creation
        if (args.labels && args.labels.length > 0) {
          const results = await Promise.all(args.labels.map(async (labelData) => {
            try {
              // Create the label
              const label = await todoistClient.addLabel({
                name: labelData.name,
                color: labelData.color,
                order: labelData.order,
                isFavorite: labelData.is_favorite
              });
              
              return {
                success: true,
                label
              };
            } catch (error) {
              return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
                label_name: labelData.name
              };
            }
          }));
    
          const successCount = results.filter(r => r.success).length;
          
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: successCount === args.labels.length,
                summary: {
                  total: args.labels.length,
                  succeeded: successCount,
                  failed: args.labels.length - successCount
                },
                results
              }, null, 2)
            }],
            isError: successCount < args.labels.length
          };
        }
        // Handle single label creation (backward compatibility)
        else {
          const label = await todoistClient.addLabel({
            name: args.name!,
            color: args.color,
            order: args.order,
            isFavorite: args.is_favorite
          });
          
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: true,
                label
              }, null, 2)
            }],
            isError: false
          };
        }
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    }

    if (name === "todoist_get_personal_label") {
      if (!isGetPersonalLabelArgs(args)) {
        throw new Error("Invalid arguments for todoist_get_personal_label");
      }
      const label = await todoistClient.getLabel(args.label_id);
      return {
        content: [{ 
          type: "text", 
          text: JSON.stringify(label, null, 2)
        }],
        isError: false,
      };
    }

    if (name === "todoist_update_personal_label") {
      if (!isUpdatePersonalLabelArgs(args)) {
        throw new Error("Invalid arguments for todoist_update_personal_label");
      }
    
      try {
        // Handle batch label updates
        if (args.labels && args.labels.length > 0) {
          // Get all labels in one API call to efficiently search by name
          const allLabels = await todoistClient.getLabels();
          
          const results = await Promise.all(args.labels.map(async (labelData) => {
            try {
              // Determine label ID - either directly provided or find by name
              let labelId = labelData.label_id;
              let labelName = '';
              
              if (!labelId && labelData.label_name) {
                const matchingLabel = allLabels.find(label => 
                  label.name.toLowerCase() === labelData.label_name!.toLowerCase()
                );
                
                if (!matchingLabel) {
                  return {
                    success: false,
                    error: `Label not found: ${labelData.label_name}`,
                    label_name: labelData.label_name
                  };
                }
                
                labelId = matchingLabel.id;
                labelName = matchingLabel.name;
              }
              
              if (!labelId) {
                return {
                  success: false,
                  error: "Either label_id or label_name must be provided",
                  labelData
                };
              }
    
              // Build update parameters
              const updateData: any = {};
              if (labelData.name !== undefined) updateData.name = labelData.name;
              if (labelData.color !== undefined) updateData.color = labelData.color;
              if (labelData.order !== undefined) updateData.order = labelData.order;
              if (labelData.is_favorite !== undefined) updateData.isFavorite = labelData.is_favorite;
    
              // Update the label
              const updatedLabel = await todoistClient.updateLabel(labelId, updateData);
              
              return {
                success: true,
                label: updatedLabel,
                original_name: labelName || undefined
              };
            } catch (error) {
              return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
                labelData
              };
            }
          }));
    
          const successCount = results.filter(r => r.success).length;
          
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: successCount === args.labels.length,
                summary: {
                  total: args.labels.length,
                  succeeded: successCount,
                  failed: args.labels.length - successCount
                },
                results
              }, null, 2)
            }],
            isError: successCount < args.labels.length
          };
        }
        // Handle single label update (backward compatibility)
        else {
          // Determine label ID - either directly provided or find by name
          let labelId = args.label_id;
          
          if (!labelId && args.label_name) {
            const labels = await todoistClient.getLabels();
            const matchingLabel = labels.find(label => 
              label.name.toLowerCase() === args.label_name!.toLowerCase()
            );
            
            if (!matchingLabel) {
              return {
                content: [{
                  type: "text",
                  text: JSON.stringify({
                    success: false,
                    error: `Label not found: ${args.label_name}`
                  }, null, 2)
                }],
                isError: true
              };
            }
            
            labelId = matchingLabel.id;
          }
          
          if (!labelId) {
            throw new Error("Either label_id or label_name must be provided");
          }
    
          // Build update parameters
          const updateData: any = {};
          if (args.name !== undefined) updateData.name = args.name;
          if (args.color !== undefined) updateData.color = args.color;
          if (args.order !== undefined) updateData.order = args.order;
          if (args.is_favorite !== undefined) updateData.isFavorite = args.is_favorite;
    
          // Update the label
          const updatedLabel = await todoistClient.updateLabel(labelId, updateData);
          
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: true,
                label: updatedLabel
              }, null, 2)
            }],
            isError: false
          };
        }
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    }

    if (name === "todoist_delete_personal_label") {
      if (!isDeletePersonalLabelArgs(args)) {
        throw new Error("Invalid arguments for todoist_delete_personal_label");
      }
      await todoistClient.deleteLabel(args.label_id);
      return {
        content: [{ 
          type: "text", 
          text: `Successfully deleted label with ID: ${args.label_id}`
        }],
        isError: false,
      };
    }
    
    // Shared Label Handlers

    if (name === "todoist_get_shared_labels") {
      if (!isGetSharedLabelsArgs(args)) {
        throw new Error("Invalid arguments for todoist_get_shared_labels");
      }
    
      try {
        const sharedLabels = await todoistClient.getSharedLabels({
          omitPersonal: args.omit_personal
        });
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              shared_labels: sharedLabels,
              count: sharedLabels.length
            }, null, 2)
          }],
          isError: false
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    }

    if (name === "todoist_rename_shared_labels") {
      if (!isRenameSharedLabelsArgs(args)) {
        throw new Error("Invalid arguments for todoist_rename_shared_labels");
      }
    
      try {
        // Handle batch label renaming
        if (args.labels && args.labels.length > 0) {
          const results = await Promise.all(args.labels.map(async (labelData) => {
            try {
              // Rename the shared label
              await todoistClient.renameSharedLabel({
                name: labelData.name,
                newName: labelData.new_name
              });
              
              return {
                success: true,
                old_name: labelData.name,
                new_name: labelData.new_name
              };
            } catch (error) {
              return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
                label_name: labelData.name
              };
            }
          }));
    
          const successCount = results.filter(r => r.success).length;
          
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: successCount === args.labels.length,
                summary: {
                  total: args.labels.length,
                  succeeded: successCount,
                  failed: args.labels.length - successCount
                },
                results
              }, null, 2)
            }],
            isError: successCount < args.labels.length
          };
        }
        // Handle single label renaming (backward compatibility)
        else {
          await todoistClient.renameSharedLabel({
            name: args.name!,
            newName: args.new_name!
          });
          
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: true,
                message: `Successfully renamed shared label "${args.name}" to "${args.new_name}"`
              }, null, 2)
            }],
            isError: false
          };
        }
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    }

    if (name === "todoist_remove_shared_labels") {
      if (!isRemoveSharedLabelsArgs(args)) {
        throw new Error("Invalid arguments for todoist_remove_shared_labels");
      }
    
      try {
        // Handle batch label removal
        if (args.labels && args.labels.length > 0) {
          const results = await Promise.all(args.labels.map(async (labelData) => {
            try {
              // Remove the shared label
              await todoistClient.removeSharedLabel({
                name: labelData.name
              });
              
              return {
                success: true,
                label_name: labelData.name
              };
            } catch (error) {
              return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
                label_name: labelData.name
              };
            }
          }));
    
          const successCount = results.filter(r => r.success).length;
          
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: successCount === args.labels.length,
                summary: {
                  total: args.labels.length,
                  succeeded: successCount,
                  failed: args.labels.length - successCount
                },
                results
              }, null, 2)
            }],
            isError: successCount < args.labels.length
          };
        }
        // Handle single label removal (backward compatibility)
        else {
          await todoistClient.removeSharedLabel({
            name: args.name!
          });
          
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: true,
                message: `Successfully removed all instances of shared label "${args.name}"`
              }, null, 2)
            }],
            isError: false
          };
        }
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    }

    // Task Label Handler

    if (name === "todoist_update_task_labels") {
      if (!isUpdateTaskLabelsArgs(args)) {
        throw new Error("Invalid arguments for todoist_update_task_labels");
      }
    
      try {
        // Process batch label updates
        if (args.tasks && args.tasks.length > 0) {
          // Get all tasks in one API call to efficiently search by name
          const allTasks = await todoistClient.getTasks();
          
          const results = await Promise.all(args.tasks.map(async (taskData) => {
            try {
              // Determine task ID - either directly provided or find by name
              let taskId = taskData.task_id;
              let taskContent = '';
              
              if (!taskId && taskData.task_name) {
                const matchingTask = allTasks.find(task => 
                  task.content.toLowerCase().includes(taskData.task_name!.toLowerCase())
                );
                
                if (!matchingTask) {
                  return {
                    success: false,
                    error: `Task not found: ${taskData.task_name}`,
                    task_name: taskData.task_name
                  };
                }
                
                taskId = matchingTask.id;
                taskContent = matchingTask.content;
              }
              
              if (!taskId) {
                return {
                  success: false,
                  error: "Either task_id or task_name must be provided",
                  taskData
                };
              }
    
              // Update the task labels
              await todoistClient.updateTask(taskId, {
                labels: taskData.labels
              });
              
              return {
                success: true,
                task_id: taskId,
                content: taskContent || `Task ID: ${taskId}`,
                labels: taskData.labels
              };
            } catch (error) {
              return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
                taskData
              };
            }
          }));
    
          const successCount = results.filter(r => r.success).length;
          
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: successCount === args.tasks.length,
                summary: {
                  total: args.tasks.length,
                  succeeded: successCount,
                  failed: args.tasks.length - successCount
                },
                results
              }, null, 2)
            }],
            isError: successCount < args.tasks.length
          };
        }
        // Process single task label update (backward compatibility)
        else {
          // Determine task ID - either directly provided or find by name
          let taskId = args.task_id;
          let taskContent = '';
          
          if (!taskId && args.task_name) {
            const tasks = await todoistClient.getTasks();
            const matchingTask = tasks.find(task => 
              task.content.toLowerCase().includes(args.task_name!.toLowerCase())
            );
            
            if (!matchingTask) {
              return {
                content: [{
                  type: "text",
                  text: JSON.stringify({
                    success: false,
                    error: `Task not found: ${args.task_name}`
                  }, null, 2)
                }],
                isError: true
              };
            }
            
            taskId = matchingTask.id;
            taskContent = matchingTask.content;
          }
          
          if (!taskId) {
            throw new Error("Either task_id or task_name must be provided");
          }
    
          // Update the task labels
          await todoistClient.updateTask(taskId, {
            labels: args.labels
          });
          
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: true,
                task_id: taskId,
                content: taskContent || `Task ID: ${taskId}`,
                labels: args.labels
              }, null, 2)
            }],
            isError: false
          };
        }
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    }
    
    return {
      content: [{ type: "text", text: `Unknown tool: ${name}` }],
      isError: true,
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

// async functions

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Todoist MCP Server running on stdio");
}

runServer().catch((error) => {
  console.error("Fatal error running server:", error);
  process.exit(1);
});
