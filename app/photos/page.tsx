"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useSession } from "@/components/session";
import { PARTNERS, otherPartner } from "@/lib/config";
import { compressImage } from "@/lib/image";
import {
  Camera,
  Plus,
  Sparkles,
  FolderHeart,
  Image as ImageIcon,
  X,
  Loader2,
} from "lucide-react";

type View = "requests" | "albums" | "all";

export default function PhotosPage() {
  const { me } = useSession();
  const [view, setView] = useState<View>("requests");

  const them = PARTNERS[otherPartner(me)].name;

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Photos 📸</h1>

      <div className="flex gap-1 rounded-2xl bg-zinc-100 p-1 dark:bg-zinc-900">
        {(
          [
            ["requests", "Requests"],
            ["albums", "Albums"],
            ["all", "All photos"],
          ] as [View, string][]
        ).map(([v, label]) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`flex-1 rounded-xl py-2 text-sm font-medium transition ${
              view === v
                ? "bg-white shadow-sm dark:bg-zinc-800"
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {view === "requests" && <RequestsView me={me} them={them} />}
      {view === "albums" && <AlbumsView me={me} />}
      {view === "all" && <AllPhotosView me={me} />}
    </div>
  );
}

// ---------------- Requests ----------------

function RequestsView({ me, them }: { me: "A" | "B"; them: string }) {
  const requests = useQuery(api.photos.listRequests);
  const createRequest = useMutation(api.photos.createRequest);
  const [prompt, setPrompt] = useState("");

  const SUGGESTIONS = [
    "your outfit today",
    "your view right now",
    "what you're eating",
    "your smile",
    "where you're sitting",
  ];

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim()) return;
    await createRequest({ requester: me, prompt: prompt.trim() });
    setPrompt("");
  }

  return (
    <div className="space-y-4">
      <form
        onSubmit={handleCreate}
        className="rounded-3xl bg-gradient-to-br from-rose-500 to-violet-500 p-5 text-white"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          <h2 className="font-semibold">Ask {them} for a photo</h2>
        </div>
        <div className="mt-3 flex gap-2">
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="flex-1 rounded-xl bg-white/20 px-3 py-2.5 text-sm placeholder-white/70 focus:bg-white/30 focus:outline-none"
            placeholder={`Send me a photo of...`}
          />
          <button className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-rose-600">
            Ask
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setPrompt(s)}
              className="rounded-full bg-white/20 px-2.5 py-1 text-xs hover:bg-white/30"
            >
              {s}
            </button>
          ))}
        </div>
      </form>

      <div className="space-y-3">
        {requests?.map((r) => (
          <RequestCard key={r._id} request={r} me={me} them={them} />
        ))}
        {requests?.length === 0 && (
          <p className="py-8 text-center text-sm text-zinc-400">
            No requests yet. Ask {them} for a photo of something!
          </p>
        )}
      </div>
    </div>
  );
}

function RequestCard({
  request,
  me,
  them,
}: {
  request: any;
  me: "A" | "B";
  them: string;
}) {
  const photos = useQuery(api.photos.photosByRequest, { requestId: request._id });
  const forMe = request.requester !== me && request.status === "open";

  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium">“{request.prompt}”</p>
          <p className="mt-0.5 text-xs text-zinc-400">
            {request.requester === me ? "You asked" : `${them} asked`} ·{" "}
            {new Date(request.createdAt).toLocaleDateString([], {
              month: "short",
              day: "numeric",
            })}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
            request.status === "open"
              ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
              : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
          }`}
        >
          {request.status === "open" ? "Waiting" : "Fulfilled"}
        </span>
      </div>

      {photos && photos.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-2">
          {photos.map((p: any) =>
            p.url ? (
              <img
                key={p._id}
                src={p.url}
                alt={request.prompt}
                className="aspect-square w-full rounded-xl object-cover"
              />
            ) : null
          )}
        </div>
      )}

      {forMe && <UploadButton me={me} requestId={request._id} label={`Send it 📷`} />}
    </div>
  );
}

// ---------------- Upload ----------------

function UploadButton({
  me,
  requestId,
  albumId,
  label,
}: {
  me: "A" | "B";
  requestId?: Id<"photoRequests">;
  albumId?: Id<"albums">;
  label: string;
}) {
  const generateUploadUrl = useMutation(api.photos.generateUploadUrl);
  const addPhoto = useMutation(api.photos.addPhoto);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const blob = await compressImage(file);
      const url = await generateUploadUrl();
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "image/jpeg" },
        body: blob,
      });
      const { storageId } = await res.json();
      await addPhoto({
        author: me,
        storageId,
        requestId,
        albumIds: albumId ? [albumId] : undefined,
      });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
      <button
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-rose-500 py-2.5 text-sm font-semibold text-white hover:bg-rose-600 disabled:opacity-60"
      >
        {uploading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Uploading…
          </>
        ) : (
          <>
            <Camera className="h-4 w-4" /> {label}
          </>
        )}
      </button>
    </>
  );
}

// ---------------- Albums ----------------

function AlbumsView({ me }: { me: "A" | "B" }) {
  const albums = useQuery(api.photos.listAlbums);
  const photos = useQuery(api.photos.listPhotos);
  const createAlbum = useMutation(api.photos.createAlbum);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [openAlbum, setOpenAlbum] = useState<Id<"albums"> | null>(null);
  const [openMonth, setOpenMonth] = useState<string | null>(null);

  const months = new Map<string, any[]>();
  photos?.forEach((p) => {
    const list = months.get(p.monthKey) || [];
    list.push(p);
    months.set(p.monthKey, list);
  });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    await createAlbum({ name: name.trim(), createdBy: me });
    setName("");
    setCreating(false);
  }

  if (openAlbum) {
    const album = albums?.find((a) => a._id === openAlbum);
    const albumPhotos = photos?.filter((p) => p.albumIds.includes(openAlbum)) || [];
    return (
      <div className="space-y-3">
        <button
          onClick={() => setOpenAlbum(null)}
          className="flex items-center gap-1 text-sm text-zinc-500"
        >
          <X className="h-4 w-4" /> Close
        </button>
        <h2 className="text-lg font-semibold">{album?.name}</h2>
        <UploadButton me={me} albumId={openAlbum} label="Add photo to album" />
        <PhotoGrid photos={albumPhotos} />
      </div>
    );
  }

  if (openMonth) {
    return (
      <div className="space-y-3">
        <button
          onClick={() => setOpenMonth(null)}
          className="flex items-center gap-1 text-sm text-zinc-500"
        >
          <X className="h-4 w-4" /> Close
        </button>
        <h2 className="text-lg font-semibold">{formatMonth(openMonth)}</h2>
        <PhotoGrid photos={months.get(openMonth) || []} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-semibold">
            <FolderHeart className="h-5 w-5 text-rose-500" /> Our albums
          </h2>
          <button
            onClick={() => setCreating((c) => !c)}
            className="flex items-center gap-1 rounded-full bg-rose-100 px-3 py-1.5 text-xs font-semibold text-rose-600 dark:bg-rose-900/30 dark:text-rose-300"
          >
            <Plus className="h-3.5 w-3.5" /> New album
          </button>
        </div>
        {creating && (
          <form onSubmit={handleCreate} className="mb-3 flex gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900"
              placeholder="Album name (e.g. Date nights)"
              autoFocus
            />
            <button className="rounded-xl bg-rose-500 px-4 text-sm font-semibold text-white">
              Create
            </button>
          </form>
        )}
        <div className="grid grid-cols-2 gap-3">
          {albums?.map((a) => {
            const count = photos?.filter((p) => p.albumIds.includes(a._id)).length || 0;
            const cover = photos?.find((p) => p.albumIds.includes(a._id));
            return (
              <button
                key={a._id}
                onClick={() => setOpenAlbum(a._id)}
                className="overflow-hidden rounded-2xl bg-white text-left shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800"
              >
                {cover?.url ? (
                  <img src={cover.url} alt="" className="aspect-video w-full object-cover" />
                ) : (
                  <div className="flex aspect-video items-center justify-center bg-zinc-100 dark:bg-zinc-800">
                    <ImageIcon className="h-6 w-6 text-zinc-300" />
                  </div>
                )}
                <div className="p-3">
                  <p className="text-sm font-medium">{a.name}</p>
                  <p className="text-xs text-zinc-400">{count} photos</p>
                </div>
              </button>
            );
          })}
        </div>
        {albums?.length === 0 && (
          <p className="py-4 text-center text-sm text-zinc-400">
            No custom albums yet — create one!
          </p>
        )}
      </div>

      <div>
        <h2 className="mb-3 font-semibold">By month</h2>
        <div className="grid grid-cols-2 gap-3">
          {[...months.entries()].map(([monthKey, monthPhotos]) => (
            <button
              key={monthKey}
              onClick={() => setOpenMonth(monthKey)}
              className="overflow-hidden rounded-2xl bg-white text-left shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800"
            >
              {monthPhotos[0]?.url && (
                <img src={monthPhotos[0].url} alt="" className="aspect-video w-full object-cover" />
              )}
              <div className="p-3">
                <p className="text-sm font-medium">{formatMonth(monthKey)}</p>
                <p className="text-xs text-zinc-400">{monthPhotos.length} photos</p>
              </div>
            </button>
          ))}
        </div>
        {months.size === 0 && (
          <p className="py-4 text-center text-sm text-zinc-400">No photos yet.</p>
        )}
      </div>
    </div>
  );
}

// ---------------- All photos ----------------

function AllPhotosView({ me }: { me: "A" | "B" }) {
  const photos = useQuery(api.photos.listPhotos);
  return (
    <div className="space-y-3">
      <UploadButton me={me} label="Share a photo" />
      <PhotoGrid photos={photos || []} showAuthor me={me} />
      {photos?.length === 0 && (
        <p className="py-8 text-center text-sm text-zinc-400">
          Nothing here yet. Share the first photo!
        </p>
      )}
    </div>
  );
}

function PhotoGrid({
  photos,
  showAuthor,
  me,
}: {
  photos: any[];
  showAuthor?: boolean;
  me?: "A" | "B";
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {photos.map(
        (p) =>
          p.url && (
            <div key={p._id} className="relative">
              <img
                src={p.url}
                alt={p.caption || ""}
                className="aspect-square w-full rounded-xl object-cover"
              />
              {showAuthor && me && (
                <span className="absolute bottom-1 right-1 rounded-full bg-black/50 px-1.5 py-0.5 text-[10px] text-white">
                  {p.author === me ? "you" : PARTNERS[otherPartner(me)].name}
                </span>
              )}
            </div>
          )
      )}
    </div>
  );
}

function formatMonth(monthKey: string) {
  const [y, m] = monthKey.split("-").map(Number);
  return new Date(y, m - 1).toLocaleDateString([], { month: "long", year: "numeric" });
}
