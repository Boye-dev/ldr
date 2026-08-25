"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { formatTimeIn, getOverlapText } from "@/lib/timezones";
import { Heart, Clock, MapPin } from "lucide-react";

const STATUSES = ["Free", "Busy", "At work", "Sleeping soon", "Missing you"];

export function PresenceBar({ code, me }: { code: string; me: "A" | "B" }) {
  const couple = useQuery(api.couples.getByCode, { code });
  const pulses = useQuery(api.presence.recentPulses, { code });
  const sendPulse = useMutation(api.presence.sendPulse);
  const updateStatus = useMutation(api.couples.updateStatus);
  const markSeen = useMutation(api.presence.markPulsesSeen);
  const [statusOpen, setStatusOpen] = useState(false);

  if (!couple) return <div className="p-6 text-center">Loading…</div>;

  const partner = me === "A" ? couple.partnerB : couple.partnerA;
  const mine = me === "A" ? couple.partnerA : couple.partnerB;
  const other = me === "A" ? "B" : "A";

  const unseen = pulses?.filter((p) => p.sender !== me && !p.seenAt) || [];

  async function handlePulse() {
    await sendPulse({ code, sender: me });
  }

  async function handleStatus(status: string) {
    await updateStatus({ code, partner: me, status });
    setStatusOpen(false);
  }

  async function handleMarkSeen() {
    if (unseen.length) {
      await markSeen({ pulseIds: unseen.map((p) => p._id) });
    }
  }

  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Presence</h2>
        <div className="flex gap-2">
          <button
            onClick={handlePulse}
            className="flex items-center gap-2 rounded-full bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
          >
            <Heart className="h-4 w-4" /> Send pulse
          </button>
          <div className="relative">
            <button
              onClick={() => setStatusOpen((s) => !s)}
              className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              {mine.status || "Set status"}
            </button>
            {statusOpen && (
              <div className="absolute right-0 z-10 mt-2 w-40 rounded-xl border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleStatus(s)}
                    className="block w-full px-4 py-2 text-left text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-violet-50 p-4 dark:bg-violet-900/20">
          <p className="text-sm font-medium text-violet-700 dark:text-violet-300">You</p>
          <p className="mt-1 text-2xl font-bold">{formatTimeIn(mine.timezone)}</p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{mine.name}</p>
          <p className="mt-1 text-sm text-zinc-500">{mine.status || "—"}</p>
        </div>
        <div className="rounded-2xl bg-rose-50 p-4 dark:bg-rose-900/20">
          <p className="text-sm font-medium text-rose-700 dark:text-rose-300">Partner</p>
          <p className="mt-1 text-2xl font-bold">{formatTimeIn(partner.timezone)}</p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{partner.name}</p>
          <p className="mt-1 text-sm text-zinc-500">{partner.status || "—"}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 text-sm text-zinc-500">
        <Clock className="h-4 w-4" />
        {getOverlapText(mine.timezone, partner.timezone)}
      </div>

      {pulses && pulses.length > 0 && (
        <div className="mt-4 rounded-2xl border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium">Recent pulses</p>
            {unseen.length > 0 && (
              <button onClick={handleMarkSeen} className="text-xs text-violet-600 hover:underline">
                Mark seen ({unseen.length})
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {pulses.map((p, i) => (
              <span
                key={i}
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                  p.sender !== me && !p.seenAt
                    ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
                    : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800"
                }`}
              >
                <MapPin className="h-3 w-3" />
                {p.sender === me ? "You" : partner.name} • {new Date(p.sentAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
