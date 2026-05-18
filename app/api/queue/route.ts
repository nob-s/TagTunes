import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/queue — add a song
export async function POST(req: NextRequest) {
  const { room_id, track_uri, track_name, artist, added_by } = await req.json();

  if (!room_id || !track_uri || !track_name || !artist) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Get current max position
  const { data: maxRow } = await supabase
    .from("queue_items")
    .select("position")
    .eq("room_id", room_id)
    .eq("played", false)
    .order("position", { ascending: false })
    .limit(1)
    .single();

  const position = (maxRow?.position ?? 0) + 1000;

  const { data, error } = await supabase
    .from("queue_items")
    .insert({
      room_id,
      track_uri,
      track_name,
      artist,
      added_by: added_by ?? "Guest",
      position,
      played: false,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

// PATCH /api/queue — reorder a song (fractional indexing)
// Body: { id, above_position, below_position }
// Pass null for above_position to move to top, null for below_position to move to bottom
export async function PATCH(req: NextRequest) {
  const { id, above_position, below_position } = await req.json();

  if (!id) {
    return NextResponse.json({ error: "Missing item id" }, { status: 400 });
  }

  let newPosition: number;

  if (above_position == null && below_position == null) {
    return NextResponse.json({ error: "Need at least one neighbor position" }, { status: 400 });
  } else if (above_position == null) {
    // Moving to top
    newPosition = below_position - 500;
  } else if (below_position == null) {
    // Moving to bottom
    newPosition = above_position + 1000;
  } else {
    // Between two items
    newPosition = (above_position + below_position) / 2;
  }

  const { data, error } = await supabase
    .from("queue_items")
    .update({ position: newPosition })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// DELETE /api/queue?id=<uuid> — remove a song
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing item id" }, { status: 400 });
  }

  const { error } = await supabase
    .from("queue_items")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}