import { v } from "convex/values";
import { query, mutation, QueryCtx, MutationCtx } from "./_generated/server";
import { dayKey } from "../lib/timezones";
import { PREDICT_QUESTIONS, hashQuestion, Question } from "../lib/questions";

async function getCouple(ctx: QueryCtx | MutationCtx, code: string) {
  const couple = await ctx.db
    .query("couples")
    .withIndex("by_code", (q) => q.eq("code", code))
    .unique();
  if (!couple) throw new Error("Couple not found");
  return couple;
}

function pickQuestionFor(coupleCode: string, usedHashes: number[]): Question {
  const day = dayKey();
  const base = coupleCode
    .split("")
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  let idx =
    (base + day.split("-").reduce((a, b) => a + parseInt(b, 10), 0)) %
    PREDICT_QUESTIONS.length;
  let safety = 0;
  while (
    usedHashes.includes(hashQuestion(PREDICT_QUESTIONS[idx])) &&
    safety < PREDICT_QUESTIONS.length
  ) {
    idx = (idx + 1) % PREDICT_QUESTIONS.length;
    safety++;
  }
  return PREDICT_QUESTIONS[idx];
}

// ------------------ Predict Your Partner ------------------

export const todaysPredict = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const couple = await getCouple(ctx, args.code);
    const day = dayKey();
    return await ctx.db
      .query("games")
      .withIndex("by_couple_day", (q) =>
        q.eq("coupleId", couple._id).eq("dayKey", day),
      )
      .filter((q) => q.eq(q.field("type"), "predict"))
      .unique();
  },
});

export const createTodaysPredict = mutation({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const couple = await getCouple(ctx, args.code);
    const day = dayKey();
    const existing = await ctx.db
      .query("games")
      .withIndex("by_couple_day", (q) =>
        q.eq("coupleId", couple._id).eq("dayKey", day),
      )
      .filter((q) => q.eq(q.field("type"), "predict"))
      .unique();
    if (existing) return existing._id;

    const prior = await ctx.db
      .query("games")
      .withIndex("by_couple", (q) => q.eq("coupleId", couple._id))
      .filter((q) => q.eq(q.field("type"), "predict"))
      .collect();
    const usedHashes = prior.map((g) =>
      hashQuestion(g.data.question as Question),
    );
    const q = pickQuestionFor(couple.code, usedHashes);
    return await ctx.db.insert("games", {
      coupleId: couple._id,
      type: "predict",
      dayKey: day,
      status: "active",
      data: { question: q, A: null, B: null, revealed: false },
      updatedAt: Date.now(),
    });
  },
});

export const submitPredict = mutation({
  args: {
    code: v.string(),
    partner: v.string(),
    selfAnswer: v.string(),
    predictedAnswer: v.string(),
  },
  handler: async (ctx, args) => {
    const couple = await getCouple(ctx, args.code);
    const day = dayKey();
    let game = await ctx.db
      .query("games")
      .withIndex("by_couple_day", (q) =>
        q.eq("coupleId", couple._id).eq("dayKey", day),
      )
      .filter((q) => q.eq(q.field("type"), "predict"))
      .unique();

    if (!game) {
      const prior = await ctx.db
        .query("games")
        .withIndex("by_couple", (q) => q.eq("coupleId", couple._id))
        .filter((q) => q.eq(q.field("type"), "predict"))
        .collect();
      const usedHashes = prior.map((g) =>
        hashQuestion(g.data.question as Question),
      );
      const q = pickQuestionFor(couple.code, usedHashes);
      const id = await ctx.db.insert("games", {
        coupleId: couple._id,
        type: "predict",
        dayKey: day,
        status: "active",
        data: { question: q, A: null, B: null, revealed: false },
        updatedAt: Date.now(),
      });
      game = await ctx.db.get(id);
    }
    if (!game) throw new Error("Could not create game");

    const field = args.partner === "A" ? "A" : "B";
    const other = args.partner === "A" ? "B" : "A";
    const answers = { ...game.data };
    answers[field] = {
      self: args.selfAnswer,
      predicted: args.predictedAnswer,
      at: Date.now(),
    };
    const otherAnswer = (answers[other] as any)?.self?.toLowerCase().trim();
    const revealed = !!(answers[other] as any) && !!(answers[field] as any);

    if (revealed) {
      answers.revealed = true;
      answers.A.correctPrediction =
        (answers.A.predicted as string).toLowerCase().trim() ===
        (answers.B.self as string).toLowerCase().trim();
      answers.B.correctPrediction =
        (answers.B.predicted as string).toLowerCase().trim() ===
        (answers.A.self as string).toLowerCase().trim();
    }

    await ctx.db.patch(game._id, {
      data: answers,
      status: revealed ? "completed" : "active",
      updatedAt: Date.now(),
    });
    return await ctx.db.get(game._id);
  },
});

// ------------------ Word Duel ------------------

export const todaysWord = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const couple = await getCouple(ctx, args.code);
    const day = dayKey();
    return await ctx.db
      .query("games")
      .withIndex("by_couple_day", (q) =>
        q.eq("coupleId", couple._id).eq("dayKey", day),
      )
      .filter((q) => q.eq(q.field("type"), "word"))
      .unique();
  },
});

export const createTodaysWord = mutation({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const couple = await getCouple(ctx, args.code);
    const day = dayKey();
    const existing = await ctx.db
      .query("games")
      .withIndex("by_couple_day", (q) =>
        q.eq("coupleId", couple._id).eq("dayKey", day),
      )
      .filter((q) => q.eq(q.field("type"), "word"))
      .unique();
    if (existing) return existing._id;
    return await ctx.db.insert("games", {
      coupleId: couple._id,
      type: "word",
      dayKey: day,
      status: "active",
      data: {
        AWord: null,
        BWord: null,
        AGuesses: [],
        BGuesses: [],
        turn: null,
      },
      updatedAt: Date.now(),
    });
  },
});

export const setWord = mutation({
  args: { code: v.string(), partner: v.string(), word: v.string() },
  handler: async (ctx, args) => {
    const couple = await getCouple(ctx, args.code);
    const day = dayKey();
    let game = await ctx.db
      .query("games")
      .withIndex("by_couple_day", (q) =>
        q.eq("coupleId", couple._id).eq("dayKey", day),
      )
      .filter((q) => q.eq(q.field("type"), "word"))
      .unique();
    if (!game) {
      const id = await ctx.db.insert("games", {
        coupleId: couple._id,
        type: "word",
        dayKey: day,
        status: "active",
        data: {
          AWord: null,
          BWord: null,
          AGuesses: [],
          BGuesses: [],
          turn: null,
        },
        updatedAt: Date.now(),
      });
      game = await ctx.db.get(id);
    }
    if (!game) throw new Error("Could not create game");
    const field = args.partner === "A" ? "AWord" : "BWord";
    const otherField = args.partner === "A" ? "BWord" : "AWord";
    const data = { ...game.data, [field]: args.word.toLowerCase().trim() };
    if (data[otherField]) {
      data.turn = "A";
    }
    await ctx.db.patch(game._id, { data, updatedAt: Date.now() });
    return await ctx.db.get(game._id);
  },
});

export const guessWord = mutation({
  args: { code: v.string(), partner: v.string(), guess: v.string() },
  handler: async (ctx, args) => {
    const couple = await getCouple(ctx, args.code);
    const day = dayKey();
    const game = await ctx.db
      .query("games")
      .withIndex("by_couple_day", (q) =>
        q.eq("coupleId", couple._id).eq("dayKey", day),
      )
      .filter((q) => q.eq(q.field("type"), "word"))
      .unique();
    if (!game || !game.data.AWord || !game.data.BWord)
      throw new Error("Words not set");

    const myGuesses = args.partner === "A" ? "AGuesses" : "BGuesses";
    const target = args.partner === "A" ? game.data.BWord : game.data.AWord;
    const guess = args.guess.toLowerCase().trim();
    const result = { guess, correct: guess === target, at: Date.now() };
    const data = {
      ...game.data,
      [myGuesses]: [...game.data[myGuesses], result],
    };

    if (!result.correct) {
      data.turn = args.partner === "A" ? "B" : "A";
    } else {
      data.winner = args.partner;
    }

    await ctx.db.patch(game._id, {
      data,
      status: data.winner ? "completed" : game.status,
      updatedAt: Date.now(),
    });
    return await ctx.db.get(game._id);
  },
});

// ------------------ Battleship ------------------

export const getBattleship = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const couple = await getCouple(ctx, args.code);
    const day = dayKey();
    return await ctx.db
      .query("games")
      .withIndex("by_couple_day", (q) =>
        q.eq("coupleId", couple._id).eq("dayKey", day),
      )
      .filter((q) => q.eq(q.field("type"), "battleship"))
      .unique();
  },
});

export const createTodaysBattleship = mutation({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const couple = await getCouple(ctx, args.code);
    const day = dayKey();
    const existing = await ctx.db
      .query("games")
      .withIndex("by_couple_day", (q) =>
        q.eq("coupleId", couple._id).eq("dayKey", day),
      )
      .filter((q) => q.eq(q.field("type"), "battleship"))
      .unique();
    if (existing) return existing._id;
    return await ctx.db.insert("games", {
      coupleId: couple._id,
      type: "battleship",
      dayKey: day,
      status: "active",
      data: {
        A: { board: [], hits: [], shipsSet: false },
        B: { board: [], hits: [], shipsSet: false },
        turn: null,
        winner: null,
      },
      updatedAt: Date.now(),
    });
  },
});

export const setShips = mutation({
  args: {
    code: v.string(),
    partner: v.string(),
    positions: v.array(v.number()),
  },
  handler: async (ctx, args) => {
    const couple = await getCouple(ctx, args.code);
    const day = dayKey();
    let game = await ctx.db
      .query("games")
      .withIndex("by_couple_day", (q) =>
        q.eq("coupleId", couple._id).eq("dayKey", day),
      )
      .filter((q) => q.eq(q.field("type"), "battleship"))
      .unique();
    if (!game) {
      const id = await ctx.db.insert("games", {
        coupleId: couple._id,
        type: "battleship",
        dayKey: day,
        status: "active",
        data: {
          A: { board: [], hits: [], shipsSet: false },
          B: { board: [], hits: [], shipsSet: false },
          turn: null,
          winner: null,
        },
        updatedAt: Date.now(),
      });
      game = await ctx.db.get(id);
    }
    if (!game) throw new Error("Could not create game");
    const field = args.partner === "A" ? "A" : "B";
    const data = { ...game.data };
    data[field] = {
      board: args.positions,
      hits: data[field].hits,
      shipsSet: true,
    };
    if (data.A.shipsSet && data.B.shipsSet) {
      data.turn = "A";
    }
    await ctx.db.patch(game._id, { data, updatedAt: Date.now() });
    return await ctx.db.get(game._id);
  },
});

export const fire = mutation({
  args: { code: v.string(), partner: v.string(), index: v.number() },
  handler: async (ctx, args) => {
    const couple = await getCouple(ctx, args.code);
    const day = dayKey();
    const game = await ctx.db
      .query("games")
      .withIndex("by_couple_day", (q) =>
        q.eq("coupleId", couple._id).eq("dayKey", day),
      )
      .filter((q) => q.eq(q.field("type"), "battleship"))
      .unique();
    if (!game || game.data.turn !== args.partner)
      throw new Error("Not your turn");

    const opponent = args.partner === "A" ? "B" : "A";
    const hit = game.data[opponent].board.includes(args.index);
    const data = { ...game.data };
    data[args.partner].hits = [
      ...data[args.partner].hits,
      { index: args.index, hit, at: Date.now() },
    ];

    const allHits = data[args.partner].hits
      .filter((h: any) => h.hit)
      .map((h: any) => h.index);
    const sunk = data[opponent].board.every((p: number) => allHits.includes(p));

    if (sunk) {
      data.winner = args.partner;
      data.turn = null;
    } else {
      data.turn = opponent;
    }

    await ctx.db.patch(game._id, {
      data,
      status: data.winner ? "completed" : game.status,
      updatedAt: Date.now(),
    });
    return await ctx.db.get(game._id);
  },
});
