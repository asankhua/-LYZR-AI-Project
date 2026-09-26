import { NextResponse } from "next/server";
import { requireProject } from "@/lib/ship/guard";
import { rotatePublicKey } from "@/lib/ship/data";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const access = await requireProject(id);
  if ("error" in access) return access.error;
  const publicKey = await rotatePublicKey(access.project.id);
  return NextResponse.json({ publicKey });
}
