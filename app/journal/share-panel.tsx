"use client";
import { useEffect, useState } from "react";

export default function SharePanel() {
  const [url, setUrl] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const toUrl = (path?: string) => (path ? `${window.location.origin}${path}` : "");

  useEffect(() => {
    fetch("/api/share", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { active: false }))
      .then((d) => setUrl(d.active ? toUrl(d.path) : ""))
      .catch(() => setMessage("Could not load sharing status."))
      .finally(() => setLoaded(true));
  }, []);

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false; // clipboard needs HTTPS + permission; the URL is still shown
    }
  }

  async function generate() {
    if (url && !confirm("Create a new link? The current link will stop working.")) return;
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch("/api/share", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not create public link.");
      const full = toUrl(data.path);
      setUrl(full);
      setMessage((await copy(full)) ? "New public link created and copied." : "New public link created.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not create public link.");
    } finally {
      setBusy(false);
    }
  }

  async function revoke() {
    if (!confirm("Revoke the public link? Anyone using it will lose access.")) return;
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch("/api/share", { method: "DELETE" });
      if (!res.ok) throw new Error("Could not revoke link.");
      setUrl("");
      setMessage("Public link revoked.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not revoke link.");
    } finally {
      setBusy(false);
    }
  }

  const active = !!url;
  return (
    <section className="panel sharepanel">
      <div className="panelhead">
        <div>
          <h2>Public Journal</h2>
          <p className="hint">Create a read-only link anyone can open without logging in.</p>
        </div>
        <span className={active ? "sharestatus active" : "sharestatus"}>{!loaded ? "…" : active ? "ACTIVE" : "OFF"}</span>
      </div>
      {active ? (
        <>
          <div className="shareurl">
            <input readOnly value={url} onFocus={(e) => e.currentTarget.select()} aria-label="Public link" />
            <button className="btn" type="button" onClick={async () => setMessage((await copy(url)) ? "Link copied." : "Select the link and copy it manually.")}>Copy</button>
            <button className="btn" type="button" onClick={generate} disabled={busy}>New link</button>
            <button className="btn danger" type="button" onClick={revoke} disabled={busy}>Revoke</button>
          </div>
          <small className="securitynote">The link contains a random, unguessable token. Creating a new link revokes the previous one.</small>
        </>
      ) : (
        <button className="btn primary" type="button" onClick={generate} disabled={busy || !loaded}>
          {busy ? "Generating…" : "Generate Public URL"}
        </button>
      )}
      {message && <div className="sharemessage" role="status">{message}</div>}
    </section>
  );
}
