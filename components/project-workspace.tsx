"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import {
  ArrowLeft, Check, PanelLeftClose, PanelLeftOpen, Workflow,
} from "lucide-react";
import { ChatPanel } from "@/components/chat-panel";
import { FlowCanvas, type FlowCanvasHandle } from "@/components/flow-canvas";
import { cn } from "@/lib/utils";

interface ProjectWorkspaceProps {
  projectId: string;
}

export function ProjectWorkspace({ projectId }: ProjectWorkspaceProps) {
  const project = useQuery(api.projects.getProject, { id: projectId as any });
  const [chatOpen, setChatOpen] = useState(true);
  const [saveIndicator, setSaveIndicator] = useState<"idle" | "saving" | "saved">("idle");
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Shared ref: ChatPanel reads from it, FlowCanvas writes to it
  const canvasRef = useRef<FlowCanvasHandle | null>(null);

  const triggerSaved = useCallback(() => {
    setSaveIndicator("saved");
    clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => setSaveIndicator("idle"), 2000);
  }, []);

  return (
    <div className="fixed inset-0 flex flex-col bg-[#080810] text-white overflow-hidden">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-5%] w-[45%] h-[45%] bg-purple-900/10 blur-[140px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[-5%] w-[45%] h-[45%] bg-blue-900/10 blur-[140px] rounded-full" />
      </div>

      {/* Top bar */}
      <header className="relative z-30 h-12 flex items-center gap-3 px-4 border-b border-white/[0.06] bg-black/50 backdrop-blur-xl shrink-0">
        <Link
          href="/projects"
          className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-white/60" />
        </Link>

        <div className="h-4 w-px bg-white/10" />

        <div className="w-6 h-6 bg-gradient-to-br from-purple-600 to-blue-600 rounded-md flex items-center justify-center shadow-lg shadow-purple-500/20">
          <Workflow className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="text-sm font-semibold tracking-tight truncate max-w-[200px]">
          {project ? project.name : "Loading…"}
        </span>
        <span className="text-[10px] text-white/30 uppercase tracking-widest font-medium">
          Workspace
        </span>

        <div className="ml-auto flex items-center gap-2">
          {saveIndicator === "saved" && (
            <span className="flex items-center gap-1 text-[11px] text-emerald-400 animate-in fade-in duration-200">
              <Check className="w-3 h-3" /> Saved
            </span>
          )}
          {saveIndicator === "saving" && (
            <span className="text-[11px] text-white/30 animate-pulse">Saving…</span>
          )}
          <button
            onClick={() => setChatOpen((v) => !v)}
            className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
            title={chatOpen ? "Hide chat" : "Show chat"}
          >
            {chatOpen
              ? <PanelLeftClose className="w-3.5 h-3.5 text-white/60" />
              : <PanelLeftOpen  className="w-3.5 h-3.5 text-white/60" />}
          </button>
        </div>
      </header>

      {/* Main split */}
      <div className="flex flex-1 overflow-hidden relative z-10">
        {/* Chat panel */}
        <div
          className={cn(
            "flex flex-col border-r border-white/[0.06] bg-black/30 backdrop-blur-sm transition-all duration-300 overflow-hidden shrink-0",
            chatOpen ? "w-[380px]" : "w-0 border-r-0"
          )}
        >
          {chatOpen && (
            <ChatPanel
              projectId={projectId}
              projectName={project?.name ?? ""}
              canvasRef={canvasRef}
            />
          )}
        </div>

        {/* React Flow canvas — ref forwarded so AI can mutate it */}
        <div className="flex-1 relative overflow-hidden">
          <FlowCanvas
            ref={canvasRef}
            projectId={projectId}
            onSave={triggerSaved}
          />
        </div>
      </div>
    </div>
  );
}
