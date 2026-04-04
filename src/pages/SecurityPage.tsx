import { useState, useMemo } from "react";
import { PageHeader, Card, Pill, StatusDot } from "@/components/shell/Primitives";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { JsonRenderer } from "@/components/json/JsonRenderer";
import { useEventStore } from "@/stores/event-store";
import { Search, ChevronRight, ShieldCheck, Lock, Link2, Hash } from "lucide-react";
import { cn } from "@/lib/utils";

interface AuditBlock {
  id: string;
  hash: string;
  prev_hash: string;
  timestamp: string;
  event_type: string;
  agent?: string;
  summary: string;
  payload: Record<string, unknown>;
}

const EVENT_COLORS: Record<string, string> = {
  "dbus.schema.update": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "agent.tool_call": "bg-purple-500/20 text-purple-400 border-purple-500/30",
  "agent.thought": "bg-violet-500/20 text-violet-400 border-violet-500/30",
  "network.bridge.update": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  "security.auth": "bg-green-500/20 text-green-400 border-green-500/30",
  "state.mutation": "bg-amber-500/20 text-amber-400 border-amber-500/30",
  "config.change": "bg-orange-500/20 text-orange-400 border-orange-500/30",
};

const DEFAULT_BLOCKS: AuditBlock[] = [
  { id: "blk-001", hash: "a3f8c2d1e5b7", prev_hash: "000000000000", timestamp: "2025-04-04T14:23:01Z", event_type: "security.auth", summary: "User authenticated via WireGuard peer", payload: { auth_mode: "wireguard", peer_public_key: "xR7k...Q2w=", ip: "100.64.1.15", role: "admin", session_id: "sess-7a3b" } },
  { id: "blk-002", hash: "b7e4a1c9f3d6", prev_hash: "a3f8c2d1e5b7", timestamp: "2025-04-04T14:23:05Z", event_type: "agent.thought", agent: "net-guardian", summary: "Analyzed network anomaly on br-lan", payload: { thought_process: "Detected unusual ARP pattern from 10.10.0.15. Cross-referencing with known container IPs. The source matches ct-2 (privacy-router) which occasionally broadcasts ARP for WARP tunnel re-establishment. Classifying as benign.", reasoning_steps: ["1. ARP flood detected (>50 req/s)", "2. Source IP resolved to ct-2", "3. Pattern matches WARP reconnection behavior", "4. No unknown MAC addresses involved"], conclusion: "benign", confidence: 0.94 } },
  { id: "blk-003", hash: "c1d5e8f2a4b9", prev_hash: "b7e4a1c9f3d6", timestamp: "2025-04-04T14:23:12Z", event_type: "agent.tool_call", agent: "net-guardian", summary: "Executed OVS flow inspection", payload: { tool: "ovs-ofctl dump-flows br-lan", args: { bridge: "br-lan", table: 0 }, result: { flow_count: 12, suspicious_flows: 0 }, duration_ms: 45 } },
  { id: "blk-004", hash: "d9a2b6c4e7f1", prev_hash: "c1d5e8f2a4b9", timestamp: "2025-04-04T14:24:30Z", event_type: "dbus.schema.update", summary: "NetworkManager property changed", payload: { object_path: "/org/freedesktop/NetworkManager", interface: "org.freedesktop.NetworkManager", property: "Connectivity", old_value: 3, new_value: 4, label: "full connectivity restored" } },
  { id: "blk-005", hash: "e3f7a8b1c5d2", prev_hash: "d9a2b6c4e7f1", timestamp: "2025-04-04T14:25:00Z", event_type: "network.bridge.update", summary: "Port added to br-priv", payload: { bridge: "br-priv", port: "veth-ct5", action: "add", vlan_tag: 30, ofport: 5 } },
  { id: "blk-006", hash: "f1c4d7e9a2b5", prev_hash: "e3f7a8b1c5d2", timestamp: "2025-04-04T14:26:15Z", event_type: "state.mutation", summary: "XRay obfuscation level increased", payload: { plugin: "privacy-router", key: "xray.obfuscation_level", old_value: 2, new_value: 3, mutated_by: "operator", reason: "Increased censorship resistance for outbound traffic" } },
  { id: "blk-007", hash: "a8b3c6d1e4f9", prev_hash: "f1c4d7e9a2b5", timestamp: "2025-04-04T14:27:00Z", event_type: "config.change", summary: "LLM temperature adjusted", payload: { section: "llm", key: "temperature", old_value: 0.7, new_value: 0.3, changed_by: "admin" } },
  { id: "blk-008", hash: "b5d8e1f4a7c3", prev_hash: "a8b3c6d1e4f9", timestamp: "2025-04-04T14:28:45Z", event_type: "agent.thought", agent: "sec-sentinel", summary: "Evaluated TLS certificate expiry", payload: { thought_process: "Checked TLS certificate at /etc/ssl/certs/op-dbus.pem. Certificate expires in 23 days. This is within the 30-day warning threshold. Recommending renewal.", reasoning_steps: ["1. Read certificate metadata", "2. Expiry: 2025-04-27", "3. Threshold: 30 days", "4. Action: alert operator"], conclusion: "renewal_needed", confidence: 1.0 } },
];

export default function SecurityPage() {
  const { latestState } = useEventStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedBlocks, setExpandedBlocks] = useState<Set<string>>(new Set());

  const liveStatus = useMemo(() => {
    const s = latestState["security.status"] ?? latestState["security:status"];
    const defaults = { auth_mode: "WireGuard", tls_status: "active", total_blocks: DEFAULT_BLOCKS.length, qdrant_status: "connected", vectors_indexed: 1247 };
    if (s && typeof s === "object") return { ...defaults, ...(s as Record<string, unknown>) };
    return defaults;
  }, [latestState]);

  const blocks = useMemo(() => {
    const live = latestState["security.audit_chain"] ?? latestState["audit:chain"];
    const base = Array.isArray(live) ? (live as AuditBlock[]) : DEFAULT_BLOCKS;
    if (!searchQuery.trim()) return base;
    const q = searchQuery.toLowerCase();
    return base.filter((b) =>
      b.summary.toLowerCase().includes(q) ||
      b.event_type.toLowerCase().includes(q) ||
      (b.agent?.toLowerCase().includes(q)) ||
      JSON.stringify(b.payload).toLowerCase().includes(q)
    );
  }, [latestState, searchQuery]);

  const toggleBlock = (id: string) => {
    setExpandedBlocks((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <>
      <PageHeader title="Security & Audit" subtitle="Cryptographic audit trail with semantic search." />

      {/* Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card title="Auth Mode" subtitle="Active authentication">
          <div className="flex items-center gap-2 mt-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">{String(liveStatus.auth_mode)}</span>
          </div>
        </Card>
        <Card title="TLS Status" subtitle="Transport security">
          <div className="flex items-center gap-2 mt-2">
            <Lock className="h-4 w-4 text-primary" />
            <StatusDot status={liveStatus.tls_status === "active" ? "ok" : "error"} />
            <span className="text-sm font-semibold text-foreground">{String(liveStatus.tls_status)}</span>
          </div>
        </Card>
        <Card title="Audit Chain" subtitle="Total blocks">
          <div className="flex items-center gap-2 mt-2">
            <Hash className="h-4 w-4 text-primary" />
            <span className="text-lg font-mono font-bold text-foreground">{String(liveStatus.total_blocks)}</span>
          </div>
        </Card>
        <Card title="Qdrant" subtitle="Vector index">
          <div className="flex items-center gap-2 mt-2">
            <Link2 className="h-4 w-4 text-primary" />
            <StatusDot status={liveStatus.qdrant_status === "connected" ? "ok" : "error"} />
            <span className="text-sm text-muted-foreground">{String(liveStatus.vectors_indexed)} vectors</span>
          </div>
        </Card>
      </div>

      {/* Semantic Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Semantic Audit Search — search the system's reasoning, mutations, and decisions..."
          className="pl-10 font-mono text-sm bg-card border-border"
        />
      </div>

      {/* Blockchain Ledger */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-foreground">Blockchain Ledger</h3>
          <span className="text-xs text-muted-foreground">{blocks.length} blocks</span>
        </div>
        {blocks.map((block) => {
          const isOpen = expandedBlocks.has(block.id);
          const colorClass = EVENT_COLORS[block.event_type] ?? "bg-muted text-muted-foreground border-border";
          return (
            <Collapsible key={block.id} open={isOpen} onOpenChange={() => toggleBlock(block.id)}>
              <CollapsibleTrigger className="w-full flex items-center gap-3 rounded-md border border-border bg-card px-4 py-2.5 hover:bg-muted/20 transition-colors text-left">
                <ChevronRight className={cn("h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform", isOpen && "rotate-90")} />
                <span className="font-mono text-[11px] text-muted-foreground shrink-0 w-24 truncate" title={block.hash}>{block.hash}</span>
                <Badge variant="outline" className={cn("text-[10px] font-mono shrink-0 border", colorClass)}>{block.event_type}</Badge>
                {block.agent && <Badge variant="secondary" className="text-[10px] shrink-0">{block.agent}</Badge>}
                <span className="text-xs text-foreground flex-1 truncate">{block.summary}</span>
                <span className="text-[10px] text-muted-foreground font-mono shrink-0">{new Date(block.timestamp).toLocaleTimeString()}</span>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="ml-8 mr-2 mt-1 mb-2 rounded-md border border-border overflow-hidden">
                  <JsonRenderer data={block.payload} defaultMode="tree" />
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
    </>
  );
}
