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
      email: v.optional(v.string()),
    }),
    partnerB: v.object({
      name: v.string(),
      timezone: v.string(),
      status: v.optional(v.string()),
      lastSeenAt: v.optional(v.number()),
      email: v.optional(v.string()),
    }),
    nextVisitAt: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_code", ["code"]),

  pulses: defineTable({
    coupleId: v.id("couples"),
    sender: v.string(), // "A" or "B"
    sentAt: v.number(),
    seenBy: v.optional(
      v.object({
        A: v.optional(v.number()),
        B: v.optional(v.number()),
      }),
    ),
  }).index("by_couple", ["coupleId"]),

  games: defineTable({
    coupleId: v.id("couples"),
    type: v.string(), // "predict", "word", "battleship", "handoff"
    dayKey: v.string(),
    status: v.string(), // "active" | "completed"
    data: v.any(),
    updatedAt: v.number(),
  })
    .index("by_couple", ["coupleId"])
    .index("by_couple_day", ["coupleId", "dayKey"]),

  photoRequests: defineTable({
    coupleId: v.id("couples"),
    requester: v.string(),
    prompt: v.string(),
    status: v.string(), // "open" | "fulfilled"
    createdAt: v.number(),
    fulfilledAt: v.optional(v.number()),
  })
    .index("by_couple", ["coupleId"])
    .index("by_couple_status", ["coupleId", "status"]),

  photos: defineTable({
    coupleId: v.id("couples"),
    author: v.string(),
    storageId: v.id("_storage"),
    caption: v.optional(v.string()),
    requestId: v.optional(v.id("photoRequests")),
    albumIds: v.array(v.id("albums")),
    monthKey: v.string(),
    createdAt: v.number(),
  })
    .index("by_couple", ["coupleId"])
    .index("by_request", ["requestId"])
    .index("by_couple_month", ["coupleId", "monthKey"]),

  albums: defineTable({
    coupleId: v.id("couples"),
    name: v.string(),
    createdBy: v.string(),
    createdAt: v.number(),
  }).index("by_couple", ["coupleId"]),

  photoComments: defineTable({
    photoId: v.id("photos"),
    author: v.string(),
    text: v.optional(v.string()),
    kind: v.string(), // "comment" | "reaction" | "gif"
    url: v.optional(v.string()), // for gifs
    createdAt: v.number(),
  }).index("by_photo", ["photoId"]),

  emailLogs: defineTable({
    coupleId: v.id("couples"),
    kind: v.string(),
    to: v.string(),
    subject: v.string(),
    sentAt: v.number(),
    status: v.string(), // "pending" | "sent" | "failed"
    error: v.optional(v.string()),
  }).index("by_couple", ["coupleId"]),
});
