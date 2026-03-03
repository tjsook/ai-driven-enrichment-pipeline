import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI-Driven Lead Enrichment Pipeline",
  description: "Upload a CSV and receive an enriched CSV by email"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
