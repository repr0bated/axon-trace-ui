import { PageHeader, Card, StatCard, Callout, StatusDot } from "@/components/shell/Primitives";
import { EventTape } from "@/components/json/EventTape";
import { StateProjectionPanel } from "@/components/json/StateProjectionPanel";
import { JsonRenderer } from "@/components/json/JsonRenderer";
import { ResourceGauge } from "@/components/dashboard/ResourceGauge";
import { EventDistribution } from "@/components/dashboard/EventDistribution";
import { useEventStore } from "@/stores/event-store";
import {
  Activity, Server, Cpu, HardDrive, MemoryStick, Network,
  Layers, Bot, MessageSquare, Shield, Wrench, Clock,
} from "lucide-react";

function formatUptime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${s % 60}s`;
}

export default function OverviewPage() {
  const { connected, health, events, eventCounts, latestState, latestStats, lastError } = useEventStore();

  // Derive resource values from health or stats
  const cpu = health?.cpuPercent ?? (latestStats?.cpu as number | undefined) ?? 0;
  const memory = health?.memoryMb
    ? Math.min((health.memoryMb / 2048) * 100, 100) // estimate % from MB
    : (latestStats?.memory as number | undefined) ?? 0;
  const disk = (latestStats?.disk as number | undefined) ?? 0;
  const networkMbps = (latestStats?.network as number | undefined) ?? 0;

  return (
    <>
      <PageHeader
        title="Overview"
        subtitle="System status, resource utilization, and live event stream."
        actions={
          <div className="flex items-center gap-2">
            <StatusDot status={connected ? "ok" : "warn"} />
            <span className="text-xs font-mono text-muted-foreground">
              {connected ? "Connected" : "Disconnected"}
            </span>
          </div>
        }
      />

      {lastError && <Callout variant="danger">{lastError}</Callout>}

      {/* ── Row 1: Key stat cards ─────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          label="Status"
          value={health?.status === "healthy" ? "Healthy" : health?.status === "degraded" ? "Degraded" : connected ? "Online" : "Offline"}
          variant={health?.status === "healthy" ? "ok" : connected ? "warn" : "danger"}
        />
        <StatCard
          label="Uptime"
          value={health?.uptimeMs ? formatUptime(health.uptimeMs) : "—"}
        />
        <StatCard
          label="Services"
          value={health?.services ?? "—"}
          sub="D-Bus services"
        />
        <StatCard
          label="Agents"
          value={health?.agents ?? "—"}
          sub="Active workspaces"
        />
        <StatCard
          label="Sessions"
          value={health?.activeSessions ?? "—"}
          sub="Chat sessions"
        />
        <StatCard
          label="Version"
          value={health?.version ?? "—"}
        />
      </div>

      {/* ── Row 2: Resources + Gateway info ───────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Resource Gauges */}
        <Card
          title="System Resources"
          subtitle="Live resource utilization from the control plane."
          className="lg:col-span-2"
          actions={
            <div className="flex items-center gap-1.5">
              <Cpu className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-1">
            <ResourceGauge label="CPU" value={cpu} />
            <ResourceGauge label="Memory" value={memory} />
            <ResourceGauge label="Disk" value={disk} />
            <ResourceGauge label="Network" value={Math.min(networkMbps, 100)} unit=" Mbps" variant="default" />
          </div>
          {health?.memoryMb != null && (
            <div className="mt-3 flex items-center gap-4 text-[11px] font-mono text-muted-foreground">
              <span className="flex items-center gap-1"><MemoryStick className="h-3 w-3" />{health.memoryMb} MB used</span>
              <span className="flex items-center gap-1"><HardDrive className="h-3 w-3" />CPU {cpu.toFixed(1)}%</span>
            </div>
          )}
        </Card>

        {/* Gateway Access */}
        <Card title="Gateway Access" subtitle="Connection and authentication details.">
          <div className="space-y-3 mt-1">
            <div className="space-y-1.5">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">API Endpoint</span>
              <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-input bg-muted/20 text-sm font-mono text-foreground">
                <Server className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="truncate">{window.location.origin}</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Auth Mode</span>
              <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-input bg-muted/20 text-sm font-mono text-foreground">
                <Shield className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                WireGuard (trusted-proxy)
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 rounded-md border border-border bg-[hsl(var(--bg-elevated))] text-xs font-medium hover:bg-muted/30 hover:border-muted-foreground/20 transition-all">
                Refresh
              </button>
              <span className="text-[11px] text-muted-foreground">Authenticated via WireGuard tunnel.</span>
            </div>
          </div>
        </Card>
      </div>

      {/* ── Row 3: Component overview + Event distribution ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Component status grid */}
        <Card
          title="Components"
          subtitle="Subsystem health at a glance."
          actions={<Activity className="h-3.5 w-3.5 text-muted-foreground" />}
        >
          <div className="grid grid-cols-2 gap-2 mt-1">
            {[
              { name: "D-Bus Monitor", icon: Layers, ok: connected },
              { name: "Agent Runtime", icon: Bot, ok: (health?.agents ?? 0) > 0 },
              { name: "Chat Engine", icon: MessageSquare, ok: connected },
              { name: "Tool Registry", icon: Wrench, ok: connected },
              { name: "SSE Stream", icon: Network, ok: connected },
              { name: "Scheduler", icon: Clock, ok: connected },
            ].map((c) => (
              <div key={c.name} className="flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-muted/10 hover:border-muted-foreground/20 transition-colors">
                <StatusDot status={c.ok ? "ok" : "warn"} />
                <c.icon className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-foreground">{c.name}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Event Distribution */}
        <Card
          title="Event Distribution"
          subtitle="SSE event type breakdown from the live stream."
          actions={<Activity className="h-3.5 w-3.5 text-muted-foreground" />}
        >
          {Object.keys(eventCounts).length > 0 ? (
            <EventDistribution counts={eventCounts} className="mt-1" />
          ) : (
            <div className="text-sm text-muted-foreground mt-2 font-mono">
              No events received yet. Connect to the control plane to see live data.
            </div>
          )}
        </Card>
      </div>

      {/* ── Row 4: Event tape + live state ─────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <EventTape events={events} />
        <StateProjectionPanel state={latestState} />
      </div>

      {/* ── Row 5: System stats raw + notes ────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {latestStats ? (
          <Card title="Raw System Stats" subtitle="Latest system_stats event payload.">
            <JsonRenderer data={latestStats} className="mt-2" />
          </Card>
        ) : (
          <Card title="Raw System Stats" subtitle="Waiting for system_stats events.">
            <div className="text-sm text-muted-foreground mt-2 font-mono">No stats data received.</div>
          </Card>
        )}

        <Card title="Notes" subtitle="Quick reminders for control plane setups.">
          <div className="space-y-3 mt-1">
            {[
              { title: "WireGuard tunnel", desc: "All API access goes through the WireGuard mesh. No external exposure needed." },
              { title: "Session hygiene", desc: "Use /new or session patch to reset context between agent runs." },
              { title: "Schema-first tools", desc: "Every tool exposes input_schema. Execution forms are generated from schema." },
              { title: "Event stream", desc: "SSE stream at /api/events provides real-time health, logs, and state updates." },
            ].map((n) => (
              <div key={n.title}>
                <div className="text-xs font-semibold text-foreground">{n.title}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{n.desc}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
