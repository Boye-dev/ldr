"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Gamepad2, Camera, BookHeart, Heart } from "lucide-react";
import { useSession } from "./session";
import { PARTNERS } from "@/lib/config";

const TABS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/games", label: "Games", icon: Gamepad2 },
  { href: "/photos", label: "Photos", icon: Camera },
  { href: "/us", label: "Us", icon: BookHeart },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function AppNav() {
  const pathname = usePathname();
  const { me } = useSession();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-56 flex-col border-r border-rose-100/50 bg-white/80 p-4 backdrop-blur-xl md:flex dark:border-rose-900/20 dark:bg-zinc-900/90">
        <div className="mb-8 flex items-center gap-2 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500 shadow-rose-200 shadow-sm dark:shadow-rose-900/30">
            <Heart className="h-5 w-5 fill-current text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">Closer</span>
        </div>
        <nav className="space-y-1.5">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = isActive(pathname, tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-rose-50 text-rose-600 shadow-sm dark:bg-rose-900/20 dark:text-rose-300"
                    : "text-zinc-600 hover:bg-rose-50/60 dark:text-zinc-400 dark:hover:bg-rose-900/10"
                }`}
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-xl transition ${
                    active
                      ? "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-300"
                      : "bg-zinc-100 text-zinc-500 group-hover:bg-rose-100/60 dark:bg-zinc-800 dark:text-zinc-400"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                {tab.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto rounded-2xl bg-zinc-50 p-3 text-center text-sm dark:bg-zinc-800/50">
          <span className="text-2xl">{PARTNERS[me].flag}</span>
          <p className="mt-0.5 font-medium">{PARTNERS[me].name}</p>
        </div>
      </aside>

      {/* Mobile bottom tabs */}
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-rose-100/50 bg-white/85 backdrop-blur-xl md:hidden dark:border-rose-900/20 dark:bg-zinc-900/90">
        <div className="mx-auto flex max-w-md items-center justify-around pb-[env(safe-area-inset-bottom)]">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = isActive(pathname, tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`relative flex flex-col items-center gap-0.5 px-4 py-2.5 text-[11px] font-medium transition ${
                  active
                    ? "text-rose-500"
                    : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                }`}
              >
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full transition ${
                    active
                      ? "bg-rose-100 text-rose-600 dark:bg-rose-900/30"
                      : ""
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                {tab.label}
                {active && (
                  <span className="absolute -top-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-rose-500" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
