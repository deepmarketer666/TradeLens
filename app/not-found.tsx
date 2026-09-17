import Link from "next/link";

export default function NotFound() {
  return (
    <main className="authpage">
      <div className="authcard">
        <h1>Not found</h1>
        <p>This page doesn't exist, or the public link has been revoked.</p>
        <Link className="btn primary" href="/">Go home</Link>
      </div>
    </main>
  );
}
