"use client";
import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";

export default function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const result = await signIn("credentials", { username, password, redirect: false });
      if (result?.ok && !result.error) {
        // Full navigation so the server layout re-renders with the new session.
        window.location.assign("/");
        return;
      }
      setError("Invalid username or password.");
    } catch {
      setError("Could not reach the server. Try again.");
    }
    setBusy(false);
  }

  return (
    <form className="authform" onSubmit={submit}>
      <label className="field"><span>Username</span>
        <input required autoComplete="username" autoCapitalize="none" value={username} onChange={(e) => setUsername(e.target.value)} />
      </label>
      <label className="field"><span>Password</span>
        <input required type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </label>
      {error && <div className="error" role="alert">{error}</div>}
      <button className="btn primary full" disabled={busy}>{busy ? "Logging in…" : "Login"}</button>
    </form>
  );
}
