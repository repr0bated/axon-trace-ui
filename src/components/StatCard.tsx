import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  variant?: "default" | "ok" | "warn" | "danger";
  className?: string;
}

export function StatCard({ label, value, sub, variant = "default", className }: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-4 animate-rise transition-all hover:border-muted-foreground/20",
        "shadow-[inset_0_1px_0_hsl(var(--card-foreground)/0.03)]",
        className
      )}
    >
      <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div
        className={cn(
          "mt-1.5 text-2xl font-bold tracking-tight leading-none",
          variant === "ok" && "text-ok",
          variant === "warn" && "text-warn",
          variant === "danger" && "text-danger",
          variant === "default" && "text-foreground"
        )}
      >
        {value}
      </div>
      {sub && (
        <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
      )}
    </div>
  );
}
