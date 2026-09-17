import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { computeStats } from "@/lib/trade";
import Metrics from "@/components/Metrics";
import JournalTable from "./journal-table";
import ExportButtons from "./export-buttons";
import SharePanel from "./share-panel";

export const dynamic = "force-dynamic";

export default async function JournalPage() {
  const user = await requireUser();
  const trades = await prisma.trade.findMany({
    where: { userId: user.id },
    orderBy: [{ date: "desc" }, { time: "desc" }, { createdAt: "desc" }],
    select: {
      id: true, date: true, time: true, symbol: true, direction: true, quantity: true, buyAmount: true,
      sellAmount: true, pnl: true, rMultiple: true, result: true, session: true,
    },
  });
  const today = new Date().toISOString().slice(0, 10);

  return (
    <main>
      <div className="pagehead">
        <div>
          <h1>Journal</h1>
          <p>Your private trade history.</p>
        </div>
        <div className="actions">
          <ExportButtons disabled={!trades.length} />
          <Link className="btn primary" href="/add">+ Add Trade</Link>
        </div>
      </div>

      <div id="journal-export-area">
        <div className="export-title">
          <div className="brand">Trade<span>Lens</span></div>
          <h2>@{user.username} — Trading Journal</h2>
          <p>Exported {today}</p>
        </div>
        <Metrics stats={computeStats(trades)} />
        <section className="panel">
          <div className="panelhead">
            <h2>Trade Journal</h2>
            <span className="muted">{trades.length} trade{trades.length === 1 ? "" : "s"}</span>
          </div>
          <JournalTable trades={trades} />
        </section>
      </div>

      <SharePanel />
    </main>
  );
}
