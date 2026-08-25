import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getCouple, COUPLE_CODE } from "./lib";
import { dayKey } from "../lib/timezones";

export const todaysMood = query({
  args: {},
  handler: async (ctx) => {
    const couple = await ctx.db
      .query("couples")
      .withIndex("by_code", (q) => q.eq("code", COUPLE_CODE))
      .unique();
    if (!couple) return null;
    return await ctx.db
      .query("moods")
      .withIndex("by_couple_day", (q) =>
        q.eq("coupleId", couple._id).eq("dayKey", dayKey()),
      )
      .collect();
  },
});

export const latestMoods = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const couple = await ctx.db
      .query("couples")
      .withIndex("by_code", (q) => q.eq("code", COUPLE_CODE))
      .unique();
    if (!couple) return [];
    return await ctx.db
      .query("moods")
      .withIndex("by_couple", (q) => q.eq("coupleId", couple._id))
      .order("desc")
      .take(args.limit || 30);
  },
});

export const setMood = mutation({
  args: {
    author: v.string(),
    score: v.number(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const couple = await getCouple(ctx);
    const d = dayKey();
    const existing = await ctx.db
      .query("moods")
      .withIndex("by_couple_day", (q) =>
        q.eq("coupleId", couple._id).eq("dayKey", d),
      )
      .filter((q) => q.eq(q.field("author"), args.author))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, {
        score: args.score,
        note: (args.note || "").trim(),
        createdAt: Date.now(),
      });
      return existing._id;
    }
    return await ctx.db.insert("moods", {
      coupleId: couple._id,
      author: args.author,
      dayKey: d,
      score: args.score,
      note: (args.note || "").trim(),
      createdAt: Date.now(),
    });
  },
});

export const streak = query({
  args: {},
  handler: async (ctx) => {
    const couple = await ctx.db
      .query("couples")
      .withIndex("by_code", (q) => q.eq("code", COUPLE_CODE))
      .unique();
    if (!couple) return 0;

    const all = await ctx.db
      .query("moods")
      .withIndex("by_couple", (q) => q.eq("coupleId", couple._id))
      .order("desc")
      .collect();

    if (all.length === 0) return 0;

    const days = new Set<string>();
    for (const m of all) {
      days.add(m.dayKey);
    }

    let streak = 0;
    const today = dayKey();
    const todayHasBoth =
      all.some((m) => m.dayKey === today && m.author === "A") &&
      all.some((m) => m.dayKey === today && m.author === "B");
    const start = todayHasBoth ? 0 : 1;

    for (let i = start; ; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const key = date.toISOString().slice(0, 10);
      const a = all.some((m) => m.dayKey === key && m.author === "A");
      const b = all.some((m) => m.dayKey === key && m.author === "B");
      if (a && b) streak++;
      else break;
    }
    return streak;
  },
});
