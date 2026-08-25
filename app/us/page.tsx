"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useSession } from "@/components/session";
import { PARTNERS, otherPartner } from "@/lib/config";
import { BookHeart, Sparkles, Dices, Target, Moon } from "lucide-react";

export default function UsPage() {
  const { me } = useSession();
  const history = useQuery(api.games.history);
  const stats = useQuery(api.games.scoreboard);
  const couple = useQuery(api.couples.get);

  const them = PARTNERS[otherPartner(me)].name;

  const daysTogether = couple
    ? Math.floor((Date.now() - couple.createdAt) / (1000 * 60 * 60 * 24))
    : 0;

  const revealed = history?.filter((g) => g.type === "predict" && g.data.revealed) || [];
  const handoffs = history?.filter((g) => g.type === "handoff" && g.data.openedAt) || [];

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Us 💕</h1>

      <div className="rounded-3xl bg-gradient-to-br from-rose-500 to-violet-500 p-6 text-center text-white">
        <BookHeart className="mx-auto h-8 w-8" />
        <p className="mt-2 text-3xl font-bold">Adeboye & Faith</p>
        <p className="mt-1 text-sm opacity-90">
          🇨🇦 Ontario ↔ Nigeria 🇳🇬 · {daysTogether} days on Closer
        </p>
      </div>

      {stats && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-white p-4 text-center shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
            <Sparkles className="mx-auto h-5 w-5 text-amber-500" />
            <p className="mt-1 text-xl font-bold">{stats.predictRounds}</p>
            <p className="text-xs text-zinc-400">questions answered</p>
          </div>
          <div className="rounded-2xl bg-white p-4 text-center shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
            <Dices className="mx-auto h-5 w-5 text-teal-500" />
            <p className="mt-1 text-xl font-bold">{stats.wordWinsA + stats.wordWinsB}</p>
            <p className="text-xs text-zinc-400">word duels played</p>
          </div>
          <div className="rounded-2xl bg-white p-4 text-center shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
            <Target className="mx-auto h-5 w-5 text-rose-500" />
            <p className="mt-1 text-xl font-bold">
              {stats.battleshipWinsA + stats.battleshipWinsB}
            </p>
            <p className="text-xs text-zinc-400">ships sunk</p>
          </div>
        </div>
      )}

      {revealed.length > 0 && (
        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
          <h2 className="mb-3 flex items-center gap-2 font-semibold">
            <Sparkles className="h-5 w-5 text-amber-500" /> Past questions
          </h2>
          <div className="space-y-3">
            {revealed.slice(0, 10).map((g) => (
              <div
                key={g._id}
                className="rounded-2xl border border-zinc-100 p-4 dark:border-zinc-800"
              >
                <p className="text-sm font-medium">{g.data.question.text}</p>
                <div className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
                  <p className="text-zinc-500">
                    <span className="font-medium text-rose-500">
                      {PARTNERS[me].name}:
                    </span>{" "}
                    {g.data[me]?.self}
                  </p>
                  <p className="text-zinc-500">
                    <span className="font-medium text-violet-500">{them}:</span>{" "}
                    {g.data[otherPartner(me)]?.self}
                  </p>
                </div>
                <p className="mt-1 text-xs text-zinc-400">{g.dayKey}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {handoffs.length > 0 && (
        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
          <h2 className="mb-3 flex items-center gap-2 font-semibold">
            <Moon className="h-5 w-5 text-indigo-500" /> Notes we&apos;ve left each other
          </h2>
          <div className="space-y-2">
            {handoffs.slice(0, 10).map((g) => (
              <div
                key={g._id}
                className="rounded-2xl bg-indigo-50 p-3 text-sm dark:bg-indigo-900/10"
              >
                <p className="whitespace-pre-wrap">{g.data.note}</p>
                <p className="mt-1 text-xs text-zinc-400">
                  from {g.data.from === me ? "you" : them} · {g.dayKey}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {revealed.length === 0 && handoffs.length === 0 && (
        <p className="py-8 text-center text-sm text-zinc-400">
          Your shared history will collect here as you play and leave notes. 💌
        </p>
      )}
    </div>
  );
}
