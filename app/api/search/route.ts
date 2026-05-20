import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  const room_id = req.nextUrl.searchParams.get("room_id");

  if (!q || !room_id) {
    return NextResponse.json({ error: "Missing q or room_id" }, { status: 400 });
  }

  const { data: room } = await supabase
    .from("rooms")
    .select("access_token")
    .eq("id", room_id)
    .single();

  if (!room?.access_token) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  const spotifyRes = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=track&limit=10`,
    { headers: { Authorization: `Bearer ${room.access_token}` } }
  );

  if (!spotifyRes.ok) {
    return NextResponse.json({ error: "Spotify search failed" }, { status: 502 });
  }

  const spotifyData = await spotifyRes.json();
  return NextResponse.json(spotifyData.tracks.items);
}