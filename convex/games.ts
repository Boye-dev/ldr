import { v } from "convex/values";
import { query, mutation, QueryCtx } from "./_generated/server";
import { api } from "./_generated/api";
import { getCouple, COUPLE_CODE } from "./lib";
import { dayKey } from "../lib/timezones";
import { PREDICT_QUESTIONS, hashQuestion, Question } from "../lib/questions";
import { WYR_QUESTIONS, hashWyr, WyrQuestion } from "../lib/wyr";
import { pickPromptFor } from "../lib/speedlist";
import { emailTemplates } from "../lib/emails";

async function findCouple(ctx: QueryCtx) {
  return await ctx.db
    .query("couples")
    .withIndex("by_code", (q) => q.eq("code", COUPLE_CODE))
    .unique();
}

function pickQuestionFor(seed: string, usedHashes: number[]): Question {
  const day = dayKey();
  const base = seed.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
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

function pickWyrQuestion(seed: string, usedHashes: number[]): WyrQuestion {
  const day = dayKey();
  const base = seed.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  let idx =
    (base + day.split("-").reduce((a, b) => a + parseInt(b, 10), 0)) %
    WYR_QUESTIONS.length;
  let safety = 0;
  while (
    usedHashes.includes(hashWyr(WYR_QUESTIONS[idx])) &&
    safety < WYR_QUESTIONS.length
  ) {
    idx = (idx + 1) % WYR_QUESTIONS.length;
    safety++;
  }
  return WYR_QUESTIONS[idx];
}

async function findGame(
  ctx: QueryCtx,
  coupleId: any,
  type: string,
  day: string,
) {
  return await ctx.db
    .query("games")
    .withIndex("by_couple_day", (q) =>
      q.eq("coupleId", coupleId).eq("dayKey", day),
    )
    .filter((q) => q.eq(q.field("type"), type))
    .unique();
}

// ------------------ Predict Your Partner ------------------

export const todaysPredict = query({
  args: {},
  handler: async (ctx) => {
    const couple = await findCouple(ctx);
    if (!couple) return null;
    return await findGame(ctx, couple._id, "predict", dayKey());
  },
});

export const createTodaysPredict = mutation({
  args: {},
  handler: async (ctx) => {
    const couple = await getCouple(ctx);
    const day = dayKey();
    const existing = await findGame(ctx, couple._id, "predict", day);
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
    partner: v.string(),
    selfAnswer: v.string(),
    predictedAnswer: v.string(),
  },
  handler: async (ctx, args) => {
    const couple = await getCouple(ctx);
    const day = dayKey();
    const game = await findGame(ctx, couple._id, "predict", day);
    if (!game) throw new Error("No game today yet");

    const field = args.partner === "A" ? "A" : "B";
    const other = args.partner === "A" ? "B" : "A";
    const answers = { ...game.data };
    answers[field] = {
      self: args.selfAnswer,
      predicted: args.predictedAnswer,
      at: Date.now(),
    };
    const revealed = !!answers[other] && !!answers[field];

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
  },
});

// ------------------ Would You Rather ------------------

export const todaysWyr = query({
  args: {},
  handler: async (ctx) => {
    const couple = await findCouple(ctx);
    if (!couple) return null;
    return await findGame(ctx, couple._id, "wyr", dayKey());
  },
});

export const createTodaysWyr = mutation({
  args: {},
  handler: async (ctx) => {
    const couple = await getCouple(ctx);
    const day = dayKey();
    const existing = await findGame(ctx, couple._id, "wyr", day);
    if (existing) return existing._id;

    const prior = await ctx.db
      .query("games")
      .withIndex("by_couple", (q) => q.eq("coupleId", couple._id))
      .filter((q) => q.eq(q.field("type"), "wyr"))
      .collect();
    const usedHashes = prior.map((g) =>
      hashWyr(g.data.question as WyrQuestion),
    );
    const q = pickWyrQuestion(couple.code, usedHashes);
    return await ctx.db.insert("games", {
      coupleId: couple._id,
      type: "wyr",
      dayKey: day,
      status: "active",
      data: { question: q, A: null, B: null, revealed: false },
      updatedAt: Date.now(),
    });
  },
});

export const submitWyr = mutation({
  args: {
    partner: v.string(),
    choice: v.string(), // "A" or "B"
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const couple = await getCouple(ctx);
    const day = dayKey();
    const game = await findGame(ctx, couple._id, "wyr", day);
    if (!game) throw new Error("No game today yet");

    const field = args.partner === "A" ? "A" : "B";
    const other = args.partner === "A" ? "B" : "A";
    const answers = { ...game.data };
    answers[field] = {
      choice: args.choice,
      note: (args.note || "").trim(),
      at: Date.now(),
    };
    const revealed = !!answers[other] && !!answers[field];

    if (revealed) {
      answers.revealed = true;
    }

    await ctx.db.patch(game._id, {
      data: answers,
      status: revealed ? "completed" : "active",
      updatedAt: Date.now(),
    });
  },
});

// ------------------ Two Truths and a Lie ------------------

export const todaysTwoTruths = query({
  args: {},
  handler: async (ctx) => {
    const couple = await findCouple(ctx);
    if (!couple) return null;
    return await findGame(ctx, couple._id, "twotruths", dayKey());
  },
});

export const createTodaysTwoTruths = mutation({
  args: {},
  handler: async (ctx) => {
    const couple = await getCouple(ctx);
    const day = dayKey();
    const existing = await findGame(ctx, couple._id, "twotruths", day);
    if (existing) return existing._id;
    return await ctx.db.insert("games", {
      coupleId: couple._id,
      type: "twotruths",
      dayKey: day,
      status: "active",
      data: {
        statements: null,
        author: null,
        A: null,
        B: null,
        revealed: false,
      },
      updatedAt: Date.now(),
    });
  },
});

export const submitStatements = mutation({
  args: {
    partner: v.string(),
    statements: v.array(
      v.object({
        text: v.string(),
        isLie: v.boolean(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const couple = await getCouple(ctx);
    const game = await findGame(ctx, couple._id, "twotruths", dayKey());
    if (!game) throw new Error("No game today yet");
    if (game.data.author) throw new Error("Statements already set");
    if (args.statements.length !== 3)
      throw new Error("Submit exactly 3 statements");
    if (!args.statements.some((s) => s.isLie))
      throw new Error("One statement must be a lie");

    const data = { ...game.data };
    data.author = args.partner;
    data.statements = args.statements.map((s) => ({
      text: s.text.trim(),
      isLie: s.isLie,
    }));
    data[args.partner] = { done: true, at: Date.now() };

    await ctx.db.patch(game._id, {
      data,
      updatedAt: Date.now(),
    });
  },
});

export const submitLieGuess = mutation({
  args: {
    partner: v.string(),
    guess: v.number(),
  },
  handler: async (ctx, args) => {
    const couple = await getCouple(ctx);
    const game = await findGame(ctx, couple._id, "twotruths", dayKey());
    if (!game) throw new Error("No game today yet");
    if (!game.data.author) throw new Error("Statements not set yet");
    if (game.data.author === args.partner)
      throw new Error("You can't guess your own statements");
    if (game.data[args.partner]?.guess !== undefined)
      throw new Error("Already guessed");

    const lieIndex = game.data.statements.findIndex((s: any) => s.isLie);
    const winner = args.guess === lieIndex ? args.partner : game.data.author;

    const data = { ...game.data };
    data[args.partner] = {
      guess: args.guess,
      at: Date.now(),
    };
    data.winner = winner;
    data.revealed = true;

    await ctx.db.patch(game._id, {
      data,
      status: "completed",
      updatedAt: Date.now(),
    });
  },
});

// ------------------ Speed Lists ------------------

export const todaysSpeedList = query({
  args: {},
  handler: async (ctx) => {
    const couple = await findCouple(ctx);
    if (!couple) return null;
    return await findGame(ctx, couple._id, "speedlist", dayKey());
  },
});

export const createTodaysSpeedList = mutation({
  args: {},
  handler: async (ctx) => {
    const couple = await getCouple(ctx);
    const day = dayKey();
    const existing = await findGame(ctx, couple._id, "speedlist", day);
    if (existing) return existing._id;
    return await ctx.db.insert("games", {
      coupleId: couple._id,
      type: "speedlist",
      dayKey: day,
      status: "active",
      data: {
        prompt: pickPromptFor(day),
        A: null,
        B: null,
        revealed: false,
        matches: 0,
      },
      updatedAt: Date.now(),
    });
  },
});

export const submitSpeedList = mutation({
  args: {
    partner: v.string(),
    items: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const couple = await getCouple(ctx);
    const day = dayKey();
    const game = await findGame(ctx, couple._id, "speedlist", day);
    if (!game) throw new Error("No game today yet");

    const field = args.partner === "A" ? "A" : "B";
    const other = args.partner === "A" ? "B" : "A";
    const answers = { ...game.data };
    answers[field] = {
      items: args.items.map((i) => i.trim()).filter(Boolean),
      at: Date.now(),
    };
    const revealed = !!answers[other] && !!answers[field];

    if (revealed) {
      answers.revealed = true;
      const mine = (answers[field].items as string[]).map((i) =>
        i.toLowerCase(),
      );
      const theirs = (answers[other].items as string[]).map((i) =>
        i.toLowerCase(),
      );
      const overlap = mine.filter((i) => theirs.includes(i));
      answers.matches = overlap.length;
    }

    await ctx.db.patch(game._id, {
      data: answers,
      status: revealed ? "completed" : "active",
      updatedAt: Date.now(),
    });
  },
});

// ------------------ Word Duel ------------------

export const todaysWord = query({
  args: {},
  handler: async (ctx) => {
    const couple = await findCouple(ctx);
    if (!couple) return null;
    return await findGame(ctx, couple._id, "word", dayKey());
  },
});

export const createTodaysWord = mutation({
  args: {},
  handler: async (ctx) => {
    const couple = await getCouple(ctx);
    const day = dayKey();
    const existing = await findGame(ctx, couple._id, "word", day);
    if (existing) return existing._id;
    return await ctx.db.insert("games", {
      coupleId: couple._id,
      type: "word",
      dayKey: day,
      status: "active",
      data: {
        AWord: null,
        BWord: null,
        AHint: "",
        BHint: "",
        AGuesses: [],
        BGuesses: [],
        ARemaining: 3,
        BRemaining: 3,
        ARevealed: [],
        BRevealed: [],
        turn: null,
      },
      updatedAt: Date.now(),
    });
  },
});

export const setWord = mutation({
  args: { partner: v.string(), word: v.string(), hint: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const couple = await getCouple(ctx);
    const game = await findGame(ctx, couple._id, "word", dayKey());
    if (!game) throw new Error("No game today yet");
    const field = args.partner === "A" ? "AWord" : "BWord";
    const hintField = args.partner === "A" ? "AHint" : "BHint";
    const otherField = args.partner === "A" ? "BWord" : "AWord";
    const data = {
      ...game.data,
      [field]: args.word.toLowerCase().trim(),
      [hintField]: (args.hint || "").trim(),
    };
    if (data[otherField]) {
      data.turn = "A";
    }
    await ctx.db.patch(game._id, { data, updatedAt: Date.now() });

    if (data[otherField] && couple.partnerA.email) {
      const { subject, text, html } = emailTemplates.wordDuelStart({
        toName: couple.partnerA.name,
      });
      ctx.scheduler.runAfter(0, api.email.send, {
        to: couple.partnerA.email,
        subject,
        text,
        html,
      });
    }
  },
});

export const guessWord = mutation({
  args: { partner: v.string(), guess: v.string() },
  handler: async (ctx, args) => {
    const couple = await getCouple(ctx);
    const game = await findGame(ctx, couple._id, "word", dayKey());
    if (!game || !game.data.AWord || !game.data.BWord)
      throw new Error("Words not set");

    const myGuesses = args.partner === "A" ? "AGuesses" : "BGuesses";
    const myRemaining = args.partner === "A" ? "ARemaining" : "BRemaining";
    const myRevealed = args.partner === "A" ? "ARevealed" : "BRevealed";
    const target = args.partner === "A" ? game.data.BWord : game.data.AWord;
    const guess = args.guess.toLowerCase().trim();
    const result = { guess, correct: guess === target, at: Date.now() };
    const data = {
      ...game.data,
      [myGuesses]: [...game.data[myGuesses], result],
      [myRemaining]: game.data[myRemaining] - 1,
    };

    if (result.correct) {
      data.winner = args.partner;
      data[myRevealed] = [...Array(target.length).keys()];
    } else if (data[myRemaining] <= 0) {
      data.winner = args.partner === "A" ? "B" : "A";
    } else {
      data.turn = args.partner === "A" ? "B" : "A";
    }

    await ctx.db.patch(game._id, {
      data,
      status: data.winner ? "completed" : game.status,
      updatedAt: Date.now(),
    });

    if (data.turn) {
      const to =
        data.turn === "A" ? couple.partnerA.email : couple.partnerB.email;
      if (to) {
        const fromName =
          args.partner === "A" ? couple.partnerA.name : couple.partnerB.name;
        const remaining = data.turn === "A" ? data.ARemaining : data.BRemaining;
        const { subject, text, html } = emailTemplates.wordDuelTurn({
          fromName,
          remaining,
        });
        ctx.scheduler.runAfter(0, api.email.send, { to, subject, text, html });
      }
    }
  },
});

export const useHint = mutation({
  args: { partner: v.string() },
  handler: async (ctx, args) => {
    const couple = await getCouple(ctx);
    const game = await findGame(ctx, couple._id, "word", dayKey());
    if (!game || !game.data.AWord || !game.data.BWord)
      throw new Error("Words not set");

    const myRemaining = args.partner === "A" ? "ARemaining" : "BRemaining";
    const myRevealed = args.partner === "A" ? "ARevealed" : "BRevealed";
    const target = args.partner === "A" ? game.data.BWord : game.data.AWord;
    const remainingCount = game.data[myRemaining] as number;
    if (remainingCount <= 0) throw new Error("No trials left");

    const revealed: number[] = [...game.data[myRevealed]];
    const unrevealed = [...Array(target.length).keys()].filter(
      (i) => !revealed.includes(i),
    );
    if (unrevealed.length > 0) {
      const idx = unrevealed[Math.floor(Math.random() * unrevealed.length)];
      revealed.push(idx);
    }

    const data = {
      ...game.data,
      [myRevealed]: revealed,
      [myRemaining]: remainingCount - 1,
    };

    if (data[myRemaining] <= 0 && !data.winner) {
      data.winner = args.partner === "A" ? "B" : "A";
    }

    await ctx.db.patch(game._id, {
      data,
      status: data.winner ? "completed" : game.status,
      updatedAt: Date.now(),
    });
  },
});

// ------------------ Battleship ------------------

const EMPTY_BOARD = {
  A: { board: [], hits: [], shipsSet: false },
  B: { board: [], hits: [], shipsSet: false },
  turn: null,
  winner: null,
};

export const getBattleship = query({
  args: {},
  handler: async (ctx) => {
    const couple = await findCouple(ctx);
    if (!couple) return null;
    return await findGame(ctx, couple._id, "battleship", dayKey());
  },
});

export const createTodaysBattleship = mutation({
  args: {},
  handler: async (ctx) => {
    const couple = await getCouple(ctx);
    const day = dayKey();
    const existing = await findGame(ctx, couple._id, "battleship", day);
    if (existing) return existing._id;
    return await ctx.db.insert("games", {
      coupleId: couple._id,
      type: "battleship",
      dayKey: day,
      status: "active",
      data: EMPTY_BOARD,
      updatedAt: Date.now(),
    });
  },
});

export const setShips = mutation({
  args: { partner: v.string(), positions: v.array(v.number()) },
  handler: async (ctx, args) => {
    const couple = await getCouple(ctx);
    const game = await findGame(ctx, couple._id, "battleship", dayKey());
    if (!game) throw new Error("No game today yet");
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

    if (data.A.shipsSet && data.B.shipsSet && couple.partnerA.email) {
      const { subject, text, html } = emailTemplates.battleshipStart({
        toName: couple.partnerA.name,
      });
      ctx.scheduler.runAfter(0, api.email.send, {
        to: couple.partnerA.email,
        subject,
        text,
        html,
      });
    }
  },
});

export const fire = mutation({
  args: { partner: v.string(), index: v.number() },
  handler: async (ctx, args) => {
    const couple = await getCouple(ctx);
    const game = await findGame(ctx, couple._id, "battleship", dayKey());
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

    if (data.turn) {
      const to =
        data.turn === "A" ? couple.partnerA.email : couple.partnerB.email;
      if (to) {
        const fromName =
          args.partner === "A" ? couple.partnerA.name : couple.partnerB.name;
        const { subject, text, html } = emailTemplates.battleshipTurn({
          fromName,
        });
        ctx.scheduler.runAfter(0, api.email.send, { to, subject, text, html });
      }
    }
  },
});

// ------------------ Reset ------------------

export const resetGame = mutation({
  args: { type: v.string() },
  handler: async (ctx, args) => {
    const couple = await getCouple(ctx);
    const game = await findGame(ctx, couple._id, args.type, dayKey());
    if (game) {
      await ctx.db.delete(game._id);
    }
  },
});

// ------------------ Scoreboard & history ------------------

export const scoreboard = query({
  args: {},
  handler: async (ctx) => {
    const couple = await findCouple(ctx);
    if (!couple) return null;
    const all = await ctx.db
      .query("games")
      .withIndex("by_couple", (q) => q.eq("coupleId", couple._id))
      .collect();

    const stats = {
      predictMatchesA: 0,
      predictMatchesB: 0,
      predictRounds: 0,
      wyrMatchesA: 0,
      wyrMatchesB: 0,
      wyrRounds: 0,
      twoTruthsWinsA: 0,
      twoTruthsWinsB: 0,
      twoTruthsRounds: 0,
      speedListMatches: 0,
      speedListRounds: 0,
      wordWinsA: 0,
      wordWinsB: 0,
      battleshipWinsA: 0,
      battleshipWinsB: 0,
    };

    for (const g of all) {
      if (g.type === "predict" && g.data.revealed) {
        stats.predictRounds++;
        if (g.data.A?.correctPrediction) stats.predictMatchesA++;
        if (g.data.B?.correctPrediction) stats.predictMatchesB++;
      }
      if (g.type === "wyr" && g.data.revealed) {
        stats.wyrRounds++;
        if (g.data.A?.choice === g.data.B?.choice) {
          stats.wyrMatchesA++;
          stats.wyrMatchesB++;
        }
      }
      if (g.type === "twotruths" && g.data.revealed) {
        stats.twoTruthsRounds++;
        if (g.data.winner === "A") stats.twoTruthsWinsA++;
        else if (g.data.winner === "B") stats.twoTruthsWinsB++;
      }
      if (g.type === "speedlist" && g.data.revealed) {
        stats.speedListRounds++;
        stats.speedListMatches += (g.data.matches as number) || 0;
      }
      if (g.type === "word" && g.data.winner) {
        if (g.data.winner === "A") stats.wordWinsA++;
        else stats.wordWinsB++;
      }
      if (g.type === "battleship" && g.data.winner) {
        if (g.data.winner === "A") stats.battleshipWinsA++;
        else stats.battleshipWinsB++;
      }
    }
    return stats;
  },
});

export const history = query({
  args: {},
  handler: async (ctx) => {
    const couple = await findCouple(ctx);
    if (!couple) return [];
    return await ctx.db
      .query("games")
      .withIndex("by_couple", (q) => q.eq("coupleId", couple._id))
      .order("desc")
      .take(60);
  },
});
