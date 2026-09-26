import { cn } from "@/lib/utils";

export function Logo({ withWord = false, className }: { withWord?: boolean; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className="flex size-8 items-center justify-center rounded-md bg-accent text-sm font-semibold text-white">
        A
      </span>
      {withWord ? <span className="text-sm font-medium text-text">Architect</span> : null}
    </span>
  );
}
