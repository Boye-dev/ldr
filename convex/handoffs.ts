import { v } from "convex/values";
import { query, mutation, QueryCtx, MutationCtx } from "./_generated/server";

async function getCouple(ctx: QueryCtx | MutationCtx, code: string) {
  const couple = await ctx.db
    .query("couples")
    .withIndex("by_code", (q) => q.eq("code", code))
    .unique();
  if (!couple) throw new Error("Couple not found");
  return couple;
}

export const latest = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const couple = await getCouple(ctx, args.code);
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
    code: v.string(),
    from: v.string(), // "A" or "B"
    note: v.string(),
    unlockAt: v.number(),
  },
  handler: async (ctx, args) => {
    const couple = await getCouple(ctx, args.code);
    const to = args.from === "A" ? "B" : "A";
    return await ctx.db.insert("games", {
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
        content: null,
      },
      updatedAt: Date.now(),
    });
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
    return await ctx.db.get(args.id);
  },
});
