"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PARTNERS, PartnerKey, otherPartner } from "@/lib/config";
import {
  Moon,
  Mail,
  Sun,
  CloudRain,
  MapPin,
  MessageCircle,
} from "lucide-react";

const MOODS = [
  { score: 1, emoji: "😔" },
  { score: 2, emoji: "😕" },
  { score: 3, emoji: "😐" },
  { score: 4, emoji: "🙂" },
  { score: 5, emoji: "🤩" },
];

export function Handoff({ me }: { me: PartnerKey }) {
  const handoff = useQuery(api.handoffs.latest);
  const send = useMutation(api.handoffs.send);
  const open = useMutation(api.handoffs.open);
  const sendReply = useMutation(api.handoffs.reply);

  const [note, setNote] = useState("");
  const [unlockAt, setUnlockAt] = useState("");
  const [mood, setMood] = useState(0);
  const [weather, setWeather] = useState("");
  const [location, setLocation] = useState("");
  const [replyText, setReplyText] = useState("");
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
    await send({
      from: me,
      note,
      unlockAt: t,
      mood: mood || undefined,
      weather: weather || undefined,
      location: location || undefined,
    });
    setNote("");
    setUnlockAt("");
    setMood(0);
    setWeather("");
    setLocation("");
  }

  async function handleReply() {
    if (!replyText.trim() || !handoff) return;
    await sendReply({ id: handoff._id, text: replyText });
    setReplyText("");
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
        <form onSubmit={handleSend} className="space-y-4">
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

          <div>
            <p className="mb-2 text-sm font-medium">How are you right now?</p>
            <div className="flex gap-1">
              {MOODS.map((m) => (
                <button
                  key={m.score}
                  type="button"
                  onClick={() => setMood(m.score)}
                  className={`flex-1 rounded-xl p-2 text-2xl transition ${
                    mood === m.score
                      ? "bg-indigo-100 ring-1 ring-indigo-300 dark:bg-indigo-900/30"
                      : "bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-950"
                  }`}
                >
                  {m.emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950">
              <CloudRain className="h-4 w-4 text-zinc-400" />
              <input
                type="text"
                value={weather}
                onChange={(e) => setWeather(e.target.value)}
                placeholder="Weather"
                className="flex-1 bg-transparent text-sm outline-none"
              />
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950">
              <MapPin className="h-4 w-4 text-zinc-400" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Where you are"
                className="flex-1 bg-transparent text-sm outline-none"
              />
            </div>
          </div>

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
        ) : !handoff.data.openedAt ? (
          <button
            onClick={() => open({ id: handoff._id, now: Date.now() })}
            className="w-full rounded-2xl bg-linear-to-br from-indigo-500 to-violet-500 p-6 text-center text-white transition hover:opacity-90"
          >
            <Mail className="mx-auto h-8 w-8" />
            <p className="mt-2 font-semibold">
              Open your note from {partnerName}
            </p>
          </button>
        ) : null
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

      {handoff && handoff.data.openedAt && (
        <div className="mt-4 space-y-3 rounded-2xl bg-indigo-50 p-4 dark:bg-indigo-900/20">
          <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
            {handoff.data.mood ? (
              <span className="rounded-full bg-white px-2.5 py-1 text-base dark:bg-zinc-900">
                {MOODS.find((m) => m.score === handoff.data.mood)?.emoji}
              </span>
            ) : null}
            {handoff.data.weather ? (
              <span className="flex items-center gap-1 rounded-full bg-white px-2.5 py-1 dark:bg-zinc-900">
                <Sun className="h-3.5 w-3.5" /> {handoff.data.weather}
              </span>
            ) : null}
            {handoff.data.location ? (
              <span className="flex items-center gap-1 rounded-full bg-white px-2.5 py-1 dark:bg-zinc-900">
                <MapPin className="h-3.5 w-3.5" /> {handoff.data.location}
              </span>
            ) : null}
          </div>

          <p className="whitespace-pre-wrap text-base font-medium text-indigo-900 dark:text-indigo-100">
            {handoff.data.note}
          </p>
          <p className="text-xs text-zinc-500">from {partnerName}</p>

          {handoff.data.reply ? (
            <div className="rounded-xl bg-white p-3 dark:bg-zinc-900">
              <div className="mb-1 flex items-center gap-1 text-xs text-zinc-500">
                <MessageCircle className="h-3.5 w-3.5" /> Reply
              </div>
              <p className="whitespace-pre-wrap text-sm">
                {handoff.data.reply.text}
              </p>
            </div>
          ) : isRecipient ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleReply()}
                placeholder="Send a good-morning reply..."
                className="flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
              />
              <button
                onClick={handleReply}
                disabled={!replyText.trim()}
                className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-600 disabled:opacity-60"
              >
                Reply
              </button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
