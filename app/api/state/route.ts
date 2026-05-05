import { NextResponse } from "next/server";
import { readState } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  const state = await readState();
  return NextResponse.json({ ok: true, state });
}
