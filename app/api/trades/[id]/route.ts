import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { jsonError, unauthorized } from "@/lib/http";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const { id } = await params;
  // deleteMany scoped by userId: a user can never delete someone else's trade.
  const { count } = await prisma.trade.deleteMany({ where: { id, userId: user.id } });
  if (count === 0) return jsonError("Not found", 404);
  return NextResponse.json({ ok: true });
}
