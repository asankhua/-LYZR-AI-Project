import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createAdmin } from "@/lib/supabase/admin";

function tokenMatches(header: string | null) {
  const expected = process.env.KEEPALIVE_TOKEN ?? "";
  if (!expected || !header) return false;
  const left = Buffer.from(header);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function GET(request: Request) {
  if (!tokenMatches(request.headers.get("x-keepalive-token"))) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  const admin = createAdmin();
  if (!admin) return NextResponse.json({ ok: true, database: "skipped" });
  const { error } = await admin.from("profiles").select("id").limit(1);
  if (error) return NextResponse.json({ ok: false }, { status: 503 });
  return NextResponse.json({ ok: true, database: "up" });
}
