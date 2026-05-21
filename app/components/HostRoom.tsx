"use client";

import { useState } from "react";
import { QueueItem } from "@/types/queue";
import SongSearch from "@/app/components/SongSearch";
import QueueList from "@/app/components/QueueList";
import { useSpotifyPlayer } from "@/hooks/useSpotifyPlayer";

type Props = {
  roomCode: string | null;
  queue: QueueItem[];
  hostName: string | undefined;
};

export default function HostRoom({ roomCode, queue, hostName }: Props) {
  const [activeTab, setActiveTab] = useState<"queue" | "search">("queue");
  const { deviceReady, isPlaying, volume, setVolume, togglePlay, skip } = useSpotifyPlayer(queue);

  async function onDeleteItem(item: QueueItem) {
    await fetch(`/api/queue?id=${item.id}`, { method: "DELETE" });
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center px-6 py-8">
      <div className="w-full max-w-md flex flex-col flex-1 min-h-0">
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

        {activeTab === "search" && (
          <SongSearch roomId={roomCode ?? ""} addedBy={hostName ?? "Host"} />
        )}

        {activeTab === "queue" && (
          <div>
            <div className="bg-zinc-900 rounded-2xl p-4 mb-4">
              <QueueList
                queue={queue}
                rowAction={(item) => (
                  <div className="flex gap-x-4">
                    <p className="border border-zinc-700 rounded-full py-2 px-3">
                      👍 {item.votes}
                    </p>
                    <button
                      className="flex items-center gap-1 text-xs border border-zinc-700 hover:border-red-500 hover:text-red-500 transition rounded-full px-3 py-1.5"
                      onClick={() => onDeleteItem(item)}
                    >
                      🗑 Delete
                    </button>
                  </div>
                )}
              />
            </div>

            <div className="flex gap-3">
              <button className="flex-1 bg-zinc-800 hover:bg-zinc-700 transition rounded-full py-3 text-sm font-medium">
                ⏮ Prev
              </button>
              <button
                disabled={!deviceReady}
                className={`flex-1 bg-green-500 transition rounded-full py-3 text-sm font-bold ${
                  !deviceReady ? "opacity-50 cursor-not-allowed" : "hover:bg-green-400"
                }`}
                onClick={togglePlay}
              >
                {deviceReady ? (isPlaying ? "⏸ Pause" : "▶ Play") : "Connecting..."}
              </button>
              <button
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 transition rounded-full py-3 text-sm font-medium"
                onClick={skip}
              >
                Next ⏭
              </button>
            </div>
            <div className="flex items-center gap-3 px-1 pt-2">
              <span className="text-zinc-500 text-base">{
                volume == 0 ? "🔇"
                  : volume < 0.33 ? "🔈"
                    : volume < 0.66 ? "🔉" : "🔊"}
              </span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="flex-1 accent-green-500"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}