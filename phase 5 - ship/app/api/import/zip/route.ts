import { NextResponse } from "next/server";
import { safeRelativePath, selectImportFiles } from "@/lib/github/filter";
import { finishImport } from "@/lib/import/finish";
import { readZip } from "@/lib/import/zip";
import { getSession } from "@/lib/session";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose a zip file." }, { status: 400 });
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "This import is over the limit of 500 files and 5 MB. Choose a smaller folder." }, { status: 413 });
  try {
    const opened = readZip(Buffer.from(await file.arrayBuffer()));
    const candidates = opened.flatMap((entry) => {
      const path = safeRelativePath(entry.path);
      if (!path) return [];
      return [{ path, bytes: Buffer.byteLength(entry.content), content: entry.content }];
    });
    const selected = selectImportFiles(candidates);
    if (!selected.ok) return NextResponse.json({ error: selected.error }, { status: 413 });
    const content = new Map(candidates.map((entry) => [entry.path, entry.content]));
    const files = selected.files.flatMap((entry) => {
      const text = content.get(entry.path);
      return text === undefined ? [] : [{ path: entry.path, content: text }];
    });
    if (files.length === 0) return NextResponse.json({ error: "That zip has no text files to import." }, { status: 400 });
    const name = file.name.replace(/\.zip$/i, "") || "Imported app";
    const created = await finishImport({ ownerId: session.id, name, source: "a zip archive", files });
    return NextResponse.json(created);
  } catch (error) {
    const message = error instanceof Error ? error.message : "That zip could not be imported.";
    const status = message.includes("500 files") ? 413 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
