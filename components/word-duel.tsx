"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PARTNERS, PartnerKey, otherPartner } from "@/lib/config";
import { KeyRound, Dices, Lightbulb, RotateCcw } from "lucide-react";

export function WordDuel({ me }: { me: PartnerKey }) {
  const game = useQuery(api.games.todaysWord);
  const createGame = useMutation(api.games.createTodaysWord);
  const sendWord = useMutation(api.games.setWord);
  const sendGuess = useMutation(api.games.guessWord);
  const useHint = useMutation(api.games.useHint);
  const reset = useMutation(api.games.resetGame);

  const [secret, setSecret] = useState("");
  const [hint, setHint] = useState("");
  const [currentGuess, setCurrentGuess] = useState("");

  const them = PARTNERS[otherPartner(me)].name;

  useEffect(() => {
    if (game === null) createGame({});
  }, [game, createGame]);

  if (!game)
    return <div className="p-6 text-center text-zinc-400">Loading…</div>;

  const myWordKey = me === "A" ? "AWord" : "BWord";
  const myHintKey = me === "A" ? "AHint" : "BHint";
  const theirHintKey = me === "A" ? "BHint" : "AHint";
  const myGuesses = me === "A" ? game.data.AGuesses : game.data.BGuesses;
  const theirGuesses = me === "A" ? game.data.BGuesses : game.data.AGuesses;
  const myRevealed = me === "A" ? game.data.ARevealed : game.data.BRevealed;
  const myRemaining = me === "A" ? game.data.ARemaining : game.data.BRemaining;
  const target = me === "A" ? game.data.BWord : game.data.AWord;
  const targetRevealed = me === "A" ? game.data.ARevealed : game.data.BRevealed;
  const turn = game.data.turn;
  const bothSet = game.data.AWord && game.data.BWord;

  async function handleSetWord(e: React.FormEvent) {
    e.preventDefault();
    await sendWord({ partner: me, word: secret, hint });
    setSecret("");
    setHint("");
  }

  async function handleGuess(e: React.FormEvent) {
    e.preventDefault();
    if (myRemaining <= 0) return;
    await sendGuess({ partner: me, guess: currentGuess });
    setCurrentGuess("");
  }

  async function handleHint() {
    if (myRemaining <= 0) return;
    await useHint({ partner: me });
  }

  async function handleReset() {
    if (confirm("Start a new Word Duel?")) {
      await reset({ type: "word" });
      await createGame({});
    }
  }

  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Dices className="h-5 w-5 text-teal-500" />
          <h2 className="text-lg font-semibold">Word Duel</h2>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Reset
        </button>
      </div>

      {!game.data[myWordKey] ? (
        <form onSubmit={handleSetWord} className="space-y-3">
          <p className="text-sm text-zinc-500">
            Pick a secret word and an optional hint. {them} gets 3 tries to
            guess it.
          </p>
          <input
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            placeholder="your secret word"
            required
          />
          <input
            value={hint}
            onChange={(e) => setHint(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            placeholder={`Optional hint for ${them} (e.g. a type of food)`}
          />
          <button className="w-full rounded-xl bg-teal-500 py-2.5 font-semibold text-white hover:bg-teal-600">
            Set word
          </button>
        </form>
      ) : bothSet ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-2xl bg-zinc-50 p-3 dark:bg-zinc-800/50">
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              Your trials left: {" ".repeat(3 - (3 - myRemaining))}
              <span className="font-semibold text-teal-600">
                {myRemaining} / 3
              </span>
            </p>
            <p className="text-sm text-zinc-500">
              {turn === me ? "🎯 Your turn" : `Waiting for ${them}…`}
            </p>
          </div>

          {game.data[theirHintKey] && (
            <p className="rounded-2xl bg-amber-50 p-3 text-sm text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
              💡 Hint: {game.data[theirHintKey]}
            </p>
          )}

          {target && (
            <div className="flex justify-center gap-1.5">
              {target.split("").map((ch: string, i: number) => (
                <div
                  key={i}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-lg font-bold dark:bg-zinc-800"
                >
                  {targetRevealed.includes(i) ? ch : "·"}
                </div>
              ))}
            </div>
          )}

          {game.data.winner ? (
            <p className="rounded-2xl bg-teal-50 p-3 text-center font-medium text-teal-700 dark:bg-teal-900/20 dark:text-teal-300">
              {game.data.winner === me
                ? `� You guessed ${them}'s word!`
                : `${them} guessed your word!`}
            </p>
          ) : (
            turn === me &&
            myRemaining > 0 && (
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
            )
          )}

          {!game.data.winner && turn === me && myRemaining > 0 && target && (
            <button
              onClick={handleHint}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-100 py-2.5 text-sm font-semibold text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-300"
            >
              <Lightbulb className="h-4 w-4" /> Use hint (costs 1 trial, reveals
              a letter)
            </button>
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

          {myRevealed.length > 0 && (
            <p className="text-center text-xs text-zinc-400">
              Revealed {myRevealed.length} letter
              {myRevealed.length === 1 ? "" : "s"} from hints
            </p>
          )}
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
