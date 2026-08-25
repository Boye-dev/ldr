import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getCouple, COUPLE_CODE } from "./lib";

export const list = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const couple = await ctx.db
      .query("couples")
      .withIndex("by_code", (q) => q.eq("code", COUPLE_CODE))
      .unique();
    if (!couple) return [];
    return await ctx.db
      .query("journalEntries")
      .withIndex("by_couple", (q) => q.eq("coupleId", couple._id))
      .order("desc")
      .take(args.limit || 50);
  },
});

export const create = mutation({
  args: {
    author: v.string(),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const couple = await getCouple(ctx);
    return await ctx.db.insert("journalEntries", {
      coupleId: couple._id,
      author: args.author,
      text: args.text.trim(),
      createdAt: Date.now(),
    });
  },
});
