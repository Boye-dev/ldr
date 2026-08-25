"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useSession } from "@/components/session";
import { PARTNERS, otherPartner } from "@/lib/config";
import { TextSearch, RefreshCcw, CheckCircle2, Frown } from "lucide-react";

export function TwoTruthsGame() {
  const { me } = useSession();
  const them = PARTNERS[otherPartner(me)].name;
  const game = useQuery(api.games.todaysTwoTruths);
  const createGame = useMutation(api.games.createTodaysTwoTruths);
  const submitStatements = useMutation(api.games.submitStatements);
  const submitGuess = useMutation(api.games.submitLieGuess);
  const reset = useMutation(api.games.resetGame);

  const [statements, setStatements] = useState<
    { text: string; isLie: boolean }[]
  >([
    { text: "", isLie: false },
    { text: "", isLie: false },
    { text: "", isLie: false },
  ]);

  useEffect(() => {
    if (game === null) createGame({});
  }, [game, createGame]);

  async function handleSubmitStatements() {
    const valid = statements.filter((s) => s.text.trim()).length === 3;
    const oneLie = statements.filter((s) => s.isLie).length === 1;
    if (!valid || !oneLie) {
      alert("Enter 3 statements and mark exactly one as the lie.");
      return;
    }
    await submitStatements({ partner: me, statements });
  }

  async function handleGuess(idx: number) {
    await submitGuess({ partner: me, guess: idx });
  }

  async function handleReset() {
    if (confirm("Start a fresh round?")) {
      await reset({ type: "twotruths" });
      await createGame({});
    }
  }

  if (!game) {
    return (
      <div className="rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
        <TextSearch className="mx-auto h-8 w-8 text-pink-500" />
        <p className="mt-3 text-zinc-500">Loading today&apos;s round...</p>
      </div>
    );
  }

  const data = game.data as {
    statements: { text: string; isLie: boolean }[] | null;
    author: "A" | "B" | null;
    A: { guess?: number; done?: boolean } | null;
    B: { guess?: number; done?: boolean } | null;
    revealed: boolean;
    winner: "A" | "B" | null;
  };
  const iamAuthor = data.author === me;
  const myPart = data[me];
  const revealed = data.revealed;
  const winner = data.winner;

  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TextSearch className="h-5 w-5 text-pink-500" />
          <h2 className="text-lg font-semibold">Two Truths and a Lie</h2>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
        >
          <RefreshCcw className="h-3.5 w-3.5" /> New
        </button>
      </div>

      <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-300">
        One of you writes two truths and a lie. The other guesses the lie.
      </p>

      {!data.statements ? (
        <div className="space-y-3">
          <p className="text-sm font-medium">Your three statements:</p>
          {statements.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="text"
                value={s.text}
                onChange={(e) => {
                  const next = [...statements];
                  next[i] = { ...next[i], text: e.target.value };
                  setStatements(next);
                }}
                placeholder={`Statement ${i + 1}`}
                className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm focus:border-pink-400 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
              />
              <button
                onClick={() => {
                  const next = statements.map((item, idx) => ({
                    ...item,
                    isLie: idx === i,
                  }));
                  setStatements(next);
                }}
                className={`rounded-xl border-2 px-3 py-2.5 text-xs font-semibold transition ${
                  s.isLie
                    ? "border-pink-500 bg-pink-50 text-pink-600 dark:bg-pink-900/20"
                    : "border-zinc-200 text-zinc-500 dark:border-zinc-800"
                }`}
              >
                {s.isLie ? "Lie" : "Truth"}
              </button>
            </div>
          ))}
          <button
            onClick={handleSubmitStatements}
            className="w-full rounded-xl bg-pink-500 py-3 font-semibold text-white hover:bg-pink-600"
          >
            Set the statements
          </button>
        </div>
      ) : iamAuthor ? (
        <div className="space-y-4">
          {!revealed ? (
            <div className="rounded-2xl bg-zinc-50 p-4 text-center text-sm dark:bg-zinc-900/50">
              You wrote the statements. Waiting for {them} to guess...
            </div>
          ) : (
            <div className="space-y-3 rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-900/50">
              <div className="flex items-center gap-2">
                {winner === me ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <Frown className="h-5 w-5 text-rose-500" />
                )}
                <p className="font-medium">
                  {winner === me
                    ? "You fooled them!"
                    : `${them} caught the lie!`}
                </p>
              </div>
              <ul className="space-y-2 text-sm">
                {data.statements.map((s, i) => (
                  <li
                    key={i}
                    className={`flex items-center gap-2 rounded-xl p-2 ${
                      s.isLie
                        ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30"
                        : "bg-green-100 text-green-700 dark:bg-green-900/30"
                    }`}
                  >
                    {s.isLie ? "🤥" : "✓"} {s.text}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : !myPart ? (
        <div className="space-y-3">
          <p className="text-sm font-medium">
            Which one is the lie? {them} wrote these:
          </p>
          {data.statements.map((s, i) => (
            <button
              key={i}
              onClick={() => handleGuess(i)}
              className="w-full rounded-2xl border-2 border-zinc-100 bg-zinc-50 p-4 text-left text-sm font-medium transition hover:border-pink-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-pink-900"
            >
              {i + 1}. {s.text}
            </button>
          ))}
        </div>
      ) : revealed ? (
        <div className="space-y-3 rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-900/50">
          <div className="flex items-center gap-2">
            {winner === me ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <Frown className="h-5 w-5 text-rose-500" />
            )}
            <p className="font-medium">
              {winner === me ? "You caught the lie!" : "They fooled you!"}
            </p>
          </div>
          <ul className="space-y-2 text-sm">
            {data.statements.map((s, i) => (
              <li
                key={i}
                className={`flex items-center gap-2 rounded-xl p-2 ${
                  s.isLie
                    ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30"
                    : "bg-green-100 text-green-700 dark:bg-green-900/30"
                }`}
              >
                {s.isLie ? "🤥" : "✓"} {s.text}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="rounded-2xl bg-zinc-50 p-4 text-center text-sm dark:bg-zinc-900/50">
          Your guess is locked in. Waiting for {them} to reveal...
        </div>
      )}
    </div>
  );
}
