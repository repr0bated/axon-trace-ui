import { cn } from "@/lib/utils";

interface StatusDotProps {
  status: "ok" | "warn" | "error" | "offline";
  className?: string;
}

export function StatusDot({ status, className }: StatusDotProps) {
  return (
    <span
      className={cn(
        "inline-block h-2 w-2 rounded-full shrink-0",
        status === "ok" && "bg-ok shadow-[0_0_8px_hsl(var(--ok)/0.5)]",
        status === "warn" && "bg-warn shadow-[0_0_8px_hsl(var(--warn)/0.5)] animate-[pulse-subtle_2s_ease-in-out_infinite]",
        status === "error" && "bg-danger shadow-[0_0_8px_hsl(var(--danger)/0.5)] animate-[pulse-subtle_2s_ease-in-out_infinite]",
        status === "offline" && "bg-muted-foreground",
        className
      )}
    />
  );
}
