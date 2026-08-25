"use client";

import {
  createContext,
  useContext,
  useEffect,
  useReducer,
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

type Phase = "loading" | "pin" | "identity" | "ready";

interface GateState {
  phase: Phase;
  me: PartnerKey | null;
  pin: string;
  pinError: boolean;
  pinLoading: boolean;
}

type Action =
  | { type: "init"; savedMe: PartnerKey | null; pinOk: boolean }
  | { type: "setPin"; pin: string }
  | { type: "startCheck" }
  | { type: "pinBad" }
  | { type: "pinError" }
  | { type: "goIdentity" }
  | { type: "ready"; me: PartnerKey };

function reducer(state: GateState, action: Action): GateState {
  switch (action.type) {
    case "init":
      if (!action.pinOk) return { ...state, phase: "pin" };
      if (!action.savedMe) return { ...state, phase: "identity" };
      return { ...state, phase: "ready", me: action.savedMe };
    case "setPin":
      return { ...state, pin: action.pin, pinError: false };
    case "startCheck":
      return { ...state, pinLoading: true };
    case "pinBad":
      return { ...state, pin: "", pinError: true, pinLoading: false };
    case "pinError":
      return { ...state, pinError: true, pinLoading: false };
    case "goIdentity":
      return { ...state, phase: "identity", pinLoading: false };
    case "ready":
      return { ...state, phase: "ready", me: action.me, pinLoading: false };
  }
}

export function SessionGate({ children }: { children: ReactNode }) {
  const convex = useConvex();
  const seed = useMutation(api.couples.seed);

  const [state, dispatch] = useReducer(reducer, {
    phase: "loading",
    me: null,
    pin: "",
    pinError: false,
    pinLoading: false,
  });

  useEffect(() => {
    seed({}).catch(() => {});
    const pinOk = localStorage.getItem(PIN_KEY) === "yes";
    const savedMe = localStorage.getItem(ME_KEY) as PartnerKey | null;
    dispatch({ type: "init", pinOk, savedMe });
  }, [seed]);

  async function submitPin(e: React.FormEvent) {
    e.preventDefault();
    dispatch({ type: "startCheck" });
    try {
      const ok = await convex.query(api.couples.verifyPin, { pin: state.pin });
      if (ok) {
        localStorage.setItem(PIN_KEY, "yes");
        const savedMe = localStorage.getItem(ME_KEY) as PartnerKey | null;
        if (savedMe) {
          localStorage.setItem(ME_KEY, savedMe);
          dispatch({ type: "ready", me: savedMe });
        } else {
          dispatch({ type: "goIdentity" });
        }
      } else {
        dispatch({ type: "pinBad" });
      }
    } catch (err) {
      console.error("PIN check failed", err);
      dispatch({ type: "pinError" });
    }
  }

  function chooseIdentity(key: PartnerKey) {
    localStorage.setItem(ME_KEY, key);
    dispatch({ type: "ready", me: key });
  }

  if (state.phase === "loading") {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Heart className="h-10 w-10 animate-pulse fill-current text-rose-500" />
      </div>
    );
  }

  if (state.phase === "pin") {
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
            value={state.pin}
            onChange={(e) => dispatch({ type: "setPin", pin: e.target.value })}
            className="mt-6 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-center text-2xl tracking-[0.5em] focus:border-rose-400 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
            placeholder="••••"
            autoFocus
          />
          {state.pinError && (
            <p className="mt-2 text-sm text-rose-600">
              Wrong PIN or connection problem
            </p>
          )}
          <button
            disabled={state.pinLoading || state.pin.length === 0}
            className="mt-4 w-full rounded-xl bg-rose-500 py-3 font-semibold text-white hover:bg-rose-600 disabled:opacity-60"
          >
            {state.pinLoading ? "Checking…" : "Unlock"}
          </button>
        </form>
      </div>
    );
  }

  if (state.phase === "identity") {
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
    <SessionContext.Provider value={{ me: state.me! }}>
      {children}
    </SessionContext.Provider>
  );
}
