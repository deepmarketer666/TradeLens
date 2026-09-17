"use client";
import { useState } from "react";

async function captureJournal() {
  const target = document.getElementById("journal-export-area");
  if (!target) throw new Error("Nothing to export.");
  const { default: html2canvas } = await import("html2canvas");
  return html2canvas(target, {
    backgroundColor: "#0b0f14",
    scale: 2,
    // Show the export-only title and let wide tables render at full width.
    onclone: (doc) => {
      doc.querySelectorAll<HTMLElement>(".export-title").forEach((el) => (el.style.display = "block"));
      doc.querySelectorAll<HTMLElement>(".tablewrap").forEach((el) => (el.style.overflow = "visible"));
    },
    windowWidth: Math.max(target.scrollWidth, 1100),
  });
}

export default function ExportButtons({ disabled = false }: { disabled?: boolean }) {
  const [busy, setBusy] = useState<"" | "png" | "pdf">("");
  const stamp = () => new Date().toISOString().slice(0, 10);

  async function exportPng() {
    setBusy("png");
    try {
      const canvas = await captureJournal();
      const link = document.createElement("a");
      link.download = `tradelens-journal-${stamp()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch {
      alert("Could not create image.");
    } finally {
      setBusy("");
    }
  }

  async function exportPdf() {
    setBusy("pdf");
    try {
      const canvas = await captureJournal();
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 24;
      const imgW = pageW - margin * 2;
      // Canvas pixels that fit on one PDF page at this width.
      const sliceH = Math.floor(((pageH - margin * 2) * canvas.width) / imgW);

      for (let y = 0, page = 0; y < canvas.height; y += sliceH, page++) {
        const h = Math.min(sliceH, canvas.height - y);
        const slice = document.createElement("canvas");
        slice.width = canvas.width;
        slice.height = h;
        slice.getContext("2d")!.drawImage(canvas, 0, y, canvas.width, h, 0, 0, canvas.width, h);
        if (page > 0) pdf.addPage();
        pdf.setFillColor(11, 15, 20);
        pdf.rect(0, 0, pageW, pageH, "F");
        pdf.addImage(slice.toDataURL("image/jpeg", 0.92), "JPEG", margin, margin, imgW, (h * imgW) / canvas.width);
      }
      pdf.save(`tradelens-journal-${stamp()}.pdf`);
    } catch {
      alert("Could not create PDF.");
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="actions">
      <a className={`btn${disabled ? " disabled" : ""}`} href="/api/export" aria-disabled={disabled}>CSV</a>
      <button className="btn" type="button" onClick={exportPng} disabled={disabled || !!busy}>{busy === "png" ? "Creating…" : "Image"}</button>
      <button className="btn" type="button" onClick={exportPdf} disabled={disabled || !!busy}>{busy === "pdf" ? "Creating…" : "PDF"}</button>
    </div>
  );
}
