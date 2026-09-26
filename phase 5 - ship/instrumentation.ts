export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { checkConfig } = await import("@/lib/ops/config-check");
  await checkConfig();
}
