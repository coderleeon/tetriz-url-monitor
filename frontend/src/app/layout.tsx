import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tetriz URL Monitor - Real-time Uptime Dashboard",
  description: "Monitor website status, uptime latency, and response statistics in real-time.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
