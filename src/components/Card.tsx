import { cn } from "@/lib/utils";

interface CardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
}

export function Card({ title, subtitle, children, className, actions }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-5 animate-rise transition-all",
        "shadow-[0_1px_2px_hsl(0_0%_0%/0.2),inset_0_1px_0_hsl(var(--card-foreground)/0.03)]",
        "hover:border-muted-foreground/20 hover:shadow-[0_4px_12px_hsl(0_0%_0%/0.25)]",
        className
      )}
    >
      {(title || actions) && (
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            {title && (
              <h3 className="text-[15px] font-semibold tracking-tight text-foreground">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="mt-1 text-[13px] text-muted-foreground leading-relaxed">{subtitle}</p>
            )}
          </div>
          {actions}
        </div>
      )}
      {children}
    </div>
  );
}
