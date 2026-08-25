"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Eye, Lock, Sparkles } from "lucide-react";

export function PredictGame({ code, me }: { code: string; me: "A" | "B" }) {
  const game = useQuery(api.games.todaysPredict, { code });
  const createGame = useMutation(api.games.createTodaysPredict);
  const submit = useMutation(api.games.submitPredict);
  const [self, setSelf] = useState("");
  const [predicted, setPredicted] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (game === null) createGame({ code });
  }, [game, createGame, code]);

  if (game === undefined)
    return <div className="p-4 text-center text-zinc-500">Loading…</div>;
  if (game === null)
    return (
      <div className="p-4 text-center text-zinc-500">
        Preparing today&apos;s duel…
      </div>
    );

  const myAnswer = game.data[me];
  const other = me === "A" ? "B" : "A";
  const otherAnswer = game.data[other];
  const revealed = game.data.revealed;
  const iSubmitted = !!myAnswer;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await submit({
      code,
      partner: me,
      selfAnswer: self,
      predictedAnswer: predicted,
    });
    setSubmitted(true);
  }

  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-amber-500" />
        <h2 className="text-lg font-semibold">Predict Your Partner</h2>
      </div>

      <div className="rounded-2xl bg-gradient-to-br from-violet-50 to-rose-50 p-5 dark:from-violet-900/20 dark:to-rose-900/20">
        <p className="text-lg font-medium leading-relaxed text-zinc-800 dark:text-zinc-100">
          {game.data.question.text}
        </p>
        <span className="mt-2 inline-block rounded-full bg-white/60 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-400">
          {game.data.question.category}
        </span>
      </div>

      {!revealed ? (
        <div className="mt-5">
          {!iSubmitted ? (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium">
                  Your real answer
                </label>
                <input
                  value={self}
                  onChange={(e) => setSelf(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                  placeholder="What is true for you?"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium">
                  What you think they&apos;d say
                </label>
                <input
                  value={predicted}
                  onChange={(e) => setPredicted(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                  placeholder="Your prediction of their answer"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={submitted}
                className="w-full rounded-xl bg-violet-600 py-2.5 font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
              >
                Lock in answers
              </button>
            </form>
          ) : (
            <div className="space-y-2 rounded-2xl bg-zinc-50 p-4 text-center dark:bg-zinc-900/50">
              <Lock className="mx-auto h-5 w-5 text-zinc-400" />
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Your answers are locked. Waiting for your partner to answer too.
              </p>
              <p className="text-xs text-zinc-400">
                You answered: {myAnswer.self}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-violet-50 p-4 dark:bg-violet-900/20">
              <p className="text-xs font-semibold uppercase text-violet-700 dark:text-violet-300">
                You said
              </p>
              <p className="mt-1 text-lg font-medium">{myAnswer.self}</p>
              <p className="mt-1 text-sm text-zinc-600">
                Predicted them: {myAnswer.predicted}
              </p>
              {myAnswer.correctPrediction ? (
                <span className="mt-2 inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-300">
                  Match
                </span>
              ) : (
                <span className="mt-2 inline-block rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  Mismatch
                </span>
              )}
            </div>
            <div className="rounded-2xl bg-rose-50 p-4 dark:bg-rose-900/20">
              <p className="text-xs font-semibold uppercase text-rose-700 dark:text-rose-300">
                They said
              </p>
              <p className="mt-1 text-lg font-medium">{otherAnswer.self}</p>
              <p className="mt-1 text-sm text-zinc-600">
                Predicted you: {otherAnswer.predicted}
              </p>
              {otherAnswer.correctPrediction ? (
                <span className="mt-2 inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-300">
                  Match
                </span>
              ) : (
                <span className="mt-2 inline-block rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  Mismatch
                </span>
              )}
            </div>
          </div>
          <p className="flex items-center justify-center gap-2 text-sm text-zinc-500">
            <Eye className="h-4 w-4" /> Revealed because you both answered.
          </p>
        </div>
      )}
    </div>
  );
}
