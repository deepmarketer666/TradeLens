import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import LoginForm from "./login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/");
  return (
    <main className="authpage">
      <div className="authcard">
        <div className="brand big">Trade<span>Lens</span></div>
        <h1>Private Trading Journal</h1>
        <p>Login to access your trading journal.</p>
        <LoginForm />
        <small>Don&apos;t have an account? <Link href="/register">Create one</Link></small>
      </div>
    </main>
  );
}
