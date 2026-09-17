"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import TradeTable from "@/components/TradeTable";
import type { TradeRow } from "@/lib/trade";

export default function JournalTable({ trades }: { trades: TradeRow[] }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);

  async function del(id: string) {
    if (!confirm("Delete this trade?")) return;
    setDeleting(id);
    try {
      const r = await fetch(`/api/trades/${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!r.ok && r.status !== 404) alert("Could not delete trade.");
      router.refresh();
    } finally {
      setDeleting(null);
    }
  }

  return (
    <TradeTable
      trades={trades}
      renderAction={(t) => (
        <button className="btn danger" type="button" disabled={deleting === t.id} onClick={() => del(t.id)}>
          {deleting === t.id ? "…" : "Delete"}
        </button>
      )}
    />
  );
}
