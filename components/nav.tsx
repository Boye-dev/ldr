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
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-56 flex-col border-r border-zinc-200 bg-white p-4 md:flex dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-8 flex items-center gap-2 px-2">
          <Heart className="h-6 w-6 fill-current text-rose-500" />
          <span className="text-lg font-bold">Closer</span>
        </div>
        <nav className="space-y-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = isActive(pathname, tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-300"
                    : "text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800"
                }`}
              >
                <Icon className="h-5 w-5" />
                {tab.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto rounded-xl bg-zinc-50 p-3 text-center text-sm dark:bg-zinc-800">
          <span className="text-lg">{PARTNERS[me].flag}</span>
          <p className="font-medium">{PARTNERS[me].name}</p>
        </div>
      </aside>

      {/* Mobile bottom tabs */}
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-zinc-200 bg-white/95 backdrop-blur md:hidden dark:border-zinc-800 dark:bg-zinc-900/95">
        <div className="mx-auto flex max-w-md items-center justify-around pb-[env(safe-area-inset-bottom)]">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = isActive(pathname, tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex flex-col items-center gap-0.5 px-4 py-2.5 text-[11px] font-medium ${
                  active ? "text-rose-500" : "text-zinc-400"
                }`}
              >
                <Icon className="h-6 w-6" />
                {tab.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
