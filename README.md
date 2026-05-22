# 🎵 TagTunes   [[Website]]( https://tag-tunes.vercel.app/)

A collaborative music queue for groups. The host creates a room, shares a link, and everyone adds songs together in real time.

> **⚠️ Currently in Spotify Development Mode** — only approved testers can log in as host. If you haven't been added as a tester, you can still join any room as a guest and add songs to the queue. [Test link](https://tag-tunes.vercel.app/RJVXC1) (my link).

---

## Features

- Host creates a room and shares a link — guests join instantly, no Spotify account needed
- Everyone can search for songs and add them to the shared queue
- Queue syncs live across all browsers via Supabase Realtime
- Music plays in the host's browser via the Spotify Web Playback SDK
- Host controls play / pause / skip; guests can vote to skip

## Stack

Next.js · React · TypeScript · Tailwind · NextAuth · Supabase · Spotify Web Playback SDK · Vercel

## Running locally

```bash
git clone https://github.com/yourusername/tagtunes
cd tagtunes
npm install
```

You'll need a Spotify Developer app, a Supabase project, and ngrok (the SDK requires HTTPS locally). Copy `.env.local.example` to `.env.local` and fill in your keys.

> The host must have Spotify Premium. Guests need no account at all.

### Code to setup supabase tables
```sql
CREATE TABLE rooms (
  id text PRIMARY KEY,
  host_id text,
  name text,
  access_token text,
  created_at timestamp DEFAULT now()
);

CREATE TABLE queue_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id text REFERENCES rooms(id) ON DELETE CASCADE,
  track_uri text,
  track_name text,
  artist text,
  added_by text,
  position integer,
  played boolean DEFAULT false,
  votes integer DEFAULT 0,
  album_image text,
  created_at timestamp DEFAULT now()
);

ALTER TABLE queue_items REPLICA IDENTITY FULL;

ALTER TABLE queue_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

ALTER PUBLICATION supabase_realtime ADD TABLE queue_items;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.rooms TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.queue_items TO service_role;

CREATE POLICY "public read queue_items" ON queue_items FOR SELECT USING (true);
```

