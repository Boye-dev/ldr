"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PARTNERS, PartnerKey, otherPartner } from "@/lib/config";
import { X, Send, Smile } from "lucide-react";

interface LightboxProps {
  photoId: string;
  onClose: () => void;
  me: PartnerKey;
}

const EMOJIS = ["❤️", "😍", "🔥", "😂", "😮", "🥰", "👏", "😭", "🤗"];

export function PhotoLightbox({ photoId, onClose, me }: LightboxProps) {
  const photo = useQuery(api.photos.getPhoto, { id: photoId as any });
  const comments = useQuery(api.photos.getComments, {
    photoId: photoId as any,
  });
  const addComment = useMutation(api.photos.addComment);
  const [text, setText] = useState("");
  const [gifUrl, setGifUrl] = useState("");
  const [mode, setMode] = useState<"comment" | "gif">("comment");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  if (!photo) return null;

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    await addComment({
      photoId: photoId as any,
      author: me,
      kind: "comment",
      text: text.trim(),
    });
    setText("");
  }

  async function sendReaction(emoji: string) {
    await addComment({
      photoId: photoId as any,
      author: me,
      kind: "reaction",
      text: emoji,
    });
  }

  async function submitGif(e: React.FormEvent) {
    e.preventDefault();
    if (!gifUrl.trim()) return;
    await addComment({
      photoId: photoId as any,
      author: me,
      kind: "gif",
      url: gifUrl.trim(),
    });
    setGifUrl("");
    setMode("comment");
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-zinc-950 md:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-10 rounded-full bg-black/50 p-2 text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex flex-1 items-center justify-center bg-black p-4 md:w-2/3">
          <img
            src={photo.url || undefined}
            alt={photo.caption || ""}
            className="max-h-[70vh] w-auto max-w-full rounded-xl object-contain md:max-h-[85vh]"
          />
        </div>

        <div className="flex w-full flex-col border-l border-zinc-800 bg-zinc-900 p-4 md:w-1/3">
          <div className="mb-2">
            <p className="text-sm text-zinc-400">
              by {photo.author === me ? "You" : PARTNERS[otherPartner(me)].name}
            </p>
            {photo.caption && (
              <p className="mt-1 text-sm text-white">{photo.caption}</p>
            )}
          </div>

          <div className="flex-1 overflow-y-auto py-3">
            {comments?.length === 0 && (
              <p className="text-sm text-zinc-500">No comments yet</p>
            )}
            <div className="space-y-3">
              {comments?.map((c) => (
                <div
                  key={c._id}
                  className={`flex ${
                    c.author === me ? "justify-end" : "justify-start"
                  }`}
                >
                  {c.kind === "reaction" ? (
                    <span className="text-2xl">{c.text}</span>
                  ) : c.kind === "gif" ? (
                    <img
                      src={c.url || ""}
                      alt="gif"
                      className="max-h-32 rounded-xl object-cover"
                    />
                  ) : (
                    <div
                      className={`max-w-[90%] rounded-2xl px-3 py-2 text-sm ${
                        c.author === me
                          ? "bg-rose-500 text-white"
                          : "bg-zinc-800 text-zinc-100"
                      }`}
                    >
                      <p>{c.text}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-2 border-t border-zinc-800 pt-3">
            <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => sendReaction(e)}
                  className="text-xl hover:scale-110"
                >
                  {e}
                </button>
              ))}
              <button
                onClick={() => setMode(mode === "gif" ? "comment" : "gif")}
                className={`ml-auto rounded-full px-2 py-1 text-[10px] font-medium ${
                  mode === "gif"
                    ? "bg-rose-500 text-white"
                    : "bg-zinc-800 text-zinc-300"
                }`}
              >
                GIF
              </button>
            </div>

            {mode === "gif" ? (
              <form onSubmit={submitGif} className="flex gap-2">
                <input
                  value={gifUrl}
                  onChange={(e) => setGifUrl(e.target.value)}
                  className="flex-1 rounded-xl bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500"
                  placeholder="Paste GIF URL (Tenor/GIPHY)"
                />
                <button className="rounded-xl bg-rose-500 p-2 text-white">
                  <Send className="h-4 w-4" />
                </button>
              </form>
            ) : (
              <form onSubmit={submitComment} className="flex gap-2">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="flex-1 rounded-xl bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500"
                  placeholder="Write a comment..."
                />
                <button className="rounded-xl bg-rose-500 p-2 text-white">
                  <Send className="h-4 w-4" />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
