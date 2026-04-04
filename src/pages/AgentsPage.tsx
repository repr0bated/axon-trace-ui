import { useState, useMemo } from "react";
import { PageHeader, Card, Pill, StatCard, StatusDot } from "@/components/shell/Primitives";
import { SchemaRenderer } from "@/components/json/SchemaRenderer";
import { Badge } from "@/components/ui/badge";
import { useEventStore } from "@/stores/event-store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

/* ── Mock cognitive agents ─────────────────────────────── */

interface CognitiveAgent {
  id: string;
  name: string;
  description: string;
  status: "running" | "busy" | "error" | "offline";
  capabilities: string[];
  activeSessions: number;
  memoryEntries: number;
  configSchema: Record<string, unknown>;
  configData: Record<string, unknown>;
}

const COGNITIVE_AGENTS: CognitiveAgent[] = [
  {
    id: "rust-pro",
    name: "Rust Pro",
    description: "High-performance systems agent specializing in Rust codegen, unsafe audits, and async runtime analysis.",
    status: "running",
    capabilities: ["code_generation", "unsafe_audit", "async_analysis", "perf_profiling"],
    activeSessions: 3,
    memoryEntries: 1284,
    configSchema: {
      type: "object",
      properties: {
        temperature: { type: "number", title: "Temperature", minimum: 0, maximum: 2 },
        system_prompt: { type: "string", title: "System Prompt" },
        max_context_window: { type: "number", title: "Max Context Window" },
        enable_unsafe_suggestions: { type: "boolean", title: "Enable Unsafe Suggestions" },
      },
    },
    configData: { temperature: 0.3, system_prompt: "You are a Rust expert.", max_context_window: 128000, enable_unsafe_suggestions: false },
  },
  {
    id: "backend-arch",
    name: "Backend Architect",
    description: "Designs distributed system architectures, API schemas, and database models.",
    status: "busy",
    capabilities: ["architecture_design", "api_schema", "db_modeling", "load_analysis"],
    activeSessions: 1,
    memoryEntries: 742,
    configSchema: {
      type: "object",
      properties: {
        temperature: { type: "number", title: "Temperature", minimum: 0, maximum: 2 },
        system_prompt: { type: "string", title: "System Prompt" },
        max_context_window: { type: "number", title: "Max Context Window" },
        prefer_microservices: { type: "boolean", title: "Prefer Microservices" },
      },
    },
    configData: { temperature: 0.5, system_prompt: "You are a backend architect.", max_context_window: 64000, prefer_microservices: true },
  },
  {
    id: "memory-mgr",
    name: "Memory Manager",
    description: "Maintains long-term context, vector embeddings, and cross-session knowledge graphs.",
    status: "running",
    capabilities: ["vector_store", "knowledge_graph", "context_compression", "session_replay"],
    activeSessions: 8,
    memoryEntries: 5621,
    configSchema: {
      type: "object",
      properties: {
        embedding_model: { type: "string", title: "Embedding Model", enum: ["text-embedding-3-small", "text-embedding-3-large", "nomic-embed-text"] },
        max_memory_entries: { type: "number", title: "Max Memory Entries" },
        auto_prune: { type: "boolean", title: "Auto Prune Old Entries" },
        similarity_threshold: { type: "number", title: "Similarity Threshold", minimum: 0, maximum: 1 },
      },
    },
    configData: { embedding_model: "text-embedding-3-small", max_memory_entries: 10000, auto_prune: true, similarity_threshold: 0.78 },
  },
  {
    id: "security-agent",
    name: "Security Sentinel",
    description: "Monitors D-Bus policy violations, privilege escalation attempts, and surface attack vectors.",
    status: "running",
    capabilities: ["policy_audit", "escalation_detection", "cve_scan", "dbus_firewall"],
    activeSessions: 2,
    memoryEntries: 389,
    configSchema: {
      type: "object",
      properties: {
        alert_threshold: { type: "string", title: "Alert Threshold", enum: ["low", "medium", "high", "critical"] },
        auto_block: { type: "boolean", title: "Auto-Block Threats" },
        scan_interval_secs: { type: "number", title: "Scan Interval (seconds)" },
        system_prompt: { type: "string", title: "System Prompt" },
      },
    },
    configData: { alert_threshold: "medium", auto_block: false, scan_interval_secs: 30, system_prompt: "You are a security monitor." },
  },
  {
    id: "openclaw-cognitive",
    name: "OpenClaw Cognitive",
    description: "Central reasoning agent that coordinates multi-step plans across all other cognitive agents.",
    status: "error",
    capabilities: ["planning", "delegation", "self_reflection", "tool_composition"],
    activeSessions: 0,
    memoryEntries: 2103,
    configSchema: {
      type: "object",
      properties: {
        temperature: { type: "number", title: "Temperature", minimum: 0, maximum: 2 },
        max_planning_depth: { type: "number", title: "Max Planning Depth" },
        enable_self_reflection: { type: "boolean", title: "Enable Self-Reflection" },
        delegation_strategy: { type: "string", title: "Delegation Strategy", enum: ["round_robin", "capability_match", "load_balanced"] },
      },
    },
    configData: { temperature: 0.7, max_planning_depth: 5, enable_self_reflection: true, delegation_strategy: "capability_match" },
  },
];

const STATUS_DOT: Record<CognitiveAgent["status"], "ok" | "warn" | "error" | "offline"> = {
  running: "ok",
  busy: "warn",
  error: "error",
  offline: "offline",
};

const STATUS_PILL: Record<CognitiveAgent["status"], "ok" | "warn" | "danger" | "default"> = {
  running: "ok",
  busy: "warn",
  error: "danger",
  offline: "default",
};

export default function AgentsPage() {
  const latestState = useEventStore((s) => s.latestState);
  const [configAgent, setConfigAgent] = useState<CognitiveAgent | null>(null);
  const [configs, setConfigs] = useState<Record<string, Record<string, unknown>>>(
    Object.fromEntries(COGNITIVE_AGENTS.map((a) => [a.id, { ...a.configData }]))
  );

  // Merge live state into agent definitions
  const agents = useMemo(() => {
    return COGNITIVE_AGENTS.map((agent) => {
      const liveData = latestState[`agent.${agent.id}`] ?? latestState[`agents:${agent.id}`];
      if (liveData && typeof liveData === "object") {
        const live = liveData as Record<string, unknown>;
        return {
          ...agent,
          status: (live.status as CognitiveAgent["status"]) ?? agent.status,
          activeSessions: (live.activeSessions as number) ?? (live.active_sessions as number) ?? agent.activeSessions,
          memoryEntries: (live.memoryEntries as number) ?? (live.memory_entries as number) ?? agent.memoryEntries,
        };
      }
      return agent;
    });
  }, [latestState]);

  const running = agents.filter((a) => a.status === "running").length;
  const totalSessions = agents.reduce((s, a) => s + a.activeSessions, 0);
  const totalMemory = agents.reduce((s, a) => s + a.memoryEntries, 0);

  return (
    <>
      <PageHeader
        title="Cognitive Agents"
        subtitle="Monitor and configure always-on MCP background agents."
        actions={
          <button className="px-4 py-2 rounded-md border border-border bg-[hsl(var(--bg-elevated))] text-sm font-medium hover:bg-muted/30 transition-colors">
            Refresh
          </button>
        }
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Agents" value={COGNITIVE_AGENTS.length} />
        <StatCard label="Running" value={running} variant="ok" />
        <StatCard label="Active Sessions" value={totalSessions} />
        <StatCard label="Memory Entries" value={totalMemory.toLocaleString()} />
      </div>

      {/* Agent grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {COGNITIVE_AGENTS.map((agent) => (
          <Card key={agent.id}>
            <div className="flex items-start gap-3">
              <StatusDot status={STATUS_DOT[agent.status]} className="mt-1.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-foreground truncate">{agent.name}</h3>
                  <Pill variant={STATUS_PILL[agent.status]}>{agent.status}</Pill>
                </div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{agent.description}</p>

                {/* Capabilities */}
                <div className="flex flex-wrap gap-1 mt-2">
                  {agent.capabilities.map((cap) => (
                    <Badge key={cap} variant="secondary" className="text-[10px] px-1.5 py-0">
                      {cap}
                    </Badge>
                  ))}
                </div>

                {/* Metrics */}
                <div className="flex gap-4 mt-3 text-xs text-muted-foreground font-mono">
                  <span>Sessions: <span className="text-foreground">{agent.activeSessions}</span></span>
                  <span>Memory: <span className="text-foreground">{agent.memoryEntries.toLocaleString()}</span></span>
                </div>

                {/* Configure button */}
                <button
                  onClick={() => setConfigAgent(agent)}
                  className="mt-3 w-full px-3 py-1.5 rounded-md border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
                >
                  Configure
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Config dialog */}
      <Dialog open={!!configAgent} onOpenChange={(open) => !open && setConfigAgent(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <StatusDot status={configAgent ? STATUS_DOT[configAgent.status] : "ok"} />
              {configAgent?.name} Configuration
            </DialogTitle>
            <DialogDescription>{configAgent?.description}</DialogDescription>
          </DialogHeader>
          {configAgent && (
            <div className="mt-2">
              <SchemaRenderer
                schema={configAgent.configSchema}
                data={configs[configAgent.id] ?? configAgent.configData}
                onChange={(updated) =>
                  setConfigs((prev) => ({ ...prev, [configAgent.id]: updated as Record<string, unknown> }))
                }
              />
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => setConfigAgent(null)}
                  className="px-4 py-2 rounded-md border border-border text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setConfigAgent(null)}
                  className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
