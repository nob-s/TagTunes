// app/components/SongSearch.tsx
"use client";

import { useState } from "react";

export type SearchTrack = {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  uri: string;
  album: { images: Array<{ url: string }> };
};

type Props = {
  roomId: string;
  addedBy?: string;  // add this
};

export default function SongSearch({ roomId, addedBy = "Guest" }: Props) {
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
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&room_id=${roomId}`);
    if (res.ok) setSearchResults(await res.json());
    setSearching(false);
  }

  async function handleAdd(track: SearchTrack) {
    setAddingId(track.id);
    await fetch("/api/queue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        room_id: roomId,
        track_uri: track.uri,
        track_name: track.name,
        artist: track.artists[0].name,
        added_by: addedBy,
      }),
    });
    setAddingId(null);
  }

  return (
    <div>
      <input
        placeholder="Search for a song..."
        value={searchQuery}
        onChange={(e) => handleSearch(e.target.value)}
        className="w-full bg-zinc-900 border border-zinc-700 rounded-full px-5 py-3 text-sm outline-none focus:border-green-500 mb-4"
      />
      {searching && (
        <p className="text-zinc-500 text-sm text-center py-4">Searching…</p>
      )}
      {searchResults.map((track) => (
        <div key={track.id} className="flex items-center gap-3 py-3 border-b border-zinc-900">
          {track.album.images[0] && (
            <img
              src={track.album.images[0].url}
              className="w-10 h-10 rounded-md shrink-0"
              alt={track.name}
            />
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
  );
}