import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/queue?room_id=<code> — fetch queue for a room
export async function GET(req: NextRequest) {
  const room_id = req.nextUrl.searchParams.get("room_id");

  if (!room_id) {
    return NextResponse.json({ error: "Missing room_id" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("queue_items")
    .select("*")
    .eq("room_id", room_id)
    .order("position", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST /api/queue — add a song
export async function POST(req: NextRequest) {
  const { room_id, track_uri, track_name, artist, added_by, album_image} = await req.json();

  if (!room_id || !track_uri || !track_name || !artist) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Get current max position
  const { data: maxRow } = await supabase
    .from("queue_items")
    .select("position")
    .eq("room_id", room_id)
    .order("position", { ascending: false })
    .limit(1)
    .single();

  const position = (maxRow?.position ?? 0) + 1000;

  const { data, error } = await supabase
    .from("queue_items")
    .insert({ room_id, track_uri, track_name, artist, added_by, position, album_image })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

// PATCH /api/queue — reorder a song (fractional indexing)
// Body: { id, above_position, below_position, new_votes, new_played }
// Don't pass above_position to move to top, don't pass for below_position to move to bottom
// Don't pass both to not move.
// Don't pass new_votes or new_played if not updating
export async function PATCH(req: NextRequest) {
  const { id, above_position, below_position, new_votes, new_played } = await req.json();

  if (!id) {
    return NextResponse.json({ error: "Missing item id" }, { status: 400 });
  }

  let newPosition;

  if (above_position == undefined && below_position == undefined) {
    newPosition = undefined;
  } else if (above_position == undefined) {
    // Moving to top
    newPosition = below_position - 500;
  } else if (below_position == undefined) {
    // Moving to bottom
    newPosition = above_position + 1000;
  } else {
    // Between two items
    newPosition = (above_position + below_position) / 2;
  }

  const updateJson = {
    ...(new_votes !== undefined && { votes: new_votes}),
    ...(newPosition !== undefined && { position: newPosition }),
    ...(new_played !== undefined && { played: new_played }),
  };

  const { data, error } = await supabase
    .from("queue_items")
    .update(updateJson)
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
