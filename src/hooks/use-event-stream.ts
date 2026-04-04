import { useEffect, useRef, useCallback } from "react";
import { connectEventStream } from "@/lib/api";
import { useEventStore } from "@/stores/event-store";
import type { SseEventType } from "@/types/api";

export function useEventStream() {
  const store = useEventStore();
  const cleanupRef = useRef<(() => void) | null>(null);

  const connect = useCallback(() => {
    if (cleanupRef.current) return;

    const cleanup = connectEventStream(
      (event) => {
        const type = event.type as SseEventType;
        store.incrementEventCount(type);
        store.addEvent({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          event: type,
          ts: Date.now(),
          payload: event.data,
        });

        switch (type) {
          case "health":
            store.setHealth(event.data as any);
            break;
          case "system_stats":
            store.setStats(event.data as Record<string, unknown>);
            break;
          case "state_update": {
            const d = event.data as { key?: string; value?: unknown };
            if (d.key) store.updateState(d.key, d.value);
            break;
          }
          case "log":
            store.addLog(event.data as any);
            break;
          case "agent_status":
            break;
        }

        store.setConnected(true);
        store.setError(null);
      },
      (err) => {
        store.setConnected(false);
        store.setError(err.message);
        cleanupRef.current = null;
        // Reconnect after delay
        setTimeout(connect, 3000);
      },
    );

    cleanupRef.current = cleanup;
  }, [store]);

  useEffect(() => {
    connect();
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, [connect]);
}
