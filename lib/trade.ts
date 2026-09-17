// Shared trade types, validation and statistics (used by server and client).

export const DIRECTIONS = ["BUY", "SELL"] as const;
export const RESULTS = ["WIN", "LOSS", "BREAKEVEN"] as const;
export type Direction = (typeof DIRECTIONS)[number];
export type Result = (typeof RESULTS)[number];

export const NUMBER_FIELDS = [
  "quantity", "buyAmount", "sellAmount", "entry", "exit",
  "stopLoss", "takeProfit", "pnl", "risk", "rMultiple",
] as const;
export const TEXT_FIELDS = ["session", "sessionZone", "strategy", "lesson", "notes"] as const;

export type TradeRow = {
  id: string;
  date: string;
  time: string | null;
  symbol: string;
  direction: string;
  quantity: number | null;
  buyAmount: number | null;
  sellAmount: number | null;
  entry?: number | null;
  exit?: number | null;
  pnl: number | null;
  rMultiple: number | null;
  result: string;
  session: string | null;
};

type NumberField = (typeof NUMBER_FIELDS)[number];
type TextField = (typeof TEXT_FIELDS)[number];

export type TradeInput = {
  date: string;
  time: string | null;
  symbol: string;
  direction: Direction;
  result: Result;
} & Record<NumberField, number | null> & Record<TextField, string | null>;

/** Accepts numbers or numeric strings like "1,234.5", "$12", "+4.2". */
export function toNumber(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const s = String(v).replace(/[$,\s]/g, "");
  if (s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

const cleanText = (v: unknown, max: number) => {
  const s = String(v ?? "").trim();
  return s ? s.slice(0, max) : null;
};

export function validateTrade(body: unknown): { ok: true; data: TradeInput } | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "Invalid request body." };
  const b = body as Record<string, unknown>;

  const date = String(b.date ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) {
    return { ok: false, error: "A valid date (YYYY-MM-DD) is required." };
  }
  const timeRaw = String(b.time ?? "").trim();
  if (timeRaw && !/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(timeRaw)) {
    return { ok: false, error: "Time must be HH:MM." };
  }
  const symbol = String(b.symbol ?? "").trim().toUpperCase();
  if (!/^[A-Z0-9._\-/]{1,20}$/.test(symbol)) return { ok: false, error: "A valid symbol is required." };

  const numbers = {} as Record<NumberField, number | null>;
  for (const f of NUMBER_FIELDS) {
    const raw = b[f];
    const n = toNumber(raw);
    if (n === null && raw !== null && raw !== undefined && String(raw).trim() !== "") {
      return { ok: false, error: `${f} must be a number.` };
    }
    numbers[f] = n;
  }
  if (numbers.rMultiple === null && numbers.pnl !== null && numbers.risk) {
    numbers.rMultiple = numbers.pnl / Math.abs(numbers.risk);
  }

  const texts = {} as Record<TextField, string | null>;
  for (const f of TEXT_FIELDS) texts[f] = cleanText(b[f], f === "notes" || f === "lesson" ? 2000 : 100);

  const direction: Direction = b.direction === "SELL" ? "SELL" : "BUY";
  const result: Result = RESULTS.includes(b.result as Result)
    ? (b.result as Result)
    : resultFromPnl(numbers.pnl);

  return { ok: true, data: { date, time: timeRaw ? timeRaw.slice(0, 5) : null, symbol, direction, result, ...numbers, ...texts } };
}

export function resultFromPnl(pnl: number | null): Result {
  if (pnl === null || pnl === 0) return "BREAKEVEN";
  return pnl > 0 ? "WIN" : "LOSS";
}

export function computeStats(trades: Pick<TradeRow, "result" | "pnl" | "rMultiple">[]) {
  const total = trades.length;
  const wins = trades.filter((t) => t.result === "WIN").length;
  const losses = trades.filter((t) => t.result === "LOSS").length;
  const netPnl = trades.reduce((s, t) => s + (t.pnl ?? 0), 0);
  const withR = trades.filter((t) => t.rMultiple !== null);
  const avgR = withR.length ? withR.reduce((s, t) => s + (t.rMultiple ?? 0), 0) / withR.length : null;
  const decided = wins + losses;
  const winRate = decided ? (wins / decided) * 100 : null;
  return { total, wins, losses, netPnl, avgR, winRate };
}

export const formatMoney = (v: number) => `${v >= 0 ? "+" : "-"}$${Math.abs(v).toFixed(2)}`;
export const formatR = (v: number) => `${v.toFixed(2)}R`;
