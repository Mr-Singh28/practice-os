import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Practice OS Foundation",
  description: "Local execution foundation for Practice OS.",
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
