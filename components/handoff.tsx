"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Moon, Mail } from "lucide-react";

export function Handoff({ code, me, partnerName }: { code: string; me: "A" | "B"; partnerName: string }) {
  const handoff = useQuery(api.handoffs.latest, { code });
  const send = useMutation(api.handoffs.send);
  const open = useMutation(api.handoffs.open);

  const [note, setNote] = useState("");
  const [unlockAt, setUnlockAt] = useState("");
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const t = new Date(unlockAt).getTime();
    if (!t) return;
    await send({ code, from: me, note, unlockAt: t });
    setNote("");
    setUnlockAt("");
  }

  async function handleOpen() {
    if (handoff) await open({ id: handoff._id, now: Date.now() });
  }

  const isRecipient = handoff?.data.to === me;
  const locked = handoff && now < handoff.data.unlockAt;

  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
      <div className="mb-4 flex items-center gap-2">
        <Moon className="h-5 w-5 text-indigo-500" />
        <h2 className="text-lg font-semibold">Goodnight Handoff</h2>
      </div>

      {!handoff || handoff.data.openedAt ? (
        <form onSubmit={handleSend} className="space-y-3">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Leave a note that unlocks when your partner wakes up.
          </p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="h-24 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            placeholder="Goodnight, I..."
            required
          />
          <input
            type="datetime-local"
            value={unlockAt}
            onChange={(e) => setUnlockAt(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            required
          />
          <button className="w-full rounded-xl bg-indigo-600 py-2.5 font-semibold text-white hover:bg-indigo-700">
            Leave for {partnerName}
          </button>
        </form>
      ) : (
        <div className="space-y-3">
          {isRecipient ? (
            locked ? (
              <div className="rounded-2xl bg-zinc-50 p-6 text-center dark:bg-zinc-900/50">
                <Mail className="mx-auto h-8 w-8 text-zinc-400" />
                <p className="mt-2 text-sm font-medium text-zinc-600 dark:text-zinc-400">A handoff is waiting for you</p>
                <p className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">
                  {Math.max(0, Math.ceil((handoff.data.unlockAt - now) / 1000))}s
                </p>
                <p className="text-xs text-zinc-500">Unlocks at {new Date(handoff.data.unlockAt).toLocaleString()}</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-2xl bg-indigo-50 p-5 text-indigo-900 dark:bg-indigo-900/20 dark:text-indigo-100">
                  <p className="whitespace-pre-wrap text-lg font-medium leading-relaxed">{handoff.data.note}</p>
                </div>
                <p className="text-center text-xs text-zinc-500">Opened at {new Date(handoff.data.openedAt || now).toLocaleString()}</p>
              </div>
            )
          ) : (
            <div className="rounded-2xl bg-zinc-50 p-4 text-center text-sm text-zinc-600 dark:bg-zinc-900/50 dark:text-zinc-400">
              <p>Your handoff is waiting for {partnerName}.</p>
              <p className="text-xs text-zinc-500">Unlocks at {new Date(handoff.data.unlockAt).toLocaleString()}</p>
            </div>
          )}
          {!isRecipient && !locked && (
            <button onClick={handleOpen} className="w-full rounded-xl bg-indigo-600 py-2.5 font-semibold text-white hover:bg-indigo-700">
              Open early (for testing)
            </button>
          )}
        </div>
      )}
    </div>
  );
}
