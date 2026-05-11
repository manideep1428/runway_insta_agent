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
});
