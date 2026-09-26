import { createHash, randomUUID } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { guestBundles } from "@/lib/templates/demo/catalog";

function sha(content: string) {
  return createHash("sha1").update(content).digest("hex");
}

export async function seedSupabaseGuest(ownerId: string) {
  const supabase = await createClient();
  for (const bundle of guestBundles()) {
    const { data, error } = await supabase
      .from("projects")
      .insert({
        owner_id: ownerId,
        name: bundle.name,
        description: bundle.description,
        template: "vite-react",
        stage: bundle.stage,
      })
      .select("id")
      .single();
    if (error || !data) throw new Error(error?.message ?? "Could not seed the demo project");
    const projectId = data.id as string;
    await supabase.from("messages").insert({
      project_id: projectId,
      role: "user",
      kind: "chat",
      content: bundle.prompt,
      created_by: ownerId,
    });
    await supabase.from("plans").insert({
      project_id: projectId,
      doc: bundle.plan,
      approved_at: bundle.approved ? new Date().toISOString() : null,
    });
    if (bundle.agents.length > 0) {
      await supabase.from("agents").insert(
        bundle.agents.map((spec) => {
          const id = randomUUID();
          return {
            id,
            project_id: projectId,
            name: spec.name,
            spec: { ...spec, id, projectId },
            position: spec.position,
          };
        }),
      );
    }
    if (bundle.files.length > 0) {
      await supabase.from("project_files").insert(
        bundle.files.map((file) => ({
          project_id: projectId,
          path: file.path,
          content: file.content,
          sha: sha(file.content),
        })),
      );
    }
    const manifest = Object.fromEntries(bundle.files.map((file) => [file.path, sha(file.content)]));
    for (const [index, snapshot] of bundle.snapshots.entries()) {
      await supabase.from("snapshots").insert({
        project_id: projectId,
        summary: snapshot.summary,
        manifest: index === bundle.snapshots.length - 1 ? manifest : {},
        healthy: snapshot.healthy,
        created_by: ownerId,
      });
    }
    for (const [index, deployment] of bundle.deployments.entries()) {
      await supabase.from("deployments").insert({
        project_id: projectId,
        status: deployment.status,
        url: deployment.url,
        subdomain: deployment.subdomain,
        logs: deployment.logs,
        promoted_at: index === 0 ? new Date().toISOString() : null,
        created_by: ownerId,
      });
    }
    if (bundle.usage.length > 0) {
      await supabase.from("usage_events").insert(
        bundle.usage.map((row) => ({
          user_id: ownerId,
          project_id: projectId,
          stage: row.stage,
          model: "local",
          input_tokens: row.inputTokens,
          output_tokens: row.outputTokens,
        })),
      );
    }
  }
}
