import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CP Tracker — Competitive programming dashboard",
  description:
    "A personal dashboard tracking competitive programming progress: unique problems solved, difficulty distribution, activity, and long-term progress.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
