import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import RunwayML from "@runwayml/sdk";

function getClient(apiKey?: string) {
  return new RunwayML({
    apiKey: apiKey || process.env.RUNWAYML_API_SECRET,
  });
}

// ─── Queries ───────────────────────────────────────────────
export const listTasks = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("tasks").order("desc").collect();
  },
});

export const listAvatars = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("avatars").order("desc").collect();
  },
});

// ─── Helper: store + poll ──────────────────────────────────
async function saveTask(ctx: any, taskId: string, model: string, type: string, promptText?: string, promptImage?: string) {
  await ctx.runMutation(api.runway.storeTask, {
    taskId, model, promptText, promptImage,
    status: "PENDING",
    createdAt: new Date().toISOString(),
    type,
  });
  return taskId;
}

// ─── 1. Text to Video ─────────────────────────────────────
export const createTextToVideo = action({
  args: {
    promptText: v.string(),
    model: v.optional(v.string()),
    ratio: v.optional(v.string()),
    duration: v.optional(v.number()),
    apiKey: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const runway = getClient(args.apiKey);
    const model = (args.model as any) || "veo3.1";
    const task = await runway.textToVideo.create({
      model,
      promptText: args.promptText,
      ratio: (args.ratio as any) || "1280:720",
      duration: (args.duration as any) || 5,
    });
    return saveTask(ctx, task.id, model, "text_to_video", args.promptText);
  },
});

// ─── 2. Image to Video ────────────────────────────────────
export const createImageToVideo = action({
  args: {
    promptText: v.string(),
    promptImage: v.string(),
    model: v.optional(v.string()),
    ratio: v.optional(v.string()),
    duration: v.optional(v.number()),
    apiKey: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const runway = getClient(args.apiKey);
    const model = (args.model as any) || "gen4_turbo";
    const task = await runway.imageToVideo.create({
      model,
      promptImage: args.promptImage,
      promptText: args.promptText,
      ratio: (args.ratio as any) || "1280:720",
      duration: (args.duration as any) || 5,
    });
    return saveTask(ctx, task.id, model, "image_to_video", args.promptText, args.promptImage);
  },
});

// ─── 3. Video to Video ────────────────────────────────────
export const createVideoToVideo = action({
  args: {
    promptText: v.string(),
    videoUri: v.string(),
    referenceImageUri: v.optional(v.string()),
    apiKey: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const runway = getClient(args.apiKey);
    const params: any = {
      model: "gen4_aleph",
      videoUri: args.videoUri,
      promptText: args.promptText,
    };
    if (args.referenceImageUri) {
      params.references = [{ type: "image", uri: args.referenceImageUri }];
    }
    const task = await runway.videoToVideo.create(params);
    return saveTask(ctx, task.id, "gen4_aleph", "video_to_video", args.promptText);
  },
});

// ─── 4. Text/Image to Image ──────────────────────────────
export const createTextToImage = action({
  args: {
    promptText: v.string(),
    model: v.optional(v.string()),
    ratio: v.optional(v.string()),
    referenceImages: v.optional(v.array(v.object({ uri: v.string(), tag: v.optional(v.string()) }))),
    apiKey: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const runway = getClient(args.apiKey);
    const model = (args.model as any) || "gen4_image";
    const params: any = {
      model,
      promptText: args.promptText,
      ratio: (args.ratio as any) || "1360:768",
    };
    if (args.referenceImages && args.referenceImages.length > 0) {
      params.referenceImages = args.referenceImages;
    }
    const task = await runway.textToImage.create(params);
    return saveTask(ctx, task.id, model, "text_to_image", args.promptText);
  },
});

// ─── 5. Character Performance ─────────────────────────────
export const createCharacterPerformance = action({
  args: {
    characterType: v.string(), // "image" or "video"
    characterUri: v.string(),
    referenceUri: v.string(),
    ratio: v.optional(v.string()),
    bodyControl: v.optional(v.boolean()),
    expressionIntensity: v.optional(v.number()),
    apiKey: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const runway = getClient(args.apiKey);
    const task = await runway.characterPerformance.create({
      model: "act_two",
      character: { type: args.characterType as any, uri: args.characterUri },
      reference: { type: "video", uri: args.referenceUri },
      ratio: (args.ratio as any) || "1280:720",
      bodyControl: args.bodyControl,
      expressionIntensity: args.expressionIntensity as any,
    });
    return saveTask(ctx, task.id, "act_two", "character_performance");
  },
});

// ─── 6. Sound Effect ──────────────────────────────────────
export const createSoundEffect = action({
  args: {
    promptText: v.string(),
    duration: v.optional(v.number()),
    loop: v.optional(v.boolean()),
    apiKey: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const runway = getClient(args.apiKey);
    const task = await runway.soundEffect.create({
      model: "eleven_text_to_sound_v2",
      promptText: args.promptText,
      duration: args.duration,
      loop: args.loop,
    });
    return saveTask(ctx, task.id, "eleven_text_to_sound_v2", "sound_effect", args.promptText);
  },
});

// ─── 7. Text to Speech ───────────────────────────────────
export const createTextToSpeech = action({
  args: {
    promptText: v.string(),
    voicePresetId: v.string(),
    apiKey: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const runway = getClient(args.apiKey);
    const task = await runway.textToSpeech.create({
      model: "eleven_multilingual_v2",
      promptText: args.promptText,
      voice: { type: "runway-preset", presetId: args.voicePresetId as any },
    });
    return saveTask(ctx, task.id, "eleven_multilingual_v2", "text_to_speech", args.promptText);
  },
});

// ─── 8. Speech to Speech ─────────────────────────────────
export const createSpeechToSpeech = action({
  args: {
    mediaType: v.string(), // "audio" or "video"
    mediaUri: v.string(),
    voicePresetId: v.string(),
    removeBackgroundNoise: v.optional(v.boolean()),
    apiKey: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const runway = getClient(args.apiKey);
    const task = await runway.speechToSpeech.create({
      model: "eleven_multilingual_sts_v2",
      media: { type: args.mediaType as any, uri: args.mediaUri },
      voice: { type: "runway-preset", presetId: args.voicePresetId as any },
      removeBackgroundNoise: args.removeBackgroundNoise,
    });
    return saveTask(ctx, task.id, "eleven_multilingual_sts_v2", "speech_to_speech");
  },
});

// ─── 9. Voice Dubbing ────────────────────────────────────
export const createVoiceDubbing = action({
  args: {
    audioUri: v.string(),
    targetLang: v.string(),
    disableVoiceCloning: v.optional(v.boolean()),
    dropBackgroundAudio: v.optional(v.boolean()),
    apiKey: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const runway = getClient(args.apiKey);
    const task = await runway.voiceDubbing.create({
      model: "eleven_voice_dubbing",
      audioUri: args.audioUri,
      targetLang: args.targetLang as any,
      disableVoiceCloning: args.disableVoiceCloning,
      dropBackgroundAudio: args.dropBackgroundAudio,
    });
    return saveTask(ctx, task.id, "eleven_voice_dubbing", "voice_dubbing");
  },
});

// ─── 10. Voice Isolation ─────────────────────────────────
export const createVoiceIsolation = action({
  args: {
    audioUri: v.string(),
    apiKey: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const runway = getClient(args.apiKey);
    const task = await (runway.voiceIsolation as any).create({
      model: "eleven_voice_isolation",
      audioUri: args.audioUri,
    });
    return saveTask(ctx, task.id, "eleven_voice_isolation", "voice_isolation");
  },
});

// ─── 11. Avatar Video ────────────────────────────────────
export const createAvatarVideo = action({
  args: {
    avatarType: v.string(), // "runway-preset" or "custom"
    avatarId: v.string(), // presetId or custom avatarId
    speechType: v.string(), // "text" or "audio"
    speechContent: v.string(), // text or audioUri
    voicePresetId: v.optional(v.string()),
    apiKey: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const runway = getClient(args.apiKey);
    const avatar: any = args.avatarType === "custom"
      ? { type: "custom", avatarId: args.avatarId }
      : { type: "runway-preset", presetId: args.avatarId };

    const speech: any = args.speechType === "text"
      ? { type: "text", text: args.speechContent, ...(args.voicePresetId ? { voice: { type: "preset", presetId: args.voicePresetId } } : {}) }
      : { type: "audio", audio: args.speechContent };

    const task = await runway.avatarVideos.create({
      model: "gwm1_avatars",
      avatar,
      speech,
    });
    return saveTask(ctx, task.id, "gwm1_avatars", "avatar_video", args.speechType === "text" ? args.speechContent : undefined);
  },
});

// ─── Legacy createTask (kept for compatibility) ──────────
export const createTask = action({
  args: {
    type: v.string(),
    promptText: v.string(),
    promptImage: v.optional(v.string()),
    model: v.optional(v.string()),
    apiKey: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const runway = getClient(args.apiKey);
    let task;
    if (args.type === "text_to_video") {
      task = await runway.textToVideo.create({
        model: (args.model as any) || "veo3.1",
        promptText: args.promptText,
        ratio: "1280:720",
        duration: 5,
      });
    } else if (args.type === "image_to_video") {
      if (!args.promptImage) throw new Error("promptImage is required for image_to_video");
      task = await runway.imageToVideo.create({
        model: (args.model as any) || "gen3a_turbo",
        promptImage: args.promptImage,
        promptText: args.promptText,
        duration: 5,
      });
    } else {
      throw new Error(`Unsupported task type: ${args.type}`);
    }
    return saveTask(ctx, task.id, args.model || "veo3.1", args.type, args.promptText, args.promptImage);
  },
});

// ─── Avatar CRUD ─────────────────────────────────────────
export const createAvatar = action({
  args: {
    name: v.string(),
    referenceImage: v.string(),
    personality: v.string(),
    voiceId: v.string(),
    apiKey: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const runway = getClient(args.apiKey);
    const avatar = await runway.avatars.create({
      name: args.name,
      referenceImage: args.referenceImage,
      personality: args.personality,
      voice: { type: "runway-live-preset", presetId: args.voiceId as any },
    });

    await ctx.runMutation(api.runway.storeAvatar, {
      avatarId: avatar.id,
      name: args.name,
      personality: args.personality,
      voiceId: args.voiceId,
      referenceImage: args.referenceImage,
      status: avatar.status,
      createdAt: new Date().toISOString(),
    });

    return avatar.id;
  },
});

// ─── Mutations ───────────────────────────────────────────
export const storeTask = mutation({
  args: {
    taskId: v.string(),
    model: v.string(),
    promptText: v.optional(v.string()),
    promptImage: v.optional(v.string()),
    status: v.string(),
    createdAt: v.string(),
    type: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("tasks", args);
  },
});

export const storeAvatar = mutation({
  args: {
    avatarId: v.string(),
    name: v.string(),
    personality: v.string(),
    voiceId: v.string(),
    referenceImage: v.string(),
    status: v.string(),
    createdAt: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("avatars", args);
  },
});

export const updateTaskStatus = mutation({
  args: {
    taskId: v.string(),
    status: v.string(),
    outputUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db
      .query("tasks")
      .withIndex("by_taskId", (q) => q.eq("taskId", args.taskId))
      .unique();
    if (task) {
      await ctx.db.patch(task._id, {
        status: args.status,
        outputUrl: args.outputUrl,
      });
    }
  },
});

export const pollTask = action({
  args: {
    taskId: v.string(),
    apiKey: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const runway = getClient(args.apiKey);
    const task = await runway.tasks.retrieve(args.taskId);
    let status = task.status;
    let outputUrl = undefined;
    // @ts-ignore
    if (status === "SUCCEEDED" && task.output?.[0]) {
       // @ts-ignore
       outputUrl = task.output[0];
    }
    await ctx.runMutation(api.runway.updateTaskStatus, {
      taskId: args.taskId,
      status: status,
      outputUrl: outputUrl,
    });
    return task;
  },
});
