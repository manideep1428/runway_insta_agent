import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { Composio } from '@composio/core';
import { OpenAIProvider } from '@composio/openai';

// Use a function to initialize clients lazily to prevent build-time errors when env vars are missing
function getClients() {
    const composioApiKey = process.env.COMPOSIO_API_KEY;
    const openaiApiKey = process.env.OPENAI_API_KEY;

    if (!composioApiKey || !openaiApiKey) {
        console.warn("Missing API keys for Composio or OpenAI");
    }

    const composio = new Composio({
        provider: new OpenAIProvider(),
        apiKey: composioApiKey,
    });

    const openai = new OpenAI({
        apiKey: openaiApiKey,
    });

    return { composio, openai };
}

export async function POST(req: Request) {
    try {
        const { messages, userId = "default_user_123" } = await req.json();
        const { composio, openai } = getClients();

        // Create a session for the user
        const session = await composio.create(userId);
        const tools = await session.tools();

        // Start the Chat Completions loop
        let response = await openai.chat.completions.create({
            model: "gpt-4o", // using gpt-4o as a solid default
            tools: tools.length > 0 ? tools : undefined,
            messages: messages,
        });

        // Agentic loop — keep executing tool calls until the model responds with text
        while (response.choices[0].message.tool_calls && response.choices[0].message.tool_calls.length > 0) {
            const results = await composio.provider.handleToolCalls(userId, response);
            
            messages.push(response.choices[0].message);
            
            for (const [i, tc] of response.choices[0].message.tool_calls.entries()) {
                messages.push({
                    role: "tool",
                    tool_call_id: tc.id,
                    content: JSON.stringify(results[i]),
                });
            }
            
            response = await openai.chat.completions.create({
                model: "gpt-4o",
                tools: tools.length > 0 ? tools : undefined,
                messages: messages,
            });
        }

        return NextResponse.json({ 
            message: response.choices[0].message,
            updatedMessages: messages
        });

    } catch (error: any) {
        console.error("Chat API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
