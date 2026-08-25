import { v } from "convex/values";
import { query, mutation, QueryCtx } from "./_generated/server";
import { api } from "./_generated/api";
import { getCouple, COUPLE_CODE } from "./lib";
import { emailTemplates } from "../lib/emails";

async function findCouple(ctx: QueryCtx) {
  return await ctx.db
    .query("couples")
    .withIndex("by_code", (q) => q.eq("code", COUPLE_CODE))
    .unique();
}

export const latest = query({
  args: {},
  handler: async (ctx) => {
    const couple = await findCouple(ctx);
    if (!couple) return null;
    return await ctx.db
      .query("games")
      .withIndex("by_couple", (q) => q.eq("coupleId", couple._id))
      .filter((q) => q.eq(q.field("type"), "handoff"))
      .order("desc")
      .first();
  },
});

export const send = mutation({
  args: {
    from: v.string(), // "A" or "B"
    note: v.string(),
    unlockAt: v.number(),
  },
  handler: async (ctx, args) => {
    const couple = await getCouple(ctx);
    const to = args.from === "A" ? "B" : "A";
    const handoff = await ctx.db.insert("games", {
      coupleId: couple._id,
      type: "handoff",
      dayKey: new Date().toISOString().slice(0, 10),
      status: "active",
      data: {
        from: args.from,
        to,
        note: args.note,
        unlockAt: args.unlockAt,
        openedAt: null,
      },
      updatedAt: Date.now(),
    });

    const email = to === "A" ? couple.partnerA.email : couple.partnerB.email;
    if (email) {
      const fromName =
        args.from === "A" ? couple.partnerA.name : couple.partnerB.name;
      const { subject, text, html } = emailTemplates.handoff({
        fromName,
        unlockAt: args.unlockAt,
      });
      ctx.scheduler.runAfter(0, api.email.send, {
        to: email,
        subject,
        text,
        html,
      });
    }
    return handoff;
  },
});

export const open = mutation({
  args: { id: v.id("games"), now: v.number() },
  handler: async (ctx, args) => {
    const handoff = await ctx.db.get(args.id);
    if (!handoff || handoff.type !== "handoff") throw new Error("Not found");
    if (args.now < handoff.data.unlockAt) throw new Error("Not yet");
    if (!handoff.data.openedAt) {
      await ctx.db.patch(args.id, {
        data: { ...handoff.data, openedAt: args.now },
        updatedAt: args.now,
      });
    }
  },
});
