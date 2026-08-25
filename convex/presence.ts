import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getCouple } from "./lib";

export const sendPulse = mutation({
  args: { sender: v.string() },
  handler: async (ctx, args) => {
    const couple = await getCouple(ctx);
    await ctx.db.insert("pulses", {
      coupleId: couple._id,
      sender: args.sender,
      sentAt: Date.now(),
    });
  },
});

export const recentPulses = query({
  args: {},
  handler: async (ctx) => {
    const couple = await ctx.db
      .query("couples")
      .withIndex("by_code", (q) => q.eq("code", "adeboye-faith"))
      .unique();
    if (!couple) return [];
    return await ctx.db
      .query("pulses")
      .withIndex("by_couple", (q) => q.eq("coupleId", couple._id))
      .order("desc")
      .take(8);
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
