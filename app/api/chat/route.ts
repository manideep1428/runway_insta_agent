import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { Composio } from '@composio/core';
import { OpenAIProvider } from '@composio/openai';
import { AnthropicProvider } from '@composio/anthropic';
import { handleInstagramToolCall } from '@/lib/instagram-tools';
import {
  RUNWAY_TOOL_SCHEMAS_OPENAI,
  RUNWAY_TOOL_SCHEMAS_ANTHROPIC,
  INSTAGRAM_PUBLISH_TOOLS_OPENAI,
  INSTAGRAM_PUBLISH_TOOLS_ANTHROPIC,
  REACTFLOW_TOOL_SCHEMAS_OPENAI,
  REACTFLOW_TOOL_SCHEMAS_ANTHROPIC,
  INSTAGRAM_MANAGER_SYSTEM_PROMPT
} from '@/lib/pipeline-tools';
import { nanoid } from 'nanoid';
import { getRunwayClient } from '@/lib/runway';
import { InstagramClient } from '@/lib/instagram';

// ── Tool Handlers ─────────────────────────────────────────────────────────────

async function handleRunwayTool(name: string, args: any) {
  const runway = getRunwayClient();
  if (!runway) return { error: 'RunwayML API key not configured on server.' };

  try {
    switch (name) {
      case 'runway_generate_image': {
        const task = await runway.textToImage.create({
          model: 'gen4_image',
          promptText: args.promptText,
          ratio: args.ratio || '1360:768',
        });
        return { taskId: task.id, status: 'PENDING', message: 'Image generation started.' };
      }
      case 'runway_generate_video_from_text': {
        const task = await runway.textToVideo.create({
          model: 'gen4.5',
          promptText: args.promptText,
          ratio: args.ratio || '1280:720',
        });
        return { taskId: task.id, status: 'PENDING', message: 'Video generation started.' };
      }
      case 'runway_poll_task': {
        const task = await runway.tasks.retrieve(args.taskId);
        let outputUrl = (task as any).output?.[0];
        return { taskId: task.id, status: task.status, outputUrl };
      }
      default:
        return { error: `Unknown runway tool: ${name}` };
    }
  } catch (err: any) {
    return { error: err.message };
  }
}

async function handleInstagramPublishTool(name: string, args: any, credentials?: { accessToken: string; igUserId: string }) {
  if (!credentials) return { error: 'Instagram credentials missing.' };
  const client = new InstagramClient({ accessToken: credentials.accessToken, instagramUserId: credentials.igUserId });

  try {
    switch (name) {
      case 'instagram_post_image': {
        const mediaId = await client.publishSingleMedia({
          mediaType: 'IMAGE',
          url: args.imageUrl,
          caption: args.caption,
        });
        return { success: true, mediaId, message: 'Image published to Instagram.' };
      }
      case 'instagram_post_reel': {
        const mediaId = await client.publishSingleMedia({
          mediaType: 'REELS',
          url: args.videoUrl,
          caption: args.caption,
        });
        return { success: true, mediaId, message: 'Reel published to Instagram.' };
      }
      default:
        return { error: `Unknown instagram tool: ${name}` };
    }
  } catch (err: any) {
    return { error: err.message };
  }
}

function handleCanvasTool(name: string, args: any, currentNodes: any[]): object {
  const action = name.replace('canvas_', '');
  return {
    __reactflow__: true,
    action,
    ...args,
    message: `Visual update: ${action} applied to canvas.`
  };
}

// ── OpenAI Handler ─────────────────────────────────────────────────────────────

async function handleOpenAI(
  messages: any[],
  model: string,
  openaiApiKey: string,
  composioApiKey: string,
  userId: string,
  currentNodes: any[],
  instagramCredentials?: { accessToken: string; igUserId: string }
) {
  const composio = new Composio({ provider: new OpenAIProvider(), apiKey: composioApiKey });
  const openai = new OpenAI({ apiKey: openaiApiKey });
  const session = await composio.create(userId);
  const composioTools = await session.tools();

  const allTools = [
    ...composioTools,
    ...RUNWAY_TOOL_SCHEMAS_OPENAI,
    ...INSTAGRAM_PUBLISH_TOOLS_OPENAI,
    ...REACTFLOW_TOOL_SCHEMAS_OPENAI,
  ];

  let response = await openai.chat.completions.create({
    model,
    tools: allTools.length > 0 ? allTools : undefined,
    messages: [{ role: 'system', content: INSTAGRAM_MANAGER_SYSTEM_PROMPT }, ...messages],
  });

  const toolsUsed: string[] = [];
  const reactflowActions: object[] = [];
  let loopCount = 0;

  while (response.choices[0].message.tool_calls?.length && loopCount < 10) {
    loopCount++;
    const toolCalls = response.choices[0].message.tool_calls;
    messages.push(response.choices[0].message);

    const results = [];
    for (const _tc of toolCalls) {
      const tc = _tc as any;
      toolsUsed.push(tc.function.name);
      const args = JSON.parse(tc.function.arguments);

      if (tc.function.name.startsWith('runway_')) {
        results.push(await handleRunwayTool(tc.function.name, args));
      } else if (tc.function.name.startsWith('instagram_')) {
        results.push(await handleInstagramPublishTool(tc.function.name, args, instagramCredentials));
      } else if (tc.function.name.startsWith('canvas_')) {
        const res = handleCanvasTool(tc.function.name, args, currentNodes);
        reactflowActions.push(res);
        results.push(res);
      } else {
        const composioResult = await composio.provider.handleToolCalls(userId, {
          choices: [{ message: { tool_calls: [tc] } }],
        } as any);
        results.push(composioResult[0]);
      }
    }

    for (const [i, _tc2] of toolCalls.entries()) {
      const tc2 = _tc2 as any;
      messages.push({ role: 'tool', tool_call_id: tc2.id, content: JSON.stringify(results[i]) });
    }

    response = await openai.chat.completions.create({
      model,
      tools: allTools.length > 0 ? allTools : undefined,
      messages: [{ role: 'system', content: INSTAGRAM_MANAGER_SYSTEM_PROMPT }, ...messages],
    });
  }

  return { message: response.choices[0].message, toolsUsed, reactflowActions };
}

// ── Claude Handler ─────────────────────────────────────────────────────────────

async function handleClaude(
  messages: any[],
  model: string,
  claudeApiKey: string,
  composioApiKey: string,
  userId: string,
  currentNodes: any[],
  instagramCredentials?: { accessToken: string; igUserId: string }
) {
  const composio = new Composio({ provider: new AnthropicProvider(), apiKey: composioApiKey });
  const client = new Anthropic({ apiKey: claudeApiKey });
  const session = await composio.create(userId);
  const composioTools = await session.tools();

  const allTools = [
    ...composioTools,
    ...RUNWAY_TOOL_SCHEMAS_ANTHROPIC,
    ...INSTAGRAM_PUBLISH_TOOLS_ANTHROPIC,
    ...REACTFLOW_TOOL_SCHEMAS_ANTHROPIC,
  ];

  const anthropicMessages: Anthropic.MessageParam[] = messages
    .filter((m: any) => m.role === 'user' || m.role === 'assistant' || m.role === 'tool')
    .map((m: any) => {
      if (m.role === 'assistant' && m.tool_calls) {
        return {
          role: 'assistant',
          content: [
            { type: 'text', text: m.content || 'Executing content pipeline...' },
            ...m.tool_calls.map((tc: any) => ({
              type: 'tool_use', id: tc.id || `tc_${nanoid()}`,
              name: tc.function.name, input: JSON.parse(tc.function.arguments),
            })),
          ],
        };
      }
      if (m.role === 'tool') {
        return {
          role: 'user',
          content: [{ type: 'tool_result', tool_use_id: m.tool_call_id, content: m.content }],
        };
      }
      return { role: m.role as 'user' | 'assistant', content: m.content };
    });

  let currentResponse = await client.messages.create({
    model, max_tokens: 4096, system: INSTAGRAM_MANAGER_SYSTEM_PROMPT,
    tools: allTools.length > 0 ? allTools as any : undefined,
    messages: anthropicMessages.filter((m) => m.role === 'user' || m.role === 'assistant') as any,
  });

  const toolsUsed: string[] = [];
  const reactflowActions: object[] = [];
  const fullMessages = [...anthropicMessages];
  let loopCount = 0;

  while (currentResponse.stop_reason === 'tool_use' && loopCount < 10) {
    loopCount++;
    const toolUseBlocks = currentResponse.content.filter((b: any) => b.type === 'tool_use');
    fullMessages.push({ role: 'assistant', content: currentResponse.content });

    const toolResults = [];
    for (const block of toolUseBlocks) {
      const toolUse = block as any;
      toolsUsed.push(toolUse.name);
      const args = toolUse.input;

      let result;
      if (toolUse.name.startsWith('runway_')) {
        result = await handleRunwayTool(toolUse.name, args);
      } else if (toolUse.name.startsWith('instagram_')) {
        result = await handleInstagramPublishTool(toolUse.name, args, instagramCredentials);
      } else if (toolUse.name.startsWith('canvas_')) {
        result = handleCanvasTool(toolUse.name, args, currentNodes);
        reactflowActions.push(result);
      } else {
        const composioResults = await composio.provider.handleToolCalls(userId, currentResponse);
        const idx = toolUseBlocks.indexOf(block);
        result = composioResults[idx];
      }
      toolResults.push({ type: 'tool_result', tool_use_id: toolUse.id, content: JSON.stringify(result) });
    }

    fullMessages.push({ role: 'user', content: toolResults as any });
    currentResponse = await client.messages.create({
      model, max_tokens: 4096, system: INSTAGRAM_MANAGER_SYSTEM_PROMPT,
      tools: allTools.length > 0 ? allTools as any : undefined,
      messages: fullMessages.filter((m) => m.role === 'user' || m.role === 'assistant') as any,
    });
  }

  const textContent = currentResponse.content
    .filter((b: any) => b.type === 'text')
    .map((b: any) => b.text)
    .join('\n');

  return { message: { role: 'assistant', content: textContent }, toolsUsed, reactflowActions };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      messages, userId = 'default_user_123', model, provider = 'openai',
      openaiKey, claudeKey, composioKey, instagramCredentials,
      currentNodes = [],
    } = body;

    const resolvedComposioKey = composioKey || process.env.COMPOSIO_API_KEY;
    if (!resolvedComposioKey) {
      return NextResponse.json({ error: 'Composio API key is required.' }, { status: 400 });
    }

    if (provider === 'claude') {
      const resolvedClaudeKey = claudeKey || process.env.ANTHROPIC_API_KEY;
      if (!resolvedClaudeKey) return NextResponse.json({ error: 'Claude API key is required.' }, { status: 400 });
      const result = await handleClaude(messages, model || 'claude-opus-4.7', resolvedClaudeKey, resolvedComposioKey, userId, currentNodes, instagramCredentials);
      return NextResponse.json(result);
    } else {
      const resolvedOpenAIKey = openaiKey || process.env.OPENAI_API_KEY;
      if (!resolvedOpenAIKey) return NextResponse.json({ error: 'OpenAI API key is required.' }, { status: 400 });
      const result = await handleOpenAI(messages, model || 'gpt-5.5', resolvedOpenAIKey, resolvedComposioKey, userId, currentNodes, instagramCredentials);
      return NextResponse.json(result);
    }
  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: error.message || 'An unexpected error occurred' }, { status: 500 });
  }
}
