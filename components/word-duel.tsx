"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { KeyRound, Dices } from "lucide-react";

export function WordDuel({ code, me }: { code: string; me: "A" | "B" }) {
  const game = useQuery(api.games.todaysWord, { code });
  const createGame = useMutation(api.games.createTodaysWord);
  const sendWord = useMutation(api.games.setWord);
  const sendGuess = useMutation(api.games.guessWord);

  const [secret, setSecret] = useState("");
  const [currentGuess, setCurrentGuess] = useState("");

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

  const myWordKey = me === "A" ? "AWord" : "BWord";
  const theirWordKey = me === "A" ? "BWord" : "AWord";
  const myGuesses = me === "A" ? game.data.AGuesses : game.data.BGuesses;
  const turn = game.data.turn;
  const bothSet = game.data.AWord && game.data.BWord;

  async function handleSetWord(e: React.FormEvent) {
    e.preventDefault();
    await sendWord({ code, partner: me, word: secret });
    setSecret("");
  }

  async function handleGuess(e: React.FormEvent) {
    e.preventDefault();
    await sendGuess({ code, partner: me, guess: currentGuess });
    setCurrentGuess("");
  }

  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
      <div className="mb-4 flex items-center gap-2">
        <Dices className="h-5 w-5 text-teal-500" />
        <h2 className="text-lg font-semibold">Word Duel</h2>
      </div>

      {!game.data[myWordKey] ? (
        <form onSubmit={handleSetWord} className="space-y-3">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Pick a secret short word. Your partner will try to guess it.
          </p>
          <input
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            placeholder="your secret word"
            required
          />
          <button className="w-full rounded-xl bg-teal-600 py-2.5 font-semibold text-white hover:bg-teal-700">
            Set secret word
          </button>
        </form>
      ) : bothSet ? (
        <div className="space-y-4">
          {game.data.winner ? (
            <p className="text-center font-medium text-teal-700 dark:text-teal-300">
              {game.data.winner === me
                ? "You guessed it!"
                : "They guessed your word!"}
            </p>
          ) : (
            <p className="text-center text-sm text-zinc-500">
              {turn === me ? "Your turn to guess" : "Waiting for their guess"}
            </p>
          )}

          {turn === me && !game.data.winner && (
            <form onSubmit={handleGuess} className="flex gap-2">
              <input
                value={currentGuess}
                onChange={(e) => setCurrentGuess(e.target.value)}
                className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                placeholder="your guess"
                required
              />
              <button className="rounded-xl bg-teal-600 px-4 font-semibold text-white hover:bg-teal-700">
                Guess
              </button>
            </form>
          )}

          <div className="space-y-2">
            {myGuesses?.map((g: any, i: number) => (
              <div
                key={i}
                className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm ${
                  g.correct
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                    : "bg-zinc-50 dark:bg-zinc-900/50"
                }`}
              >
                <span>{g.guess}</span>
                <span>{g.correct ? "✓" : "✗"}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-zinc-50 p-4 text-center text-sm text-zinc-600 dark:bg-zinc-900/50 dark:text-zinc-400">
          <KeyRound className="mx-auto mb-2 h-5 w-5 text-zinc-400" />
          Your secret word is set. Waiting for your partner.
        </div>
      )}
    </div>
  );
}
