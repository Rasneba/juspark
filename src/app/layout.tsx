import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JusPark - Find & List Parking Spaces",
  description: "Ethiopia's leading parking marketplace. Search, book, and pay for parking online.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
