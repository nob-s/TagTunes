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
  const [guestCode, setGuestCode] = useState("");
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const { data: session } = useSession();

  const activeRoomCode = roomCode ?? (view === "guest-room" ? guestCode : null);

  useEffect(() => {
    if (!activeRoomCode) return;
    fetch(`/api/queue?room_id=${activeRoomCode}`)
      .then(r => r.json())
      .then(d => setQueue(d));
  }, [activeRoomCode]);

  useEffect(() => {
    if (!session) return;
    if (view === "landing") setView("host-room");
    fetch("/api/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "My Room" }),
    })
      .then(r => r.json())
      .then(d => setRoomCode(d.id));
  }, [session]);

  useEffect(() => {
    if (!activeRoomCode) return;
    const channel = supabase
      .channel(`queue:${activeRoomCode}`)
      .on("postgres_changes",
        { event: "*", schema: "public", table: "queue_items", filter: `room_id=eq.${activeRoomCode}` },
        () => fetch(`/api/queue?room_id=${activeRoomCode}`).then(r => r.json()).then(setQueue)
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeRoomCode]);

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
        guestCode={guestCode}
        setGuestCodeAction={setGuestCode}
        onJoinAction={() => setView("guest-room")}
      />
    );
  }

  if (view === "guest-room") {
    return <GuestRoom guestCode={guestCode} queue={queue} />;
  }

  return (
    <Landing
      onHostAction={() => signIn("spotify")}
      onGuestAction={() => setView("guest-join")}
    />
  );
}