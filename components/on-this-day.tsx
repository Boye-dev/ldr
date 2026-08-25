"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useSession } from "@/components/session";
import { PARTNERS, otherPartner } from "@/lib/config";
import { Calendar, Sparkles, Camera, Smile, BookHeart } from "lucide-react";
import Image from "next/image";

export function OnThisDay() {
  const { me } = useSession();
  const them = PARTNERS[otherPartner(me)].name;
  const memory = useQuery(api.memories.onThisDay);

  if (!memory) return null;

  const hasAnything =
    memory.games.length > 0 ||
    memory.photos.length > 0 ||
    memory.moods.length > 0 ||
    memory.journals.length > 0;

  if (!hasAnything) {
    return (
      <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
        <h2 className="mb-2 flex items-center gap-2 font-semibold">
          <Calendar className="h-5 w-5 text-amber-500" /> On this day
        </h2>
        <p className="text-sm text-zinc-500">
          One year ago today — no memories yet. The longer you use Closer, the
          more this fills up. 💕
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
      <h2 className="mb-4 flex items-center gap-2 font-semibold">
        <Calendar className="h-5 w-5 text-amber-500" /> On this day ·{" "}
        {new Date(memory.dayKey).toLocaleDateString(undefined, {
          month: "long",
          day: "numeric",
        })}
      </h2>

      <div className="space-y-4">
        {memory.moods.map((m) => {
          const author = PARTNERS[m.author as "A" | "B"].name;
          const labels = ["", "Rough", "Off", "Okay", "Good", "Great"];
          const emojis = ["", "😔", "😕", "😐", "🙂", "🤩"];
          return (
            <div
              key={m._id}
              className="flex items-center gap-3 rounded-2xl bg-zinc-50 p-3 dark:bg-zinc-900/50"
            >
              <Smile className="h-5 w-5 text-emerald-500" />
              <div>
                <p className="text-sm font-medium">
                  {author} was feeling {labels[m.score]} {emojis[m.score]}
                </p>
                {m.note && <p className="text-xs text-zinc-500">“{m.note}”</p>}
              </div>
            </div>
          );
        })}

        {memory.photos.map((p: any) => (
          <div
            key={p._id}
            className="flex items-center gap-3 rounded-2xl bg-zinc-50 p-3 dark:bg-zinc-900/50"
          >
            <Camera className="h-5 w-5 text-cyan-500" />
            <div className="relative h-16 w-16 overflow-hidden rounded-xl">
              <Image
                src={p.url}
                alt="Memory"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <p className="text-sm text-zinc-600">
              A photo from {PARTNERS[p.author as "A" | "B"].name}
            </p>
          </div>
        ))}

        {memory.journals.map((j) => (
          <div
            key={j._id}
            className="rounded-2xl bg-zinc-50 p-3 dark:bg-zinc-900/50"
          >
            <div className="mb-1 flex items-center gap-2">
              <BookHeart className="h-4 w-4 text-rose-500" />
              <p className="text-xs font-medium text-zinc-500">
                {PARTNERS[j.author as "A" | "B"].name} wrote
              </p>
            </div>
            <p className="text-sm whitespace-pre-wrap">{j.text}</p>
          </div>
        ))}

        {memory.games.map((g) => (
          <div
            key={g._id}
            className="rounded-2xl bg-zinc-50 p-3 dark:bg-zinc-900/50"
          >
            <div className="mb-1 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <p className="text-xs font-medium text-zinc-500 capitalize">
                {g.type} · {g.dayKey}
              </p>
            </div>
            {g.type === "predict" && g.data?.question?.text && (
              <p className="text-sm">“{g.data.question.text as string}”</p>
            )}
            {g.type === "handoff" && (
              <p className="text-sm whitespace-pre-wrap">{g.data.note as string}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
