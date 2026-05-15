import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ── Nodes ──────────────────────────────────────────────

export const upsertNode = mutation({
  args: {
    projectId: v.string(),
    nodeId: v.string(),
    type: v.string(),
    label: v.string(),
    positionX: v.number(),
    positionY: v.number(),
    data: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("workflow_nodes")
      .withIndex("by_projectId_nodeId", (q) =>
        q.eq("projectId", args.projectId).eq("nodeId", args.nodeId)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        type: args.type,
        label: args.label,
        positionX: args.positionX,
        positionY: args.positionY,
        data: args.data,
        updatedAt: new Date().toISOString(),
      });
      return existing._id;
    } else {
      return await ctx.db.insert("workflow_nodes", {
        projectId: args.projectId,
        nodeId: args.nodeId,
        type: args.type,
        label: args.label,
        positionX: args.positionX,
        positionY: args.positionY,
        data: args.data,
        updatedAt: new Date().toISOString(),
      });
    }
  },
});

export const deleteNode = mutation({
  args: {
    projectId: v.string(),
    nodeId: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("workflow_nodes")
      .withIndex("by_projectId_nodeId", (q) =>
        q.eq("projectId", args.projectId).eq("nodeId", args.nodeId)
      )
      .first();
    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});

export const listNodes = query({
  args: { projectId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("workflow_nodes")
      .withIndex("by_projectId", (q) => q.eq("projectId", args.projectId))
      .collect();
  },
});

// ── Edges ──────────────────────────────────────────────

export const upsertEdge = mutation({
  args: {
    projectId: v.string(),
    edgeId: v.string(),
    source: v.string(),
    target: v.string(),
    sourceHandle: v.optional(v.string()),
    targetHandle: v.optional(v.string()),
    label: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("workflow_edges")
      .withIndex("by_projectId_edgeId", (q) =>
        q.eq("projectId", args.projectId).eq("edgeId", args.edgeId)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        source: args.source,
        target: args.target,
        sourceHandle: args.sourceHandle,
        targetHandle: args.targetHandle,
        label: args.label,
        updatedAt: new Date().toISOString(),
      });
      return existing._id;
    } else {
      return await ctx.db.insert("workflow_edges", {
        projectId: args.projectId,
        edgeId: args.edgeId,
        source: args.source,
        target: args.target,
        sourceHandle: args.sourceHandle,
        targetHandle: args.targetHandle,
        label: args.label,
        updatedAt: new Date().toISOString(),
      });
    }
  },
});

export const deleteEdge = mutation({
  args: {
    projectId: v.string(),
    edgeId: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("workflow_edges")
      .withIndex("by_projectId_edgeId", (q) =>
        q.eq("projectId", args.projectId).eq("edgeId", args.edgeId)
      )
      .first();
    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});

export const listEdges = query({
  args: { projectId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("workflow_edges")
      .withIndex("by_projectId", (q) => q.eq("projectId", args.projectId))
      .collect();
  },
});

// ── Bulk save (snapshot entire workflow) ──────────────────────────────────────

export const saveWorkflow = mutation({
  args: {
    projectId: v.string(),
    nodes: v.array(
      v.object({
        nodeId: v.string(),
        type: v.string(),
        label: v.string(),
        positionX: v.number(),
        positionY: v.number(),
        data: v.optional(v.string()),
      })
    ),
    edges: v.array(
      v.object({
        edgeId: v.string(),
        source: v.string(),
        target: v.string(),
        sourceHandle: v.optional(v.string()),
        targetHandle: v.optional(v.string()),
        label: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();

    // Delete all existing nodes/edges for project and re-insert
    const existingNodes = await ctx.db
      .query("workflow_nodes")
      .withIndex("by_projectId", (q) => q.eq("projectId", args.projectId))
      .collect();
    for (const n of existingNodes) await ctx.db.delete(n._id);

    const existingEdges = await ctx.db
      .query("workflow_edges")
      .withIndex("by_projectId", (q) => q.eq("projectId", args.projectId))
      .collect();
    for (const e of existingEdges) await ctx.db.delete(e._id);

    for (const node of args.nodes) {
      await ctx.db.insert("workflow_nodes", {
        projectId: args.projectId,
        nodeId: node.nodeId,
        type: node.type,
        label: node.label,
        positionX: node.positionX,
        positionY: node.positionY,
        data: node.data,
        updatedAt: now,
      });
    }

    for (const edge of args.edges) {
      await ctx.db.insert("workflow_edges", {
        projectId: args.projectId,
        edgeId: edge.edgeId,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
        label: edge.label,
        updatedAt: now,
      });
    }
  },
});
