// app/components/GuestRoom.tsx
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
  guestCode: string;
  queue: QueueItem[];
};

export default function GuestRoom({ guestCode, queue }: Props) {
  const [activeTab, setActiveTab] = useState<"search" | "queue">("queue");
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
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&room_id=${guestCode}`);
    if (res.ok) setSearchResults(await res.json());
    setSearching(false);
  }

  async function handleAdd(track: SearchTrack) {
    setAddingId(track.id);
    await fetch("/api/queue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        room_id: guestCode,
        track_uri: track.uri,
        track_name: track.name,
        artist: track.artists[0].name,
        added_by: "Guest",
      }),
    });
    setAddingId(null);
  }

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