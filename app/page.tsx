import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { computeStats } from "@/lib/trade";
import Metrics from "@/components/Metrics";
import TradeTable from "@/components/TradeTable";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const user = await requireUser();
  const trades = await prisma.trade.findMany({
    where: { userId: user.id },
    orderBy: [{ date: "desc" }, { time: "desc" }, { createdAt: "desc" }],
  });

  return (
    <main>
      <div className="pagehead">
        <div>
          <h1>Trading Dashboard</h1>
          <p>Welcome back, @{user.username}.</p>
        </div>
        <Link className="btn primary" href="/add">+ Add Trade</Link>
      </div>
      <Metrics stats={computeStats(trades)} />
      <section className="panel">
        <div className="panelhead">
          <h2>Recent Trades</h2>
          <Link href="/journal">View all →</Link>
        </div>
        <TradeTable trades={trades.slice(0, 8)} showSession={false} empty="No trades yet. Upload your first screenshot." />
      </section>
    </main>
  );
}
