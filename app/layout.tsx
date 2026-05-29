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
    "A dynamic workflow is a JavaScript script that orchestrates subagents at scale. See how Claude fans work out across hundreds of parallel agents, cross-checks the results, and returns a single answer.",
  openGraph: {
    title: "Dynamic Workflows in Claude Code — interactive explainer",
    description:
      "Watch a prompt fan out into hundreds of parallel subagents, get cross-checked, and converge into one report.",
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
