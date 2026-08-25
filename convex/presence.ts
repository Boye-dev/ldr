import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const sendPulse = mutation({
  args: { code: v.string(), sender: v.string() },
  handler: async (ctx, args) => {
    const couple = await ctx.db
      .query("couples")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .unique();
    if (!couple) throw new Error("Couple not found");
    await ctx.db.insert("pulses", {
      coupleId: couple._id,
      sender: args.sender,
      sentAt: Date.now(),
    });
  },
});

export const recentPulses = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const couple = await ctx.db
      .query("couples")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .unique();
    if (!couple) return [];
    return await ctx.db
      .query("pulses")
      .withIndex("by_couple", (q) => q.eq("coupleId", couple._id))
      .order("desc")
      .take(10);
  },
});

export const markPulsesSeen = mutation({
  args: { pulseIds: v.array(v.id("pulses")) },
  handler: async (ctx, args) => {
    for (const id of args.pulseIds) {
      await ctx.db.patch(id, { seenAt: Date.now() });
    }
  },
});
