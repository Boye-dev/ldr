import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getCouple } from "./lib";

// ---------- Photo requests ----------

export const createRequest = mutation({
  args: { requester: v.string(), prompt: v.string() },
  handler: async (ctx, args) => {
    const couple = await getCouple(ctx);
    return await ctx.db.insert("photoRequests", {
      coupleId: couple._id,
      requester: args.requester,
      prompt: args.prompt,
      status: "open",
      createdAt: Date.now(),
    });
  },
});

export const listRequests = query({
  args: {},
  handler: async (ctx) => {
    const couple = await ctx.db
      .query("couples")
      .withIndex("by_code", (q) => q.eq("code", "adeboye-faith"))
      .unique();
    if (!couple) return [];
    return await ctx.db
      .query("photoRequests")
      .withIndex("by_couple", (q) => q.eq("coupleId", couple._id))
      .order("desc")
      .take(50);
  },
});

// ---------- Upload / photos ----------

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const addPhoto = mutation({
  args: {
    author: v.string(),
    storageId: v.id("_storage"),
    caption: v.optional(v.string()),
    requestId: v.optional(v.id("photoRequests")),
    albumIds: v.optional(v.array(v.id("albums"))),
  },
  handler: async (ctx, args) => {
    const couple = await getCouple(ctx);
    const now = Date.now();
    const monthKey = new Date(now).toISOString().slice(0, 7);
    const id = await ctx.db.insert("photos", {
      coupleId: couple._id,
      author: args.author,
      storageId: args.storageId,
      caption: args.caption,
      requestId: args.requestId,
      albumIds: args.albumIds || [],
      monthKey,
      createdAt: now,
    });
    if (args.requestId) {
      await ctx.db.patch(args.requestId, {
        status: "fulfilled",
        fulfilledAt: now,
      });
    }
    return id;
  },
});

async function withUrls(ctx: any, photos: any[]) {
  return await Promise.all(
    photos.map(async (p) => ({
      ...p,
      url: await ctx.storage.getUrl(p.storageId),
    }))
  );
}

export const listPhotos = query({
  args: {},
  handler: async (ctx) => {
    const couple = await ctx.db
      .query("couples")
      .withIndex("by_code", (q) => q.eq("code", "adeboye-faith"))
      .unique();
    if (!couple) return [];
    const photos = await ctx.db
      .query("photos")
      .withIndex("by_couple", (q) => q.eq("coupleId", couple._id))
      .order("desc")
      .take(200);
    return await withUrls(ctx, photos);
  },
});

export const photosByRequest = query({
  args: { requestId: v.id("photoRequests") },
  handler: async (ctx, args) => {
    const photos = await ctx.db
      .query("photos")
      .withIndex("by_request", (q) => q.eq("requestId", args.requestId))
      .collect();
    return await withUrls(ctx, photos);
  },
});

// ---------- Albums ----------

export const createAlbum = mutation({
  args: { name: v.string(), createdBy: v.string() },
  handler: async (ctx, args) => {
    const couple = await getCouple(ctx);
    return await ctx.db.insert("albums", {
      coupleId: couple._id,
      name: args.name,
      createdBy: args.createdBy,
      createdAt: Date.now(),
    });
  },
});

export const listAlbums = query({
  args: {},
  handler: async (ctx) => {
    const couple = await ctx.db
      .query("couples")
      .withIndex("by_code", (q) => q.eq("code", "adeboye-faith"))
      .unique();
    if (!couple) return [];
    return await ctx.db
      .query("albums")
      .withIndex("by_couple", (q) => q.eq("coupleId", couple._id))
      .order("desc")
      .collect();
  },
});

export const addToAlbum = mutation({
  args: { photoId: v.id("photos"), albumId: v.id("albums") },
  handler: async (ctx, args) => {
    const photo = await ctx.db.get(args.photoId);
    if (!photo) throw new Error("Photo not found");
    if (!photo.albumIds.includes(args.albumId)) {
      await ctx.db.patch(args.photoId, {
        albumIds: [...photo.albumIds, args.albumId],
      });
    }
  },
});
