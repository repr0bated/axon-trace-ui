import { create } from "zustand";

export interface SystemStats {
  uptime_secs: number;
  memory_total_mb: number;
  memory_used_mb: number;
  cpu_usage: number;
}

export interface TimeSeriesPoint {
  t: string;
  v: number;
}

const MAX_SERIES_POINTS = 50;

interface LiveRegistryState {
  connected: boolean;
  latestStateByKey: Record<string, unknown>;
  systemStats: SystemStats | null;
  timeSeriesData: Record<string, TimeSeriesPoint[]>;

  setConnectionState: (connected: boolean) => void;
  ingestEvent: (type: string, payload: Record<string, unknown>) => void;
}

export const useLiveRegistry = create<LiveRegistryState>((set) => ({
  connected: false,
  latestStateByKey: {},
  systemStats: null,
  timeSeriesData: {},

  setConnectionState: (connected) => set({ connected }),

  ingestEvent: (type, payload) => {
    if (type === "system_stats") {
      set({
        systemStats: payload as unknown as SystemStats,
      });
      return;
    }

    if (type === "state_update") {
      const key = `${payload.plugin_id}:${payload.object_path}:${payload.property_name}`;
      const newValue = payload.new_value;

      set((s) => {
        const next: Partial<LiveRegistryState> = {
          latestStateByKey: { ...s.latestStateByKey, [key]: newValue },
        };

        if (typeof newValue === "number") {
          const existing = s.timeSeriesData[key] ?? [];
          const point: TimeSeriesPoint = { t: new Date().toISOString(), v: newValue };
          next.timeSeriesData = {
            ...s.timeSeriesData,
            [key]: [...existing, point].slice(-MAX_SERIES_POINTS),
          };
        }

        return next;
      });
    }
  },
}));
