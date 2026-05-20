import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function generateRoomCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// POST /api/rooms — host creates a room
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.spotifyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check for existing room first
  const { data: existing } = await supabase
    .from("rooms")
    .select("id")
    .eq("host_id", session.user.spotifyId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (existing) {
    await supabase
      .from("rooms")
      .update({ access_token: session.accessToken })
      .eq("id", existing.id);
    return NextResponse.json({ id: existing.id });
  }

  // No existing room
  const { name } = await req.json();
  const code = generateRoomCode();

  const { data, error } = await supabase
    .from("rooms")
    .insert({
      id: code,
      host_id: session.user.spotifyId,
      name: name ?? "My Room",
      access_token: session.accessToken,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

// GET /api/rooms?code=ABC123 — validate a room code (guests)
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "Missing room code" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("rooms")
    .select("id, name, host_id, created_at")
    .eq("id", code.toUpperCase())
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}