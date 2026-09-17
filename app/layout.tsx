import "./globals.css";
import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getCurrentUser } from "@/lib/session";
import AuthButtons from "./auth-buttons";

export const metadata: Metadata = {
  title: "TradeLens — Trading Journal",
  description: "Private screenshot-to-trading-journal application",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  return (
    <html lang="en">
      <body>
        <div className="shell">
          <header className="topbar">
            <Link href={user ? "/" : "/login"} className="brand">Trade<span>Lens</span></Link>
            {user && (
              <nav>
                <Link href="/">Dashboard</Link>
                <Link href="/add">Add Trade</Link>
                <Link href="/journal">Journal</Link>
                <AuthButtons username={user.username} />
              </nav>
            )}
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
