"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useSession } from "@/components/session";
import { PARTNERS, otherPartner } from "@/lib/config";
import {
  Sparkles,
  Dices,
  Target,
  HelpCircle,
  TextSearch,
  Trophy,
  ChevronRight,
} from "lucide-react";

export default function GamesPage() {
  const { me } = useSession();
  const predict = useQuery(api.games.todaysPredict);
  const wyr = useQuery(api.games.todaysWyr);
  const twoTruths = useQuery(api.games.todaysTwoTruths);
  const word = useQuery(api.games.todaysWord);
  const battleship = useQuery(api.games.getBattleship);
  const stats = useQuery(api.games.scoreboard);

  const them = PARTNERS[otherPartner(me)].name;
  const myName = PARTNERS[me].name;

  function predictBadge() {
    if (!predict) return { text: "New today", tone: "new" };
    if (predict.data.revealed) return { text: "Revealed ✓", tone: "done" };
    if (!predict.data[me]) return { text: "Your turn", tone: "turn" };
    return { text: `Waiting for ${them}`, tone: "wait" };
  }
  function wyrBadge() {
    if (!wyr) return { text: "New today", tone: "new" };
    if (wyr.data.revealed) return { text: "Revealed ✓", tone: "done" };
    if (!wyr.data[me]) return { text: "Your turn", tone: "turn" };
    return { text: `Waiting for ${them}`, tone: "wait" };
  }
  function twoTruthsBadge() {
    if (!twoTruths) return { text: "New today", tone: "new" };
    if (twoTruths.data.revealed) return { text: "Revealed ✓", tone: "done" };
    if (!twoTruths.data.statements)
      return { text: "Set statements", tone: "turn" };
    if (twoTruths.data.author !== me && !twoTruths.data[me])
      return { text: "Find the lie", tone: "turn" };
    return { text: `Waiting for ${them}`, tone: "wait" };
  }
  function wordBadge() {
    if (!word) return { text: "New today", tone: "new" };
    const myWordKey = me === "A" ? "AWord" : "BWord";
    if (word.data.winner) return { text: "Finished ✓", tone: "done" };
    if (!word.data[myWordKey]) return { text: "Set your word", tone: "turn" };
    if (word.data.turn === me) return { text: "Your turn", tone: "turn" };
    return { text: `Waiting for ${them}`, tone: "wait" };
  }
  function shipBadge() {
    if (!battleship) return { text: "New today", tone: "new" };
    if (battleship.data.winner) return { text: "Finished ✓", tone: "done" };
    if (!battleship.data[me]?.shipsSet)
      return { text: "Place your ship", tone: "turn" };
    if (battleship.data.turn === me) return { text: "Your shot", tone: "turn" };
    return { text: `Waiting for ${them}`, tone: "wait" };
  }

  const games = [
    {
      href: "/games/predict",
      name: "Predict Your Partner",
      desc: "Daily question — answer & guess theirs",
      icon: Sparkles,
      color: "text-amber-500 bg-amber-50 dark:bg-amber-900/20",
      badge: predictBadge(),
    },
    {
      href: "/games/wyr",
      name: "Would You Rather",
      desc: "Pick a side and see if you agree",
      icon: HelpCircle,
      color: "text-violet-500 bg-violet-50 dark:bg-violet-900/20",
      badge: wyrBadge(),
    },
    {
      href: "/games/twotruths",
      name: "Two Truths",
      desc: "Write 2 truths & a lie, find the lie",
      icon: TextSearch,
      color: "text-pink-500 bg-pink-50 dark:bg-pink-900/20",
      badge: twoTruthsBadge(),
    },
    {
      href: "/games/word",
      name: "Word Duel",
      desc: "Guess each other's secret word",
      icon: Dices,
      color: "text-teal-500 bg-teal-50 dark:bg-teal-900/20",
      badge: wordBadge(),
    },
    {
      href: "/games/battleship",
      name: "Battleship",
      desc: "Hunt each other's hidden ship",
      icon: Target,
      color: "text-rose-500 bg-rose-50 dark:bg-rose-900/20",
      badge: shipBadge(),
    },
  ];

  const toneStyles: Record<string, string> = {
    new: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
    turn: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    wait: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800",
    done: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  };

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Games 🎮</h1>

      {stats && (
        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
          <div className="mb-3 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            <h2 className="font-semibold">Season scoreboard</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 text-center md:grid-cols-5">
            <div className="rounded-2xl bg-amber-50 p-3 dark:bg-amber-900/10">
              <p className="text-xs text-zinc-500">Predictions</p>
              <p className="mt-1 text-lg font-bold">
                {me === "A" ? stats.predictMatchesA : stats.predictMatchesB} –{" "}
                {me === "A" ? stats.predictMatchesB : stats.predictMatchesA}
              </p>
              <p className="text-[10px] text-zinc-400">
                {myName} vs {them}
              </p>
            </div>
            <div className="rounded-2xl bg-violet-50 p-3 dark:bg-violet-900/10">
              <p className="text-xs text-zinc-500">Rather</p>
              <p className="mt-1 text-lg font-bold">
                {stats.wyrMatchesA} – {stats.wyrMatchesB}
              </p>
              <p className="text-[10px] text-zinc-400">
                {stats.wyrRounds} rounds
              </p>
            </div>
            <div className="rounded-2xl bg-pink-50 p-3 dark:bg-pink-900/10">
              <p className="text-xs text-zinc-500">Truths</p>
              <p className="mt-1 text-lg font-bold">
                {me === "A" ? stats.twoTruthsWinsA : stats.twoTruthsWinsB} –{" "}
                {me === "A" ? stats.twoTruthsWinsB : stats.twoTruthsWinsA}
              </p>
              <p className="text-[10px] text-zinc-400">
                {stats.twoTruthsRounds} rounds
              </p>
            </div>
            <div className="rounded-2xl bg-teal-50 p-3 dark:bg-teal-900/10">
              <p className="text-xs text-zinc-500">Word Duel</p>
              <p className="mt-1 text-lg font-bold">
                {me === "A" ? stats.wordWinsA : stats.wordWinsB} –{" "}
                {me === "A" ? stats.wordWinsB : stats.wordWinsA}
              </p>
              <p className="text-[10px] text-zinc-400">
                {myName} vs {them}
              </p>
            </div>
            <div className="rounded-2xl bg-rose-50 p-3 dark:bg-rose-900/10">
              <p className="text-xs text-zinc-500">Battleship</p>
              <p className="mt-1 text-lg font-bold">
                {me === "A" ? stats.battleshipWinsA : stats.battleshipWinsB} –{" "}
                {me === "A" ? stats.battleshipWinsB : stats.battleshipWinsA}
              </p>
              <p className="text-[10px] text-zinc-400">
                {myName} vs {them}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {games.map((g) => {
          const Icon = g.icon;
          return (
            <Link
              key={g.href}
              href={g.href}
              className="flex items-center gap-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-zinc-200 transition hover:shadow-md dark:bg-zinc-900 dark:ring-zinc-800"
            >
              <div className={`rounded-2xl p-3 ${g.color}`}>
                <Icon className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">{g.name}</p>
                <p className="text-sm text-zinc-500">{g.desc}</p>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${toneStyles[g.badge.tone]}`}
              >
                {g.badge.text}
              </span>
              <ChevronRight className="h-4 w-4 text-zinc-300" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
