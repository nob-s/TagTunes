"use client";

import { useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { createClient } from "@supabase/supabase-js";
import GuestJoin from "@/app/components/GuestJoin";
import HostRoom from "@/app/components/HostRoom";
import GuestRoom from "@/app/components/GuestRoom";
import Landing from "@/app/components/Landing";
import { QueueItem } from "@/types/queue";

type View = "landing" | "host-room" | "guest-join" | "guest-room";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Home() {
  const [view, setView] = useState<View>("landing");
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const { data: session } = useSession();

  useEffect(() => {
    if (!roomCode) return;
    fetch(`/api/queue?room_id=${roomCode}`)
      .then(r => r.json())
      .then(setQueue);

    const channel = supabase
      .channel(`queue:${roomCode}`)
      .on("postgres_changes",
        { event: "*", schema: "public", table: "queue_items", filter: `room_id=eq.${roomCode}` },
        () => fetch(`/api/queue?room_id=${roomCode}`)
          .then(r => r.json())
          .then(setQueue)
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [roomCode]);

  const handleHost = async () => {
    if (session) {
      const r = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "My Room" }),
      });
      const d = await r.json();
      setRoomCode(d.id);
      setView("host-room");
    } else {
      await signIn("spotify");
    }
  };

  if (view === "host-room") {
    return (
      <HostRoom
        roomCode={roomCode}
        queue={queue}
        hostName={session?.user?.name ?? undefined}
      />
    );
  }

  if (view === "guest-join") {
    return (
      <GuestJoin
        onJoinAction={(code) => {
          setRoomCode(code);
          setView("guest-room");
        }}
      />
    );
  }

  if (view === "guest-room") {
    return <GuestRoom roomCode={roomCode} queue={queue} />;
  }

  return (
    <Landing
      onHostAction={handleHost}
      onGuestAction={() => setView("guest-join")}
      hostName={session?.user?.name ?? null}
    />
  );
}