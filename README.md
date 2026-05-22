# 🎵 TagTunes   [[Website]]( https://tag-tunes.vercel.app/)

A collaborative music queue for groups. The host creates a room, shares a link, and everyone adds songs together in real time.

> **⚠️ Currently in Spotify Development Mode** — only approved testers can log in as host. If you haven't been added as a tester, you can still join any room as a guest and add songs to the queue.

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
