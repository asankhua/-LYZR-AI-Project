export default function CliPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-[32px] leading-10 font-medium">API and CLI</h1>
      <p className="mt-2 text-sm text-text-muted">
        The command line is a preview. This is the shape of a later <span className="font-mono">architect deploy</span> command.
      </p>
      <pre className="mt-4 overflow-auto rounded-md border border-border bg-surface-2 p-4 font-mono text-xs">{`architect login
architect deploy --project travel-planner`}</pre>
      <h2 className="mt-6 text-sm font-medium">Branch previews</h2>
      <p className="mt-1 text-sm text-text-muted">Each branch would get its own URL. That list is mocked for now.</p>
      <ul className="mt-3 font-mono text-xs text-text-muted">
        <li>main → preview.example / main</li>
        <li>feature/search → preview.example / feature-search</li>
      </ul>
    </main>
  );
}
