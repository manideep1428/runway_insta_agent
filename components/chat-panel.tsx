"use client";

import {
  useState, useRef, useEffect, useCallback,
  type KeyboardEvent, type FormEvent,
} from "react";
import { nanoid } from "nanoid";
import Link from "next/link";
import {
  AlertCircle, ArrowDown, Bot, CornerDownLeft,
  GlobeIcon, Loader2, Sparkles, User, GitBranch,
} from "lucide-react";
import { cn } from "@/lib/utils";
import React from "react";
import type { FlowCanvasHandle } from "@/components/flow-canvas";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
  reactflowActions?: object[];
}

const models = [
  { id: "gpt-5.5",          name: "GPT-5.5",          provider: "openai" },
  { id: "gpt-5.4-mini",     name: "GPT-5.4 Mini",     provider: "openai" },
  { id: "claude-opus-4.7",  name: "Claude 4.7 Opus",  provider: "claude" },
  { id: "claude-sonnet-4.6",name: "Claude 4.6 Sonnet",provider: "claude" },
];

function SimpleMarkdown({ content }: { content: string }) {
  const parts = content.split(/(```[\s\S]*?```)/g);
  return (
    <div className="prose prose-invert prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
      {parts.map((part, i) => {
        if (part.startsWith("```")) {
          const lines = part.slice(3, -3).split("\n");
          const lang = lines[0]?.trim() || "";
          const code = lines.slice(lang ? 1 : 0).join("\n");
          return (
            <pre key={i} className="my-2 overflow-x-auto rounded-lg bg-black/60 border border-white/10 p-3 text-xs">
              {lang && <div className="mb-1 text-[9px] uppercase tracking-widest text-white/30">{lang}</div>}
              <code className="text-emerald-300/90">{code}</code>
            </pre>
          );
        }
        return (
          <div key={i} className="space-y-1.5">
            {part.split("\n").map((line, j) => {
              if (!line.trim()) return <div key={j} className="h-1" />;
              if (line.startsWith("### ")) return <h4 key={j} className="text-xs font-bold text-white mt-3 mb-0.5">{line.slice(4)}</h4>;
              if (line.startsWith("## ")) return <h3 key={j} className="text-sm font-bold text-white mt-3 mb-0.5">{line.slice(3)}</h3>;
              if (line.match(/^\s*[-*]\s/)) return (
                <div key={j} className="flex gap-1.5 pl-2">
                  <span className="text-purple-400 mt-0.5">•</span>
                  <span className="flex-1 text-xs">{line.replace(/^\s*[-*]\s/, "")}</span>
                </div>
              );
              return <p key={j} className="text-xs leading-relaxed">{line}</p>;
            })}
          </div>
        );
      })}
    </div>
  );
}

// Badge shown when AI performs a canvas action
function FlowActionBadge({ actions }: { actions: object[] }) {
  if (!actions.length) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-1">
      {actions.map((a: any, i) => (
        <span key={i}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-600/15 border border-purple-500/25 text-[10px] text-purple-300">
          <GitBranch className="w-2.5 h-2.5" />
          {a.action === "create_node" && `Created "${a.label}" node`}
          {a.action === "edit_node"   && `Edited node ${a.nodeId}`}
          {a.action === "connect_nodes" && `Connected nodes`}
          {a.action === "delete_node" && `Deleted node`}
          {a.action === "list_nodes"  && `Listed ${(a as any).nodes?.length ?? 0} nodes`}
        </span>
      ))}
    </div>
  );
}

const suggestions = [
  "Build me an image-to-video workflow",
  "Add a design model node",
  "Connect the prompt to the video generator",
  "Add a doc node explaining this workflow",
];

interface ChatPanelProps {
  projectId: string;
  projectName: string;
  canvasRef?: React.RefObject<FlowCanvasHandle | null>;
}

export function ChatPanel({ projectId, projectName, canvasRef }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<"ready" | "submitted" | "streaming">("ready");
  const [selectedModel, setSelectedModel] = useState(models[0].id);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // API key validation
  useEffect(() => {
    const composioKey = localStorage.getItem("COMPOSIO_API_KEY");
    const openaiKey   = localStorage.getItem("OPENAI_API_KEY");
    const claudeKey   = localStorage.getItem("ANTHROPIC_API_KEY");
    const model = models.find((m) => m.id === selectedModel);
    if (!composioKey) setApiKeyError("Composio API key missing — go to Settings.");
    else if (model?.provider === "openai" && !openaiKey) setApiKeyError("OpenAI API key missing — go to Settings.");
    else if (model?.provider === "claude" && !claudeKey) setApiKeyError("Claude API key missing — go to Settings.");
    else setApiKeyError(null);
  }, [selectedModel]);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handle = () => setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 80);
    el.addEventListener("scroll", handle);
    return () => el.removeEventListener("scroll", handle);
  }, []);

  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) { ta.style.height = "auto"; ta.style.height = Math.min(ta.scrollHeight, 160) + "px"; }
  }, [input]);

  // Apply reactflow actions to the canvas
  const applyFlowActions = useCallback((actions: any[]) => {
    const canvas = canvasRef?.current;
    if (!canvas) return;
    for (const a of actions) {
      if (!a.__reactflow__) continue;
      switch (a.action) {
        case "create_node":
          canvas.createNode(a.type, a.label, a.prompt, a.description, a.position);
          break;
        case "edit_node":
          canvas.editNode(a.nodeId, a.label, a.type, a.prompt, a.description);
          break;
        case "connect_nodes":
          canvas.connectNodes(a.sourceNodeId, a.targetNodeId, a.label);
          break;
        case "delete_node":
          canvas.deleteNode(a.nodeId);
          break;
        // list_nodes: no UI mutation needed
      }
    }
  }, [canvasRef]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || status !== "ready") return;
    const userMsg: ChatMessage  = { id: nanoid(), role: "user",      content: content.trim(), createdAt: Date.now() };
    const assistantMsg: ChatMessage = { id: nanoid(), role: "assistant", content: "",             createdAt: Date.now() };
    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput("");
    setStatus("submitted");

    try {
      const apiMessages = [
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        { role: "user" as const, content: content.trim() },
      ];
      const activeIgId = localStorage.getItem("ACTIVE_IG_ACCOUNT");
      let instagramCredentials = undefined;
      if (activeIgId) {
        const token = localStorage.getItem(`IG_TOKEN_${activeIgId}`);
        if (token) instagramCredentials = { accessToken: token, igUserId: activeIgId };
      }
      const provider = models.find((m) => m.id === selectedModel)?.provider || "openai";

      // Pass current canvas nodes so AI knows what exists
      const currentNodes = canvasRef?.current?.listNodes() ?? [];

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: apiMessages, model: selectedModel, provider,
          instagramCredentials, currentNodes,
          openaiKey:   localStorage.getItem("OPENAI_API_KEY"),
          composioKey: localStorage.getItem("COMPOSIO_API_KEY"),
          claudeKey:   localStorage.getItem("ANTHROPIC_API_KEY"),
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Apply canvas mutations immediately
      if (data.reactflowActions?.length) {
        applyFlowActions(data.reactflowActions);
      }

      if (data.message) {
        setStatus("streaming");
        const words = (data.message.content as string).split(" ");
        let current = "";
        for (let i = 0; i < words.length; i++) {
          current += (i > 0 ? " " : "") + words[i];
          const snap = current;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsg.id
                ? { ...m, content: snap, reactflowActions: data.reactflowActions ?? [] }
                : m
            )
          );
          await new Promise((r) => setTimeout(r, Math.random() * 20 + 6));
        }
      }
    } catch (err: any) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsg.id ? { ...m, content: "Error: " + (err.message || "Unknown error") } : m
        )
      );
    } finally {
      setStatus("ready");
    }
  }, [messages, status, selectedModel, canvasRef, applyFlowActions]);

  const handleSubmit = (e: FormEvent) => { e.preventDefault(); sendMessage(input); };
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 px-4 py-3 border-b border-white/[0.06] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gradient-to-br from-purple-600 to-blue-600 rounded-md flex items-center justify-center">
            <Bot className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold text-white/90">AI Agent</p>
            <p className="text-[9px] text-white/30 uppercase tracking-widest">Flow Builder</p>
          </div>
        </div>
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-md px-2 py-1 text-[10px] font-medium text-white/70 focus:outline-none focus:border-purple-500/40 cursor-pointer appearance-none"
        >
          {models.map((m) => (
            <option key={m.id} value={m.id} className="bg-neutral-900">{m.name}</option>
          ))}
        </select>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto scroll-smooth">
        <div className="px-4 py-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-600/15 to-blue-600/15 rounded-full flex items-center justify-center mb-4 border border-white/5">
                <Sparkles className="w-7 h-7 text-purple-400" />
              </div>
              <h3 className="text-sm font-bold mb-1">AI Flow Builder</h3>
              <p className="text-[11px] text-white/40 mb-5 max-w-[240px]">
                {projectName ? `"${projectName}" — ` : ""}Ask me to build your workflow
              </p>
              <div className="flex flex-col gap-1.5 w-full">
                {suggestions.map((s) => (
                  <button key={s} onClick={() => sendMessage(s)}
                    className="text-left px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.07] text-[11px] text-white/60 hover:bg-white/[0.07] hover:text-white hover:border-white/15 transition-all">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={cn("flex gap-2", msg.role === "user" ? "flex-row-reverse" : "")}>
                <div className={cn(
                  "w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5",
                  msg.role === "user"
                    ? "bg-white/10 border border-white/10"
                    : "bg-gradient-to-br from-purple-600 to-blue-600"
                )}>
                  {msg.role === "user" ? <User className="w-3 h-3 text-white/70" /> : <Bot className="w-3 h-3 text-white" />}
                </div>
                <div className={cn(
                  "min-w-0 max-w-[85%]",
                  msg.role === "user"
                    ? "rounded-2xl rounded-tr-sm bg-purple-600/80 px-3 py-2 text-xs text-white"
                    : "text-white/90 text-xs"
                )}>
                  {msg.role === "assistant" && msg.content === "" && status !== "ready" ? (
                    <div className="flex items-center gap-1.5 py-1">
                      {[0,150,300].map((d) => (
                        <span key={d} className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                      ))}
                    </div>
                  ) : msg.role === "assistant" ? (
                    <>
                      <SimpleMarkdown content={msg.content} />
                      {msg.reactflowActions?.length ? (
                        <FlowActionBadge actions={msg.reactflowActions} />
                      ) : null}
                    </>
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

      {/* Scroll btn */}
      {showScrollBtn && (
        <div className="absolute bottom-24 left-[190px] z-10">
          <button onClick={scrollToBottom}
            className="w-7 h-7 rounded-full bg-white/10 border border-white/10 flex items-center justify-center hover:bg-white/20 transition-colors shadow-xl">
            <ArrowDown className="w-3.5 h-3.5 text-white/80" />
          </button>
        </div>
      )}

      {/* Input */}
      <div className="shrink-0 px-3 py-3 border-t border-white/[0.06]">
        {apiKeyError && (
          <div className="mb-2 px-2 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] flex items-center gap-1.5">
            <AlertCircle className="w-3 h-3 shrink-0" />
            <span className="flex-1">{apiKeyError}</span>
            <Link href="/settings" className="font-bold underline">Fix</Link>
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className={cn(
            "rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden focus-within:border-purple-500/30 focus-within:ring-1 focus-within:ring-purple-500/10 transition-all",
            apiKeyError ? "opacity-40 pointer-events-none" : ""
          )}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask AI to build your workflow…"
              rows={1}
              className="w-full bg-transparent px-3 pt-3 pb-1 text-xs text-white placeholder:text-white/30 resize-none focus:outline-none max-h-40"
              disabled={status !== "ready" || !!apiKeyError}
            />
            <div className="flex items-center justify-between px-2 pb-2">
              <div className="flex gap-0.5">
                <button type="button" className="w-6 h-6 rounded flex items-center justify-center text-white/25 hover:text-white/50 hover:bg-white/5 transition-colors">
                  <GlobeIcon className="w-3.5 h-3.5" />
                </button>
                <button type="button" title="Flow tools active"
                  className="w-6 h-6 rounded flex items-center justify-center text-purple-400/60 hover:text-purple-400 hover:bg-purple-500/10 transition-colors">
                  <GitBranch className="w-3.5 h-3.5" />
                </button>
              </div>
              <button type="submit"
                disabled={!input.trim() || status !== "ready" || !!apiKeyError}
                className={cn(
                  "w-6 h-6 rounded-md flex items-center justify-center transition-all",
                  input.trim() && status === "ready" && !apiKeyError
                    ? "bg-purple-600 text-white hover:bg-purple-500 shadow-lg shadow-purple-500/30"
                    : "bg-white/5 text-white/20 cursor-not-allowed"
                )}>
                {status === "submitted"
                  ? <Loader2 className="w-3 h-3 animate-spin" />
                  : <CornerDownLeft className="w-3 h-3" />}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
