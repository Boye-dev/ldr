import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

const partnerValidator = v.object({
  name: v.string(),
  timezone: v.string(),
  status: v.optional(v.string()),
  lastSeenAt: v.optional(v.number()),
});

export const create = mutation({
  args: {
    code: v.string(),
    partnerAName: v.string(),
    partnerATimezone: v.string(),
    partnerBName: v.string(),
    partnerBTimezone: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("couples")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .unique();
    if (existing) {
      throw new Error("Code already in use");
    }
    const id = await ctx.db.insert("couples", {
      code: args.code,
      partnerA: {
        name: args.partnerAName,
        timezone: args.partnerATimezone,
      },
      partnerB: {
        name: args.partnerBName,
        timezone: args.partnerBTimezone,
      },
      createdAt: Date.now(),
    });
    return id;
  },
});

export const getByCode = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("couples")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .unique();
  },
});

export const updateStatus = mutation({
  args: {
    code: v.string(),
    partner: v.string(), // "A" or "B"
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const couple = await ctx.db
      .query("couples")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .unique();
    if (!couple) throw new Error("Couple not found");
    const field = args.partner === "A" ? "partnerA" : "partnerB";
    await ctx.db.patch(couple._id, {
      [field]: { ...couple[field], status: args.status, lastSeenAt: Date.now() },
    });
  },
});

export const setNextVisit = mutation({
  args: { code: v.string(), nextVisitAt: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const couple = await ctx.db
      .query("couples")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .unique();
    if (!couple) throw new Error("Couple not found");
    await ctx.db.patch(couple._id, { nextVisitAt: args.nextVisitAt });
  },
});
