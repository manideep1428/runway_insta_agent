import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  projects: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index("by_createdAt", ["createdAt"]),

  tasks: defineTable({
    taskId: v.string(),
    model: v.string(),
    promptText: v.optional(v.string()),
    promptImage: v.optional(v.string()),
    status: v.string(), // PENDING, RUNNING, SUCCEEDED, FAILED
    outputUrl: v.optional(v.string()),
    createdAt: v.string(),
    type: v.string(), // image_to_video, text_to_video, etc.
  }).index("by_taskId", ["taskId"]),

  avatars: defineTable({
    avatarId: v.string(),
    name: v.string(),
    personality: v.string(),
    voiceId: v.string(),
    referenceImage: v.string(),
    status: v.string(),
    createdAt: v.string(),
  }).index("by_avatarId", ["avatarId"]),

  instagramAccounts: defineTable({
    igUserId: v.string(),
    username: v.string(),
    name: v.optional(v.string()),
    profilePicture: v.optional(v.string()),
    followersCount: v.optional(v.number()),
    mediaCount: v.optional(v.number()),
    connectedAt: v.string(),
  }).index("by_igUserId", ["igUserId"]),

  // React Flow workflow nodes per project
  workflow_nodes: defineTable({
    projectId: v.string(),
    nodeId: v.string(),
    type: v.string(),
    label: v.string(),
    positionX: v.number(),
    positionY: v.number(),
    data: v.optional(v.string()), // JSON-stringified extra data
    updatedAt: v.string(),
  })
    .index("by_projectId", ["projectId"])
    .index("by_projectId_nodeId", ["projectId", "nodeId"]),

  // React Flow workflow edges per project
  workflow_edges: defineTable({
    projectId: v.string(),
    edgeId: v.string(),
    source: v.string(),
    target: v.string(),
    sourceHandle: v.optional(v.string()),
    targetHandle: v.optional(v.string()),
    label: v.optional(v.string()),
    updatedAt: v.string(),
  })
    .index("by_projectId", ["projectId"])
    .index("by_projectId_edgeId", ["projectId", "edgeId"]),
});
