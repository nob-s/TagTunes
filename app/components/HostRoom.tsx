// app/components/HostRoom.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { QueueItem } from "@/types/queue";
import SongSearch from "@/app/components/SongSearch";
import QueueList from "@/app/components/QueueList";
import { useSession } from "next-auth/react";

type Props = {
  roomCode: string | null;
  queue: QueueItem[];
  hostName: string | undefined;
};

export default function HostRoom({ roomCode, queue, hostName }: Props) {
  const [activeTab, setActiveTab] = useState<"queue" | "search">("queue");

  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [deviceReady, setDeviceReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<Spotify.Track | null>(null);

  const { data: session } = useSession();

  const playerRef = useRef<Spotify.Player | null>(null);
  const playerInitialised = useRef(false);
  const queueRef = useRef<QueueItem[]>([]);
  const deviceIdRef = useRef<string | null>(null);
  const accessTokenRef = useRef<string | null>(null);
  const markedPlayedRef = useRef<Set<string>>(new Set());

  useEffect(() => { queueRef.current = queue; }, [queue]);
  useEffect(() => { deviceIdRef.current = deviceId; }, [deviceId]);
  useEffect(() => {
    if (session?.accessToken) accessTokenRef.current = session.accessToken;
  }, [session?.accessToken]);

  useEffect(() => {
    if (!session?.accessToken) return;
    if (playerInitialised.current) return;
    playerInitialised.current = true;

    const initPlayer = () => {
      const p = new window.Spotify.Player({
        name: "TagTunes Player",
        getOAuthToken: (cb) => cb(accessTokenRef.current!),
        volume: 0.5,
      });

      p.addListener("ready", ({ device_id }) => {
        console.log("SDK ready, device_id:", device_id);
        deviceIdRef.current = device_id;
        setDeviceId(device_id);
        setDeviceReady(true);
      });

      p.addListener('player_state_changed', (state) => {
        if (!state) return;
        setCurrentTrack(state.track_window.current_track);
        setIsPlaying(!state.paused);

        if (state.paused && state.position === 0 && !state.track_window.next_tracks.length) {
          const finishedUri = state.track_window.current_track.uri;
          if (!markedPlayedRef.current.has(finishedUri)) {
            markedPlayedRef.current.add(finishedUri);
            markCurrentPlayed(finishedUri).then(() => playNextTrack());
          }
        }
      });

      p.connect().then((success) => {
        console.log("SDK connect result:", success);
      });

      playerRef.current = p;
    };

    if (window.Spotify) {
      initPlayer();
    } else {
      window.onSpotifyWebPlaybackSDKReady = initPlayer;
    }

    return () => {
      playerRef.current?.disconnect();
    };
  }, [session?.accessToken]);

  async function markCurrentPlayed(uri: string) {
    const item = queueRef.current.find(i => i.track_uri === uri);
    if (!item) return;
    await fetch("/api/queue", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, new_played: true }),
    });
  }

  async function playNextTrack() {
    const next = queueRef.current.find((item) => !item.played);
    if (!next || !deviceIdRef.current || !session?.accessToken) return;

    await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceIdRef.current}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessTokenRef.current}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ uris: [next.track_uri] }),
    });
  }

  async function onDeleteItem(item: QueueItem) {
    await fetch(`/api/queue?id=${item.id}`, {
      method: "DELETE",
    });
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
                      onClick={async () => onDeleteItem(item)}
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
                className={`flex-1 bg-green-500 transition rounded-full py-3 text-sm font-bold
                ${!deviceReady ? "opacity-50 cursor-not-allowed" : "hover:bg-green-400"}
                `}
                onClick={async () => {
                  if (isPlaying) {
                    playerRef.current?.togglePlay();
                  } else {
                    await playNextTrack();
                  }
                }}
              >
                {deviceReady ? (isPlaying ? "⏸ Pause" : "▶ Play") : "Connecting..."}
              </button>
              <button
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 transition rounded-full py-3 text-sm font-medium"
                onClick={async () => {
                  await playerRef.current?.nextTrack();   // skips in SDK
                  await playNextTrack();       // marks played + queues next URI
                }}
              >
                Next ⏭
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}