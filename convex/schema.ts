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
  }).index("by_code", ["code"]),

  pulses: defineTable({
    coupleId: v.id("couples"),
    sender: v.string(), // "A" or "B"
    sentAt: v.number(),
    seenAt: v.optional(v.number()),
  }).index("by_couple", ["coupleId"]),

  games: defineTable({
    coupleId: v.id("couples"),
    type: v.string(), // "predict", "word", "battleship", "handoff"
    dayKey: v.string(), // YYYY-MM-DD UTC or arbitrary round id
    status: v.string(), // "active" | "completed"
    data: v.any(),
    updatedAt: v.number(),
  })
    .index("by_couple", ["coupleId"])
    .index("by_couple_day", ["coupleId", "dayKey"]),

  photoRequests: defineTable({
    coupleId: v.id("couples"),
    requester: v.string(), // "A" or "B"
    prompt: v.string(),
    status: v.string(), // "open" | "fulfilled"
    createdAt: v.number(),
    fulfilledAt: v.optional(v.number()),
  })
    .index("by_couple", ["coupleId"])
    .index("by_couple_status", ["coupleId", "status"]),

  photos: defineTable({
    coupleId: v.id("couples"),
    author: v.string(), // "A" or "B"
    storageId: v.id("_storage"),
    caption: v.optional(v.string()),
    requestId: v.optional(v.id("photoRequests")),
    albumIds: v.array(v.id("albums")),
    monthKey: v.string(), // YYYY-MM
    createdAt: v.number(),
  })
    .index("by_couple", ["coupleId"])
    .index("by_request", ["requestId"])
    .index("by_couple_month", ["coupleId", "monthKey"]),

  albums: defineTable({
    coupleId: v.id("couples"),
    name: v.string(),
    createdBy: v.string(), // "A" or "B"
    createdAt: v.number(),
  }).index("by_couple", ["coupleId"]),

  // Deprecated: old base64 moments feed (kept for schema compat, no longer written)
  moments: defineTable({
    coupleId: v.id("couples"),
    author: v.string(),
    caption: v.string(),
    imageUrl: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_couple", ["coupleId"]),
});
