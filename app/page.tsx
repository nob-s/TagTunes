"use client";

import { useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { createClient } from "@supabase/supabase-js";

type View = "landing" | "host-room" | "guest-join" | "guest-room";
type QueueItem = {
  id: string;
  track_name: string;
  artist: string;
  added_by: string;
  position: number;
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Home() {
  const [view, setView] = useState<View>("landing");
  const [roomCode, setRoomCode] = useState<string | null>(null);

  const [guestCode, setGuestCode] = useState("");
  const [activeTab, setActiveTab] = useState<"search" | "queue">("queue");

  const [queue, setQueue] = useState<QueueItem[]>([]);
  const activeRoomCode = roomCode ?? (view === "guest-room" ? guestCode : null);
  const { data: session } = useSession();

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
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "queue_items", filter: `room_id=eq.${activeRoomCode}` },
        () => {
          fetch(`/api/queue?room_id=${activeRoomCode}`)
            .then(r => r.json())
            .then(d => setQueue(d));
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeRoomCode]);

  if (view === "host-room") {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-md">
          <p className="text-zinc-500 text-sm uppercase tracking-widest mb-1">Room code</p>
          <h1 className="text-5xl font-bold tracking-tight mb-2">{roomCode ?? "..."}</h1>
          <p className="text-zinc-400 mb-8">Welcome, {session?.user?.name} · Share this code with your guests</p>

          <div className="bg-zinc-900 rounded-2xl p-4 mb-4">
            <p className="text-zinc-500 text-sm mb-3">Up next</p>
            <p className="text-zinc-400 italic">Queue is empty — guests can add songs</p>
          </div>

          <div className="flex gap-3">
            <button className="flex-1 bg-zinc-800 hover:bg-zinc-700 transition rounded-full py-3 text-sm font-medium">
              ⏮ Prev
            </button>
            <button className="flex-1 bg-green-500 hover:bg-green-400 transition rounded-full py-3 text-sm font-bold">
              ▶ Play
            </button>
            <button className="flex-1 bg-zinc-800 hover:bg-zinc-700 transition rounded-full py-3 text-sm font-medium">
              Next ⏭
            </button>
          </div>
        </div>
      </div>
    );
  }
  if (view === "guest-join") {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          <h1 className="text-4xl font-bold tracking-tight mb-2">Join a room</h1>
          <p className="text-zinc-400 mb-8">Enter the room code from your host</p>
          <input
            value={guestCode}
            onChange={(e) => setGuestCode(e.target.value.toUpperCase())}
            placeholder="e.g. ABC123"
            className="w-full bg-zinc-900 border border-zinc-700 rounded-full px-6 py-4 text-center text-2xl font-bold tracking-widest mb-4 outline-none focus:border-green-500"
          />
          <button
            onClick={() => setView("guest-room")}
            disabled={guestCode.length < 4}
            className="w-full bg-green-500 hover:bg-green-400 disabled:opacity-40 transition text-black font-bold py-4 rounded-full text-base"
          >
            Join Room
          </button>
        </div>
      </div>
    );
  }

  if (view === "guest-room") {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-md">
          <p className="text-zinc-500 text-sm uppercase tracking-widest mb-1">Room</p>
          <h1 className="text-5xl font-bold tracking-tight mb-1">{guestCode}</h1>
          <p className="text-zinc-400 text-sm mb-6">Hosted by {"TODO"} · {"TODO"} guests</p>

          <div className="flex bg-zinc-900 rounded-full p-1 mb-6">
            <button
              onClick={() => setActiveTab("search")}
              className={`flex-1 py-2 rounded-full text-sm font-medium transition ${
                activeTab === "search" ? "bg-zinc-700 text-white" : "text-zinc-500"
              }`}
            >
              Search
            </button>
            <button
              onClick={() => setActiveTab("queue")}
              className={`flex-1 py-2 rounded-full text-sm font-medium transition ${
                activeTab === "queue" ? "bg-zinc-700 text-white" : "text-zinc-500"
              }`}
            >
              Queue
            </button>
          </div>

          {activeTab === "search" && (
            <div>
              <input
                placeholder="Search for a song..."
                className="w-full bg-zinc-900 border border-zinc-700 rounded-full px-5 py-3 text-sm outline-none focus:border-green-500 mb-4"
              />
              {[
                { title: "Mr. Brightside", artist: "The Killers" },
                { title: "Levitating", artist: "Dua Lipa" },
                { title: "Heat Waves", artist: "Glass Animals" },
                { title: "As It Was", artist: "Harry Styles" },
              ].map((s) => (
                <div key={s.title} className="flex items-center gap-3 py-3 border-b border-zinc-900">
                  <div className="w-10 h-10 rounded-md bg-zinc-800 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{s.title}</p>
                    <p className="text-xs text-zinc-500">{s.artist}</p>
                  </div>
                  <button className="text-xs border border-zinc-700 hover:border-green-500 hover:text-green-500 transition rounded-full px-3 py-1.5">
                    + Add
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeTab === "queue" && (
            <div>
              <div className="flex items-center gap-3 bg-zinc-900 rounded-2xl p-4 mb-4">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">Blinding Lights</p>
                  <p className="text-xs text-zinc-500">The Weeknd</p>
                </div>
                <span className="text-xs text-green-500 font-semibold tracking-wide">NOW PLAYING</span>
              </div>

              <p className="text-xs text-zinc-600 uppercase tracking-widest mb-3">Up next</p>
              {queue.map((s, i) => (
                <div key={s.id} className="flex items-center gap-3 py-3 border-b border-zinc-900">
                  <span className="text-xs text-zinc-600 w-4 text-center">{i + 1}</span>
                  <div className="w-10 h-10 rounded-md bg-zinc-800 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{s.track_name}</p>
                    <p className="text-xs text-zinc-500">{s.artist} · {s.added_by}</p>
                  </div>
                  <button className="flex items-center gap-1 text-xs border border-zinc-700 hover:border-green-500 hover:text-green-500 transition rounded-full px-3 py-1.5">
                    👍 {"TODO"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <div className="text-5xl mb-6">🎵</div>
        <h1 className="text-4xl font-bold tracking-tight mb-2">TagTunes</h1>
        <p className="text-zinc-400 mb-10">
          Host a room. Let your guests pick the music.
        </p>
        {/*Host*/}
        <p className="text-zinc-600 text-sm">Spotify Premium required to host</p>
        <button
          onClick={() => signIn("spotify")}
          className="w-full bg-green-500 hover:bg-green-400 transition text-black font-bold py-4 rounded-full text-base mb-4"
        >
          Login with Spotify
        </button>
        {/*Guest*/}
        <button
          onClick={() => setView("guest-join")}
          className="w-full bg-zinc-800 hover:bg-zinc-700 transition text-white font-bold py-4 rounded-full text-base"
        >
          Join a Room
        </button>
      </div>
    </div>
  );
}