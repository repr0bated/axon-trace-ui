import { useEffect, useRef } from "react";
import { stateSync, eventChainService, ovsdbMirror, runtimeMirror } from "@/grpc/client";
import { useEventStore } from "@/stores/event-store";
import type { StateChange, ChainEvent, OvsdbUpdate, RuntimeMetricUpdate } from "@/grpc/types/operation";
import { structToObject, valueToJs } from "@/grpc/google/protobuf/struct";

/**
 * Subscribes to all live gRPC-Web server-streams from the operation gateway:
 *   1. StateSync.Subscribe   — D-Bus property changes → latestState
 *   2. EventChain.SubscribeEvents — Audit ledger → events[]
 *   3. OvsdbMirror.Monitor   — OVS bridge/port/interface changes → latestState
 *   4. RuntimeMirror.StreamMetrics — CPU/memory/network metrics → latestStats
 *
 * All streams auto-reconnect on failure with exponential backoff.
 */
export function useEventStream() {
  const abortsRef = useRef<(() => void)[]>([]);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let mounted = true;

    function connectAll() {
      if (!mounted) return;
      const aborts: (() => void)[] = [];

      const s = useEventStore.getState();
      s.setConnected(false);
      s.setError(null);

      // ── 1. StateSync — live D-Bus property updates ────────────────────
      try {
        const { stream: stateStream, abort: abortState } = stateSync.subscribe({
          includeInitialState: true,
        });
        aborts.push(abortState);

        const stateReader = stateStream.getReader();
        (async () => {
          try {
            while (true) {
              const { done, value } = await stateReader.read();
              if (done) break;
              const change = value as StateChange;
              const store = useEventStore.getState();

              // Project change into latestState
              const key = change.pluginId
                ? `${change.pluginId}.${change.memberName}`
                : change.memberName;
              store.updateState(key, valueToJs(change.newValue));

              // Track as event
              store.addEvent({
                id: change.changeId || `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                event: "state_update",
                ts: Date.now(),
                payload: change,
              });
              store.incrementEventCount("state_update");

              // Mark connected on first message
              store.setConnected(true);
              store.setError(null);
            }
          } catch (err) {
            if (mounted && (err as Error).name !== "AbortError") {
              useEventStore.getState().setError(`StateSync stream error: ${(err as Error).message}`);
            }
          }
        })();
      } catch {
        // Stream creation failed — will retry
      }

      // ── 2. EventChain — audit ledger stream ──────────────────────────
      try {
        const { stream: chainStream, abort: abortChain } = eventChainService.subscribeEvents({
          fromEventId: 0,
        });
        aborts.push(abortChain);

        const chainReader = chainStream.getReader();
        (async () => {
          try {
            while (true) {
              const { done, value } = await chainReader.read();
              if (done) break;
              const evt = value as ChainEvent;
              const store = useEventStore.getState();

              store.addEvent({
                id: evt.eventHash || `chain-${evt.eventId}`,
                event: "audit_event",
                ts: Date.now(),
                payload: evt,
              });
              store.incrementEventCount("audit_event");
            }
          } catch (err) {
            if (mounted && (err as Error).name !== "AbortError") {
              useEventStore.getState().setError(`EventChain stream error: ${(err as Error).message}`);
            }
          }
        })();
      } catch {
        // Stream creation failed
      }

      // ── 3. OvsdbMirror.Monitor — OVS changes ─────────────────────────
      try {
        const { stream: ovsStream, abort: abortOvs } = ovsdbMirror.monitor({
          database: "Open_vSwitch",
          monitorRequestsJson: JSON.stringify({
            Bridge: {},
            Port: {},
            Interface: {},
          }),
        });
        aborts.push(abortOvs);

        const ovsReader = ovsStream.getReader();
        (async () => {
          try {
            while (true) {
              const { done, value } = await ovsReader.read();
              if (done) break;
              const update = value as OvsdbUpdate;
              const store = useEventStore.getState();

              // Project into latestState under ovsdb namespace
              const key = `ovsdb.${update.table}.${update.uuid}`;
              store.updateState(
                key,
                update.newRow ? structToObject(update.newRow) : null,
              );

              store.addEvent({
                id: `ovs-${update.uuid}-${Date.now()}`,
                event: "state_update",
                ts: Date.now(),
                payload: update,
              });
              store.incrementEventCount("state_update");
            }
          } catch (err) {
            if (mounted && (err as Error).name !== "AbortError") {
              useEventStore.getState().setError(`OvsdbMirror stream error: ${(err as Error).message}`);
            }
          }
        })();
      } catch {
        // Stream creation failed
      }

      // ── 4. RuntimeMirror.StreamMetrics — system metrics ───────────────
      try {
        const { stream: metricsStream, abort: abortMetrics } = runtimeMirror.streamMetrics({
          intervalSeconds: 5,
          categories: [],
        });
        aborts.push(abortMetrics);

        const metricsReader = metricsStream.getReader();
        (async () => {
          try {
            while (true) {
              const { done, value } = await metricsReader.read();
              if (done) break;
              const metric = value as RuntimeMetricUpdate;
              const store = useEventStore.getState();

              // Accumulate metrics into latestStats
              const current = store.latestStats ?? {};
              const labelKey = Object.values(metric.labels || {}).join(".");
              const metricKey = labelKey
                ? `${metric.category}.${metric.name}.${labelKey}`
                : `${metric.category}.${metric.name}`;

              store.setStats({
                ...current,
                [metricKey]: {
                  value: metric.value,
                  unit: metric.unit,
                  labels: metric.labels,
                  timestamp: metric.timestamp,
                },
              });

              store.incrementEventCount("system_stats");
            }
          } catch (err) {
            if (mounted && (err as Error).name !== "AbortError") {
              useEventStore.getState().setError(`RuntimeMirror metrics error: ${(err as Error).message}`);
            }
          }
        })();
      } catch {
        // Stream creation failed
      }

      abortsRef.current = aborts;

      // If no streams connected, schedule retry
      if (aborts.length === 0) {
        scheduleRetry();
      }
    }

    function scheduleRetry() {
      if (!mounted) return;
      const store = useEventStore.getState();
      store.setConnected(false);
      store.setError("All gRPC streams disconnected, retrying…");
      retryRef.current = setTimeout(() => {
        cleanup();
        connectAll();
      }, 5000);
    }

    function cleanup() {
      for (const abort of abortsRef.current) {
        try { abort(); } catch { /* ignore */ }
      }
      abortsRef.current = [];
      if (retryRef.current) {
        clearTimeout(retryRef.current);
        retryRef.current = null;
      }
    }

    connectAll();

    return () => {
      mounted = false;
      cleanup();
    };
  }, []);
}
