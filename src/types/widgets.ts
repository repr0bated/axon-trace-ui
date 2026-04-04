export interface KpiWidget {
  type: "kpi";
  title: string;
  bindingKey?: string;
  staticValue?: number;
  unit?: string;
  icon?: string;
}

export interface TimeSeriesWidget {
  type: "timeseries";
  title: string;
  bindingKey: string;
  unit?: string;
  color?: string;
}

export interface SystemStatsWidget {
  type: "system_stats";
  title?: string;
}

export type Widget = KpiWidget | TimeSeriesWidget | SystemStatsWidget;
