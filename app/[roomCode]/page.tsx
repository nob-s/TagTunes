"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import HostRoom from "@/app/components/HostRoom";
import GuestRoom from "@/app/components/GuestRoom";
import { QueueItem } from "@/types/queue";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type RoomStatus = "loading" | "host" | "guest" | "not-found";

export default function RoomPage() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const { data: session, status } = useSession();
  const [roomStatus, setRoomStatus] = useState<RoomStatus>("loading");
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    fetch(`/api/rooms?code=${roomCode}`)
      .then(r => r.json())
      .then(room => {
        if (!room || room.error) {
          setRoomStatus("not-found");
          return;
        }
        const isHost = session?.user?.spotifyId && session.user.spotifyId === room.host_id;
        setRoomStatus(isHost ? "host" : "guest");
      });
  }, [roomCode, session, status]);

  useEffect(() => {
    if (roomStatus === "loading" || roomStatus === "not-found") return;

    fetch(`/api/queue?room_id=${roomCode}`).then(r => r.json()).then(setQueue);

    const channel = supabase
      .channel(`queue_${roomCode}`)
      .on("postgres_changes",
        { event: "*", schema: "public", table: "queue_items" },
        () => {
          fetch(`/api/queue?room_id=${roomCode}`).then(r => r.json()).then(setQueue);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [roomCode, roomStatus]);

  if (roomStatus === "loading") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: "12px" }}>
        <i className="ti ti-loader-2 ti-spin" style={{ fontSize: "28px", color: "var(--color-text-secondary)" }} aria-hidden="true" />
        <p style={{ color: "var(--color-text-secondary)", fontSize: "15px", margin: 0 }}>Finding your room…</p>
      </div>
    );
  }

  if (roomStatus === "not-found") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: "8px" }}>
        <i className="ti ti-door-off" style={{ fontSize: "40px", color: "var(--color-text-tertiary)" }} aria-hidden="true" />
        <p style={{ fontSize: "18px", fontWeight: 500, margin: "8px 0 4px" }}>Room not found</p>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "14px", margin: "0 0 20px" }}>This room may have expired or the code is incorrect.</p>
        <button onClick={() => router.push("/")} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", fontSize: "14px", cursor: "pointer" }}>
          <i className="ti ti-arrow-left" style={{ fontSize: "16px" }} aria-hidden="true" />
          Back to home
        </button>
      </div>
    );
  }

  if (roomStatus === "host") {
    return <HostRoom roomCode={roomCode} queue={queue} hostName={session?.user?.name ?? undefined} />;
  }

  return <GuestRoom roomCode={roomCode} queue={queue} hostName={session?.user?.name ?? undefined} />;
}