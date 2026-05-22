import NextAuth from "next-auth";
import SpotifyProvider from "next-auth/providers/spotify";
import type { NextAuthOptions } from "next-auth";
import type { JWT } from "next-auth/jwt";

async function refreshAccessToken(token: JWT): Promise<JWT> {
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(
        `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
      ).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: token.refreshToken as string,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    return { ...token, error: "RefreshAccessTokenError" };
  }

  return {
    ...token,
    accessToken: data.access_token,
    accessTokenExpires: Date.now() + data.expires_in * 1000,
    // Spotify sometimes rotates the refresh token, sometimes not
    refreshToken: data.refresh_token ?? token.refreshToken,
    error: undefined,
  };
}

export const authOptions: NextAuthOptions = {
  providers: [
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID!,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "streaming user-read-email user-read-private user-modify-playback-state user-read-playback-state",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        return {
          ...token,
          accessToken: account.access_token ?? "",
          refreshToken: account.refresh_token ?? "",
          accessTokenExpires: account.expires_at
            ? account.expires_at * 1000
            : Date.now() + 3600 * 1000,
          spotifyId: (profile as any)?.id,
        };
      }

      if (Date.now() < (token.accessTokenExpires as number)) {
        return token;
      }

      return refreshAccessToken(token);
    },

    async session({ session, token }) {
      session.user.spotifyId = token.spotifyId as string;
      session.accessToken = token.accessToken as string;
      if (token.error) {
        (session as any).error = token.error;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };