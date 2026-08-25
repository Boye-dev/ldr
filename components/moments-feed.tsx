"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Camera, ImageIcon } from "lucide-react";

export function MomentsFeed({ code, me }: { code: string; me: "A" | "B" }) {
  const moments = useQuery(api.moments.list, { code });
  const create = useMutation(api.moments.create);
  const [caption, setCaption] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!caption && !image) return;
    await create({ code, author: me, caption, imageUrl: image || undefined });
    setCaption("");
    setImage(null);
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const data = ev.target?.result as string;
      // compress a bit by capping to a simple max res if needed; for now just store base64
      setImage(data);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
      <div className="mb-4 flex items-center gap-2">
        <Camera className="h-5 w-5 text-indigo-500" />
        <h2 className="text-lg font-semibold">Mundane Moments</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
          placeholder="A small thing from my day..."
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 rounded-xl border border-zinc-200 px-3 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
          >
            <ImageIcon className="h-4 w-4" /> {image ? "Photo added" : "Add photo"}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          <button
            type="submit"
            className="ml-auto rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Post
          </button>
        </div>
        {image && (
          <img
            src={image}
            alt="Preview"
            className="h-32 w-auto rounded-xl object-cover"
          />
        )}
      </form>

      <div className="mt-6 space-y-4">
        {moments?.map((m) => (
          <div key={m._id} className="rounded-2xl border border-zinc-100 p-3 dark:border-zinc-800">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-zinc-500">{m.author === me ? "You" : "Partner"}</span>
              <span className="text-xs text-zinc-400">{new Date(m.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
            </div>
            <p className="text-sm text-zinc-800 dark:text-zinc-200">{m.caption}</p>
            {m.imageUrl && <img src={m.imageUrl} alt="" className="mt-2 rounded-xl object-cover" />}
          </div>
        ))}
        {!moments?.length && <p className="text-center text-sm text-zinc-400">No moments yet. Drop the first one.</p>}
      </div>
    </div>
  );
}
