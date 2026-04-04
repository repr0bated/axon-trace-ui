import { useEffect } from "react";
import { useLiveRegistry } from "@/stores/live-registry";

const MOCK_KEYS = [
  { plugin_id: "dinit", object_path: "/system/core", property_name: "load_avg" },
  { plugin_id: "dinit", object_path: "/system/core", property_name: "active_services" },
  { plugin_id: "ovs", object_path: "/bridges/br0", property_name: "port_count" },
];

function rand(min: number, max: number) {
  return +(min + Math.random() * (max - min)).toFixed(2);
}

export function useMockGrpcStream() {
  useEffect(() => {
    const { setConnectionState, ingestEvent } = useLiveRegistry.getState();
    setConnectionState(true);

    let tick = 0;
    const id = setInterval(() => {
      tick++;
      // Rotate through mock keys
      const mock = MOCK_KEYS[tick % MOCK_KEYS.length];
      ingestEvent("state_update", {
        plugin_id: mock.plugin_id,
        object_path: mock.object_path,
        property_name: mock.property_name,
        new_value: mock.property_name === "load_avg" ? rand(0.1, 4.0)
          : mock.property_name === "active_services" ? Math.floor(rand(12, 30))
          : Math.floor(rand(2, 8)),
      });

      // Every 3rd tick emit system_stats
      if (tick % 3 === 0) {
        ingestEvent("system_stats", {
          uptime_secs: 15840 + tick,
          memory_total_mb: 8192,
          memory_used_mb: Math.floor(rand(2000, 5500)),
          cpu_usage: rand(5, 65),
        });
      }
    }, 500);

    return () => {
      clearInterval(id);
      setConnectionState(false);
    };
  }, []);
}
