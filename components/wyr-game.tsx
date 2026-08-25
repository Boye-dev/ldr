"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useSession } from "@/components/session";
import { PARTNERS, otherPartner } from "@/lib/config";
import { HelpCircle, RefreshCcw, CheckCircle2 } from "lucide-react";

export function WyrGame() {
  const { me } = useSession();
  const them = PARTNERS[otherPartner(me)].name;
  const game = useQuery(api.games.todaysWyr);
  const createGame = useMutation(api.games.createTodaysWyr);
  const submit = useMutation(api.games.submitWyr);
  const reset = useMutation(api.games.resetGame);

  const [choice, setChoice] = useState<"A" | "B" | null>(null);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (game === null) createGame({});
  }, [game, createGame]);

  async function handleSubmit() {
    if (!choice) return;
    await submit({ partner: me, choice, note });
    setNote("");
  }

  async function handleReset() {
    if (confirm("Get a fresh question?")) {
      await reset({ type: "wyr" });
      await createGame({});
    }
  }

  if (!game) {
    return (
      <div className="rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
        <HelpCircle className="mx-auto h-8 w-8 text-violet-500" />
        <p className="mt-3 text-zinc-500">Loading today&apos;s question...</p>
      </div>
    );
  }

  const q = game.data.question as { optionA: string; optionB: string };
  const myAnswer = game.data[me];
  const theirAnswer = game.data[otherPartner(me)];
  const revealed = game.data.revealed;
  const bothMatch = revealed && myAnswer?.choice === theirAnswer?.choice;

  const optionText = (c: string) => (c === "A" ? q.optionA : q.optionB);

  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-violet-500" />
          <h2 className="text-lg font-semibold">Would You Rather</h2>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
        >
          <RefreshCcw className="h-3.5 w-3.5" /> New
        </button>
      </div>

      <p className="mb-5 text-center text-base font-medium text-zinc-800 dark:text-zinc-100">
        Would you rather...
      </p>

      <div className="grid gap-3">
        <button
          onClick={() => setChoice("A")}
          disabled={!!myAnswer}
          className={`rounded-2xl border-2 p-4 text-left transition ${
            choice === "A"
              ? "border-violet-500 bg-violet-50 dark:bg-violet-900/20"
              : "border-zinc-100 bg-zinc-50 hover:border-violet-300 dark:border-zinc-800 dark:bg-zinc-950"
          }`}
        >
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {q.optionA}
          </span>
        </button>
        <button
          onClick={() => setChoice("B")}
          disabled={!!myAnswer}
          className={`rounded-2xl border-2 p-4 text-left transition ${
            choice === "B"
              ? "border-violet-500 bg-violet-50 dark:bg-violet-900/20"
              : "border-zinc-100 bg-zinc-50 hover:border-violet-300 dark:border-zinc-800 dark:bg-zinc-950"
          }`}
        >
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {q.optionB}
          </span>
        </button>
      </div>

      {!myAnswer && (
        <div className="mt-4 space-y-3">
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Why? (optional)"
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm focus:border-violet-400 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
          />
          <button
            onClick={handleSubmit}
            disabled={!choice}
            className="w-full rounded-xl bg-violet-500 py-3 font-semibold text-white hover:bg-violet-600 disabled:opacity-60"
          >
            Submit
          </button>
        </div>
      )}

      {myAnswer && !revealed && (
        <div className="mt-5 rounded-2xl bg-zinc-50 p-4 text-center text-sm text-zinc-600 dark:bg-zinc-900/50 dark:text-zinc-300">
          You chose{" "}
          <strong className="text-zinc-900 dark:text-zinc-100">
            {optionText(myAnswer.choice)}
          </strong>
          . Waiting for {them}...
        </div>
      )}

      {revealed && (
        <div className="mt-5 space-y-3 rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-900/50">
          <div className="flex items-center gap-2">
            {bothMatch ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : null}
            <p className="font-medium">
              {bothMatch ? "You agree!" : "You chose differently"}
            </p>
          </div>
          <div className="space-y-2 text-sm">
            <p>
              <span className="font-semibold">You:</span>{" "}
              {optionText(myAnswer.choice)}
              {myAnswer.note && (
                <span className="text-zinc-500"> — "{myAnswer.note}"</span>
              )}
            </p>
            <p>
              <span className="font-semibold">{them}:</span>{" "}
              {optionText(theirAnswer.choice)}
              {theirAnswer.note && (
                <span className="text-zinc-500"> — "{theirAnswer.note}"</span>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
