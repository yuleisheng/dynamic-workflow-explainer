import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dynamic Workflows in Claude Code — an interactive explainer",
  description:
    "A dynamic workflow is a JavaScript script that orchestrates subagents at scale. See a real memory-stock research prompt fan out across parallel agents, get stress-tested, and return one cited brief.",
  openGraph: {
    title: "Dynamic Workflows in Claude Code — interactive explainer",
    description:
      "Watch a real research prompt fan out into parallel subagents, get stress-tested, and converge into one cited brief.",
    type: "website",
  },
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
      <body className="min-h-full">{children}</body>
    </html>
  );
}
