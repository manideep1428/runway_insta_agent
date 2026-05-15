"use client";

import { useState, useRef, useEffect, useCallback, type KeyboardEvent, type FormEvent } from "react";
import { nanoid } from "nanoid";
import Link from "next/link";
import {
  AlertCircle,
  ArrowDown,
  ArrowLeft,
  Bot,
  CheckIcon,
  CornerDownLeft,
  GlobeIcon,
  Loader2,
  MicIcon,
  Send,
  Sparkles,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import React from "react";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
}

// ──────────────────────────────────────────────
// Simple Markdown Renderer (no external dep)
// ──────────────────────────────────────────────

function SimpleMarkdown({ content }: { content: string }) {
  // Splits the content into code blocks and regular text, then renders
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="prose prose-invert prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
      {parts.map((part, i) => {
        if (part.startsWith("```")) {
          const lines = part.slice(3, -3).split("\n");
          const lang = lines[0]?.trim() || "";
          const code = lines.slice(lang ? 1 : 0).join("\n");
          return (
            <pre
              key={i}
              className="my-3 overflow-x-auto rounded-xl bg-black/60 border border-white/10 p-4 text-xs leading-relaxed"
            >
              {lang && (
                <div className="mb-2 text-[10px] uppercase tracking-widest text-white/30 font-bold">
                  {lang}
                </div>
              )}
              <code className="text-emerald-300/90">{code}</code>
            </pre>
          );
        }

        // Render inline markdown
        return (
          <div key={i} className="space-y-2">
            {part.split("\n").map((line, j) => {
              if (!line.trim()) return <div key={j} className="h-2" />;

              // Headers
              if (line.startsWith("### "))
                return (
                  <h4 key={j} className="text-sm font-bold text-white mt-4 mb-1">
                    {renderInline(line.slice(4))}
                  </h4>
                );
              if (line.startsWith("## "))
                return (
                  <h3 key={j} className="text-base font-bold text-white mt-4 mb-1">
                    {renderInline(line.slice(3))}
                  </h3>
                );
              if (line.startsWith("# "))
                return (
                  <h2 key={j} className="text-lg font-bold text-white mt-4 mb-2">
                    {renderInline(line.slice(2))}
                  </h2>
                );

              // List items
              if (line.match(/^\s*[-*]\s/))
                return (
                  <div key={j} className="flex gap-2 pl-2">
                    <span className="text-purple-400 mt-0.5">•</span>
                    <span className="flex-1">{renderInline(line.replace(/^\s*[-*]\s/, ""))}</span>
                  </div>
                );

              // Numbered lists
              if (line.match(/^\s*\d+\.\s/))
                return (
                  <div key={j} className="flex gap-2 pl-2">
                    <span className="text-purple-400 font-bold min-w-[1.2em]">
                      {line.match(/^\s*(\d+)/)?.[1]}.
                    </span>
                    <span className="flex-1">
                      {renderInline(line.replace(/^\s*\d+\.\s/, ""))}
                    </span>
                  </div>
                );

              return (
                <p key={j} className="leading-relaxed">
                  {renderInline(line)}
                </p>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function renderInline(text: string) {
  // Handle bold, italic, inline code, links
  const parts: (string | React.JSX.Element)[] = [];
  let remaining = text;
  let keyIdx = 0;

  while (remaining.length > 0) {
    // Inline code
    const codeMatch = remaining.match(/`([^`]+)`/);
    // Bold
    const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);
    // Italic
    const italicMatch = remaining.match(/\*([^*]+)\*/);

    const matches = [
      codeMatch ? { type: "code", match: codeMatch } : null,
      boldMatch ? { type: "bold", match: boldMatch } : null,
      italicMatch ? { type: "italic", match: italicMatch } : null,
    ]
      .filter(Boolean)
      .sort((a, b) => (a!.match.index ?? 0) - (b!.match.index ?? 0));

    if (matches.length === 0) {
      parts.push(remaining);
      break;
    }

    const first = matches[0]!;
    const idx = first.match.index ?? 0;

    if (idx > 0) {
      parts.push(remaining.slice(0, idx));
    }

    if (first.type === "code") {
      parts.push(
        <code
          key={keyIdx++}
          className="rounded bg-white/10 px-1.5 py-0.5 text-xs font-mono text-purple-300"
        >
          {first.match[1]}
        </code>
      );
    } else if (first.type === "bold") {
      parts.push(
        <strong key={keyIdx++} className="font-bold text-white">
          {first.match[1]}
        </strong>
      );
    } else if (first.type === "italic") {
      parts.push(
        <em key={keyIdx++} className="italic text-white/80">
          {first.match[1]}
        </em>
      );
    }

    remaining = remaining.slice(idx + first.match[0].length);
  }

  return <>{parts}</>;
}

// ──────────────────────────────────────────────
// Suggestions
// ──────────────────────────────────────────────

const suggestions = [
  "Send an email to john@example.com",
  "What integrations are available?",
  "Create a GitHub issue for a bug report",
  "Schedule a meeting for tomorrow",
  "List my recent Slack messages",
  "How do I connect my Google account?",
];

// ──────────────────────────────────────────────
// Models
// ──────────────────────────────────────────────

const models = [
  { id: "gpt-5.5", name: "GPT-5.5 (Flagship)", provider: "openai" },
  { id: "gpt-5.4", name: "GPT-5.4 Pro", provider: "openai" },
  { id: "gpt-5.4-mini", name: "GPT-5.4 Mini", provider: "openai" },
  { id: "claude-opus-4.7", name: "Claude 4.7 Opus", provider: "claude" },
  { id: "claude-sonnet-4.6", name: "Claude 4.6 Sonnet", provider: "claude" },
  { id: "claude-haiku-4.5", name: "Claude 4.5 Haiku", provider: "claude" },
];

import { useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

// ──────────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────────

export function ComposioChatbot() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("project");
  const project = useQuery(api.projects.getProject, projectId ? { id: projectId as any } : "skip");

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<"ready" | "submitted" | "streaming">("ready");
  const [selectedModel, setSelectedModel] = useState(models[0].id);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Check for API keys
  useEffect(() => {
    const openaiKey = localStorage.getItem("OPENAI_API_KEY");
    const composioKey = localStorage.getItem("COMPOSIO_API_KEY");
    const claudeKey = localStorage.getItem("ANTHROPIC_API_KEY");

    const currentModel = models.find(m => m.id === selectedModel);
    
    if (!composioKey) {
      setApiKeyError("Composio API key is missing. Please add it in Settings.");
    } else if (currentModel?.provider === 'openai' && !openaiKey) {
      setApiKeyError("OpenAI API key is missing. Please add it in Settings.");
    } else if (currentModel?.provider === 'claude' && !claudeKey) {
      setApiKeyError("Claude API key is missing. Please add it in Settings.");
    } else {
      setApiKeyError(null);
    }
  }, [selectedModel]);

  // Auto-scroll to bottom on new messages
  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Track scroll position for "scroll to bottom" button
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 100);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 192) + "px";
    }
  }, [input]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || status !== "ready") return;

      const userMessage: ChatMessage = {
        id: nanoid(),
        role: "user",
        content: content.trim(),
        createdAt: Date.now(),
      };

      const assistantMessage: ChatMessage = {
        id: nanoid(),
        role: "assistant",
        content: "",
        createdAt: Date.now(),
      };

      setMessages((prev) => [...prev, userMessage, assistantMessage]);
      setInput("");
      setStatus("submitted");

      try {
        // Build messages array for the API
        const apiMessages = [
          ...messages.map((m) => ({ role: m.role, content: m.content })),
          { role: "user" as const, content: content.trim() },
        ];

        // Fetch Instagram credentials if available
        const activeIgId = localStorage.getItem("ACTIVE_IG_ACCOUNT");
        let instagramCredentials = undefined;
        if (activeIgId) {
          const token = localStorage.getItem(`IG_TOKEN_${activeIgId}`);
          if (token) {
            instagramCredentials = {
              accessToken: token,
              igUserId: activeIgId
            };
          }
        }

        const provider = models.find(m => m.id === selectedModel)?.provider || "openai";

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: apiMessages,
            model: selectedModel,
            provider,
            instagramCredentials,
            openaiKey: localStorage.getItem("OPENAI_API_KEY"),
            composioKey: localStorage.getItem("COMPOSIO_API_KEY"),
            claudeKey: localStorage.getItem("ANTHROPIC_API_KEY"),
          }),
        });

        const data = await response.json();

        if (data.error) throw new Error(data.error);

        if (data.message) {
          setStatus("streaming");
          // Simulate streaming by revealing the text word-by-word
          const words = data.message.content.split(" ");
          let current = "";

          for (let i = 0; i < words.length; i++) {
            current += (i > 0 ? " " : "") + words[i];
            const snapshot = current;
            setMessages((prev) =>
              prev.map((m) => (m.id === assistantMessage.id ? { ...m, content: snapshot } : m))
            );
            await new Promise((resolve) => setTimeout(resolve, Math.random() * 30 + 10));
          }
        }
      } catch (error: any) {
        console.error("Chat error:", error);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessage.id
              ? {
                ...m,
                content:
                  "Sorry, I encountered an error. Please check that your API keys (COMPOSIO_API_KEY and OPENAI_API_KEY) are configured in `.env.local`.",
              }
              : m
          )
        );
      } finally {
        setStatus("ready");
      }
    },
    [messages, status, selectedModel]
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-[#050505] text-white overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-900/15 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-900/15 blur-[150px] rounded-full" />
      </div>

      {/* Header */}
      <header className="relative z-20 border-b border-white/5 bg-black/60 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/projects"
              className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-white/60" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/20">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold tracking-tight">
                  {project ? project.name : "Composio Agent"}
                </h1>
                <p className="text-[10px] text-white/40 uppercase tracking-widest font-medium">
                  {project ? "Project Workspace" : "Powered by OpenAI + Composio"}
                </p>
              </div>
            </div>
          </div>

          {/* Model Selector */}
          <div className="flex items-center gap-2">
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs font-medium text-white/80 focus:outline-none focus:border-purple-500/50 cursor-pointer hover:bg-white/10 transition-colors appearance-none"
            >
              {models.map((m) => (
                <option key={m.id} value={m.id} className="bg-neutral-900">
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <div
        ref={scrollContainerRef}
        className="relative z-10 flex-1 overflow-y-auto scroll-smooth"
      >
        <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
          {messages.length === 0 ? (
            // Empty State
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-full flex items-center justify-center mb-6 border border-white/5">
                <Sparkles className="w-10 h-10 text-purple-400" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight mb-2">
                What can I help you with?
              </h2>
              <p className="text-white/40 text-sm max-w-md mb-10">
                I can use Composio tools to interact with your connected apps — send emails, create
                issues, manage calendars, and more.
              </p>

              {/* Suggestions */}
              <div className="flex flex-wrap justify-center gap-2 max-w-2xl">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSuggestionClick(s)}
                    className="px-4 py-2 rounded-full bg-white/[0.03] border border-white/10 text-sm text-white/70 hover:bg-white/[0.08] hover:text-white hover:border-white/20 transition-all font-medium"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            // Message List
            messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex gap-3 max-w-[95%] animate-in fade-in slide-in-from-bottom-2 duration-300",
                  msg.role === "user" ? "ml-auto flex-row-reverse" : ""
                )}
              >
                {/* Avatar */}
                <div
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                    msg.role === "user"
                      ? "bg-white/10 border border-white/10"
                      : "bg-gradient-to-br from-purple-600 to-blue-600 shadow-lg shadow-purple-500/20"
                  )}
                >
                  {msg.role === "user" ? (
                    <User className="w-4 h-4 text-white/70" />
                  ) : (
                    <Bot className="w-4 h-4 text-white" />
                  )}
                </div>

                {/* Bubble */}
                <div
                  className={cn(
                    "min-w-0 max-w-full",
                    msg.role === "user"
                      ? "rounded-2xl rounded-tr-sm bg-purple-600/90 px-4 py-3 text-sm text-white"
                      : "text-white/90 text-sm"
                  )}
                >
                  {msg.role === "assistant" && msg.content === "" && status !== "ready" ? (
                    <div className="flex items-center gap-2 py-2">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce [animation-delay:0ms]" />
                        <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce [animation-delay:150ms]" />
                        <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce [animation-delay:300ms]" />
                      </div>
                      <span className="text-xs text-white/40">Agent is thinking...</span>
                    </div>
                  ) : msg.role === "assistant" ? (
                    <SimpleMarkdown content={msg.content} />
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Scroll-to-bottom button */}
      {showScrollBtn && (
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-30">
          <button
            onClick={scrollToBottom}
            className="w-10 h-10 rounded-full bg-white/10 border border-white/10 backdrop-blur-xl flex items-center justify-center hover:bg-white/20 transition-colors shadow-2xl"
          >
            <ArrowDown className="w-4 h-4 text-white/80" />
          </button>
        </div>
      )}

      {/* Input Area */}
      <div className="relative z-20 shrink-0 border-t border-white/5 bg-black/60 backdrop-blur-xl">
        {/* Inline Suggestions (show when messages exist) */}
        {messages.length > 0 && status === "ready" && (
          <div className="max-w-3xl mx-auto px-6 pt-3 flex gap-2 overflow-x-auto scrollbar-none">
            {suggestions.slice(0, 3).map((s) => (
              <button
                key={s}
                onClick={() => handleSuggestionClick(s)}
                className="shrink-0 px-3 py-1 rounded-full bg-white/[0.03] border border-white/8 text-xs text-white/50 hover:bg-white/[0.06] hover:text-white/80 transition-all"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="max-w-3xl mx-auto px-6 py-4">
          {apiKeyError && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-4 h-4" />
              <span>{apiKeyError}</span>
              <Link href="/settings" className="ml-auto font-bold underline hover:text-red-300">
                Go to Settings
              </Link>
            </div>
          )}
          <form onSubmit={handleSubmit} className="relative">
            <div className={cn(
              "rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl overflow-hidden focus-within:border-purple-500/30 focus-within:ring-1 focus-within:ring-purple-500/10 transition-all shadow-2xl shadow-black/40",
              apiKeyError ? "opacity-50 grayscale pointer-events-none" : ""
            )}>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={apiKeyError ? "API Key required..." : "Ask me anything..."}
                rows={1}
                className="w-full bg-transparent px-5 pt-4 pb-2 text-sm text-white placeholder:text-white/30 resize-none focus:outline-none max-h-48"
                disabled={status !== "ready" || !!apiKeyError}
              />

              <div className="flex items-center justify-between px-3 pb-3">
                <div className="flex items-center gap-1">
                  {/* Optional action buttons */}
                  <button
                    type="button"
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors"
                    title="Web Search (coming soon)"
                  >
                    <GlobeIcon className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors"
                    title="Voice Input (coming soon)"
                  >
                    <MicIcon className="w-4 h-4" />
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={!input.trim() || status !== "ready" || !!apiKeyError}
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                    input.trim() && status === "ready" && !apiKeyError
                      ? "bg-purple-600 text-white hover:bg-purple-500 shadow-lg shadow-purple-500/30"
                      : "bg-white/5 text-white/20 cursor-not-allowed"
                  )}
                >
                  {status === "submitted" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CornerDownLeft className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <p className="text-center text-[10px] text-white/20 mt-2.5">
              Powered by Composio + OpenAI · Connected to your tools
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
