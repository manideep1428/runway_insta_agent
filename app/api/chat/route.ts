import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { Composio } from '@composio/core';
import { OpenAIProvider } from '@composio/openai';

// Initialize Composio with OpenAI Provider
const composio = new Composio({
    provider: new OpenAIProvider(),
    apiKey: process.env.COMPOSIO_API_KEY,
});

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
    try {
        const { messages, userId = "default_user_123" } = await req.json();

        // Create a session for the user
        const session = await composio.create(userId);
        const tools = await session.tools();

        // Start the Chat Completions loop
        let response = await client.chat.completions.create({
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
            
            response = await client.chat.completions.create({
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
