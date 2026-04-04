import { useSystemStats } from "@/hooks/use-live-registry";
import { Card as ShCard, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cpu, MemoryStick, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

function MiniKpi({ icon: Icon, label, value, unit, variant }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  unit?: string;
  variant?: "ok" | "warn" | "danger";
}) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-border bg-background/50 px-3 py-2.5">
      <Icon className={cn(
        "h-4 w-4 shrink-0",
        variant === "danger" ? "text-destructive" : variant === "warn" ? "text-warn" : "text-primary",
      )} />
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="text-sm font-bold tabular-nums text-foreground">
          {value}{unit && <span className="text-xs font-normal text-muted-foreground ml-0.5">{unit}</span>}
        </div>
      </div>
    </div>
  );
}

function formatUptime(secs: number): string {
  if (secs < 3600) return `${Math.floor(secs / 60)}m`;
  const h = Math.floor(secs / 3600);
  const d = Math.floor(h / 24);
  return d > 0 ? `${d}d ${h % 24}h` : `${h}h ${Math.floor((secs % 3600) / 60)}m`;
}

export function SystemStatsCard({ title }: { title?: string }) {
  const stats = useSystemStats();

  const cpuVariant = stats && stats.cpu_usage > 90 ? "danger" : stats && stats.cpu_usage > 70 ? "warn" : "ok";
  const memPct = stats ? (stats.memory_used_mb / stats.memory_total_mb) * 100 : 0;
  const memVariant = memPct > 90 ? "danger" : memPct > 70 ? "warn" : "ok";

  return (
    <ShCard className="bg-card border-border">
      <CardHeader className="pb-1 pt-4 px-4">
        <CardTitle className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {title ?? "System Stats"}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-2">
        {!stats ? (
          <div className="text-xs text-muted-foreground py-4 text-center">Awaiting system_stats event…</div>
        ) : (
          <>
            <MiniKpi icon={Cpu} label="CPU Usage" value={stats.cpu_usage.toFixed(1)} unit="%" variant={cpuVariant} />
            <MiniKpi
              icon={MemoryStick}
              label="Memory"
              value={`${stats.memory_used_mb} / ${stats.memory_total_mb}`}
              unit=" MB"
              variant={memVariant}
            />
            <MiniKpi icon={Clock} label="Uptime" value={formatUptime(stats.uptime_secs)} variant="ok" />
          </>
        )}
      </CardContent>
    </ShCard>
  );
}
