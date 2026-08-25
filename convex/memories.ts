import { query } from "./_generated/server";
import { COUPLE_CODE } from "./lib";

function oneYearAgoDayKey() {
  const now = new Date();
  now.setFullYear(now.getFullYear() - 1);
  return now.toISOString().slice(0, 10);
}

function dayBounds(dayKey: string) {
  const start = new Date(dayKey).getTime();
  const end = start + 24 * 60 * 60 * 1000 - 1;
  return { start, end };
}

export const onThisDay = query({
  args: {},
  handler: async (ctx) => {
    const couple = await ctx.db
      .query("couples")
      .withIndex("by_code", (q) => q.eq("code", COUPLE_CODE))
      .unique();
    if (!couple) return null;

    const dayKey = oneYearAgoDayKey();
    const monthKey = dayKey.slice(0, 7);
    const { start, end } = dayBounds(dayKey);

    const games = await ctx.db
      .query("games")
      .withIndex("by_couple_day", (q) =>
        q
          .eq("coupleId", couple._id)
          .gte("dayKey", dayKey)
          .lte("dayKey", dayKey),
      )
      .take(20);

    const photos = await ctx.db
      .query("photos")
      .withIndex("by_couple_month", (q) =>
        q.eq("coupleId", couple._id).eq("monthKey", monthKey),
      )
      .filter((q) =>
        q.and(
          q.gte(q.field("createdAt"), start),
          q.lte(q.field("createdAt"), end),
        ),
      )
      .take(20);

    const moods = await ctx.db
      .query("moods")
      .withIndex("by_couple_day", (q) =>
        q.eq("coupleId", couple._id).eq("dayKey", dayKey),
      )
      .take(10);

    const journals = await ctx.db
      .query("journalEntries")
      .withIndex("by_couple_created", (q) =>
        q
          .eq("coupleId", couple._id)
          .gte("createdAt", start)
          .lte("createdAt", end),
      )
      .take(20);

    return {
      dayKey,
      games,
      photos: await Promise.all(
        photos.map(async (p) => ({
          ...p,
          url: await ctx.storage.getUrl(p.storageId),
        })),
      ),
      moods,
      journals,
    };
  },
});
