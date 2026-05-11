import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createProject = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const projectId = await ctx.db.insert("projects", {
      name: args.name,
      description: args.description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return projectId;
  },
});

export const listProjects = query({
  handler: async (ctx) => {
    return await ctx.db.query("projects").withIndex("by_createdAt").order("desc").collect();
  },
});

export const deleteProject = mutation({
  args: {
    id: v.id("projects"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
