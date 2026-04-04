import type { Widget } from "@/types/widgets";
import { KpiCard } from "./KpiCard";
import { TimeSeriesChart } from "./TimeSeriesChart";
import { SystemStatsCard } from "./SystemStatsCard";

export function WidgetHost({ widget }: { widget: Widget }) {
  switch (widget.type) {
    case "kpi":
      return <KpiCard config={widget} />;
    case "timeseries":
      return <TimeSeriesChart config={widget} />;
    case "system_stats":
      return <SystemStatsCard title={widget.title} />;
    default:
      return null;
  }
}
