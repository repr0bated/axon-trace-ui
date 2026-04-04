import { useLiveRegistry, type SystemStats, type TimeSeriesPoint } from "@/stores/live-registry";

export function useLiveBinding(bindingKey: string, staticValue?: unknown): unknown {
  return useLiveRegistry((s) => s.latestStateByKey[bindingKey] ?? staticValue);
}

export function useLiveSeries(bindingKey: string): TimeSeriesPoint[] {
  return useLiveRegistry((s) => s.timeSeriesData[bindingKey] ?? []);
}

export function useSystemStats(): SystemStats | null {
  return useLiveRegistry((s) => s.systemStats);
}
