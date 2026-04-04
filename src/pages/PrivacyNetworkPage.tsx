import { useState, useCallback, useMemo } from "react";
import { PageHeader } from "@/components/shell/Primitives";
import {
  ReactFlow, Background, Controls, MiniMap,
  type Node, type Edge, type NodeProps, Handle, Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { SchemaRenderer } from "@/components/json/SchemaRenderer";
import { StatusDot } from "@/components/shell/Primitives";
import { useEventStore } from "@/stores/event-store";
import { cn } from "@/lib/utils";
import { Shield, Globe, Zap, Radio } from "lucide-react";

const OBF_LABELS = ["None", "Basic", "Pattern Hiding", "Advanced"] as const;

interface PNodeData {
  label: string;
  component: string;
  status: "online" | "degraded" | "offline";
  icon: typeof Shield;
  config: Record<string, unknown>;
  schema: Record<string, unknown>;
  obfuscation_level?: number;
  [key: string]: unknown;
}

function PrivacyNode({ data, selected }: NodeProps<Node<PNodeData>>) {
  const Icon = data.icon;
  const statusMap = { online: "ok", degraded: "warn", offline: "error" } as const;
  const busy = data.status === "degraded";

  return (
    <div className={cn(
      "rounded-lg border bg-card px-4 py-3 min-w-[160px] transition-all",
      selected ? "border-primary ring-1 ring-primary/30" : "border-border",
      busy && "animate-pulse shadow-[0_0_12px_hsl(var(--warning)/0.4)]"
    )}>
      <Handle type="target" position={Position.Left} className="!bg-primary !w-2 !h-2" />
      <Handle type="source" position={Position.Right} className="!bg-primary !w-2 !h-2" />
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">{data.label}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <StatusDot status={statusMap[data.status]} />
        <span className="text-[11px] text-muted-foreground font-mono">{data.component}</span>
      </div>
      {data.obfuscation_level !== undefined && (
        <Badge variant="outline" className="mt-2 text-[10px]">Obf: {OBF_LABELS[data.obfuscation_level]}</Badge>
      )}
    </div>
  );
}

const nodeTypes = { privacy: PrivacyNode };

const DEFAULT_NODES: Node<PNodeData>[] = [
  { id: "wg", type: "privacy", position: { x: 50, y: 150 }, data: { label: "WireGuard", component: "wg0", status: "online", icon: Shield, config: { listen_port: 51820, private_key: "••••••", peers: 3, mtu: 1420, keepalive: 25, dns: "10.10.0.2" }, schema: { type: "object", properties: { listen_port: { type: "number", title: "Listen Port", minimum: 1024, maximum: 65535 }, mtu: { type: "number", title: "MTU" }, keepalive: { type: "number", title: "Keepalive (s)" }, dns: { type: "string", title: "DNS Server" } } } } },
  { id: "xray1", type: "privacy", position: { x: 320, y: 80 }, data: { label: "XRay Inbound", component: "xray-in", status: "online", icon: Zap, obfuscation_level: 2, config: { protocol: "vless", port: 443, flow: "xtls-rprx-vision", obfuscation_level: 2, tls: { server_name: "example.com", fingerprint: "chrome" } }, schema: { type: "object", properties: { protocol: { type: "string", title: "Protocol", enum: ["vless", "vmess", "trojan"] }, port: { type: "number", title: "Port" }, flow: { type: "string", title: "Flow" }, obfuscation_level: { type: "number", title: "Obfuscation Level", minimum: 0, maximum: 3 } } } } },
  { id: "warp", type: "privacy", position: { x: 580, y: 150 }, data: { label: "Cloudflare WARP", component: "warp0", status: "online", icon: Globe, config: { mode: "proxy", endpoint: "engage.cloudflareclient.com:2408", mtu: 1280, reserved: [0, 0, 0] }, schema: { type: "object", properties: { mode: { type: "string", title: "Mode", enum: ["proxy", "tunnel", "warp+doh"] }, endpoint: { type: "string", title: "Endpoint" }, mtu: { type: "number", title: "MTU" } } } } },
  { id: "xray2", type: "privacy", position: { x: 840, y: 80 }, data: { label: "XRay Outbound", component: "xray-out", status: "degraded", icon: Radio, obfuscation_level: 3, config: { protocol: "freedom", tag: "direct", obfuscation_level: 3 }, schema: { type: "object", properties: { protocol: { type: "string", title: "Protocol", enum: ["freedom", "blackhole"] }, tag: { type: "string", title: "Tag" }, obfuscation_level: { type: "number", title: "Obfuscation Level", minimum: 0, maximum: 3 } } } } },
];

const DEFAULT_EDGES: Edge[] = [
  { id: "e-wg-x1", source: "wg", target: "xray1", animated: true, style: { stroke: "hsl(var(--primary))" } },
  { id: "e-x1-warp", source: "xray1", target: "warp", animated: true, style: { stroke: "hsl(var(--primary))" } },
  { id: "e-warp-x2", source: "warp", target: "xray2", animated: true, style: { stroke: "hsl(var(--warning))" } },
];

export default function PrivacyNetworkPage() {
  const { latestState } = useEventStore();
  const [selectedNode, setSelectedNode] = useState<Node<PNodeData> | null>(null);
  const [localConfig, setLocalConfig] = useState<Record<string, unknown>>({});

  const nodes = useMemo(() => {
    return DEFAULT_NODES.map((n) => {
      const live = latestState[`privacy.${n.id}`] ?? latestState[`network:${n.id}`];
      if (live && typeof live === "object") {
        return { ...n, data: { ...n.data, ...(live as Partial<PNodeData>) } };
      }
      return n;
    });
  }, [latestState]);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node as Node<PNodeData>);
    setLocalConfig((node as Node<PNodeData>).data.config);
  }, []);

  const handleObfChange = (val: number[]) => {
    if (!selectedNode) return;
    setLocalConfig((p) => ({ ...p, obfuscation_level: val[0] }));
  };

  return (
    <>
      <PageHeader title="Privacy Network" subtitle="Real-time topology of the privacy routing stack." />

      <div className="rounded-lg border border-border bg-card overflow-hidden" style={{ height: "calc(100vh - 180px)" }}>
        <ReactFlow
          nodes={nodes}
          edges={DEFAULT_EDGES}
          nodeTypes={nodeTypes}
          onNodeClick={onNodeClick}
          fitView
          proOptions={{ hideAttribution: true }}
          className="[&_.react-flow__background]:!bg-background"
        >
          <Background gap={20} size={1} className="opacity-30" />
          <Controls className="!bg-card !border-border !rounded-md [&_button]:!bg-card [&_button]:!border-border [&_button]:!text-foreground" />
          <MiniMap className="!bg-card !border-border" nodeColor="hsl(var(--primary))" />
        </ReactFlow>
      </div>

      <Sheet open={!!selectedNode} onOpenChange={(o) => !o && setSelectedNode(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          {selectedNode && (
            <>
              <SheetHeader>
                <SheetTitle className="font-mono">{selectedNode.data.label}</SheetTitle>
                <SheetDescription>{selectedNode.data.component} — click fields to edit</SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                {selectedNode.data.obfuscation_level !== undefined && (
                  <div className="space-y-3">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                      Obfuscation Level: {OBF_LABELS[(localConfig.obfuscation_level as number) ?? selectedNode.data.obfuscation_level]}
                    </Label>
                    <Slider
                      min={0} max={3} step={1}
                      value={[(localConfig.obfuscation_level as number) ?? selectedNode.data.obfuscation_level]}
                      onValueChange={handleObfChange}
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                      {OBF_LABELS.map((l) => <span key={l}>{l}</span>)}
                    </div>
                  </div>
                )}
                <SchemaRenderer
                  schema={selectedNode.data.schema as any}
                  data={localConfig}
                  onChange={(val) => setLocalConfig(val as Record<string, unknown>)}
                />
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
