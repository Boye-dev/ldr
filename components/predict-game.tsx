"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PARTNERS, PartnerKey, otherPartner } from "@/lib/config";
import { Eye, Lock, Sparkles, RotateCcw } from "lucide-react";

export function PredictGame({ me }: { me: PartnerKey }) {
  const game = useQuery(api.games.todaysPredict);
  const createGame = useMutation(api.games.createTodaysPredict);
  const submit = useMutation(api.games.submitPredict);
  const reset = useMutation(api.games.resetGame);
  const [self, setSelf] = useState("");
  const [predicted, setPredicted] = useState("");

  const them = PARTNERS[otherPartner(me)].name;

  useEffect(() => {
    if (game === null) createGame({});
  }, [game, createGame]);

  async function handleReset() {
    if (confirm("Get a fresh question?")) {
      await reset({ type: "predict" });
      await createGame({});
    }
  }

  if (!game)
    return (
      <div className="p-6 text-center text-zinc-400">
        Loading today&apos;s question…
      </div>
    );

  const myAnswer = game.data[me];
  const otherAnswer = game.data[otherPartner(me)];
  const revealed = game.data.revealed;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await submit({ partner: me, selfAnswer: self, predictedAnswer: predicted });
  }

  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-500" />
          <h2 className="text-lg font-semibold">Predict Your Partner</h2>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Reset
        </button>
      </div>

      <div className="rounded-2xl bg-gradient-to-br from-violet-50 to-rose-50 p-5 dark:from-violet-900/20 dark:to-rose-900/20">
        <p className="text-lg font-medium leading-relaxed">
          {game.data.question.text}
        </p>
        <span className="mt-2 inline-block rounded-full bg-white/60 px-2.5 py-0.5 text-xs font-medium text-zinc-500 dark:bg-zinc-800/60">
          {game.data.question.category}
        </span>
      </div>

      {!revealed ? (
        <div className="mt-4">
          {!myAnswer ? (
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                value={self}
                onChange={(e) => setSelf(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                placeholder="Your real answer"
                required
              />
              <input
                value={predicted}
                onChange={(e) => setPredicted(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                placeholder={`What will ${them} say?`}
                required
              />
              <button className="w-full rounded-xl bg-violet-500 py-2.5 font-semibold text-white hover:bg-violet-600">
                Lock in answers
              </button>
            </form>
          ) : (
            <div className="rounded-2xl bg-zinc-50 p-4 text-center dark:bg-zinc-800/50">
              <Lock className="mx-auto h-5 w-5 text-zinc-400" />
              <p className="mt-1 text-sm text-zinc-500">
                Locked in. Waiting for {them} to answer…
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-rose-50 p-4 dark:bg-rose-900/20">
              <p className="text-xs font-semibold uppercase text-rose-500">
                You said
              </p>
              <p className="mt-1 font-medium">{myAnswer.self}</p>
              <p className="mt-1 text-sm text-zinc-500">
                Guessed {them}: “{myAnswer.predicted}”{" "}
                {myAnswer.correctPrediction ? "✅" : "❌"}
              </p>
            </div>
            <div className="rounded-2xl bg-violet-50 p-4 dark:bg-violet-900/20">
              <p className="text-xs font-semibold uppercase text-violet-500">
                {them} said
              </p>
              <p className="mt-1 font-medium">{otherAnswer.self}</p>
              <p className="mt-1 text-sm text-zinc-500">
                Guessed you: “{otherAnswer.predicted}”{" "}
                {otherAnswer.correctPrediction ? "✅" : "❌"}
              </p>
            </div>
          </div>
          <p className="flex items-center justify-center gap-1.5 text-xs text-zinc-400">
            <Eye className="h-3.5 w-3.5" /> Revealed — you both answered. New
            question tomorrow!
          </p>
        </div>
      )}
    </div>
  );
}
