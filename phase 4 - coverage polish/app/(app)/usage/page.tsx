import { UsageDashboard } from "@/components/usage/usage-dashboard";

export default async function UsagePage({ searchParams }: { searchParams: Promise<{ preview?: string }> }) {
  const params = await searchParams;
  return <UsageDashboard showLimit={params.preview === "limit"} />;
}
