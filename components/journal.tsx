"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useSession } from "@/components/session";
import { PARTNERS } from "@/lib/config";
import { BookHeart, Send } from "lucide-react";

export function Journal() {
  const { me } = useSession();
  const entries = useQuery(api.journal.list, { limit: 50 });
  const create = useMutation(api.journal.create);
  const [text, setText] = useState("");

  async function submit() {
    if (!text.trim()) return;
    await create({ author: me, text });
    setText("");
  }

  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
      <h2 className="mb-3 flex items-center gap-2 font-semibold">
        <BookHeart className="h-5 w-5 text-rose-500" /> Our journal
      </h2>

      <div className="mb-4 flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Write a little note to the journal..."
          className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm focus:border-rose-400 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
        />
        <button
          onClick={submit}
          disabled={!text.trim()}
          className="rounded-xl bg-rose-500 px-4 py-3 font-semibold text-white hover:bg-rose-600 disabled:opacity-60"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>

      {entries && entries.length > 0 ? (
        <div className="space-y-3">
          {entries.slice(0, 20).map((e) => (
            <div
              key={e._id}
              className="rounded-2xl bg-zinc-50 p-3 dark:bg-zinc-900/50"
            >
              <p className="whitespace-pre-wrap text-sm">{e.text}</p>
              <p className="mt-1 text-xs text-zinc-400">
                {PARTNERS[e.author as "A" | "B"].name} ·{" "}
                {new Date(e.createdAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="py-4 text-center text-sm text-zinc-500">
          No entries yet. Start the journal with a short note.
        </p>
      )}
    </div>
  );
}
