import type { Metadata } from "next";
import { getCurrentLanguage } from "@/lib/i18nServer";
import "./globals.css";

export const metadata: Metadata = {
  title: "izforex.pro",
  description: "Premium real-time trading signals and market imbalance ideas",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const language = getCurrentLanguage();

  return (
    <html lang={language}>
      <body>{children}</body>
    </html>
  );
}
