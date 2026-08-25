"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useSession } from "@/components/session";
import { PresenceBar } from "@/components/presence-bar";
import { Handoff } from "@/components/handoff";
import { PARTNERS, otherPartner } from "@/lib/config";
import { Calendar, Gamepad2, Camera, ChevronRight, Pencil } from "lucide-react";

export default function HomePage() {
  const { me } = useSession();
  const couple = useQuery(api.couples.get);
  const setVisit = useMutation(api.couples.setNextVisit);
  const predict = useQuery(api.games.todaysPredict);
  const word = useQuery(api.games.todaysWord);
  const battleship = useQuery(api.games.getBattleship);
  const requests = useQuery(api.photos.listRequests);

  const [editingVisit, setEditingVisit] = useState(false);
  const [visitDate, setVisitDate] = useState("");

  const them = PARTNERS[otherPartner(me)].name;

  const daysLeft = couple?.nextVisitAt
    ? Math.ceil((couple.nextVisitAt - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  // Attention items
  const attention: { label: string; href: string; icon: typeof Gamepad2 }[] =
    [];
  if (predict && !predict.data[me] && !predict.data.revealed)
    attention.push({
      label: "Answer today's question",
      href: "/games/predict",
      icon: Gamepad2,
    });
  if (word?.data) {
    const myWordKey = me === "A" ? "AWord" : "BWord";
    if (!word.data[myWordKey])
      attention.push({
        label: "Set your Word Duel word",
        href: "/games/word",
        icon: Gamepad2,
      });
    else if (word.data.turn === me && !word.data.winner)
      attention.push({
        label: "Your turn in Word Duel",
        href: "/games/word",
        icon: Gamepad2,
      });
  }
  if (battleship?.data) {
    if (!battleship.data[me]?.shipsSet)
      attention.push({
        label: "Place your Battleship",
        href: "/games/battleship",
        icon: Gamepad2,
      });
    else if (battleship.data.turn === me && !battleship.data.winner)
      attention.push({
        label: "Your shot in Battleship",
        href: "/games/battleship",
        icon: Gamepad2,
      });
  }
  const openRequestsForMe =
    requests?.filter((r) => r.status === "open" && r.requester !== me) || [];
  if (openRequestsForMe.length > 0)
    attention.push({
      label: `${them} wants a photo: "${openRequestsForMe[0].prompt}"`,
      href: "/photos",
      icon: Camera,
    });

  async function saveVisit() {
    if (!visitDate) return;
    await setVisit({ nextVisitAt: new Date(visitDate).getTime() });
    setEditingVisit(false);
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Hey {PARTNERS[me].name} 👋</h1>

      <PresenceBar me={me} />

      {attention.length > 0 && (
        <div className="rounded-3xl bg-amber-50 p-5 ring-1 ring-amber-200 dark:bg-amber-900/10 dark:ring-amber-900/30">
          <h2 className="mb-3 text-sm font-semibold text-amber-700 dark:text-amber-300">
            Waiting on you
          </h2>
          <div className="space-y-2">
            {attention.map((item, i) => {
              const Icon = item.icon;
              return (
                <Link
                  key={i}
                  href={item.href}
                  className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 text-sm font-medium shadow-sm transition hover:shadow dark:bg-zinc-900"
                >
                  <Icon className="h-4 w-4 text-amber-500" />
                  <span className="flex-1">{item.label}</span>
                  <ChevronRight className="h-4 w-4 text-zinc-300" />
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <div className="rounded-3xl bg-gradient-to-br from-rose-500 to-violet-500 p-5 text-white shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <h2 className="font-semibold">Next time together</h2>
          </div>
          <button
            onClick={() => setEditingVisit((e) => !e)}
            className="rounded-full bg-white/20 p-2 hover:bg-white/30"
            aria-label="Edit visit date"
          >
            <Pencil className="h-4 w-4" />
          </button>
        </div>
        {editingVisit ? (
          <div className="mt-3 flex gap-2">
            <input
              type="date"
              value={visitDate}
              onChange={(e) => setVisitDate(e.target.value)}
              className="flex-1 rounded-xl bg-white/20 px-3 py-2 text-sm text-white placeholder-white/60 [color-scheme:dark]"
            />
            <button
              onClick={saveVisit}
              className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-rose-600"
            >
              Save
            </button>
          </div>
        ) : daysLeft !== null ? (
          <p className="mt-2 text-4xl font-bold">
            {daysLeft > 0 ? (
              <>
                {daysLeft}{" "}
                <span className="text-lg font-medium opacity-80">
                  days to go
                </span>
              </>
            ) : daysLeft === 0 ? (
              "Today! 🎉"
            ) : (
              "Set your next visit"
            )}
          </p>
        ) : (
          <p className="mt-2 text-sm opacity-90">
            No date set yet — tap the pencil to add your next visit.
          </p>
        )}
      </div>

      <Handoff me={me} />
    </div>
  );
}
