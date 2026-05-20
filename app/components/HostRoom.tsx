// app/components/HostRoom.tsx
"use client";

import { useState } from "react";
import { QueueItem } from "@/types/queue";

type SearchTrack = {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  uri: string;
  album: { images: Array<{ url: string }> };
};

type Props = {
  roomCode: string | null;
  queue: QueueItem[];
  hostName: string | undefined;
};

export default function HostRoom({ roomCode, queue, hostName }: Props) {
  const [activeTab, setActiveTab] = useState<"queue" | "search">("queue");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchTrack[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);

  async function handleSearch(query: string) {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&room_id=${roomCode}`);
    if (res.ok) setSearchResults(await res.json());
    setSearching(false);
  }

  async function handleAdd(track: SearchTrack) {
    setAddingId(track.id);
    await fetch("/api/queue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        room_id: roomCode,
        track_uri: track.uri,
        track_name: track.name,
        artist: track.artists[0].name,
        added_by: hostName ?? "Host",
      }),
    });
    setAddingId(null);
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-md">
        <p className="text-zinc-500 text-sm uppercase tracking-widest mb-1">Room code</p>
        <h1 className="text-5xl font-bold tracking-tight mb-2">{roomCode ?? "..."}</h1>
        <p className="text-zinc-400 mb-6">Welcome, {hostName} · Share this code with your guests</p>

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

        {activeTab === "queue" && (
          <div>
            <div className="bg-zinc-900 rounded-2xl p-4 mb-4">
              <p className="text-zinc-500 text-sm mb-3">Up next</p>
              {queue.length === 0 ? (
                <p className="text-zinc-400 italic">Queue is empty — add some songs</p>
              ) : (
                queue.map((s, i) => (
                  <div key={s.id} className="flex items-center gap-3 py-2.5 border-b border-zinc-800 last:border-0">
                    <span className="text-xs text-zinc-600 w-4 text-center shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{s.track_name}</p>
                      <p className="text-xs text-zinc-500">{s.artist} · added by {s.added_by}</p>
                    </div>
                  </div>
                ))
              )}
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
        )}

        {activeTab === "search" && (
          <div>
            <input
              placeholder="Search for a song..."
              value={searchQuery}
              onChange={e => handleSearch(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-full px-5 py-3 text-sm outline-none focus:border-green-500 mb-4"
            />
            {searching && (
              <p className="text-zinc-500 text-sm text-center py-4">Searching…</p>
            )}
            {searchResults.map((track) => (
              <div key={track.id} className="flex items-center gap-3 py-3 border-b border-zinc-900">
                {track.album.images[0] && (
                  <img src={track.album.images[0].url} className="w-10 h-10 rounded-md shrink-0" alt={track.name} />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{track.name}</p>
                  <p className="text-xs text-zinc-500">{track.artists[0].name}</p>
                </div>
                <button
                  onClick={() => handleAdd(track)}
                  disabled={addingId === track.id}
                  className="text-xs border border-zinc-700 hover:border-green-500 hover:text-green-500 disabled:opacity-40 transition rounded-full px-3 py-1.5"
                >
                  {addingId === track.id ? "Adding…" : "+ Add"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}