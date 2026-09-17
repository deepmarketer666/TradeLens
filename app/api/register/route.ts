import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/http";

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid request body.", 400);
  }

  const username = String(body.username ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");

  if (!/^[a-z0-9_]{3,30}$/.test(username)) {
    return jsonError("Username must be 3–30 characters using letters, numbers or underscore.", 400);
  }
  if (password.length < 8) return jsonError("Password must be at least 8 characters.", 400);
  if (password.length > 72) return jsonError("Password must be at most 72 characters.", 400);

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({ data: { username, passwordHash } });
    return NextResponse.json({ id: user.id, username: user.username }, { status: 201 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return jsonError("Username is already taken.", 409);
    }
    console.error("register failed", e);
    return jsonError("Could not create account.", 500);
  }
}
