"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PARTNERS, PartnerKey, otherPartner } from "@/lib/config";
import { Moon, Mail } from "lucide-react";

export function Handoff({ me }: { me: PartnerKey }) {
  const handoff = useQuery(api.handoffs.latest);
  const send = useMutation(api.handoffs.send);
  const open = useMutation(api.handoffs.open);

  const [note, setNote] = useState("");
  const [unlockAt, setUnlockAt] = useState("");
  const [now, setNow] = useState(Date.now());

  const partnerName = PARTNERS[otherPartner(me)].name;

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const t = new Date(unlockAt).getTime();
    if (!t) return;
    await send({ from: me, note, unlockAt: t });
    setNote("");
    setUnlockAt("");
  }

  const isRecipient = handoff?.data.to === me;
  const locked = handoff && now < handoff.data.unlockAt;
  const showCompose = !handoff || handoff.data.openedAt;

  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
      <div className="mb-4 flex items-center gap-2">
        <Moon className="h-5 w-5 text-indigo-500" />
        <h2 className="text-lg font-semibold">Goodnight Handoff</h2>
      </div>

      {showCompose ? (
        <form onSubmit={handleSend} className="space-y-3">
          <p className="text-sm text-zinc-500">
            Leave a note that unlocks when {partnerName} wakes up.
          </p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="h-20 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            placeholder={`Goodnight ${partnerName}...`}
            required
          />
          <div className="flex gap-2">
            <input
              type="datetime-local"
              value={unlockAt}
              onChange={(e) => setUnlockAt(e.target.value)}
              className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
              required
            />
            <button className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-600">
              Send
            </button>
          </div>
        </form>
      ) : isRecipient ? (
        locked ? (
          <div className="rounded-2xl bg-indigo-50 p-6 text-center dark:bg-indigo-900/20">
            <Mail className="mx-auto h-8 w-8 text-indigo-400" />
            <p className="mt-2 text-sm font-medium text-zinc-600 dark:text-zinc-300">
              {partnerName} left you something
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Unlocks{" "}
              {new Date(handoff.data.unlockAt).toLocaleString([], {
                weekday: "short",
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
          </div>
        ) : (
          <button
            onClick={() => open({ id: handoff._id, now: Date.now() })}
            className="w-full rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 p-6 text-center text-white transition hover:opacity-90"
          >
            <Mail className="mx-auto h-8 w-8" />
            <p className="mt-2 font-semibold">
              Open your note from {partnerName}
            </p>
          </button>
        )
      ) : (
        <div className="rounded-2xl bg-zinc-50 p-4 text-center text-sm text-zinc-500 dark:bg-zinc-800/50">
          Your note is waiting for {partnerName}.
          <span className="block text-xs">
            Unlocks{" "}
            {new Date(handoff.data.unlockAt).toLocaleString([], {
              weekday: "short",
              hour: "numeric",
              minute: "2-digit",
            })}
          </span>
        </div>
      )}

      {handoff && handoff.data.openedAt && handoff.data.to === me && (
        <div className="mt-3 rounded-2xl bg-indigo-50 p-4 dark:bg-indigo-900/20">
          <p className="whitespace-pre-wrap text-base font-medium text-indigo-900 dark:text-indigo-100">
            {handoff.data.note}
          </p>
          <p className="mt-1 text-xs text-zinc-500">from {partnerName}</p>
        </div>
      )}
    </div>
  );
}
