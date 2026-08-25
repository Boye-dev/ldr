"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PARTNERS, PartnerKey, otherPartner } from "@/lib/config";
import { Target, RotateCcw } from "lucide-react";

const BOARD_SIZE = 6;
const SHIP_LENGTH = 4;

export function Battleship({ me }: { me: PartnerKey }) {
  const game = useQuery(api.games.getBattleship);
  const createGame = useMutation(api.games.createTodaysBattleship);
  const setShips = useMutation(api.games.setShips);
  const fireShot = useMutation(api.games.fire);
  const reset = useMutation(api.games.resetGame);

  const [selected, setSelected] = useState<number[]>([]);
  const [target, setTarget] = useState<number | null>(null);

  const them = PARTNERS[otherPartner(me)].name;

  useEffect(() => {
    if (game === null) createGame({});
  }, [game, createGame]);

  if (!game)
    return <div className="p-6 text-center text-zinc-400">Loading…</div>;

  const my = game.data[me];
  const themData = game.data[otherPartner(me)];
  const winner = game.data.winner;
  const turn = game.data.turn;

  function toggleCell(i: number) {
    if (my.shipsSet) return;
    if (selected.includes(i)) setSelected(selected.filter((x) => x !== i));
    else if (selected.length < SHIP_LENGTH) setSelected([...selected, i]);
  }

  async function handleSetShips() {
    if (selected.length !== SHIP_LENGTH) return;
    await setShips({ partner: me, positions: selected });
    setSelected([]);
  }

  async function handleFire() {
    if (target == null) return;
    await fireShot({ partner: me, index: target });
    setTarget(null);
  }

  async function handleReset() {
    if (confirm("Start a new Battleship?")) {
      await reset({ type: "battleship" });
      await createGame({});
    }
  }

  function renderCell(i: number, showShip: boolean, isMyTracking: boolean) {
    const shot = my.hits.find((h: any) => h.index === i);
    const isShip = my.shipsSet && my.board.includes(i) && !isMyTracking;
    const isOpponentShip = winner && themData.board.includes(i) && isMyTracking;

    return (
      <button
        key={i}
        disabled={!!shot || !isMyTracking || !!winner || turn !== me}
        onClick={() => isMyTracking && setTarget(i)}
        className={`aspect-square rounded-lg border text-sm transition ${
          shot
            ? shot.hit
              ? "border-rose-500 bg-rose-500 text-white"
              : "border-zinc-300 bg-zinc-200 text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800"
            : isShip
              ? "border-emerald-500 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
              : isOpponentShip
                ? "border-amber-500 bg-amber-100 text-amber-700 dark:bg-amber-900/30"
                : target === i
                  ? "border-rose-500 bg-rose-100 dark:bg-rose-900/30"
                  : "border-zinc-200 bg-zinc-50 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950"
        }`}
      >
        {shot
          ? shot.hit
            ? "💥"
            : "·"
          : isShip
            ? "🚢"
            : isOpponentShip
              ? "🚢"
              : ""}
      </button>
    );
  }

  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-rose-500" />
          <h2 className="text-lg font-semibold">Battleship</h2>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Reset
        </button>
      </div>

      {!my.shipsSet ? (
        <div className="space-y-3">
          <p className="text-sm text-zinc-500">
            Hide your {SHIP_LENGTH}-cell ship. {them} will hunt for it.
          </p>
          <div className="grid grid-cols-6 gap-1.5">
            {Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, i) => (
              <button
                key={i}
                onClick={() => toggleCell(i)}
                className={`aspect-square rounded-lg border text-xs font-semibold transition ${
                  selected.includes(i)
                    ? "border-emerald-500 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30"
                    : "border-zinc-200 bg-zinc-50 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950"
                }`}
              >
                {selected.includes(i) ? "🚢" : ""}
              </button>
            ))}
          </div>
          <button
            onClick={handleSetShips}
            disabled={selected.length !== SHIP_LENGTH}
            className="w-full rounded-xl bg-rose-500 py-2.5 font-semibold text-white hover:bg-rose-600 disabled:opacity-50"
          >
            Place ship ({selected.length}/{SHIP_LENGTH})
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          <div>
            <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Your ship (remember where it is)
            </p>
            <div className="grid grid-cols-6 gap-1.5 opacity-90">
              {Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, i) =>
                renderCell(i, true, false),
              )}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {winner ? "Final board" : `Fire at ${them}'s ship`}
              </p>
              {winner ? (
                <p className="text-sm font-semibold text-rose-600">
                  {winner === me ? `🎉 You sunk ${them}!` : `${them} sunk you!`}
                </p>
              ) : (
                <p className="text-sm text-zinc-500">
                  {game.data.turn === me
                    ? "🎯 Your shot"
                    : `${them} is aiming…`}
                </p>
              )}
            </div>
            <div className="grid grid-cols-6 gap-1.5">
              {Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, i) =>
                renderCell(i, winner === me, true),
              )}
            </div>
          </div>

          {game.data.turn === me && !winner && (
            <button
              onClick={handleFire}
              disabled={target == null}
              className="w-full rounded-xl bg-rose-500 py-2.5 font-semibold text-white hover:bg-rose-600 disabled:opacity-50"
            >
              Fire!
            </button>
          )}
        </div>
      )}
    </div>
  );
}
