import type { ReactNode } from "react";
import { formatMoney, formatR, type TradeRow } from "@/lib/trade";

const dash = (v: string | number | null | undefined) => (v === null || v === undefined || v === "" ? "—" : v);

export default function TradeTable({
  trades,
  showSession = true,
  empty = "No trades recorded.",
  renderAction,
}: {
  trades: TradeRow[];
  showSession?: boolean;
  empty?: string;
  renderAction?: (t: TradeRow) => ReactNode;
}) {
  if (!trades.length) return <div className="empty">{empty}</div>;
  return (
    <div className="tablewrap">
      <table>
        <thead>
          <tr>
            <th>Date</th><th>Time</th><th>Symbol</th><th>Side</th><th>Qty</th><th>Buy</th><th>Sell</th>
            <th>P/L</th><th>R</th><th>Result</th>
            {showSession && <th>Session</th>}
            {renderAction && <th data-html2canvas-ignore="true" aria-label="Actions" />}
          </tr>
        </thead>
        <tbody>
          {trades.map((t) => (
            <tr key={t.id}>
              <td>{t.date}</td>
              <td>{dash(t.time)}</td>
              <td>{t.symbol}</td>
              <td className={t.direction === "BUY" ? "green" : "red"}>{t.direction}</td>
              <td>{dash(t.quantity)}</td>
              <td>{dash(t.buyAmount)}</td>
              <td>{dash(t.sellAmount)}</td>
              <td className={t.pnl === null ? "" : t.pnl >= 0 ? "green" : "red"}>{t.pnl === null ? "—" : formatMoney(t.pnl)}</td>
              <td>{t.rMultiple === null ? "—" : formatR(t.rMultiple)}</td>
              <td><span className={`pill ${t.result.toLowerCase()}`}>{t.result}</span></td>
              {showSession && <td>{dash(t.session)}</td>}
              {renderAction && <td data-html2canvas-ignore="true">{renderAction(t)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
