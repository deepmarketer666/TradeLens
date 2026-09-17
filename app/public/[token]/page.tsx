import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { computeStats } from "@/lib/trade";
import Metrics from "@/components/Metrics";
import TradeTable from "@/components/TradeTable";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shared Trading Journal — TradeLens",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function PublicJournal({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[A-Za-z0-9_-]{40,64}$/.test(token)) notFound();

  const link = await prisma.shareLink.findUnique({
    where: { token },
    select: { revokedAt: true, user: { select: { id: true, username: true } } },
  });
  if (!link || link.revokedAt) notFound();

  // Only the columns shown publicly are selected - private notes/lessons never leave the server.
  const trades = await prisma.trade.findMany({
    where: { userId: link.user.id },
    orderBy: [{ date: "desc" }, { time: "desc" }, { createdAt: "desc" }],
    select: {
      id: true, date: true, time: true, symbol: true, direction: true, quantity: true, buyAmount: true,
      sellAmount: true, pnl: true, rMultiple: true, result: true, session: true,
    },
  });

  return (
    <main className="publicpage">
      <div className="publichead">
        <div>
          <h1>@{link.user.username}&apos;s Trading Journal</h1>
          <p>Read-only public journal</p>
        </div>
        <span className="readonly">READ ONLY</span>
      </div>
      <Metrics stats={computeStats(trades)} />
      <section className="panel publictable">
        <div className="panelhead">
          <h2>Trade Journal</h2>
          <span className="muted">{trades.length} trade{trades.length === 1 ? "" : "s"}</span>
        </div>
        <TradeTable trades={trades} />
      </section>
      <p className="publicfoot">This page is shared publicly and is read-only. No account is required to view it.</p>
    </main>
  );
}
