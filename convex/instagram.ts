import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { api } from "./_generated/api";

// Fetch Instagram account info using the Graph API
export const connectAccount = action({
  args: {
    accessToken: v.string(),
  },
  handler: async (ctx, args) => {
    // Step 1: Get user pages and Instagram business account ID
    const meRes = await fetch(
      `https://graph.instagram.com/v21.0/me?fields=id,username,name,profile_picture_url,followers_count,media_count&access_token=${args.accessToken}`
    );

    if (!meRes.ok) {
      const errText = await meRes.text();
      throw new Error(`Failed to fetch Instagram profile: ${errText}`);
    }

    const profile = await meRes.json();

    // Store in Convex
    await ctx.runMutation(api.instagram.storeAccount, {
      igUserId: profile.id,
      username: profile.username || `user_${profile.id}`,
      name: profile.name || undefined,
      profilePicture: profile.profile_picture_url || undefined,
      followersCount: profile.followers_count ?? undefined,
      mediaCount: profile.media_count ?? undefined,
      connectedAt: new Date().toISOString(),
    });

    return {
      igUserId: profile.id,
      username: profile.username || `user_${profile.id}`,
      name: profile.name,
      profilePicture: profile.profile_picture_url,
      followersCount: profile.followers_count,
      mediaCount: profile.media_count,
    };
  },
});

export const storeAccount = mutation({
  args: {
    igUserId: v.string(),
    username: v.string(),
    name: v.optional(v.string()),
    profilePicture: v.optional(v.string()),
    followersCount: v.optional(v.number()),
    mediaCount: v.optional(v.number()),
    connectedAt: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if account already exists
    const existing = await ctx.db
      .query("instagramAccounts")
      .withIndex("by_igUserId", (q) => q.eq("igUserId", args.igUserId))
      .unique();

    if (existing) {
      // Update the existing account
      await ctx.db.patch(existing._id, {
        username: args.username,
        name: args.name,
        profilePicture: args.profilePicture,
        followersCount: args.followersCount,
        mediaCount: args.mediaCount,
        connectedAt: args.connectedAt,
      });
    } else {
      await ctx.db.insert("instagramAccounts", args);
    }
  },
});

export const listAccounts = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("instagramAccounts").order("desc").collect();
  },
});

export const removeAccount = mutation({
  args: {
    igUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const account = await ctx.db
      .query("instagramAccounts")
      .withIndex("by_igUserId", (q) => q.eq("igUserId", args.igUserId))
      .unique();

    if (account) {
      await ctx.db.delete(account._id);
    }
  },
});
