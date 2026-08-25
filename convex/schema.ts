import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  couples: defineTable({
    code: v.string(),
    partnerA: v.object({
      name: v.string(),
      timezone: v.string(),
      status: v.optional(v.string()),
      lastSeenAt: v.optional(v.number()),
    }),
    partnerB: v.object({
      name: v.string(),
      timezone: v.string(),
      status: v.optional(v.string()),
      lastSeenAt: v.optional(v.number()),
    }),
    nextVisitAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_code", ["code"]),

  pulses: defineTable({
    coupleId: v.id("couples"),
    sender: v.string(), // "A" or "B"
    sentAt: v.number(),
    seenAt: v.optional(v.number()),
  })
    .index("by_couple", ["coupleId"]),

  games: defineTable({
    coupleId: v.id("couples"),
    type: v.string(), // "predict", "word", "battleship", "draw", "handoff"
    dayKey: v.string(), // YYYY-MM-DD UTC or arbitrary round id
    status: v.string(), // "active" | "completed"
    data: v.any(),
    updatedAt: v.number(),
  })
    .index("by_couple", ["coupleId"])
    .index("by_couple_day", ["coupleId", "dayKey"]),

  moments: defineTable({
    coupleId: v.id("couples"),
    author: v.string(), // "A" or "B"
    caption: v.string(),
    imageUrl: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_couple", ["coupleId"]),
});
