"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PARTNERS, PartnerKey, otherPartner } from "@/lib/config";
import { KeyRound, Dices } from "lucide-react";

export function WordDuel({ me }: { me: PartnerKey }) {
  const game = useQuery(api.games.todaysWord);
  const createGame = useMutation(api.games.createTodaysWord);
  const sendWord = useMutation(api.games.setWord);
  const sendGuess = useMutation(api.games.guessWord);

  const [secret, setSecret] = useState("");
  const [currentGuess, setCurrentGuess] = useState("");

  const them = PARTNERS[otherPartner(me)].name;

  useEffect(() => {
    if (game === null) createGame({});
  }, [game, createGame]);

  if (!game)
    return <div className="p-6 text-center text-zinc-400">Loading…</div>;

  const myWordKey = me === "A" ? "AWord" : "BWord";
  const myGuesses = me === "A" ? game.data.AGuesses : game.data.BGuesses;
  const theirGuesses = me === "A" ? game.data.BGuesses : game.data.AGuesses;
  const turn = game.data.turn;
  const bothSet = game.data.AWord && game.data.BWord;

  async function handleSetWord(e: React.FormEvent) {
    e.preventDefault();
    await sendWord({ partner: me, word: secret });
    setSecret("");
  }

  async function handleGuess(e: React.FormEvent) {
    e.preventDefault();
    await sendGuess({ partner: me, guess: currentGuess });
    setCurrentGuess("");
  }

  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
      <div className="mb-4 flex items-center gap-2">
        <Dices className="h-5 w-5 text-teal-500" />
        <h2 className="text-lg font-semibold">Word Duel</h2>
      </div>

      {!game.data[myWordKey] ? (
        <form onSubmit={handleSetWord} className="space-y-3">
          <p className="text-sm text-zinc-500">
            Pick a secret short word. {them} will try to guess it — you&apos;ll
            take turns.
          </p>
          <div className="flex gap-2">
            <input
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm dark:border-zinc-800 dark:bg-zinc-950"
              placeholder="your secret word"
              required
            />
            <button className="rounded-xl bg-teal-500 px-4 font-semibold text-white hover:bg-teal-600">
              Set
            </button>
          </div>
        </form>
      ) : bothSet ? (
        <div className="space-y-4">
          {game.data.winner ? (
            <p className="rounded-2xl bg-teal-50 p-3 text-center font-medium text-teal-700 dark:bg-teal-900/20 dark:text-teal-300">
              {game.data.winner === me
                ? `🎉 You guessed ${them}'s word!`
                : `${them} guessed your word!`}
            </p>
          ) : (
            <p className="text-center text-sm text-zinc-500">
              {turn === me ? "🎯 Your turn to guess" : `Waiting for ${them}…`}
            </p>
          )}

          {turn === me && !game.data.winner && (
            <form onSubmit={handleGuess} className="flex gap-2">
              <input
                value={currentGuess}
                onChange={(e) => setCurrentGuess(e.target.value)}
                className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                placeholder={`Guess ${them}'s word`}
                required
              />
              <button className="rounded-xl bg-teal-500 px-4 font-semibold text-white hover:bg-teal-600">
                Guess
              </button>
            </form>
          )}

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase text-zinc-400">
                Your guesses
              </p>
              <div className="space-y-1.5">
                {myGuesses?.map((g: any, i: number) => (
                  <div
                    key={i}
                    className={`rounded-lg px-2.5 py-1.5 ${
                      g.correct
                        ? "bg-teal-100 font-medium text-teal-700 dark:bg-teal-900/30"
                        : "bg-zinc-50 text-zinc-500 dark:bg-zinc-800/50"
                    }`}
                  >
                    {g.guess} {g.correct && "✓"}
                  </div>
                ))}
                {!myGuesses?.length && (
                  <p className="text-xs text-zinc-400">None yet</p>
                )}
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase text-zinc-400">
                {them}&apos;s guesses
              </p>
              <div className="space-y-1.5">
                {theirGuesses?.map((g: any, i: number) => (
                  <div
                    key={i}
                    className={`rounded-lg px-2.5 py-1.5 ${
                      g.correct
                        ? "bg-teal-100 font-medium text-teal-700 dark:bg-teal-900/30"
                        : "bg-zinc-50 text-zinc-500 dark:bg-zinc-800/50"
                    }`}
                  >
                    {g.guess} {g.correct && "✓"}
                  </div>
                ))}
                {!theirGuesses?.length && (
                  <p className="text-xs text-zinc-400">None yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-zinc-50 p-4 text-center text-sm text-zinc-500 dark:bg-zinc-800/50">
          <KeyRound className="mx-auto mb-1.5 h-5 w-5 text-zinc-400" />
          Your word is set. Waiting for {them} to pick theirs.
        </div>
      )}
    </div>
  );
}
