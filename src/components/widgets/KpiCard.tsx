import { useLiveBinding } from "@/hooks/use-live-registry";
import { Card as ShCard, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { KpiWidget } from "@/types/widgets";
import { Activity } from "lucide-react";

export function KpiCard({ config }: { config: KpiWidget }) {
  const liveValue = useLiveBinding(config.bindingKey ?? "", config.staticValue);
  const display = liveValue != null ? String(liveValue) : "—";

  return (
    <ShCard className="bg-card border-border">
      <CardHeader className="pb-1 pt-4 px-4">
        <CardTitle className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Activity className="h-3 w-3" />
          {config.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="text-2xl font-bold tabular-nums text-foreground">
          {display}
          {config.unit && <span className="text-sm font-normal text-muted-foreground ml-1">{config.unit}</span>}
        </div>
        {config.bindingKey && (
          <div className="text-[10px] font-mono text-muted-foreground mt-1 truncate">{config.bindingKey}</div>
        )}
      </CardContent>
    </ShCard>
  );
}
