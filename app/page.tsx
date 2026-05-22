"use client";

import { useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import GuestJoin from "@/app/components/GuestJoin";
import Landing from "@/app/components/Landing";

type View = "landing" | "guest-join";

export default function Home() {
  const [view, setView] = useState<View>("landing");
  const { data: session } = useSession();
  const router = useRouter();

  const handleHost = async () => {
    if (session) {
      const r = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "My Room" }),
      });
      const d = await r.json();
      router.push(`/${d.id}`);
    } else {
      await signIn("spotify");
    }
  };

  if (view === "guest-join") {
    return (
      <GuestJoin onJoinAction={(code) => router.push(`/${code}`)} />
    );
  }

  return (
    <Landing
      onHostAction={handleHost}
      onGuestAction={() => setView("guest-join")}
      hostName={session?.user?.name ?? null}
    />
  );
}