"use client";

import { useCallback, useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import {
  ReactFlow, Background, Controls, MiniMap, addEdge,
  useNodesState, useEdgesState, BackgroundVariant,
  type Node, type Edge, type OnConnect, type NodeTypes,
  Panel, Handle, Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { nanoid } from "nanoid";
import {
  Plus, Trash2, MessageSquare, Image, Video, Layers,
  FileText, Zap, Share2, X, ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Node colour + icon map ─────────────────────────────────────────

const NODE_META: Record<string, { icon: React.ElementType; color: string; bg: string; badge: string }> = {
  prompt:       { icon: MessageSquare, color: "text-purple-400",  bg: "bg-purple-600/20 border-purple-500/40",  badge: "bg-purple-600" },
  "image-prompt":{ icon: Image,        color: "text-emerald-400", bg: "bg-emerald-600/20 border-emerald-500/40", badge: "bg-emerald-600" },
  "video-prompt":{ icon: Video,        color: "text-rose-400",    bg: "bg-rose-600/20 border-rose-500/40",       badge: "bg-rose-600" },
  "design-model":{ icon: Layers,       color: "text-amber-400",   bg: "bg-amber-600/20 border-amber-500/40",     badge: "bg-amber-600" },
  doc:           { icon: FileText,      color: "text-sky-400",     bg: "bg-sky-600/20 border-sky-500/40",         badge: "bg-sky-600" },
  action:        { icon: Zap,           color: "text-yellow-400",  bg: "bg-yellow-600/20 border-yellow-500/40",   badge: "bg-yellow-600" },
  instagram:     { icon: Share2,        color: "text-pink-400",    bg: "bg-pink-600/20 border-pink-500/40",       badge: "bg-pink-600" },
};

function getMeta(type: string) {
  return NODE_META[type] ?? NODE_META["action"];
}

// ── Shared editable node shell ──────────────────────────────────────

function NodeShell({
  id, data, selected, children,
}: {
  id: string; data: any; selected?: boolean; children?: React.ReactNode;
}) {
  const meta = getMeta(data.type);
  const Icon = meta.icon;
  return (
    <div
      className={cn(
        "min-w-[210px] max-w-[260px] rounded-2xl border bg-[#0d0d1a]/95 shadow-2xl transition-all backdrop-blur-sm",
        selected
          ? "border-purple-500/60 shadow-purple-500/20 ring-1 ring-purple-500/20"
          : "border-white/10 hover:border-white/20",
      )}
    >
      {/* Header */}
      <div className={cn("flex items-center gap-2 px-3 py-2 border-b border-white/[0.07] rounded-t-2xl", meta.bg)}>
        <div className={cn("w-5 h-5 rounded-md flex items-center justify-center", meta.badge)}>
          <Icon className="w-3 h-3 text-white" />
        </div>
        <span className={cn("text-[10px] font-bold uppercase tracking-widest flex-1 truncate", meta.color)}>
          {data.label}
        </span>
        <span className="text-[9px] text-white/30 uppercase tracking-widest">{data.type}</span>
      </div>

      {/* Body */}
      <div className="px-3 py-2.5 space-y-2">{children}</div>

      {/* Handles */}
      <Handle type="target" position={Position.Left}
        className="!w-2.5 !h-2.5 !bg-purple-500 !border-2 !border-[#0d0d1a]" />
      <Handle type="source" position={Position.Right}
        className="!w-2.5 !h-2.5 !bg-purple-500 !border-2 !border-[#0d0d1a]" />
    </div>
  );
}

// ── Prompt input ────────────────────────────────────────────────────

function PromptInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder ?? "Enter prompt…"}
      rows={2}
      className="nodrag w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-[11px] text-white/80 placeholder:text-white/25 resize-none focus:outline-none focus:border-purple-500/40 transition-colors"
    />
  );
}

// ── Media slot (image / video) ──────────────────────────────────────

function MediaSlot({ label, accept, value, onChange }: {
  label: string; accept: string; value?: string; onChange: (url: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[9px] text-white/30 uppercase tracking-widest">{label}</span>
      {value ? (
        <div className="relative rounded-lg overflow-hidden border border-white/10 bg-black/40 h-16">
          {accept.startsWith("video") ? (
            <video src={value} className="w-full h-full object-cover" muted />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="w-full h-full object-cover" />
          )}
          <button
            onClick={() => onChange("")}
            className="absolute top-1 right-1 w-4 h-4 rounded-full bg-black/70 flex items-center justify-center hover:bg-red-500/80 transition-colors"
          >
            <X className="w-2.5 h-2.5 text-white" />
          </button>
        </div>
      ) : (
        <label className="nodrag flex items-center justify-center gap-1.5 h-10 rounded-lg border border-dashed border-white/15 bg-white/[0.02] text-[10px] text-white/30 cursor-pointer hover:border-white/30 hover:text-white/50 transition-all">
          <Plus className="w-3 h-3" />
          {label}
          <input
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onChange(URL.createObjectURL(file));
            }}
          />
        </label>
      )}
    </div>
  );
}

// ── Specific node types ─────────────────────────────────────────────

function PromptNode({ id, data, selected }: any) {
  const [prompt, setPrompt] = useState(data.prompt ?? "");
  return (
    <NodeShell id={id} data={data} selected={selected}>
      <PromptInput value={prompt} onChange={(v) => { setPrompt(v); data.prompt = v; }} placeholder="Describe your output…" />
    </NodeShell>
  );
}

function ImagePromptNode({ id, data, selected }: any) {
  const [prompt, setPrompt] = useState(data.prompt ?? "");
  const [imageUrl, setImageUrl] = useState(data.imageUrl ?? "");
  return (
    <NodeShell id={id} data={data} selected={selected}>
      <PromptInput value={prompt} onChange={(v) => { setPrompt(v); data.prompt = v; }} placeholder="Image generation prompt…" />
      <MediaSlot label="Reference Image" accept="image/*" value={imageUrl}
        onChange={(v) => { setImageUrl(v); data.imageUrl = v; }} />
    </NodeShell>
  );
}

function VideoPromptNode({ id, data, selected }: any) {
  const [prompt, setPrompt] = useState(data.prompt ?? "");
  const [imageUrl, setImageUrl] = useState(data.imageUrl ?? "");
  const [videoUrl, setVideoUrl] = useState(data.videoUrl ?? "");
  return (
    <NodeShell id={id} data={data} selected={selected}>
      <PromptInput value={prompt} onChange={(v) => { setPrompt(v); data.prompt = v; }} placeholder="Video generation prompt…" />
      <MediaSlot label="Image Input" accept="image/*" value={imageUrl}
        onChange={(v) => { setImageUrl(v); data.imageUrl = v; }} />
      <MediaSlot label="Video Input" accept="video/*" value={videoUrl}
        onChange={(v) => { setVideoUrl(v); data.videoUrl = v; }} />
    </NodeShell>
  );
}

function DesignModelNode({ id, data, selected }: any) {
  const [prompt, setPrompt] = useState(data.prompt ?? "");
  const [imageUrl, setImageUrl] = useState(data.imageUrl ?? "");
  const [videoUrl, setVideoUrl] = useState(data.videoUrl ?? "");
  const [model, setModel] = useState(data.model ?? "runway-gen4");
  const models = ["runway-gen4", "runway-gen3", "stable-diffusion-xl", "flux-dev", "dalle-3"];
  return (
    <NodeShell id={id} data={data} selected={selected}>
      <div className="flex flex-col gap-1">
        <span className="text-[9px] text-white/30 uppercase tracking-widest">Model</span>
        <div className="relative">
          <select
            value={model}
            onChange={(e) => { setModel(e.target.value); data.model = e.target.value; }}
            className="nodrag w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-[11px] text-white/80 appearance-none focus:outline-none focus:border-amber-500/40 transition-colors pr-6"
          >
            {models.map((m) => <option key={m} value={m} className="bg-neutral-900">{m}</option>)}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-white/30 pointer-events-none" />
        </div>
      </div>
      <PromptInput value={prompt} onChange={(v) => { setPrompt(v); data.prompt = v; }} placeholder="Design prompt…" />
      <MediaSlot label="Image" accept="image/*" value={imageUrl}
        onChange={(v) => { setImageUrl(v); data.imageUrl = v; }} />
      <MediaSlot label="Video" accept="video/*" value={videoUrl}
        onChange={(v) => { setVideoUrl(v); data.videoUrl = v; }} />
    </NodeShell>
  );
}

function DocNode({ id, data, selected }: any) {
  const [text, setText] = useState(data.description ?? data.prompt ?? "");
  return (
    <NodeShell id={id} data={data} selected={selected}>
      <textarea
        value={text}
        onChange={(e) => { setText(e.target.value); data.description = e.target.value; }}
        placeholder="Documentation / notes…"
        rows={3}
        className="nodrag w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-[11px] text-white/70 placeholder:text-white/25 resize-none focus:outline-none focus:border-sky-500/40 transition-colors"
      />
    </NodeShell>
  );
}

function ActionNode({ id, data, selected }: any) {
  const [prompt, setPrompt] = useState(data.prompt ?? "");
  return (
    <NodeShell id={id} data={data} selected={selected}>
      <PromptInput value={prompt} onChange={(v) => { setPrompt(v); data.prompt = v; }} placeholder="Action / tool call…" />
    </NodeShell>
  );
}

function InstagramNode({ id, data, selected }: any) {
  const [caption, setCaption] = useState(data.prompt ?? "");
  return (
    <NodeShell id={id} data={data} selected={selected}>
      <PromptInput value={caption} onChange={(v) => { setCaption(v); data.prompt = v; }} placeholder="Instagram caption…" />
      <div className="flex gap-2">
        {["image","video","reel","carousel"].map((t) => (
          <button key={t}
            onClick={() => { data.mediaType = t; }}
            className="flex-1 text-[9px] uppercase tracking-widest py-1 rounded-md bg-white/[0.04] border border-white/[0.08] text-white/40 hover:text-pink-400 hover:border-pink-500/30 transition-colors"
          >{t}</button>
        ))}
      </div>
    </NodeShell>
  );
}

const nodeTypes: NodeTypes = {
  prompt: PromptNode,
  "image-prompt": ImagePromptNode,
  "video-prompt": VideoPromptNode,
  "design-model": DesignModelNode,
  doc: DocNode,
  action: ActionNode,
  instagram: InstagramNode,
};

// ── Add-node menu ───────────────────────────────────────────────────

const NODE_MENU = [
  { type: "prompt",        label: "Prompt",       icon: MessageSquare, color: "bg-purple-600/20 text-purple-400 border-purple-500/30" },
  { type: "image-prompt",  label: "Image Gen",    icon: Image,         color: "bg-emerald-600/20 text-emerald-400 border-emerald-500/30" },
  { type: "video-prompt",  label: "Video Gen",    icon: Video,         color: "bg-rose-600/20 text-rose-400 border-rose-500/30" },
  { type: "design-model",  label: "Design Model", icon: Layers,        color: "bg-amber-600/20 text-amber-400 border-amber-500/30" },
  { type: "doc",           label: "Doc / Note",   icon: FileText,      color: "bg-sky-600/20 text-sky-400 border-sky-500/30" },
  { type: "action",        label: "Action",       icon: Zap,           color: "bg-yellow-600/20 text-yellow-400 border-yellow-500/30" },
  { type: "instagram",     label: "Instagram",    icon: Share2,        color: "bg-pink-600/20 text-pink-400 border-pink-500/30" },
];

const DEFAULT_NODES: Node[] = [
  { id: "start", type: "prompt",       position: { x: 60,  y: 160 }, data: { label: "Start Prompt",      type: "prompt",       prompt: "" } },
  { id: "img1",  type: "image-prompt", position: { x: 340, y: 80  }, data: { label: "Generate Image",     type: "image-prompt", prompt: "", imageUrl: "" } },
  { id: "vid1",  type: "video-prompt", position: { x: 340, y: 280 }, data: { label: "Generate Video",     type: "video-prompt", prompt: "", imageUrl: "", videoUrl: "" } },
  { id: "post1", type: "instagram",    position: { x: 640, y: 160 }, data: { label: "Post to Instagram",  type: "instagram",    prompt: "" } },
];
const DEFAULT_EDGES: Edge[] = [
  { id: "e1", source: "start", target: "img1",  animated: true, style: { stroke: "#7c3aed", strokeWidth: 1.5 } },
  { id: "e2", source: "start", target: "vid1",  animated: true, style: { stroke: "#7c3aed", strokeWidth: 1.5 } },
  { id: "e3", source: "img1",  target: "post1", animated: true, style: { stroke: "#7c3aed", strokeWidth: 1.5 } },
  { id: "e4", source: "vid1",  target: "post1", animated: true, style: { stroke: "#7c3aed", strokeWidth: 1.5 } },
];

// ── Imperative handle (exposed to parent) ───────────────────────────

export interface FlowCanvasHandle {
  createNode: (type: string, label: string, prompt?: string, description?: string, position?: { x: number; y: number }) => string;
  editNode: (nodeId: string, label?: string, type?: string, prompt?: string, description?: string) => void;
  connectNodes: (sourceId: string, targetId: string, label?: string) => void;
  deleteNode: (nodeId: string) => void;
  listNodes: () => { id: string; type: string; label: string }[];
}

interface FlowCanvasProps {
  projectId: string;
  onSave?: () => void;
}

export const FlowCanvas = forwardRef<FlowCanvasHandle, FlowCanvasProps>(
  function FlowCanvas({ projectId, onSave }, ref) {
    const savedNodes = useQuery(api.workflow.listNodes, { projectId });
    const savedEdges = useQuery(api.workflow.listEdges, { projectId });
    const saveWorkflow = useMutation(api.workflow.saveWorkflow);

    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
    const [initialized, setInitialized] = useState(false);
    const [showAddMenu, setShowAddMenu] = useState(false);
    const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    // Expose imperative API to parent (for AI tool calls)
    useImperativeHandle(ref, () => ({
      createNode(type, label, prompt, description, position) {
        const id = nanoid();
        const newNode: Node = {
          id,
          type,
          position: position ?? { x: 120 + Math.random() * 300, y: 120 + Math.random() * 250 },
          data: { label, type, prompt: prompt ?? "", description: description ?? "" },
        };
        setNodes((nds) => {
          const next = [...nds, newNode];
          triggerSave(next, edges);
          return next;
        });
        return id;
      },
      editNode(nodeId, label, type, prompt, description) {
        setNodes((nds) => {
          const next = nds.map((n) => {
            if (n.id !== nodeId) return n;
            return {
              ...n,
              type: type ?? n.type,
              data: {
                ...n.data,
                ...(label !== undefined && { label }),
                ...(prompt !== undefined && { prompt }),
                ...(description !== undefined && { description }),
              },
            };
          });
          triggerSave(next, edges);
          return next;
        });
      },
      connectNodes(sourceId, targetId, label) {
        const id = nanoid();
        const newEdge: Edge = {
          id, source: sourceId, target: targetId,
          label, animated: true,
          style: { stroke: "#7c3aed", strokeWidth: 1.5 },
        };
        setEdges((eds) => {
          const next = addEdge(newEdge as any, eds);
          triggerSave(nodes, next);
          return next;
        });
      },
      deleteNode(nodeId) {
        setNodes((nds) => {
          const next = nds.filter((n) => n.id !== nodeId);
          triggerSave(next, edges);
          return next;
        });
      },
      listNodes() {
        return nodes.map((n) => ({ id: n.id, type: n.type ?? "prompt", label: (n.data?.label as string) ?? n.id }));
      },
    }));

    // Load from Convex
    useEffect(() => {
      if (initialized) return;
      if (savedNodes === undefined || savedEdges === undefined) return;
      if (savedNodes.length > 0) {
        setNodes(savedNodes.map((n) => ({
          id: n.nodeId, type: n.type,
          position: { x: n.positionX, y: n.positionY },
          data: { label: n.label, type: n.type, ...(n.data ? JSON.parse(n.data) : {}) },
        })));
        setEdges(savedEdges.map((e) => ({
          id: e.edgeId, source: e.source, target: e.target,
          sourceHandle: e.sourceHandle ?? undefined, targetHandle: e.targetHandle ?? undefined,
          label: e.label ?? undefined, animated: true,
          style: { stroke: "#7c3aed", strokeWidth: 1.5 },
        })));
      } else {
        setNodes(DEFAULT_NODES);
        setEdges(DEFAULT_EDGES);
      }
      setInitialized(true);
    }, [savedNodes, savedEdges, initialized, setNodes, setEdges]);

    // Debounced save
    const triggerSave = useCallback(
      (currentNodes: Node[], currentEdges: Edge[]) => {
        clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(async () => {
          try {
            await saveWorkflow({
              projectId,
              nodes: currentNodes.map((n) => ({
                nodeId: n.id, type: n.type || "prompt",
                label: (n.data?.label as string) || n.id,
                positionX: n.position.x, positionY: n.position.y,
                data: JSON.stringify(n.data),
              })),
              edges: currentEdges.map((e) => ({
                edgeId: e.id, source: e.source, target: e.target,
                sourceHandle: e.sourceHandle ?? undefined,
                targetHandle: e.targetHandle ?? undefined,
                label: typeof e.label === "string" ? e.label : undefined,
              })),
            });
            onSave?.();
          } catch (err) { console.error("Auto-save failed:", err); }
        }, 800);
      },
      [projectId, saveWorkflow, onSave]
    );

    const handleNodesChange = useCallback((changes: any) => {
      onNodesChange(changes);
      setTimeout(() => setNodes((nds) => { triggerSave(nds, edges); return nds; }), 50);
    }, [onNodesChange, setNodes, edges, triggerSave]);

    const handleEdgesChange = useCallback((changes: any) => {
      onEdgesChange(changes);
      setTimeout(() => setEdges((eds) => { triggerSave(nodes, eds); return eds; }), 50);
    }, [onEdgesChange, setEdges, nodes, triggerSave]);

    const onConnect: OnConnect = useCallback((params) => {
      const newEdge = { ...params, id: nanoid(), animated: true, style: { stroke: "#7c3aed", strokeWidth: 1.5 } };
      setEdges((eds) => { const next = addEdge(newEdge as any, eds); triggerSave(nodes, next); return next; });
    }, [setEdges, nodes, triggerSave]);

    const addNode = useCallback((type: string, label: string) => {
      const id = nanoid();
      setNodes((nds) => {
        const next = [...nds, {
          id, type, position: { x: 200 + Math.random() * 200, y: 150 + Math.random() * 200 },
          data: { label, type, prompt: "", description: "" },
        }];
        triggerSave(next, edges);
        return next;
      });
      setShowAddMenu(false);
    }, [setNodes, edges, triggerSave]);

    const deleteSelected = useCallback(() => {
      setNodes((nds) => { const next = nds.filter((n) => !n.selected); triggerSave(next, edges); return next; });
      setEdges((eds) => { const next = eds.filter((e) => !e.selected); triggerSave(nodes, next); return next; });
    }, [setNodes, setEdges, nodes, edges, triggerSave]);

    if (!initialized) {
      return (
        <div className="w-full h-full flex items-center justify-center">
          <div className="flex gap-1.5">
            {[0, 150, 300].map((d) => (
              <span key={d} className="w-2 h-2 rounded-full bg-purple-400 animate-bounce"
                style={{ animationDelay: `${d}ms` }} />
            ))}
          </div>
        </div>
      );
    }

    return (
      <ReactFlow
        nodes={nodes} edges={edges}
        onNodesChange={handleNodesChange} onEdgesChange={handleEdgesChange}
        onConnect={onConnect} nodeTypes={nodeTypes}
        fitView fitViewOptions={{ padding: 0.3 }}
        minZoom={0.3} maxZoom={2}
        proOptions={{ hideAttribution: true }}
        className="bg-[#080810]"
        defaultEdgeOptions={{ animated: true, style: { stroke: "#7c3aed", strokeWidth: 1.5 } }}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="rgba(255,255,255,0.06)" />
        <MiniMap className="!bg-[#0d0d1a] !border !border-white/10 !rounded-xl overflow-hidden"
          nodeColor="#7c3aed" maskColor="rgba(8,8,16,0.85)" />
        <Controls className="!bg-[#0d0d1a] !border !border-white/10 !rounded-xl overflow-hidden [&>button]:!bg-transparent [&>button]:!border-white/10 [&>button]:!text-white/60 [&>button:hover]:!bg-white/10" />

        <Panel position="top-left" className="flex items-center gap-2 m-3">
          <div className="relative">
            <button
              onClick={() => setShowAddMenu((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-colors shadow-lg shadow-purple-500/25"
            >
              <Plus className="w-3.5 h-3.5" /> Add Node
            </button>
            {showAddMenu && (
              <div className="absolute top-full left-0 mt-1.5 w-48 rounded-xl border border-white/10 bg-[#0d0d1a]/95 backdrop-blur-xl shadow-2xl z-50 overflow-hidden p-1">
                {NODE_MENU.map((item) => (
                  <button key={item.type} onClick={() => addNode(item.type, item.label)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/[0.06] transition-colors text-left">
                    <span className={cn("w-6 h-6 rounded-md flex items-center justify-center border text-[10px]", item.color)}>
                      <item.icon className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-xs text-white/80 font-medium">{item.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={deleteSelected}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 text-white/60 text-xs font-medium transition-colors">
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
        </Panel>

        {showAddMenu && <div className="fixed inset-0 z-40" onClick={() => setShowAddMenu(false)} />}
      </ReactFlow>
    );
  }
);
