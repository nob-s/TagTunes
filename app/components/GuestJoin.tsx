// app/components/GuestJoin.tsx
"use client";

type Props = {
  guestCode: string;
  onJoinAction: () => void;
  setGuestCodeAction: (v: string) => void;
};

export default function GuestJoin({ guestCode, setGuestCodeAction, onJoinAction }: Props) {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-4xl font-bold tracking-tight mb-2">Join a room</h1>
        <p className="text-zinc-400 mb-8">Enter the room code from your host</p>
        <input
          value={guestCode}
          onChange={(e) => setGuestCodeAction(e.target.value.toUpperCase())}
          placeholder="e.g. ABC123"
          className="w-full bg-zinc-900 border border-zinc-700 rounded-full px-6 py-4 text-center text-2xl font-bold tracking-widest mb-4 outline-none focus:border-green-500"
        />
        <button
          onClick={async () => {
            const res = await fetch(`/api/rooms?code=${guestCode}`);
            if (res.ok) {
              onJoinAction();
            } else {
              alert("Room not found. Check the code and try again.");
            }
          }}
          disabled={guestCode.length < 4}
          className="w-full bg-green-500 hover:bg-green-400 disabled:opacity-40 transition text-black font-bold py-4 rounded-full text-base"
        >
          Join Room
        </button>
      </div>
    </div>
  );
}