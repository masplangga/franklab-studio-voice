import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FrankLab Studio Voice PRO",
  description:
    "Studio voice over AI untuk membuat script iklan dan audio bahasa Indonesia.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
