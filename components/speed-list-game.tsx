"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useSession } from "@/components/session";
import { PARTNERS, otherPartner } from "@/lib/config";
import { List, RefreshCcw, Sparkles } from "lucide-react";

export function SpeedListGame() {
  const { me } = useSession();
  const them = PARTNERS[otherPartner(me)].name;
  const game = useQuery(api.games.todaysSpeedList);
  const createGame = useMutation(api.games.createTodaysSpeedList);
  const submit = useMutation(api.games.submitSpeedList);
  const reset = useMutation(api.games.resetGame);

  const [items, setItems] = useState<string[]>(["", "", ""]);

  useEffect(() => {
    if (game === null) createGame({});
  }, [game, createGame]);

  async function handleSubmit() {
    const valid = items.filter((i) => i.trim()).slice(0, 5);
    if (valid.length < 1) {
      alert("Add at least one item.");
      return;
    }
    await submit({ partner: me, items: valid });
  }

  async function handleReset() {
    if (confirm("Get a new list prompt?")) {
      await reset({ type: "speedlist" });
      await createGame({});
    }
  }

  if (!game) {
    return (
      <div className="rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
        <List className="mx-auto h-8 w-8 text-cyan-500" />
        <p className="mt-3 text-zinc-500">Loading today&apos;s list...</p>
      </div>
    );
  }

  const data = game.data as {
    prompt: string;
    A: { items: string[] } | null;
    B: { items: string[] } | null;
    revealed: boolean;
    matches: number;
  };
  const myAnswer = data[me];
  const theirAnswer = data[otherPartner(me)];
  const revealed = data.revealed;

  function updateItem(idx: number, value: string) {
    const next = [...items];
    next[idx] = value;
    if (idx === next.length - 1 && value.trim()) next.push("");
    if (next.length > 5) next.length = 5;
    setItems(next);
  }

  const overlap =
    revealed && myAnswer && theirAnswer
      ? myAnswer.items.filter((i) =>
          theirAnswer.items
            .map((t) => t.toLowerCase())
            .includes(i.toLowerCase()),
        )
      : [];

  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <List className="h-5 w-5 text-cyan-500" />
          <h2 className="text-lg font-semibold">Speed List</h2>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
        >
          <RefreshCcw className="h-3.5 w-3.5" /> New
        </button>
      </div>

      <div className="rounded-2xl bg-cyan-50 p-4 dark:bg-cyan-900/20">
        <p className="text-sm font-medium text-cyan-800 dark:text-cyan-200">
          {data.prompt}
        </p>
      </div>

      {!myAnswer ? (
        <div className="mt-4 space-y-2">
          {items.map((item, i) => (
            <input
              key={i}
              type="text"
              value={item}
              onChange={(e) => updateItem(i, e.target.value)}
              placeholder={`Item ${i + 1}`}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm focus:border-cyan-400 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
            />
          ))}
          <p className="text-xs text-zinc-500">Add up to 5 items.</p>
          <button
            onClick={handleSubmit}
            className="w-full rounded-xl bg-cyan-500 py-3 font-semibold text-white hover:bg-cyan-600"
          >
            Submit list
          </button>
        </div>
      ) : !revealed ? (
        <div className="mt-5 rounded-2xl bg-zinc-50 p-4 text-center text-sm dark:bg-zinc-900/50">
          Your list is in. Waiting for {them}...
          <ul className="mt-3 space-y-1 text-left text-sm">
            {myAnswer.items.map((item, i) => (
              <li key={i} className="rounded-lg bg-white p-2 dark:bg-zinc-900">
                • {item}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="mt-5 space-y-4 rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-900/50">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            <p className="font-medium">
              {data.matches} match{data.matches === 1 ? "" : "es"}!
            </p>
          </div>

          {overlap.length > 0 && (
            <div className="rounded-xl bg-green-100 p-3 text-sm text-green-800 dark:bg-green-900/30 dark:text-green-200">
              <p className="font-semibold">You both said:</p>
              <ul className="mt-1 space-y-1">
                {overlap.map((item, i) => (
                  <li key={i}>• {item}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-1 text-sm font-semibold">You</p>
              <ul className="space-y-1 text-sm">
                {myAnswer.items.map((item, i) => (
                  <li
                    key={i}
                    className={`rounded-lg p-2 ${
                      overlap.includes(item)
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200"
                        : "bg-white dark:bg-zinc-900"
                    }`}
                  >
                    • {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-1 text-sm font-semibold">{them}</p>
              <ul className="space-y-1 text-sm">
                {(theirAnswer?.items || []).map((item, i) => (
                  <li
                    key={i}
                    className={`rounded-lg p-2 ${
                      (myAnswer?.items || []).some(
                        (m) => m.toLowerCase() === item.toLowerCase(),
                      )
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200"
                        : "bg-white dark:bg-zinc-900"
                    }`}
                  >
                    • {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
