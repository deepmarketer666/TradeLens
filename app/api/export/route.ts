import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { unauthorized } from "@/lib/http";
import { csvCell } from "@/lib/csv";

export const dynamic = "force-dynamic";

const FIELDS = [
  "date", "time", "symbol", "direction", "quantity", "buyAmount", "sellAmount", "entry", "exit",
  "stopLoss", "takeProfit", "pnl", "risk", "rMultiple", "result", "session", "sessionZone",
  "strategy", "lesson", "notes",
] as const;

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const trades = await prisma.trade.findMany({
    where: { userId: user.id },
    orderBy: [{ date: "asc" }, { time: "asc" }],
  });

  const lines = [FIELDS.join(","), ...trades.map((t) => FIELDS.map((f) => csvCell(t[f])).join(","))];
  // BOM so Excel opens UTF-8 correctly.
  const csv = "\uFEFF" + lines.join("\r\n");
  const filename = `tradelens-journal-${new Date().toISOString().slice(0, 10)}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
