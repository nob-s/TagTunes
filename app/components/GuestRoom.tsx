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

export default function GuestRoom({ roomCode, queue, hostName }: Props) {
  const [activeTab, setActiveTab] = useState<"search" | "queue">("queue");
  const [voteItems, setVoteItems] = useState<Record<string, boolean>>({});
  const [guestName, setGuestName] = useState(() =>
    typeof window !== "undefined" ? (localStorage.getItem("tagtunes_guest_name") ?? "") : ""
  );

  function handleNameBlur() {
    if (guestName.trim()) {
      localStorage.setItem("tagtunes_guest_name", guestName.trim());
    }
  }

  async function onToggleVote(item: QueueItem) {
    setVoteItems((prev) => ({
      ...prev,
      [item.id]: !prev[item.id],
    }));
    const voteChange = voteItems[item.id] ? -1 : 1;
    await fetch("/api/queue", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: item.id,
        new_votes: item.votes + voteChange,}),
    });
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center px-6 py-8">
      <div className="w-full max-w-md flex flex-col flex-1 min-h-0">
        <p className="text-zinc-500 text-sm uppercase tracking-widest mb-1">Room Code</p>
        <h1 className="text-5xl font-bold tracking-tight mb-1">{roomCode}</h1>
        <p className="text-zinc-400 text-sm mb-6">Hosted by {hostName}</p>

        <div className="flex items-center gap-2 mb-6">
          <input
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            onBlur={handleNameBlur}
            placeholder="Your name"
            className="bg-zinc-900 text-white text-sm rounded-full px-4 py-2 outline-none focus:ring-1 focus:ring-zinc-600 w-40 placeholder:text-zinc-600"
          />
        </div>

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

        {activeTab === "search" && roomCode && <SongSearch roomId={roomCode} addedBy={guestName} />}

        {activeTab === "queue" && (
          <QueueList
            queue={queue}
            rowAction={(item) => (
              <button
                className={`
                  flex items-center gap-1 text-xs border
                  border-zinc-700 hover:border-green-500 hover:text-green-500
                  transition rounded-full px-3 py-1.5          
                  ${voteItems[item.id]
                    ? "border-green-500 text-green-500 bg-green-500/10"
                    : "border-zinc-700 hover:border-green-500 hover:text-green-500"}
                `}
                onClick={async () => onToggleVote(item)}
              >
                👍 {item.votes}
              </button>
            )}
          />
        )}
      </div>
    </div>
  );
}