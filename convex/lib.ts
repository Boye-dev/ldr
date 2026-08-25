import { QueryCtx, MutationCtx } from "./_generated/server";

export const COUPLE_CODE = "adeboye-faith";

export async function getCouple(ctx: QueryCtx | MutationCtx) {
  const couple = await ctx.db
    .query("couples")
    .withIndex("by_code", (q) => q.eq("code", COUPLE_CODE))
    .unique();
  if (!couple) throw new Error("Couple not seeded yet");
  return couple;
}
