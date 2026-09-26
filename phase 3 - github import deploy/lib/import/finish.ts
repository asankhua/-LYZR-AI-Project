import { draftAgents, draftPlan } from "@/lib/ai/draft";
import { detectFramework } from "@/lib/github/filter";
import { applyFiles, addSnapshot, replaceAgents, savePlan, setStage } from "@/lib/records";
import { renameProject, updateShipMeta } from "@/lib/ship/data";
import { updateSessionMode } from "@/lib/session";
import { createProject } from "@/lib/projects";

export async function finishImport(input: { ownerId: string; name: string; source: string; files: { path: string; content: string }[] }) {
  const framework = detectFramework(input.files);
  const project = await createProject({
    ownerId: input.ownerId,
    prompt: `Imported ${input.name}. ${input.source}`,
    template: "vite-react",
  });
  await renameProject(project.id, input.name);
  await setStage(project.id, "build");
  const plan = draftPlan(`Imported project ${input.name}. Files: ${input.files.map((file) => file.path).slice(0, 40).join(", ")}`);
  plan.title = input.name;
  await savePlan(project.id, plan);
  await replaceAgents(project.id, draftAgents(project.id, plan));
  const saved = await applyFiles(project.id, input.files);
  await addSnapshot(
    project.id,
    input.ownerId,
    `Imported ${input.name}`,
    Object.fromEntries(saved.map((file) => [file.path, file.sha])),
  );
  if (framework === "other") await updateShipMeta(project.id, { codeOnly: true });
  await updateSessionMode("developer");
  return { projectId: project.id, codeOnly: framework === "other" };
}
