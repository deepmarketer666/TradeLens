import { computeStats, formatMoney, formatR } from "@/lib/trade";

type Stats = ReturnType<typeof computeStats>;

export default function Metrics({ stats, className = "" }: { stats: Stats; className?: string }) {
  return (
    <section className={`metrics ${className}`}>
      <Metric label="Total Trades" value={String(stats.total)} />
      <Metric label="Win Rate" value={stats.winRate === null ? "—" : `${stats.winRate.toFixed(1)}%`} hint="wins ÷ (wins + losses)" />
      <Metric label="Net P/L" value={formatMoney(stats.netPnl)} tone={stats.netPnl >= 0 ? "green" : "red"} />
      <Metric label="Average R" value={stats.avgR === null ? "—" : formatR(stats.avgR)} />
    </section>
  );
}

function Metric({ label, value, tone = "", hint }: { label: string; value: string; tone?: string; hint?: string }) {
  return (
    <div className="metric" title={hint}>
      <span>{label}</span>
      <strong className={tone}>{value}</strong>
    </div>
  );
}
