"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { formatTimeIn } from "@/lib/timezones";
import { PARTNERS, PartnerKey, otherPartner } from "@/lib/config";
import { Heart, Clock } from "lucide-react";

const STATUSES = ["Free", "Busy", "At work", "Sleeping soon", "Missing you"];

export function PresenceBar({ me }: { me: PartnerKey }) {
  const couple = useQuery(api.couples.get);
  const pulses = useQuery(api.presence.recentPulses);
  const sendPulse = useMutation(api.presence.sendPulse);
  const updateStatus = useMutation(api.couples.updateStatus);
  const markSeen = useMutation(api.presence.markPulsesSeen);
  const [statusOpen, setStatusOpen] = useState(false);
  const [pulseSent, setPulseSent] = useState(false);
  const [, tick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 30000);
    return () => clearInterval(t);
  }, []);

  if (!couple)
    return <div className="p-6 text-center text-zinc-400">Loading…</div>;

  const them = otherPartner(me);
  const mine = me === "A" ? couple.partnerA : couple.partnerB;
  const theirs = me === "A" ? couple.partnerB : couple.partnerA;

  const unseen = pulses?.filter((p) => p.sender !== me && !p.seenAt) || [];

  async function handlePulse() {
    await sendPulse({ sender: me });
    setPulseSent(true);
    setTimeout(() => setPulseSent(false), 2000);
  }

  async function handleStatus(status: string) {
    await updateStatus({ partner: me, status });
    setStatusOpen(false);
  }

  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-rose-50 p-4 dark:bg-rose-900/20">
          <p className="text-xs font-semibold text-rose-600 dark:text-rose-300">
            {PARTNERS[me].flag} You · {PARTNERS[me].name}
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums">
            {formatTimeIn(PARTNERS[me].timezone)}
          </p>
          <button
            onClick={() => setStatusOpen((s) => !s)}
            className="mt-1 text-sm text-zinc-500 underline-offset-2 hover:underline"
          >
            {mine.status || "Set status"}
          </button>
          {statusOpen && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => handleStatus(s)}
                  className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-zinc-600 ring-1 ring-zinc-200 hover:bg-rose-100 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-violet-50 p-4 dark:bg-violet-900/20">
          <p className="text-xs font-semibold text-violet-600 dark:text-violet-300">
            {PARTNERS[them].flag} {PARTNERS[them].name}
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums">
            {formatTimeIn(PARTNERS[them].timezone)}
          </p>
          <p className="mt-1 text-sm text-zinc-500">{theirs.status || "—"}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={handlePulse}
          className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition ${
            pulseSent ? "bg-green-500" : "bg-rose-500 hover:bg-rose-600"
          }`}
        >
          <Heart className={`h-4 w-4 ${pulseSent ? "" : "fill-current"}`} />
          {pulseSent ? "Sent!" : `Pulse ${PARTNERS[them].name}`}
        </button>
        {unseen.length > 0 && (
          <button
            onClick={() => markSeen({ pulseIds: unseen.map((p) => p._id) })}
            className="flex items-center gap-1.5 rounded-full bg-rose-100 px-4 py-2 text-sm font-medium text-rose-600 dark:bg-rose-900/30 dark:text-rose-300"
          >
            <Heart className="h-4 w-4 fill-current" />
            {unseen.length} from {PARTNERS[them].name}
          </button>
        )}
      </div>

      {pulses && pulses.length > 0 && unseen.length === 0 && (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-zinc-400">
          <Clock className="h-3.5 w-3.5" />
          Last pulse:{" "}
          {new Date(pulses[0].sentAt).toLocaleString([], {
            weekday: "short",
            hour: "numeric",
            minute: "2-digit",
          })}{" "}
          from {pulses[0].sender === me ? "you" : PARTNERS[them].name}
        </p>
      )}
    </div>
  );
}
