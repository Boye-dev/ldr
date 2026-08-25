import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { api } from "./_generated/api";
import { getCouple } from "./lib";

export const sendPulse = mutation({
  args: { sender: v.string() },
  handler: async (ctx, args) => {
    const couple = await getCouple(ctx);
    await ctx.db.insert("pulses", {
      coupleId: couple._id,
      sender: args.sender,
      sentAt: Date.now(),
      seenBy: {},
    });

    const to =
      args.sender === "A" ? couple.partnerB.email : couple.partnerA.email;
    if (to) {
      ctx.scheduler.runAfter(0, api.email.send, {
        to,
        subject: `${args.sender === "A" ? "Adeboye" : "Faith"} sent you a pulse 💓`,
        text: `Open Closer to feel it.`,
      });
    }
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
      .take(20);
  },
});

export const markPulsesSeen = mutation({
  args: { by: v.string(), pulseIds: v.array(v.id("pulses")) },
  handler: async (ctx, args) => {
    const now = Date.now();
    for (const id of args.pulseIds) {
      const pulse = await ctx.db.get(id);
      if (!pulse) continue;
      const seenBy = { ...pulse.seenBy };
      (seenBy as any)[args.by] = now;
      await ctx.db.patch(id, { seenBy });
    }
  },
});
