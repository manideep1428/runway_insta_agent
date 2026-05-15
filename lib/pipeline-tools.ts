/**
 * Pipeline Tools for the AI Instagram Content Manager.
 *
 * These tools are injected alongside Composio tools so the AI can:
 *   1. Research topics (via Composio web/docs)
 *   2. Generate images/videos with RunwayML
 *   3. Poll for generation status
 *   4. Publish directly to Instagram via Graph API
 *   5. Manipulate the React Flow canvas to show the workflow visually
 */

// ─────────────────────────────────────────────────────────────────────────────
// Runway Generation Tools
// ─────────────────────────────────────────────────────────────────────────────

export const RUNWAY_TOOL_SCHEMAS_OPENAI = [
  {
    type: 'function' as const,
    function: {
      name: 'runway_generate_image',
      description:
        'Generate an image using RunwayML gen4_image model from a text prompt. Returns a taskId to poll for completion.',
      parameters: {
        type: 'object',
        properties: {
          promptText: {
            type: 'string',
            description: 'Detailed text prompt describing the image. Be specific about style, lighting, composition.',
          },
          ratio: {
            type: 'string',
            enum: ['1360:768', '768:1360', '1024:1024', '1184:880', '880:1184'],
            description: 'Image aspect ratio. Use 1360:768 for landscape, 768:1360 for portrait/stories.',
          },
          referenceImageUrl: {
            type: 'string',
            description: 'Optional URL of a reference image to guide the generation style.',
          },
        },
        required: ['promptText'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'runway_generate_video_from_text',
      description:
        'Generate a video from text using RunwayML gen4.5 model. Returns a taskId to poll. Best for Reels/Stories content.',
      parameters: {
        type: 'object',
        properties: {
          promptText: {
            type: 'string',
            description: 'Detailed cinematic prompt for the video. Describe motion, camera moves, subjects, mood.',
          },
          ratio: {
            type: 'string',
            enum: ['1280:720', '720:1280', '1104:832', '832:1104', '960:960'],
            description: 'Video aspect ratio. Use 720:1280 for Reels/Stories (vertical), 1280:720 for landscape.',
          },
          duration: {
            type: 'number',
            enum: [5, 10],
            description: 'Duration in seconds. 5 or 10.',
          },
        },
        required: ['promptText'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'runway_generate_video_from_image',
      description:
        'Animate a static image into a video using RunwayML gen4.5. Great for product shots or reference-based content.',
      parameters: {
        type: 'object',
        properties: {
          promptText: {
            type: 'string',
            description: 'Describes the motion/animation to apply to the image.',
          },
          promptImage: {
            type: 'string',
            description: 'URL of the source image to animate.',
          },
          ratio: {
            type: 'string',
            enum: ['1280:720', '720:1280', '1104:832', '960:960'],
            description: 'Output video ratio.',
          },
          duration: {
            type: 'number',
            enum: [5, 10],
          },
        },
        required: ['promptText', 'promptImage'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'runway_poll_task',
      description:
        'Check the status of a RunwayML generation task. Returns status (PENDING/RUNNING/SUCCEEDED/FAILED) and outputUrl when done. Call repeatedly until SUCCEEDED.',
      parameters: {
        type: 'object',
        properties: {
          taskId: {
            type: 'string',
            description: 'The task ID returned by a runway_generate_* tool.',
          },
        },
        required: ['taskId'],
      },
    },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Instagram Publishing Tools
// ─────────────────────────────────────────────────────────────────────────────

export const INSTAGRAM_PUBLISH_TOOLS_OPENAI = [
  {
    type: 'function' as const,
    function: {
      name: 'instagram_post_image',
      description:
        'Publish a single image to Instagram. The image must be a publicly accessible URL. Perfect for feed posts.',
      parameters: {
        type: 'object',
        properties: {
          imageUrl: {
            type: 'string',
            description: 'Publicly accessible URL of the image (JPEG/PNG).',
          },
          caption: {
            type: 'string',
            description: 'Instagram caption. Include hashtags at the end for reach.',
          },
        },
        required: ['imageUrl', 'caption'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'instagram_post_reel',
      description:
        'Publish a video as an Instagram Reel. Video must be a publicly accessible URL, MP4 format, max 15 minutes.',
      parameters: {
        type: 'object',
        properties: {
          videoUrl: {
            type: 'string',
            description: 'Publicly accessible URL of the video (MP4).',
          },
          caption: {
            type: 'string',
            description: 'Reel caption with hashtags.',
          },
          coverUrl: {
            type: 'string',
            description: 'Optional cover image URL for the Reel thumbnail.',
          },
        },
        required: ['videoUrl', 'caption'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'instagram_post_story',
      description: 'Publish an image or video as an Instagram Story (ephemeral, 24h).',
      parameters: {
        type: 'object',
        properties: {
          mediaUrl: {
            type: 'string',
            description: 'Publicly accessible URL of the image or video.',
          },
          mediaType: {
            type: 'string',
            enum: ['IMAGE', 'VIDEO'],
            description: 'Type of media.',
          },
        },
        required: ['mediaUrl', 'mediaType'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'instagram_post_carousel',
      description:
        'Publish a carousel post (2–10 images/videos) to Instagram feed.',
      parameters: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            description: 'Array of media items (2–10 items).',
            items: {
              type: 'object',
              properties: {
                mediaType: { type: 'string', enum: ['IMAGE', 'VIDEO'] },
                url: { type: 'string', description: 'Public URL of the image or video.' },
              },
              required: ['mediaType', 'url'],
            },
          },
          caption: {
            type: 'string',
            description: 'Caption for the carousel post.',
          },
        },
        required: ['items', 'caption'],
      },
    },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// React Flow Canvas Tools
// ─────────────────────────────────────────────────────────────────────────────

export const REACTFLOW_TOOL_SCHEMAS_OPENAI = [
  {
    type: 'function' as const,
    function: {
      name: 'canvas_create_node',
      description:
        'Add a step node to the visual workflow canvas. Use this to show the user what pipeline step is being added (research, generate, publish, etc.).',
      parameters: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['prompt', 'image-prompt', 'video-prompt', 'design-model', 'doc', 'action', 'instagram'],
            description: 'Node type matching the pipeline step.',
          },
          label: { type: 'string', description: 'Short human-readable step name.' },
          prompt: { type: 'string', description: 'Prompt or content associated with this step.' },
          description: { type: 'string', description: 'Notes for doc nodes.' },
          position: {
            type: 'object',
            properties: { x: { type: 'number' }, y: { type: 'number' } },
            description: 'Optional canvas position.',
          },
        },
        required: ['type', 'label'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'canvas_connect_nodes',
      description: 'Draw an arrow between two canvas nodes to show the data flow.',
      parameters: {
        type: 'object',
        properties: {
          sourceNodeId: { type: 'string' },
          targetNodeId: { type: 'string' },
          label: { type: 'string', description: 'Optional edge label.' },
        },
        required: ['sourceNodeId', 'targetNodeId'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'canvas_list_nodes',
      description: 'List all existing nodes on the canvas to discover their IDs.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'canvas_edit_node',
      description: 'Update an existing canvas node label, prompt, or type.',
      parameters: {
        type: 'object',
        properties: {
          nodeId: { type: 'string' },
          label: { type: 'string' },
          type: { type: 'string', enum: ['prompt', 'image-prompt', 'video-prompt', 'design-model', 'doc', 'action', 'instagram'] },
          prompt: { type: 'string' },
          description: { type: 'string' },
        },
        required: ['nodeId'],
      },
    },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Anthropic Formats (same tools, different schema key)
// ─────────────────────────────────────────────────────────────────────────────

function toAnthropic(tools: any[]) {
  return tools.map((t) => ({
    name: t.function.name,
    description: t.function.description,
    input_schema: t.function.parameters,
  }));
}

export const RUNWAY_TOOL_SCHEMAS_ANTHROPIC      = toAnthropic(RUNWAY_TOOL_SCHEMAS_OPENAI);
export const INSTAGRAM_PUBLISH_TOOLS_ANTHROPIC  = toAnthropic(INSTAGRAM_PUBLISH_TOOLS_OPENAI);
export const REACTFLOW_TOOL_SCHEMAS_ANTHROPIC   = toAnthropic(REACTFLOW_TOOL_SCHEMAS_OPENAI);

// ─────────────────────────────────────────────────────────────────────────────
// Master System Prompt
// ─────────────────────────────────────────────────────────────────────────────

export const INSTAGRAM_MANAGER_SYSTEM_PROMPT = `You are an AI Instagram Content Manager. Your job is to take a user's topic or idea and execute a full end-to-end content pipeline:

PIPELINE STEPS (always follow this order):
1. RESEARCH — Use Composio web_search or fetch_url tools to research the topic. Read blog posts, docs, articles about it.
2. PLAN — Briefly summarise what you found and propose a content format (image post, Reel, carousel, Story).
3. DESIGN PROMPT — Write a highly detailed RunwayML generation prompt based on your research. Consider: visual style, mood, colors, composition, Instagram best practices.
4. GENERATE — Call the appropriate runway_generate_* tool with the crafted prompt.
5. POLL — Call runway_poll_task repeatedly (every ~15 seconds) until status is SUCCEEDED. Share progress updates.
6. PUBLISH — Once media URL is ready, call the correct instagram_post_* tool with a great caption and hashtags.
7. CONFIRM — Report success with the Instagram media ID.

CANVAS (react flow) — Alongside each step, update the visual canvas:
- Before research: canvas_create_node type=doc label="Research: {topic}"
- After prompt design: canvas_create_node type=prompt label="Generation Prompt" prompt={your prompt}
- After generate call: canvas_create_node type=image-prompt OR video-prompt label="RunwayML Generate"
- After publish: canvas_create_node type=instagram label="Published to Instagram"
- Connect each step with canvas_connect_nodes in order.
- Always call canvas_list_nodes first so you know existing node IDs before connecting.

RUNWAY PROMPT GUIDELINES:
- For images: Be specific — lighting (golden hour, studio), subject, style (cinematic, editorial), background, color palette.
- For Reels: Describe camera motion (slow zoom, pan left), subject movement, atmosphere. Use vertical ratio 720:1280.
- For Stories: High contrast, bold, vertical (720:1280), quick visual impact.

INSTAGRAM CAPTION GUIDELINES:
- Hook in first line (no hashtags there).
- 2–3 sentences of value/story.
- CTA (call to action).
- 10–15 relevant hashtags at the end.

TOOLS AVAILABLE:
- Composio tools: GOOGLESEARCH, FETCH, and any other connected apps for research.
- runway_generate_image, runway_generate_video_from_text, runway_generate_video_from_image, runway_poll_task.
- instagram_post_image, instagram_post_reel, instagram_post_story, instagram_post_carousel.
- canvas_create_node, canvas_connect_nodes, canvas_list_nodes, canvas_edit_node.

IMPORTANT:
- Always research before generating — do not make up facts.
- Always poll until SUCCEEDED before publishing — never publish with a pending task URL.
- If Instagram credentials are missing, tell the user to connect their account in Settings.
- If RunwayML key is missing, tell the user to add it in Settings.
- Be transparent about what you are doing at each step.
- Format your status updates clearly with emoji: 🔍 Research → ✍️ Prompt → 🎬 Generating → ⏳ Polling → 📱 Publishing → ✅ Done`;
