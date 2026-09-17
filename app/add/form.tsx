"use client";
import { useEffect, useRef, useState, type DragEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { parseTradeText } from "@/lib/ocr-parse";
import { deriveSession, TIMEZONE_OPTIONS } from "@/lib/market-session";

type FormState = Record<string, string>;

const todayLocal = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const makeInitial = (): FormState => ({
  date: todayLocal(), time: "", symbol: "", direction: "BUY", quantity: "", buyAmount: "", sellAmount: "",
  entry: "", exit: "", stopLoss: "", takeProfit: "", pnl: "", risk: "", rMultiple: "", result: "WIN",
  session: "", sessionZone: "Asia/Kolkata", strategy: "", lesson: "", notes: "",
});

export default function AddTradeForm() {
  const router = useRouter();
  const [f, setF] = useState<FormState>(makeInitial);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [sessionEdited, setSessionEdited] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const set = (k: string, v: string) => setF((x) => ({ ...x, [k]: v }));

  // Keep the session in sync with date/time/timezone unless the user typed their own.
  useEffect(() => {
    if (sessionEdited || !f.time) return;
    const s = deriveSession(f.date, f.time, f.sessionZone);
    setF((x) => (x.session === s ? x : { ...x, session: s }));
  }, [f.date, f.time, f.sessionZone, sessionEdited]);

  async function scan(file: File) {
    if (!file.type.startsWith("image/")) {
      setStatus("Please choose an image file.");
      return;
    }
    setBusy(true);
    setError("");
    setStatus("Loading OCR engine…");
    try {
      const { recognize } = await import("tesseract.js");
      const { data } = await recognize(file, "eng", {
        logger: (m) => {
          if (m.status === "recognizing text") setStatus(`Reading screenshot… ${Math.round((m.progress || 0) * 100)}%`);
        },
      });
      const parsed = parseTradeText(data.text);
      const found = Object.keys(parsed).length;
      setF((x) => ({ ...x, ...parsed }));
      setStatus(found ? `Extracted ${found} field${found === 1 ? "" : "s"}. Review everything before saving.` : "No trade data recognised. Enter the fields manually.");
    } catch (e) {
      console.error(e);
      setStatus("OCR failed. Enter the fields manually.");
    } finally {
      setBusy(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && !busy) scan(file);
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const r = await fetch("/api/trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(f),
      });
      if (r.status === 401) {
        window.location.assign("/login");
        return;
      }
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || "Could not save trade.");
      router.push("/journal");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save trade.");
      setSaving(false);
    }
  }

  function clear() {
    setF(makeInitial());
    setStatus("");
    setError("");
    setSessionEdited(false);
  }

  const field = (k: string, label: string, props: Record<string, unknown> = {}) => (
    <label className="field" key={k}>
      <span>{label}</span>
      <input value={f[k] ?? ""} onChange={(e) => set(k, e.target.value)} {...props} />
    </label>
  );
  const numberField = (k: string, label: string) => field(k, label, { type: "number", step: "any", inputMode: "decimal" });

  return (
    <form onSubmit={save}>
      <div className="privacy">🔒 <b>Screenshot privacy:</b> OCR runs in your browser. The screenshot is never sent to or stored by the server.</div>

      <label
        className={`drop${dragging ? " dragging" : ""}${busy ? " busy" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <input ref={fileInput} type="file" accept="image/*" disabled={busy} onChange={(e) => e.target.files?.[0] && scan(e.target.files[0])} />
        <span aria-hidden>📷</span>
        <b>{busy ? "Reading screenshot…" : "Select or drop a trading screenshot"}</b>
        <small>{status || "Extracts symbol, side, quantity, prices, P/L, date, time and result."}</small>
      </label>

      <div className="panel">
        <h2>Trade Details</h2>
        <p className="hint">All values are editable. Session is calculated from the date, time and the timezone the time is shown in.</p>
        <div className="formgrid">
          {field("date", "Date", { type: "date", required: true })}
          {field("time", "Time", { type: "time" })}
          {field("symbol", "Symbol", { required: true, placeholder: "XAUUSD", style: { textTransform: "uppercase" } })}

          <label className="field"><span>Direction</span>
            <select value={f.direction} onChange={(e) => set("direction", e.target.value)}>
              <option value="BUY">BUY</option><option value="SELL">SELL</option>
            </select>
          </label>
          {numberField("quantity", "Quantity / Lot")}
          {numberField("buyAmount", "Buy Price")}
          {numberField("sellAmount", "Sell Price")}
          {numberField("entry", "Entry Price")}
          {numberField("exit", "Exit Price")}
          {numberField("pnl", "Amount Won / Lost")}

          <label className="field"><span>Result</span>
            <select value={f.result} onChange={(e) => set("result", e.target.value)}>
              <option value="WIN">WIN</option><option value="LOSS">LOSS</option><option value="BREAKEVEN">BREAKEVEN</option>
            </select>
          </label>
          <label className="field"><span>Time shown in</span>
            <select value={f.sessionZone} onChange={(e) => set("sessionZone", e.target.value)}>
              {TIMEZONE_OPTIONS.map((z) => <option key={z.value} value={z.value}>{z.label}</option>)}
            </select>
          </label>
          <label className="field"><span>Session</span>
            <input value={f.session} placeholder="Auto from time" onChange={(e) => { setSessionEdited(true); set("session", e.target.value); }} />
          </label>

          {numberField("risk", "Risk ($)")}
          {numberField("rMultiple", "R Multiple (auto if blank)")}
          {numberField("stopLoss", "Stop Loss")}
          {numberField("takeProfit", "Take Profit")}
          {field("strategy", "Strategy", { maxLength: 100 })}
          {field("lesson", "Mistake / Lesson", { maxLength: 2000 })}
          {field("notes", "Notes", { maxLength: 2000 })}
        </div>
        {error && <div className="error" role="alert" style={{ marginTop: 14 }}>{error}</div>}
        <div className="actions">
          <button className="btn" type="button" onClick={clear} disabled={saving}>Clear</button>
          <button className="btn primary" type="submit" disabled={saving || busy}>{saving ? "Saving…" : "Save Trade"}</button>
        </div>
      </div>
    </form>
  );
}
