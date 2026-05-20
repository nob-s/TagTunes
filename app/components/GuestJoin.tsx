"use client";

import { useState } from "react";

type Props = {
  onJoinAction: (code: string) => void;
};

export default function GuestJoin({ onJoinAction }: Props) {
  const [code, setCode] = useState("");

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-4xl font-bold tracking-tight mb-2">Join a room</h1>
        <p className="text-zinc-400 mb-8">Enter the room code from your host</p>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="e.g. ABC123"
          className="w-full bg-zinc-900 border border-zinc-700 rounded-full px-6 py-4 text-center text-2xl font-bold tracking-widest mb-4 outline-none focus:border-green-500"
        />
        <button
          onClick={async () => {
            const res = await fetch(`/api/rooms?code=${code}`);
            if (res.ok) {
              onJoinAction(code);
            } else {
              alert("Room not found. Check the code and try again.");
            }
          }}
          disabled={code.length < 6 || code.length > 6}
          className="w-full bg-green-500 hover:bg-green-400 disabled:opacity-40 transition text-black font-bold py-4 rounded-full text-base"
        >
          Join Room
        </button>
      </div>
    </div>
  );
}