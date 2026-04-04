/**
 * Zustand store for SSE event streaming from the operation-dbus gateway.
 */
import { create } from "zustand";
import type { HealthSnapshot, LogEntry, SseEvent, Agent, EventEntry } from "@/types/api";

interface EventStore {
  connected: boolean;
  health: HealthSnapshot | null;
  logs: LogEntry[];
  agents: Agent[];
  events: EventEntry[];
  lastError: string | null;

  // Actions
  setConnected: (v: boolean) => void;
  setHealth: (h: HealthSnapshot) => void;
  addLog: (entry: LogEntry) => void;
  setAgents: (agents: Agent[]) => void;
  addEvent: (event: EventEntry) => void;
  setError: (err: string | null) => void;
  clearLogs: () => void;
}

const MAX_LOGS = 1000;
const MAX_EVENTS = 500;

export const useEventStore = create<EventStore>((set) => ({
  connected: false,
  health: null,
  logs: [],
  agents: [],
  events: [],
  lastError: null,

  setConnected: (connected) => set({ connected }),
  setHealth: (health) => set({ health }),
  addLog: (entry) =>
    set((s) => ({ logs: [...s.logs, entry].slice(-MAX_LOGS) })),
  setAgents: (agents) => set({ agents }),
  addEvent: (event) =>
    set((s) => ({ events: [...s.events, event].slice(-MAX_EVENTS) })),
  setError: (lastError) => set({ lastError }),
  clearLogs: () => set({ logs: [] }),
}));
