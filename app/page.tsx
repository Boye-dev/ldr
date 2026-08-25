"use client";

import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { Heart, Shuffle } from "lucide-react";
import { COMMON_TIMEZONES } from "@/lib/timezones";

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default function HomePage() {
  const router = useRouter();
  const create = useMutation(api.couples.create);

  const [ready, setReady] = useState(false);
  const [code, setCode] = useState("");
  const [aName, setAName] = useState("");
  const [aTz, setATz] = useState("UTC");
  const [bName, setBName] = useState("");
  const [bTz, setBTz] = useState("UTC");
  const [error, setError] = useState("");

  useEffect(() => {
    setCode(generateCode());
    setATz(Intl.DateTimeFormat().resolvedOptions().timeZone);
    setReady(true);
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await create({
        code,
        partnerAName: aName || "Partner A",
        partnerATimezone: aTz,
        partnerBName: bName || "Partner B",
        partnerBTimezone: bTz,
      });
      localStorage.setItem(`couple:${code}:partner`, "A");
      router.push(`/couple/${code}`);
    } catch (err: any) {
      setError(err.message || "Could not create");
    }
  }

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
        <div className="mb-6 flex items-center gap-3 text-violet-600">
          <Heart className="h-8 w-8 fill-current" />
          <h1 className="text-2xl font-bold tracking-tight">Closer</h1>
        </div>
        <p className="mb-8 text-zinc-600 dark:text-zinc-400">
          A private little app for two people across distance. Games, rituals,
          and tiny moments.
        </p>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="flex items-center gap-2 rounded-xl bg-violet-50 p-3 dark:bg-violet-900/20">
            <span className="font-mono text-lg font-semibold tracking-wider text-violet-700 dark:text-violet-300">
              {code}
            </span>
            <button
              type="button"
              onClick={() => setCode(generateCode())}
              className="ml-auto rounded-lg p-2 hover:bg-violet-100 dark:hover:bg-violet-800/40"
              aria-label="New code"
            >
              <Shuffle className="h-4 w-4 text-violet-700" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Your name</label>
              <input
                value={aName}
                onChange={(e) => setAName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
                placeholder="Partner A"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Partner name</label>
              <input
                value={bName}
                onChange={(e) => setBName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
                placeholder="Partner B"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Your timezone</label>
              <select
                value={aTz}
                onChange={(e) => setATz(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
              >
                {COMMON_TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">
                Partner timezone
              </label>
              <select
                value={bTz}
                onChange={(e) => setBTz(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
              >
                {COMMON_TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            className="w-full rounded-xl bg-violet-600 py-3 font-semibold text-white shadow-sm hover:bg-violet-700"
          >
            Create our space
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-zinc-500">
          Already have a code? ask your partner to share it, then open{" "}
          <code className="rounded bg-zinc-100 px-1 py-0.5 dark:bg-zinc-800">
            /couple/CODE
          </code>
        </p>
      </div>
    </main>
  );
}
