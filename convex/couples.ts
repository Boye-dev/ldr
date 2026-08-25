import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

const COUPLE_CODE = "adeboye-faith";

export const verifyPin = query({
  args: { pin: v.string() },
  handler: async (_ctx, args) => {
    const expected = process.env.APP_PIN || "1234";
    return args.pin === expected;
  },
});

export const get = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("couples")
      .withIndex("by_code", (q) => q.eq("code", COUPLE_CODE))
      .unique();
  },
});

export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("couples")
      .withIndex("by_code", (q) => q.eq("code", COUPLE_CODE))
      .unique();
    if (existing) return existing._id;
    return await ctx.db.insert("couples", {
      code: COUPLE_CODE,
      partnerA: { name: "Adeboye", timezone: "America/Toronto" },
      partnerB: { name: "Faith", timezone: "Africa/Lagos" },
      createdAt: Date.now(),
    });
  },
});

export const updateStatus = mutation({
  args: {
    partner: v.string(), // "A" or "B"
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const couple = await ctx.db
      .query("couples")
      .withIndex("by_code", (q) => q.eq("code", COUPLE_CODE))
      .unique();
    if (!couple) throw new Error("Couple not found");
    const field = args.partner === "A" ? "partnerA" : "partnerB";
    await ctx.db.patch(couple._id, {
      [field]: {
        ...couple[field],
        status: args.status,
        lastSeenAt: Date.now(),
      },
    });
  },
});

export const setNextVisit = mutation({
  args: { nextVisitAt: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const couple = await ctx.db
      .query("couples")
      .withIndex("by_code", (q) => q.eq("code", COUPLE_CODE))
      .unique();
    if (!couple) throw new Error("Couple not found");
    await ctx.db.patch(couple._id, { nextVisitAt: args.nextVisitAt });
  },
});
