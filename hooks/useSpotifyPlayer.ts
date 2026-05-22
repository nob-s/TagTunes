"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { QueueItem } from "@/types/queue";

export interface SpotifyPlayerState {
  deviceReady: boolean;
  isPlaying: boolean;
  currentTrack: Spotify.Track | null;
  volume: number;
  position: number;
  duration: number;
}

export interface SpotifyPlayerControls {
  play: () => Promise<void>;
  pause: () => void;
  togglePlay: () => Promise<void>;
  skip: () => Promise<void>;
  setVolume: (value: number) => Promise<void>;
  seek: (positionMs: number) => Promise<void>;  // ← add this
}

export function useSpotifyPlayer(queue: QueueItem[]): SpotifyPlayerState & SpotifyPlayerControls {
  const { data: session } = useSession();

  const [deviceReady, setDeviceReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<Spotify.Track | null>(null);
  const [volume, setVolumeState] = useState(() => {
    if (typeof window === "undefined") return 0.5;
    return parseFloat(localStorage.getItem("tagtunes_volume") ?? "0.5");
  });
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);

  const playerRef = useRef<Spotify.Player | null>(null);
  const playerInitialised = useRef(false);
  const queueRef = useRef<QueueItem[]>([]);
  const deviceIdRef = useRef<string | null>(null);
  const accessTokenRef = useRef<string | null>(null);
  const currentTrackRef = useRef<Spotify.Track | null>(null); // ← new ref
  const positionRef = useRef(0);
  const isPlayingRef = useRef(false);

  useEffect(() => { queueRef.current = queue; }, [queue]);

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
        deviceIdRef.current = device_id;
        setDeviceReady(true);
        p.setVolume(parseFloat(localStorage.getItem("tagtunes_volume") ?? "0.5"));
      });

      p.addListener("player_state_changed", (state) => {
        if (!state) return;

        // Keep ref in sync with state
        currentTrackRef.current = state.track_window.current_track;
        setCurrentTrack(state.track_window.current_track);
        setIsPlaying(!state.paused);
        setPosition(state.position);
        setDuration(state.duration);

        if (state.paused && state.position === 0 && !state.track_window.next_tracks.length) {
          playNextTrack();
        }
      });

      p.connect();
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

  // Song seek
  useEffect(() => { positionRef.current = position; }, [position]);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => {
    const interval = setInterval(() => {
      if (isPlayingRef.current) {
        setPosition((p) => Math.min(p + 1000, duration));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [duration]);

  async function playNextTrack() {
    const next = queueRef.current.find((item) => !item.played);
    if (!next || !deviceIdRef.current || !accessTokenRef.current) return;

    await fetch("/api/queue", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: next.id, new_played: true }),
    });

    await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceIdRef.current}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessTokenRef.current}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ uris: [next.track_uri] }),
    });
  }

  async function play() {
    if (currentTrackRef.current) {
      // Resume the paused track instead of jumping to the next one
      playerRef.current?.resume();
    } else {
      await playNextTrack();
    }
  }

  function pause() {
    playerRef.current?.pause(); // ← was wrongly calling togglePlay()
  }

  async function togglePlay() {
    if (isPlaying) {
      pause();
    } else {
      await play();
    }
  }

  async function skip() {
    await playerRef.current?.nextTrack();
    await playNextTrack();
  }

  async function setVolume(value: number) {
    const clamped = Math.max(0, Math.min(1, value));
    await playerRef.current?.setVolume(clamped);
    setVolumeState(clamped);
    localStorage.setItem("tagtunes_volume", String(clamped)); // ← add this
  }

  async function seek(positionMs: number) {
    await playerRef.current?.seek(positionMs);
  }

  return { deviceReady, isPlaying, currentTrack, volume, position, duration, play, pause, togglePlay, skip, setVolume, seek};
}