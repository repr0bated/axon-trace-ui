import { useState, useEffect } from "react";
import { PageHeader, Card, StatCard, Callout, StatusDot, Pill } from "@/components/shell/Primitives";
import { EventTape } from "@/components/json/EventTape";
import { JsonRenderer } from "@/components/json/JsonRenderer";
import { useEventStore } from "@/stores/event-store";
import { cn } from "@/lib/utils";
import {
  Activity, Cpu, HardDrive, MemoryStick, Network, Server,
  Shield, Clock, Zap, Database, Radio, Layers, RefreshCw,
  ArrowUpRight, ArrowDownRight, Minus
} from "lucide-react";
import { WidgetHost } from "@/components/widgets/WidgetHost";
import { useMockGrpcStream } from "@/hooks/use-mock-grpc-stream";
import type { Widget } from "@/types/widgets";

function formatUptime(ms: number): string {
  const s = Math.floor(ms / 1000);
  if (s < 3600) return `${Math.floor(s / 60)}m ${s % 60}s`;
  const h = Math.floor(s / 3600);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ${h % 24}h ${Math.floor((s % 3600) / 60)}m`;
  return `${h}h ${Math.floor((s % 3600) / 60)}m`;
}

function MiniGauge({ value, max, label, unit, variant = "default" }: {
  value: number; max: number; label: string; unit?: string;
  variant?: "default" | "ok" | "warn" | "danger";
}) {
  const pct = Math.min((value / max) * 100, 100);
  const autoVariant = pct > 90 ? "danger" : pct > 70 ? "warn" : "ok";
  const v = variant === "default" ? autoVariant : variant;
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
        <span className="text-sm font-bold text-foreground tabular-nums">{value}{unit}</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            v === "ok" && "bg-ok",
            v === "warn" && "bg-warn",
            v === "danger" && "bg-danger",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="text-[10px] text-muted-foreground tabular-nums">{pct.toFixed(0)}% of {max}{unit}</div>
    </div>
  );
}

// Simulated metrics for demo — replaced by real API data when connected
const MOCK_METRICS = {
  cpuPercent: 23,
  memUsedMb: 1847,
  memTotalMb: 8192,
  diskUsedGb: 42,
  diskTotalGb: 120,
  netInMbps: 12.4,
  netOutMbps: 3.8,
  loadAvg: [0.45, 0.62, 0.58] as [number, number, number],
  openFds: 312,
  maxFds: 1024,
  goroutines: 47,
  dbusMessages: 14832,
  toolsRegistered: 24,
  toolExecutions: 187,
  agentsActive: 2,
  agentsTotal: 5,
  sessionsActive: 3,
  servicesTracked: 48,
  alertsOpen: 1,
  alertsCritical: 0,
};

const LIVE_WIDGETS: Widget[] = [
  { type: "kpi", title: "Load Average", bindingKey: "dinit:/system/core:load_avg", unit: "" },
  { type: "kpi", title: "Active Services", bindingKey: "dinit:/system/core:active_services" },
  { type: "kpi", title: "OVS Ports", bindingKey: "ovs:/bridges/br0:port_count" },
  { type: "system_stats" },
  { type: "timeseries", title: "Load Average", bindingKey: "dinit:/system/core:load_avg", color: "hsl(var(--primary))" },
  { type: "timeseries", title: "Active Services", bindingKey: "dinit:/system/core:active_services", color: "hsl(var(--ok))" },
];

export default function OverviewPage() {
  const { connected, health, events, latestState, latestStats, lastError, eventCounts, logs } = useEventStore();
  const [clock, setClock] = useState(new Date());

  // Start mock stream simulator
  useMockGrpcStream();

  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const m = MOCK_METRICS; // Will be replaced with real data

  return (
    <>
      <PageHeader
        title="Overview"
        subtitle="Control plane status, system health, and operational metrics."
        actions={
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-muted-foreground tabular-nums">
              {clock.toLocaleTimeString()}
            </span>
            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-[hsl(var(--bg-elevated))] text-xs font-medium hover:bg-muted/30 transition-colors">
              <RefreshCw className="h-3 w-3" /> Refresh
            </button>
          </div>
        }
      />

      {lastError && <Callout variant="danger">{lastError}</Callout>}

      {/* Row 1: Connection + Health Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Connection Card */}
        <Card title="Gateway" subtitle="Control plane connection.">
          <div className="space-y-3 mt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Status</span>
              <div className="flex items-center gap-2">
                <StatusDot status={connected ? "ok" : "error"} />
                <span className={cn("text-sm font-semibold", connected ? "text-ok" : "text-danger")}>
                  {connected ? "Connected" : "Disconnected"}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Endpoint</span>
              <span className="text-xs font-mono text-foreground">{window.location.origin}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Auth</span>
              <Pill variant="ok">WireGuard</Pill>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Version</span>
              <span className="text-xs font-mono text-foreground">{health?.version || "0.4.2-dev"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Uptime</span>
              <span className="text-xs font-mono text-foreground">{health?.uptimeMs ? formatUptime(health.uptimeMs) : "4h 22m"}</span>
            </div>
          </div>
        </Card>

        {/* System Resources */}
        <Card title="System Resources" subtitle="Host machine utilization.">
          <div className="space-y-4 mt-3">
            <MiniGauge value={m.cpuPercent} max={100} label="CPU" unit="%" />
            <MiniGauge value={m.memUsedMb} max={m.memTotalMb} label="Memory" unit=" MB" />
            <MiniGauge value={m.diskUsedGb} max={m.diskTotalGb} label="Disk" unit=" GB" />
          </div>
        </Card>

        {/* Network + I/O */}
        <Card title="Network & I/O" subtitle="Throughput and file descriptors.">
          <div className="space-y-4 mt-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-md border border-border bg-background/50 p-2.5">
                <div className="flex items-center gap-1.5">
                  <ArrowDownRight className="h-3 w-3 text-ok" />
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">In</span>
                </div>
                <div className="text-lg font-bold tabular-nums text-foreground mt-0.5">{m.netInMbps}</div>
                <div className="text-[10px] text-muted-foreground">Mbps</div>
              </div>
              <div className="rounded-md border border-border bg-background/50 p-2.5">
                <div className="flex items-center gap-1.5">
                  <ArrowUpRight className="h-3 w-3 text-primary" />
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Out</span>
                </div>
                <div className="text-lg font-bold tabular-nums text-foreground mt-0.5">{m.netOutMbps}</div>
                <div className="text-[10px] text-muted-foreground">Mbps</div>
              </div>
            </div>
            <MiniGauge value={m.openFds} max={m.maxFds} label="File Descriptors" />
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Load Avg</span>
              <span className="text-xs font-mono tabular-nums text-foreground">
                {m.loadAvg.map((v) => v.toFixed(2)).join(" · ")}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Row 2: Operational counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <StatCard label="Services" value={health?.services ?? m.servicesTracked} sub="D-Bus tracked" />
        <StatCard label="Tools" value={m.toolsRegistered} sub={`${m.toolExecutions} executions`} />
        <StatCard label="Agents" value={`${m.agentsActive}/${m.agentsTotal}`} sub="active / total" variant={m.agentsActive > 0 ? "ok" : "default"} />
        <StatCard label="Sessions" value={health?.activeSessions ?? m.sessionsActive} sub="active chat" variant="ok" />
        <StatCard label="D-Bus Msgs" value={m.dbusMessages.toLocaleString()} sub="total intercepted" />
        <StatCard label="Alerts" value={m.alertsOpen} sub={`${m.alertsCritical} critical`} variant={m.alertsCritical > 0 ? "danger" : m.alertsOpen > 0 ? "warn" : "ok"} />
      </div>

      {/* Row 3: Event stream counters */}
      <Card title="Event Stream" subtitle="SSE event type distribution since connection.">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
          {Object.keys(eventCounts).length > 0 ? (
            Object.entries(eventCounts).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between rounded-md border border-border bg-background/50 px-3 py-2">
                <div className="flex items-center gap-2">
                  <Radio className="h-3 w-3 text-primary" />
                  <span className="text-xs font-mono text-foreground">{type}</span>
                </div>
                <span className="text-sm font-bold tabular-nums text-foreground">{count}</span>
              </div>
            ))
          ) : (
            <>
              {["state_update", "audit_event", "system_stats", "message", "log", "tool_result"].map((type) => (
                <div key={type} className="flex items-center justify-between rounded-md border border-border bg-background/50 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Radio className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs font-mono text-muted-foreground">{type}</span>
                  </div>
                  <span className="text-sm font-bold tabular-nums text-muted-foreground">0</span>
                </div>
              ))}
            </>
          )}
        </div>
      </Card>

      {/* Row 4: Live event tape + state projection */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <EventTape events={events} />
        <Card title="State Projection" subtitle="Latest known state by key from stream.">
          {Object.keys(latestState).length > 0 ? (
            <JsonRenderer data={latestState} className="mt-2" />
          ) : (
            <div className="mt-2 space-y-2">
              <div className="text-sm text-muted-foreground">No state updates received yet.</div>
              <div className="rounded-md border border-border bg-background/50 p-3">
                <pre className="font-mono text-[11px] text-muted-foreground">{`{
  "gateway.status": "awaiting_connection",
  "dinit.services": [],
  "ovs.bridges": []
}`}</pre>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Row 5: System stats + recent logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {latestStats ? (
          <Card title="System Stats" subtitle="Latest stats payload from event stream.">
            <JsonRenderer data={latestStats} className="mt-2" />
          </Card>
        ) : (
          <Card title="System Stats" subtitle="Latest stats payload from event stream.">
            <div className="text-sm text-muted-foreground mt-2">Waiting for system_stats event…</div>
          </Card>
        )}

        <Card title="Recent Logs" subtitle={`Last ${Math.min(logs.length, 8)} entries.`}>
          <div className="mt-2 space-y-1 max-h-[260px] overflow-auto">
            {logs.length > 0 ? logs.slice(-8).reverse().map((log, i) => (
              <div key={i} className="flex items-start gap-2 rounded px-2 py-1.5 hover:bg-muted/20 transition-colors">
                <Pill variant={log.level === "error" ? "danger" : log.level === "warn" ? "warn" : "default"} className="shrink-0 mt-0.5">
                  {log.level}
                </Pill>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-mono text-foreground truncate">{log.message}</div>
                  <div className="text-[10px] text-muted-foreground">{log.subsystem} · {new Date(log.time).toLocaleTimeString()}</div>
                </div>
              </div>
            )) : (
              <div className="text-sm text-muted-foreground">No logs captured yet.</div>
            )}
          </div>
        </Card>
      </div>

      {/* Row 6: Live Registry Widgets */}
      <Card title="Live Registry" subtitle="Schema-driven widgets bound to live state keys.">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
          {LIVE_WIDGETS.map((w, i) => (
            <WidgetHost key={i} widget={w} />
          ))}
        </div>
      </Card>

      {/* Row 7: Operational notes */}
      <Card title="Operational Notes">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
          <div className="rounded-md border border-border bg-background/50 p-3">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="h-3.5 w-3.5 text-ok" />
              <span className="text-sm font-semibold text-foreground">WireGuard Tunnel</span>
            </div>
            <p className="text-xs text-muted-foreground">All API access via WireGuard mesh. No external exposure needed.</p>
          </div>
          <div className="rounded-md border border-border bg-background/50 p-3">
            <div className="flex items-center gap-2 mb-1">
              <Layers className="h-3.5 w-3.5 text-primary" />
              <span className="text-sm font-semibold text-foreground">Session Hygiene</span>
            </div>
            <p className="text-xs text-muted-foreground">Use /new or session patch to reset context between agent runs.</p>
          </div>
          <div className="rounded-md border border-border bg-background/50 p-3">
            <div className="flex items-center gap-2 mb-1">
              <Database className="h-3.5 w-3.5 text-warn" />
              <span className="text-sm font-semibold text-foreground">Schema-First Tools</span>
            </div>
            <p className="text-xs text-muted-foreground">Every tool exposes input_schema. Execution forms generated from schema.</p>
          </div>
        </div>
      </Card>
    </>
  );
}
