// Tool schemas for AI to control the React Flow canvas.
// These are returned to the frontend as tool_results so the UI can apply them.

export const REACTFLOW_TOOL_SCHEMAS_OPENAI = [
  {
    type: "function" as const,
    function: {
      name: "reactflow_create_node",
      description:
        "Create a new node on the React Flow canvas. Use this when the user asks to add an image generation step, video generation step, design model node, doc/text node, prompt node, action node, or any other workflow step.",
      parameters: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: ["prompt", "image-prompt", "video-prompt", "design-model", "doc", "action", "instagram"],
            description:
              "Node type. 'image-prompt' = image generation with prompt+image input. 'video-prompt' = video generation with prompt+image/video input. 'design-model' = image+video design model. 'doc' = documentation/text node. 'prompt' = plain text prompt. 'action' = generic action. 'instagram' = post to instagram.",
          },
          label: {
            type: "string",
            description: "Human-readable name for the node, e.g. 'Generate Hero Image'",
          },
          prompt: {
            type: "string",
            description: "Optional initial prompt text for the node",
          },
          description: {
            type: "string",
            description: "Optional description for doc nodes",
          },
          position: {
            type: "object",
            description: "Optional position on canvas. If omitted, auto-placed.",
            properties: {
              x: { type: "number" },
              y: { type: "number" },
            },
          },
        },
        required: ["type", "label"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "reactflow_edit_node",
      description:
        "Edit an existing node on the React Flow canvas. Use when the user wants to rename a node, change its label, update its prompt, or change its type.",
      parameters: {
        type: "object",
        properties: {
          nodeId: {
            type: "string",
            description: "The ID of the node to edit",
          },
          label: {
            type: "string",
            description: "New label for the node",
          },
          type: {
            type: "string",
            enum: ["prompt", "image-prompt", "video-prompt", "design-model", "doc", "action", "instagram"],
            description: "New type for the node",
          },
          prompt: {
            type: "string",
            description: "New prompt text for the node",
          },
          description: {
            type: "string",
            description: "New description for doc nodes",
          },
        },
        required: ["nodeId"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "reactflow_connect_nodes",
      description:
        "Connect two nodes together with an edge. Use when the user asks to link, connect, or chain nodes together.",
      parameters: {
        type: "object",
        properties: {
          sourceNodeId: {
            type: "string",
            description: "ID of the source node (output end)",
          },
          targetNodeId: {
            type: "string",
            description: "ID of the target node (input end)",
          },
          label: {
            type: "string",
            description: "Optional label for the edge",
          },
        },
        required: ["sourceNodeId", "targetNodeId"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "reactflow_delete_node",
      description: "Delete a node from the React Flow canvas by its ID.",
      parameters: {
        type: "object",
        properties: {
          nodeId: {
            type: "string",
            description: "ID of the node to delete",
          },
        },
        required: ["nodeId"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "reactflow_list_nodes",
      description:
        "List all current nodes on the canvas. Call this first before editing or connecting nodes to discover their IDs and types.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
];

// Anthropic format
export const REACTFLOW_TOOL_SCHEMAS_ANTHROPIC = REACTFLOW_TOOL_SCHEMAS_OPENAI.map((t) => ({
  name: t.function.name,
  description: t.function.description,
  input_schema: t.function.parameters,
}));

// Types for actions sent back to frontend
export type ReactFlowAction =
  | { action: "create_node"; type: string; label: string; prompt?: string; description?: string; position?: { x: number; y: number } }
  | { action: "edit_node"; nodeId: string; label?: string; type?: string; prompt?: string; description?: string }
  | { action: "connect_nodes"; sourceNodeId: string; targetNodeId: string; label?: string }
  | { action: "delete_node"; nodeId: string }
  | { action: "list_nodes" };
