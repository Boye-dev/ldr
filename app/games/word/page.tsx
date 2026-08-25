"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useSession } from "@/components/session";
import { WordDuel } from "@/components/word-duel";

export default function WordPage() {
  const { me } = useSession();
  return (
    <div className="space-y-4">
      <Link href="/games" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700">
        <ArrowLeft className="h-4 w-4" /> All games
      </Link>
      <WordDuel me={me} />
    </div>
  );
}
