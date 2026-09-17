import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { unauthorized } from "@/lib/http";

export const dynamic = "force-dynamic";

// The API returns only the path; the browser prefixes its own origin,
// so links are correct on onrender.com, custom domains and localhost alike.
const linkJson = (link: { token: string; createdAt: Date }) => ({
  active: true,
  path: `/public/${link.token}`,
  createdAt: link.createdAt,
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const link = await prisma.shareLink.findFirst({
    where: { userId: user.id, revokedAt: null },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(link ? linkJson(link) : { active: false });
}

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const token = randomBytes(32).toString("base64url");
  const [, link] = await prisma.$transaction([
    prisma.shareLink.updateMany({ where: { userId: user.id, revokedAt: null }, data: { revokedAt: new Date() } }),
    prisma.shareLink.create({ data: { token, userId: user.id } }),
  ]);
  return NextResponse.json(linkJson(link), { status: 201 });
}

export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  await prisma.shareLink.updateMany({ where: { userId: user.id, revokedAt: null }, data: { revokedAt: new Date() } });
  return NextResponse.json({ active: false });
}
