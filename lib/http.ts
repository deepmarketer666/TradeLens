import { NextResponse } from "next/server";

export const jsonError = (error: string, status: number) => NextResponse.json({ error }, { status });
export const unauthorized = () => jsonError("Unauthorized", 401);
