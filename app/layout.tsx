import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/app/components/Providers";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TagTunes",
  description:
    "A browser-based collaborative music queue app where a " +
    "Spotify Premium host creates a room, shares a link, and " +
    "lets anyone join to search and add songs — no account required for guests.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers children={children}/>
        <Script src="https://sdk.scdn.co/spotify-player.js" strategy="beforeInteractive" />
      </body>
    </html>
  );
}
