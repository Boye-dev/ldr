"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useSession } from "@/components/session";
import { PARTNERS, otherPartner } from "@/lib/config";
import { Music, RefreshCcw, ExternalLink } from "lucide-react";

export function MusicMatch() {
  const { me } = useSession();
  const them = PARTNERS[otherPartner(me)].name;
  const game = useQuery(api.games.todaysMusic);
  const createGame = useMutation(api.games.createTodaysMusic);
  const submit = useMutation(api.games.submitMusic);
  const reset = useMutation(api.games.resetGame);

  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (game === null) createGame({});
  }, [game, createGame]);

  async function handleSubmit() {
    if (!title.trim() || !url.trim()) {
      alert("Add a song title and a link.");
      return;
    }
    await submit({ partner: me, title, url });
    setTitle("");
    setUrl("");
  }

  async function handleReset() {
    if (confirm("Start a fresh music match?")) {
      await reset({ type: "music" });
      await createGame({});
    }
  }

  if (!game) {
    return (
      <div className="rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
        <Music className="mx-auto h-8 w-8 text-indigo-500" />
        <p className="mt-3 text-zinc-500">Loading today&apos;s soundtrack...</p>
      </div>
    );
  }

  const data = game.data as {
    prompt: string;
    A: { title: string; url: string; at: number } | null;
    B: { title: string; url: string; at: number } | null;
    revealed: boolean;
  };
  const myAnswer = data[me];
  const theirAnswer = data[otherPartner(me)];
  const revealed = data.revealed;

  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Music className="h-5 w-5 text-indigo-500" />
          <h2 className="text-lg font-semibold">Music Match</h2>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
        >
          <RefreshCcw className="h-3.5 w-3.5" /> New
        </button>
      </div>

      <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-300">
        Share one song you&apos;re vibing to today. When both of you submit, the
        soundtrack is revealed.
      </p>

      {!myAnswer ? (
        <div className="space-y-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Song / artist"
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm focus:border-indigo-400 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
          />
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Spotify / YouTube / Apple Music link"
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm focus:border-indigo-400 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
          />
          <button
            onClick={handleSubmit}
            className="w-full rounded-xl bg-indigo-500 py-3 font-semibold text-white hover:bg-indigo-600"
          >
            Add my song
          </button>
        </div>
      ) : !revealed ? (
        <div className="rounded-2xl bg-zinc-50 p-4 text-center text-sm dark:bg-zinc-900/50">
          You added <strong>{myAnswer.title}</strong>. Waiting for {them}...
        </div>
      ) : (
        <div className="space-y-3">
          <div className="rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-900/50">
            <p className="text-xs font-semibold uppercase text-zinc-500">
              You
            </p>
            <a
              href={myAnswer.url}
              target="_blank"
              rel="noreferrer"
              className="mt-1 flex items-center gap-2 font-medium text-indigo-600 hover:underline dark:text-indigo-300"
            >
              {myAnswer.title} <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
          <div className="rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-900/50">
            <p className="text-xs font-semibold uppercase text-zinc-500">
              {them}
            </p>
            <a
              href={theirAnswer?.url || "#"}
              target="_blank"
              rel="noreferrer"
              className="mt-1 flex items-center gap-2 font-medium text-indigo-600 hover:underline dark:text-indigo-300"
            >
              {theirAnswer?.title || "No song yet"}{" "}
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
