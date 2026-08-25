"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Target } from "lucide-react";

const BOARD_SIZE = 6;
const SHIP_LENGTH = 4;

export function Battleship({ code, me }: { code: string; me: "A" | "B" }) {
  const game = useQuery(api.games.getBattleship, { code });
  const createGame = useMutation(api.games.createTodaysBattleship);
  const setShips = useMutation(api.games.setShips);
  const fireShot = useMutation(api.games.fire);

  const [selected, setSelected] = useState<number[]>([]);
  const [target, setTarget] = useState<number | null>(null);

  useEffect(() => {
    if (game === null) createGame({ code });
  }, [game, createGame, code]);

  if (game === undefined)
    return <div className="p-4 text-center text-zinc-500">Loading…</div>;
  if (game === null)
    return (
      <div className="p-4 text-center text-zinc-500">Preparing board…</div>
    );

  const myKey = me === "A" ? "A" : "B";
  const theirKey = me === "A" ? "B" : "A";
  const my = game.data[myKey];
  const their = game.data[theirKey];

  function toggleCell(i: number) {
    if (my.shipsSet) return;
    if (selected.includes(i)) setSelected(selected.filter((x) => x !== i));
    else if (selected.length < SHIP_LENGTH) setSelected([...selected, i]);
  }

  async function handleSetShips() {
    if (selected.length !== SHIP_LENGTH) return;
    await setShips({ code, partner: me, positions: selected });
    setSelected([]);
  }

  async function handleFire() {
    if (target == null) return;
    await fireShot({ code, partner: me, index: target });
    setTarget(null);
  }

  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
      <div className="mb-4 flex items-center gap-2">
        <Target className="h-5 w-5 text-rose-500" />
        <h2 className="text-lg font-semibold">Battleship</h2>
      </div>

      {!my.shipsSet ? (
        <div className="space-y-3">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Choose {SHIP_LENGTH} cells for your ship.
          </p>
          <div className="grid grid-cols-6 gap-2">
            {Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, i) => (
              <button
                key={i}
                onClick={() => toggleCell(i)}
                className={`aspect-square rounded-lg border text-sm font-semibold transition ${
                  selected.includes(i)
                    ? "border-rose-500 bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
                    : "border-zinc-200 bg-zinc-50 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <button
            onClick={handleSetShips}
            disabled={selected.length !== SHIP_LENGTH}
            className="w-full rounded-xl bg-rose-600 py-2.5 font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
          >
            Place ship
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {game.data.winner ? (
            <p className="text-center font-medium text-rose-700 dark:text-rose-300">
              {game.data.winner === me
                ? "You sunk their ship!"
                : "They sunk your ship!"}
            </p>
          ) : (
            <p className="text-center text-sm text-zinc-500">
              {game.data.turn === me ? "Your turn" : "Their turn"}
            </p>
          )}

          <div className="grid grid-cols-6 gap-2">
            {Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, i) => {
              const hit = my.hits.find((h: any) => h.index === i);
              const guessed = hit !== undefined;
              const isTarget = target === i;
              return (
                <button
                  key={i}
                  disabled={
                    guessed || game.data.turn !== me || game.data.winner
                  }
                  onClick={() => setTarget(i)}
                  className={`aspect-square rounded-lg border text-sm font-semibold transition ${
                    guessed
                      ? hit?.hit
                        ? "bg-rose-500 text-white"
                        : "bg-zinc-200 text-zinc-500 dark:bg-zinc-800"
                      : isTarget
                        ? "border-rose-500 bg-rose-100 dark:bg-rose-900/30"
                        : "border-zinc-200 bg-zinc-50 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950"
                  }`}
                >
                  {guessed ? (hit?.hit ? "×" : "·") : i + 1}
                </button>
              );
            })}
          </div>

          <button
            onClick={handleFire}
            disabled={
              target == null || game.data.turn !== me || game.data.winner
            }
            className="w-full rounded-xl bg-rose-600 py-2.5 font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
          >
            Fire
          </button>
        </div>
      )}
    </div>
  );
}
