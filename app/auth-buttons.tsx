"use client";
import { signOut } from "next-auth/react";

export default function AuthButtons({ username }: { username: string }) {
  return (
    <div className="userbox">
      <span>@{username}</span>
      <button className="btn" type="button" onClick={() => signOut({ callbackUrl: "/login" })}>Sign out</button>
    </div>
  );
}
