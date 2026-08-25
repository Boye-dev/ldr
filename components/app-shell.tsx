"use client";

import { ReactNode } from "react";
import { SessionGate } from "./session";
import { AppNav } from "./nav";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <SessionGate>
      <AppNav />
      <div className="min-h-full flex-1 md:ml-56">
        <main className="mx-auto w-full max-w-2xl px-4 pb-28 pt-6 md:pb-10">
          {children}
        </main>
      </div>
    </SessionGate>
  );
}
