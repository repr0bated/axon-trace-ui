import { useLiveSeries } from "@/hooks/use-live-registry";
import { Card as ShCard, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import type { TimeSeriesWidget } from "@/types/widgets";

export function TimeSeriesChart({ config }: { config: TimeSeriesWidget }) {
  const data = useLiveSeries(config.bindingKey);

  return (
    <ShCard className="bg-card border-border">
      <CardHeader className="pb-1 pt-4 px-4">
        <CardTitle className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {config.title}
        </CardTitle>
        <p className="text-[10px] font-mono text-muted-foreground truncate">{config.bindingKey}</p>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {data.length === 0 ? (
          <div className="h-[180px] flex items-center justify-center text-xs text-muted-foreground">
            Awaiting data…
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="t"
                tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(v: string) => new Date(v).toLocaleTimeString([], { minute: "2-digit", second: "2-digit" })}
              />
              <YAxis
                tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                width={36}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 6,
                  fontSize: 11,
                }}
                labelFormatter={(v: string) => new Date(v).toLocaleTimeString()}
              />
              <Line
                type="monotone"
                dataKey="v"
                stroke={config.color ?? "hsl(var(--primary))"}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </ShCard>
  );
}
