"use client";

type Props = {
  onHostAction: () => void;
  onGuestAction: () => void;
  hostName: string | undefined;
};

export default function Landing({ onHostAction, onGuestAction, hostName }: Props) {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <div className="text-5xl mb-6">🎵</div>
        <h1 className="text-4xl font-bold tracking-tight mb-2">TagTunes</h1>
        <p className="text-zinc-400 mb-10">
          Host a room. Let your guests pick the music.
        </p>
        <p className="text-zinc-600 text-sm">Spotify Premium required to host</p>
        <button
          onClick={onHostAction}
          className="w-full bg-green-500 hover:bg-green-400 transition text-black font-bold py-4 rounded-full text-base mb-4"
        >
          {hostName ? `Host as ${hostName}` : "Login with Spotify"}
        </button>
        <button
          onClick={onGuestAction}
          className="w-full bg-zinc-800 hover:bg-zinc-700 transition text-white font-bold py-4 rounded-full text-base"
        >
          Join a Room
        </button>
      </div>
    </div>
  );
}