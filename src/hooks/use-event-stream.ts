import { useEffect, useRef } from "react";
import { connectEventStream } from "@/lib/api";
import { useEventStore } from "@/stores/event-store";
import type { SseEventType } from "@/types/api";

export function useEventStream() {
  const cleanupRef = useRef<(() => void) | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const store = useEventStore.getState();

    function connect() {
      if (cleanupRef.current) return;

      const cleanup = connectEventStream(
        (event) => {
          const s = useEventStore.getState();
          const type = event.type as SseEventType;
          s.incrementEventCount(type);
          s.addEvent({
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            event: type,
            ts: Date.now(),
            payload: event.data,
          });

          switch (type) {
            case "health":
              s.setHealth(event.data as any);
              break;
            case "system_stats":
              s.setStats(event.data as Record<string, unknown>);
              break;
            case "state_update": {
              const d = event.data as { key?: string; value?: unknown };
              if (d.key) s.updateState(d.key, d.value);
              break;
            }
            case "log":
              s.addLog(event.data as any);
              break;
          }

          s.setConnected(true);
          s.setError(null);
        },
        (err) => {
          const s = useEventStore.getState();
          s.setConnected(false);
          s.setError(err.message);
          cleanupRef.current = null;
          retryRef.current = setTimeout(connect, 5000);
        },
      );

      cleanupRef.current = cleanup;
    }

    connect();

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
      if (retryRef.current) {
        clearTimeout(retryRef.current);
        retryRef.current = null;
      }
    };
  }, []);
}
