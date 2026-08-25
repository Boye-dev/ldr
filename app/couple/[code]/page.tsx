"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PresenceBar } from "@/components/presence-bar";
import { PredictGame } from "@/components/predict-game";
import { WordDuel } from "@/components/word-duel";
import { Battleship } from "@/components/battleship";
import { MomentsFeed } from "@/components/moments-feed";
import { Handoff } from "@/components/handoff";
import { Calendar, ArrowLeft } from "lucide-react";

export default function CouplePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const router = useRouter();
  const couple = useQuery(api.couples.getByCode, { code });
  const setVisit = useMutation(api.couples.setNextVisit);

  const [me, setMe] = useState<"A" | "B" | null>(null);
  const [visitDate, setVisitDate] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem(`couple:${code}:partner`) as
      "A" | "B" | null;
    setMe(saved || "A");
  }, [code]);

  if (!couple) return <div className="p-8 text-center">Loading…</div>;

  const daysLeft = couple.nextVisitAt
    ? Math.ceil((couple.nextVisitAt - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  async function saveVisit() {
    if (!visitDate) return;
    await setVisit({ code, nextVisitAt: new Date(visitDate).getTime() });
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 p-4">
      <header className="mb-6 flex items-center justify-between">
        <button
          onClick={() => router.push("/")}
          className="rounded-full p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="text-center">
          <h1 className="text-xl font-bold">
            {couple.partnerA.name} &amp; {couple.partnerB.name}
          </h1>
          <p className="text-xs text-zinc-500">code: {code}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500">I am:</span>
          <select
            value={me || "A"}
            onChange={(e) => {
              const v = e.target.value as "A" | "B";
              setMe(v);
              localStorage.setItem(`couple:${code}:partner`, v);
            }}
            className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-sm dark:border-zinc-800 dark:bg-zinc-900"
          >
            <option value="A">{couple.partnerA.name}</option>
            <option value="B">{couple.partnerB.name}</option>
          </select>
        </div>
      </header>

      {me && (
        <div className="space-y-6">
          <PresenceBar code={code} me={me} />

          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
            <div className="mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-violet-500" />
              <h2 className="text-lg font-semibold">Next Visit</h2>
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <input
                type="datetime-local"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
              />
              <button
                onClick={saveVisit}
                className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
              >
                Save
              </button>
              {daysLeft !== null && (
                <span className="text-lg font-bold text-violet-700 dark:text-violet-300">
                  {daysLeft > 0
                    ? `${daysLeft} day${daysLeft === 1 ? "" : "s"}`
                    : daysLeft === 0
                      ? "Today!"
                      : "Past"}{" "}
                  until together
                </span>
              )}
            </div>
          </div>

          <PredictGame code={code} me={me} />
          <Handoff
            code={code}
            me={me}
            partnerName={
              me === "A" ? couple.partnerB.name : couple.partnerA.name
            }
          />
          <div className="grid gap-6 md:grid-cols-2">
            <WordDuel code={code} me={me} />
            <Battleship code={code} me={me} />
          </div>
          <MomentsFeed code={code} me={me} />
        </div>
      )}
    </main>
  );
}
