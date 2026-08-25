"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useMutation, useConvex } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PARTNERS, PartnerKey } from "@/lib/config";
import { Heart } from "lucide-react";

interface SessionState {
  me: PartnerKey;
}

const SessionContext = createContext<SessionState | null>(null);

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession outside provider");
  return ctx;
}

const PIN_KEY = "closer:pin-ok";
const ME_KEY = "closer:me";

export function SessionGate({ children }: { children: ReactNode }) {
  const convex = useConvex();
  const seed = useMutation(api.couples.seed);

  const [phase, setPhase] = useState<"loading" | "pin" | "identity" | "ready">(
    "loading"
  );
  const [me, setMe] = useState<PartnerKey | null>(null);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);

  useEffect(() => {
    seed({});
    const pinOk = localStorage.getItem(PIN_KEY) === "yes";
    const savedMe = localStorage.getItem(ME_KEY) as PartnerKey | null;
    if (!pinOk) setPhase("pin");
    else if (!savedMe) setPhase("identity");
    else {
      setMe(savedMe);
      setPhase("ready");
    }
  }, [seed]);

  async function submitPin(e: React.FormEvent) {
    e.preventDefault();
    setPinError(false);
    const ok = await convex.query(api.couples.verifyPin, { pin });
    if (ok) {
      localStorage.setItem(PIN_KEY, "yes");
      setPhase(localStorage.getItem(ME_KEY) ? "ready" : "identity");
      const savedMe = localStorage.getItem(ME_KEY) as PartnerKey | null;
      if (savedMe) setMe(savedMe);
    } else {
      setPinError(true);
      setPin("");
    }
  }

  function chooseIdentity(key: PartnerKey) {
    localStorage.setItem(ME_KEY, key);
    setMe(key);
    setPhase("ready");
  }

  if (phase === "loading") {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Heart className="h-10 w-10 animate-pulse fill-current text-rose-500" />
      </div>
    );
  }

  if (phase === "pin") {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <form
          onSubmit={submitPin}
          className="w-full max-w-xs rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800"
        >
          <Heart className="mx-auto h-10 w-10 fill-current text-rose-500" />
          <h1 className="mt-3 text-xl font-bold">Closer</h1>
          <p className="mt-1 text-sm text-zinc-500">Just for the two of us</p>
          <input
            type="password"
            inputMode="numeric"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="mt-6 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-center text-2xl tracking-[0.5em] focus:border-rose-400 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
            placeholder="••••"
            autoFocus
          />
          {pinError && (
            <p className="mt-2 text-sm text-rose-600">Wrong PIN, try again</p>
          )}
          <button className="mt-4 w-full rounded-xl bg-rose-500 py-3 font-semibold text-white hover:bg-rose-600">
            Unlock
          </button>
        </form>
      </div>
    );
  }

  if (phase === "identity") {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
          <h1 className="text-xl font-bold">Who are you?</h1>
          <p className="mt-1 text-sm text-zinc-500">
            This device will remember your answer
          </p>
          <div className="mt-6 grid grid-cols-2 gap-4">
            {(Object.keys(PARTNERS) as PartnerKey[]).map((key) => (
              <button
                key={key}
                onClick={() => chooseIdentity(key)}
                className="rounded-2xl border-2 border-zinc-200 p-6 text-center transition hover:border-rose-400 hover:bg-rose-50 dark:border-zinc-700 dark:hover:bg-rose-900/20"
              >
                <span className="text-3xl">{PARTNERS[key].flag}</span>
                <p className="mt-2 font-semibold">{PARTNERS[key].name}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <SessionContext.Provider value={{ me: me! }}>
      {children}
    </SessionContext.Provider>
  );
}
