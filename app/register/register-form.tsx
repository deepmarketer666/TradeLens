"use client";
import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";

export default function RegisterForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("Passwords do not match.");

    setBusy(true);
    try {
      const r = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError(data.error || "Could not create account.");
        setBusy(false);
        return;
      }
      const login = await signIn("credentials", { username, password, redirect: false });
      if (login?.ok && !login.error) {
        window.location.assign("/");
        return;
      }
      window.location.assign("/login");
    } catch {
      setError("Could not reach the server. Try again.");
      setBusy(false);
    }
  }

  return (
    <form className="authform" onSubmit={submit}>
      <label className="field"><span>Username</span>
        <input required minLength={3} maxLength={30} pattern="[A-Za-z0-9_]+" autoComplete="username" autoCapitalize="none"
          value={username} onChange={(e) => setUsername(e.target.value)} />
        <small>3–30 characters: letters, numbers and underscore.</small>
      </label>
      <label className="field"><span>Password</span>
        <input required minLength={8} maxLength={72} type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <small>8–72 characters.</small>
      </label>
      <label className="field"><span>Confirm Password</span>
        <input required minLength={8} maxLength={72} type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      </label>
      {error && <div className="error" role="alert">{error}</div>}
      <button className="btn primary full" disabled={busy}>{busy ? "Creating account…" : "Register"}</button>
    </form>
  );
}
