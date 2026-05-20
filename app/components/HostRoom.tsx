// app/components/HostRoom.tsx
"use client";

import { useState } from "react";
import { QueueItem } from "@/types/queue";
import SongSearch from "@/app/components/SongSearch";
import QueueList from "@/app/components/QueueList";

type Props = {
  roomCode: string | null;
  queue: QueueItem[];
  hostName: string | undefined;
};

export default function HostRoom({ roomCode, queue, hostName }: Props) {
  const [activeTab, setActiveTab] = useState<"queue" | "search">("queue");

  async function onDeleteItem(item: QueueItem) {
    await fetch(`/api/queue?id=${item.id}`, {
      method: "DELETE",
    });
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

        {activeTab === "search" && (
          <SongSearch roomId={roomCode ?? ""} addedBy={hostName ?? "Host"} />
        )}

        {activeTab === "queue" && (
          <div>
            <div className="bg-zinc-900 rounded-2xl p-4 mb-4">
              <QueueList
                queue={queue}
                nowPlaying={
                  <div className="flex items-center gap-3 bg-zinc-900 rounded-2xl p-4 mb-4">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0" />
                    <span className="text-xs text-green-500 font-semibold tracking-wide">NOW PLAYING</span>
                  </div>
                }
                rowAction={(item) => (
                  <button
                    className="flex items-center gap-1 text-xs border border-zinc-700 hover:border-red-500 hover:text-red-500 transition rounded-full px-3 py-1.5"
                    onClick={async () => onDeleteItem(item)}
                  >
                    🗑 Delete
                  </button>
                )}
              />
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
      </div>
    </div>
  );
}