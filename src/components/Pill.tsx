import { cn } from "@/lib/utils";

interface PillProps {
  children: React.ReactNode;
  variant?: "default" | "danger" | "ok" | "warn";
  className?: string;
}

export function Pill({ children, variant = "default", className }: PillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        variant === "default" && "border-border bg-secondary text-foreground",
        variant === "danger" && "border-danger/20 bg-danger/10 text-danger",
        variant === "ok" && "border-ok/20 bg-ok/10 text-ok",
        variant === "warn" && "border-warn/20 bg-warn/10 text-warn",
        className
      )}
    >
      {children}
    </span>
  );
}
