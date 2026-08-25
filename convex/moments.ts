import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const create = mutation({
  args: {
    code: v.string(),
    author: v.string(),
    caption: v.string(),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const couple = await ctx.db
      .query("couples")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .unique();
    if (!couple) throw new Error("Couple not found");
    await ctx.db.insert("moments", {
      coupleId: couple._id,
      author: args.author,
      caption: args.caption,
      imageUrl: args.imageUrl,
      createdAt: Date.now(),
    });
  },
});

export const list = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const couple = await ctx.db
      .query("couples")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .unique();
    if (!couple) return [];
    return await ctx.db
      .query("moments")
      .withIndex("by_couple", (q) => q.eq("coupleId", couple._id))
      .order("desc")
      .take(50);
  },
});
