import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pattern Journal — AI Emotion Detection Journaling",
  description: "AI-powered journaling that detects emotional patterns, surfaces recurring themes, and helps you understand yourself better.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
