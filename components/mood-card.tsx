"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useSession } from "@/components/session";
import { PARTNERS, otherPartner } from "@/lib/config";
import { Flame, Smile, Frown } from "lucide-react";

const SCORES = [
  { score: 1, emoji: "😔", label: "Rough" },
  { score: 2, emoji: "😕", label: "Off" },
  { score: 3, emoji: "😐", label: "Okay" },
  { score: 4, emoji: "🙂", label: "Good" },
  { score: 5, emoji: "🤩", label: "Great" },
];

export function MoodCard() {
  const { me } = useSession();
  const them = PARTNERS[otherPartner(me)].name;
  const todays = useQuery(api.moods.todaysMood);
  const streak = useQuery(api.moods.streak);
  const setMood = useMutation(api.moods.setMood);

  const myMood = todays?.find((m) => m.author === me);
  const theirMood = todays?.find((m) => m.author === otherPartner(me));

  const [score, setScore] = useState(myMood?.score || 0);
  const [note, setNote] = useState(myMood?.note || "");

  async function submit() {
    if (!score) return;
    await setMood({ author: me, score, note });
  }

  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Smile className="h-5 w-5 text-emerald-500" />
          <h2 className="text-lg font-semibold">Mood check-in</h2>
        </div>
        {streak ? (
          <div className="flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-1 text-xs font-semibold text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
            <Flame className="h-3.5 w-3.5" /> {streak} day streak
          </div>
        ) : null}
      </div>

      <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-300">
        How are you feeling today?
      </p>

      <div className="mb-4 flex justify-between gap-2">
        {SCORES.map((s) => (
          <button
            key={s.score}
            onClick={() => setScore(s.score)}
            className={`flex flex-1 flex-col items-center gap-1 rounded-xl p-2 transition ${
              score === s.score
                ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300"
                : "bg-zinc-50 text-zinc-500 hover:bg-zinc-100 dark:bg-zinc-950 dark:text-zinc-400"
            }`}
          >
            <span className="text-xl">{s.emoji}</span>
            <span className="text-[10px] font-medium">{s.label}</span>
          </button>
        ))}
      </div>

      <input
        type="text"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="A one-line reason (optional)"
        className="mb-3 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm focus:border-emerald-400 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
      />

      <button
        onClick={submit}
        disabled={!score}
        className="w-full rounded-xl bg-emerald-500 py-3 font-semibold text-white hover:bg-emerald-600 disabled:opacity-60"
      >
        {myMood ? "Update mood" : "Submit mood"}
      </button>

      {theirMood && (
        <div className="mt-4 rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-900/50">
          <p className="mb-1 text-sm font-medium">{them} today</p>
          <div className="flex items-center gap-2">
            <span className="text-2xl">
              {SCORES.find((s) => s.score === theirMood.score)?.emoji}
            </span>
            <div>
              <p className="text-sm font-semibold">
                {SCORES.find((s) => s.score === theirMood.score)?.label}
              </p>
              {theirMood.note && (
                <p className="text-xs text-zinc-500">“{theirMood.note}”</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
