import { NextResponse } from "next/server";
import { z } from "zod";
import { getDemoPreferences, saveDemoPreferences, setDemoName } from "@/lib/demo/store";
import { getGithubAccount } from "@/lib/ship/data";
import { encryptString, encryptionKey } from "@/lib/security/crypto";
import { getSession } from "@/lib/session";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

const providers = ["groq", "openai", "anthropic"] as const;

const bodySchema = z.object({
  displayName: z.string().trim().min(1).max(80).optional(),
  keys: z
    .object({
      groq: z.string().max(200).optional(),
      openai: z.string().max(200).optional(),
      anthropic: z.string().max(200).optional(),
    })
    .optional(),
  clearKey: z.enum(providers).optional(),
  integrations: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
  mcp: z
    .object({
      name: z.string().trim().min(1).max(60),
      url: z.string().trim().url().max(300),
    })
    .optional(),
  removeMcp: z.string().uuid().optional(),
});

function masked(keys: { provider: string; last4: string }[]) {
  return providers.map((provider) => {
    const saved = keys.find((key) => key.provider === provider);
    return { provider, stored: Boolean(saved), last4: saved?.last4 ?? "" };
  });
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const github = await getGithubAccount(session.id);
  if (isSupabaseConfigured()) {
    return NextResponse.json({
      displayName: session.fullName,
      mode: session.mode,
      keys: masked([]),
      integrations: [],
      mcp: [],
      github: github ? { login: github.login, expired: github.expired } : null,
    });
  }
  const prefs = await getDemoPreferences(session.id);
  return NextResponse.json({
    displayName: session.fullName,
    mode: session.mode,
    keys: masked(prefs.keys),
    integrations: prefs.integrations,
    mcp: prefs.mcp,
    github: github ? { login: github.login, expired: github.expired } : null,
  });
}

export async function PUT(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Check the settings fields and try again." }, { status: 400 });
  if (isSupabaseConfigured()) {
    if (parsed.data.displayName) {
      const supabase = await createClient();
      await supabase.from("profiles").update({ full_name: parsed.data.displayName }).eq("id", session.id);
    }
    return NextResponse.json({ ok: true });
  }
  const prefs = await getDemoPreferences(session.id);
  if (parsed.data.displayName) await setDemoName(session.id, parsed.data.displayName);
  if (parsed.data.integrations) prefs.integrations = parsed.data.integrations;
  if (parsed.data.clearKey) prefs.keys = prefs.keys.filter((key) => key.provider !== parsed.data.clearKey);
  if (parsed.data.keys) {
    for (const provider of providers) {
      const value = parsed.data.keys[provider]?.trim();
      if (!value) continue;
      try {
        prefs.keys = prefs.keys.filter((key) => key.provider !== provider);
        prefs.keys.push({ provider, encrypted: encryptString(value, encryptionKey()), last4: value.slice(-4) });
      } catch {
        return NextResponse.json({ error: "Keys could not be stored." }, { status: 400 });
      }
    }
  }
  if (parsed.data.mcp) {
    prefs.mcp = [...prefs.mcp, { id: crypto.randomUUID(), name: parsed.data.mcp.name, url: parsed.data.mcp.url }];
  }
  if (parsed.data.removeMcp) prefs.mcp = prefs.mcp.filter((server) => server.id !== parsed.data.removeMcp);
  await saveDemoPreferences({ ...prefs, userId: session.id });
  return NextResponse.json({ ok: true });
}
