// Extracts trade fields from OCR text of a broker screenshot (MT4/MT5 style).
// Everything returned is a best guess - the user reviews it before saving.

export type ParsedTrade = Partial<Record<
  "symbol" | "direction" | "quantity" | "buyAmount" | "sellAmount" | "entry" | "exit" |
  "date" | "time" | "pnl" | "result", string>>;

const KNOWN_SYMBOLS = /\b(XAUUSD|XAGUSD|US30|US100|US500|NAS100|SPX500|GER40|UK100|BTCUSD|ETHUSD|USOIL|UKOIL)\b/;
const FX_PAIR = /\b((?:EUR|GBP|USD|JPY|AUD|NZD|CAD|CHF)(?:EUR|GBP|USD|JPY|AUD|NZD|CAD|CHF))\b/;
const num = (s: string) => s.replace(/[\s,]/g, "");

export function parseTradeText(raw: string): ParsedTrade {
  const clean = raw.replace(/\s+/g, " ").trim();
  const up = clean.toUpperCase();
  const out: ParsedTrade = {};

  const sym = up.match(KNOWN_SYMBOLS)?.[1] ?? up.match(FX_PAIR)?.[1];
  if (sym) out.symbol = sym;

  const side = up.match(/\b(BUY|SELL)\b/)?.[1];
  if (side) out.direction = side;

  const qty = clean.match(/\b(?:BUY|SELL)\s+(\d+(?:\.\d+)?)\b/i)?.[1];
  if (qty) out.quantity = qty;

  // "2345.67 → 2350.12" : opening price → closing price
  const price = String.raw`(\d{1,3}(?:[ ,]\d{3})*(?:\.\d+)|\d+\.\d+)`;
  const pair = clean.match(new RegExp(`${price}\\s*(?:->|→|—>|=>|\\bto\\b)\\s*${price}`, "i"));
  if (pair) {
    const open = num(pair[1]);
    const close = num(pair[2]);
    out.entry = open;
    out.exit = close;
    // For a BUY you buy at open and sell at close; for a SELL it's the reverse.
    if (side === "SELL") { out.sellAmount = open; out.buyAmount = close; }
    else { out.buyAmount = open; out.sellAmount = close; }
  }

  const stamp = clean.match(/\b(20\d{2})[.\-/](\d{1,2})[.\-/](\d{1,2})[ T,]+(\d{1,2}):(\d{2})(?::\d{2})?\b/);
  if (stamp) {
    out.date = `${stamp[1]}-${stamp[2].padStart(2, "0")}-${stamp[3].padStart(2, "0")}`;
    out.time = `${stamp[4].padStart(2, "0")}:${stamp[5]}`;
  }

  // Prefer an explicit label; otherwise fall back to the last number on the screen,
  // which is where MT4/MT5 show the trade's profit.
  const labelled = clean.match(/(?:P\/L|P&L|PROFIT|LOSS)\s*[:=]?\s*([+\-−]?\s*\$?\s*\d[\d,]*(?:\.\d+)?)/i)?.[1];
  const trailing = clean.match(/(?:^|\s)([+\-−]?\d[\d,]*(?:\.\d+)?)\s*$/)?.[1];
  const pnlText = labelled ?? trailing;
  if (pnlText) {
    const v = Number(pnlText.replace(/[$,\s]/g, "").replace("−", "-"));
    if (Number.isFinite(v)) {
      out.pnl = String(v);
      out.result = v > 0 ? "WIN" : v < 0 ? "LOSS" : "BREAKEVEN";
    }
  }
  return out;
}
