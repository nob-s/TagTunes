import NextAuth from "next-auth";
import SpotifyProvider from "next-auth/providers/spotify";
import type { NextAuthOptions } from "next-auth";

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
        token.accessToken = account.access_token ?? "";
        token.spotifyId = (profile as any)?.id;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.spotifyId = token.spotifyId as string;
      session.accessToken = token.accessToken as string;
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };