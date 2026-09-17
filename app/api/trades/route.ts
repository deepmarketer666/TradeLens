import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { jsonError, unauthorized } from "@/lib/http";
import { validateTrade } from "@/lib/trade";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const trades = await prisma.trade.findMany({
    where: { userId: user.id },
    orderBy: [{ date: "desc" }, { time: "desc" }],
  });
  return NextResponse.json(trades);
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid request body.", 400);
  }

  const parsed = validateTrade(body);
  if (!parsed.ok) return jsonError(parsed.error, 400);

  try {
    const trade = await prisma.trade.create({ data: { ...parsed.data, userId: user.id } });
    return NextResponse.json(trade, { status: 201 });
  } catch (e) {
    console.error("create trade failed", e);
    return jsonError("Could not save trade.", 500);
  }
}
