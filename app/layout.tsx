import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Granted Source Agent — AI Grant Research & Intelligence Platform",
  description:
    "AI-assisted research for discovering, verifying, and evaluating non-dilutive funding opportunities for Canada and the US."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        <Nav />
        <main>{children}</main>
      </body>
    </html>
  );
}
