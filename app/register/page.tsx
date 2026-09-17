import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import RegisterForm from "./register-form";

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect("/");
  return (
    <main className="authpage">
      <div className="authcard">
        <div className="brand big">Trade<span>Lens</span></div>
        <h1>Create account</h1>
        <p>Keep your trading journal private to your account.</p>
        <RegisterForm />
        <small>Already have an account? <Link href="/login">Login</Link></small>
      </div>
    </main>
  );
}
