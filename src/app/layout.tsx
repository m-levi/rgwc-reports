import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Reports Dashboard",
  description: "Monthly performance reports",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
