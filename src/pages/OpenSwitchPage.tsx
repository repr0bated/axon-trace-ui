import { useState, useMemo } from "react";
import { PageHeader, Card } from "@/components/shell/Primitives";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { SchemaRenderer } from "@/components/json/SchemaRenderer";
import { StatusDot } from "@/components/shell/Primitives";
import { useEventStore } from "@/stores/event-store";
import { Network, Plus, Cable } from "lucide-react";

interface OvsBridge {
  id: string;
  name: string;
  datapath: string;
  status: "active" | "inactive";
  ports: { name: string; type: string; tag?: number; status: "up" | "down" }[];
}

const DEFAULT_BRIDGES: OvsBridge[] = [
  { id: "br-1", name: "br-lan", datapath: "system", status: "active", ports: [
    { name: "eth0", type: "internal", status: "up" },
    { name: "veth-ct1", type: "veth", tag: 10, status: "up" },
    { name: "veth-ct2", type: "veth", tag: 20, status: "up" },
  ] },
  { id: "br-2", name: "br-priv", datapath: "system", status: "active", ports: [
    { name: "wg0", type: "internal", status: "up" },
    { name: "tun0", type: "gre", status: "up" },
  ] },
  { id: "br-3", name: "br-mgmt", datapath: "system", status: "inactive", ports: [
    { name: "eth1", type: "internal", status: "down" },
  ] },
];

const bridgeSchema = {
  type: "object",
  properties: {
    name: { type: "string", title: "Bridge Name" },
    datapath: { type: "string", title: "Datapath Type", enum: ["system", "netdev"] },
    stp_enable: { type: "boolean", title: "STP Enabled" },
    fail_mode: { type: "string", title: "Fail Mode", enum: ["standalone", "secure"] },
    protocols: { type: "string", title: "OpenFlow Protocols" },
  },
};

const portSchema = {
  type: "object",
  properties: {
    name: { type: "string", title: "Port Name" },
    type: { type: "string", title: "Interface Type", enum: ["internal", "veth", "gre", "vxlan", "patch"] },
    tag: { type: "number", title: "VLAN Tag" },
    ofport: { type: "number", title: "OpenFlow Port Number" },
  },
};

export default function OpenSwitchPage() {
  const { latestState } = useEventStore();
  const [createDialog, setCreateDialog] = useState<"bridge" | "port" | null>(null);
  const [formData, setFormData] = useState<Record<string, unknown>>({});

  const bridges = useMemo(() => {
    return DEFAULT_BRIDGES.map((b) => {
      const live = latestState[`ovs.${b.id}`] ?? latestState[`ovs:${b.id}`];
      if (live && typeof live === "object") return { ...b, ...(live as Partial<OvsBridge>) };
      return b;
    });
  }, [latestState]);

  return (
    <>
      <PageHeader title="Open vSwitch" subtitle="OVS bridges, ports, and virtual networking." />

      <div className="flex gap-2 mb-4">
        <button onClick={() => { setCreateDialog("bridge"); setFormData({}); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-xs font-medium hover:bg-muted/30 transition-colors">
          <Plus className="h-3 w-3" /> Create Bridge
        </button>
        <button onClick={() => { setCreateDialog("port"); setFormData({}); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-xs font-medium hover:bg-muted/30 transition-colors">
          <Plus className="h-3 w-3" /> Create Port
        </button>
      </div>

      <div className="space-y-4">
        {bridges.map((br) => (
          <Card key={br.id} title={br.name} subtitle={`Datapath: ${br.datapath}`} actions={
            <div className="flex items-center gap-2">
              <StatusDot status={br.status === "active" ? "ok" : "offline"} />
              <Badge variant="outline" className="text-[10px] font-mono">{br.status}</Badge>
            </div>
          }>
            <div className="mt-3 space-y-2">
              {br.ports.map((port) => (
                <div key={port.name} className="flex items-center justify-between rounded-md border border-border px-3 py-2 bg-muted/10">
                  <div className="flex items-center gap-2">
                    <Cable className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-mono text-sm text-foreground">{port.name}</span>
                    <Badge variant="outline" className="text-[10px]">{port.type}</Badge>
                    {port.tag !== undefined && <Badge variant="secondary" className="text-[10px]">VLAN {port.tag}</Badge>}
                  </div>
                  <StatusDot status={port.status === "up" ? "ok" : "error"} />
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={!!createDialog} onOpenChange={(o) => !o && setCreateDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create {createDialog === "bridge" ? "Bridge" : "Port"}</DialogTitle>
            <DialogDescription>Fill the form to create a new OVS {createDialog}.</DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <SchemaRenderer
              schema={(createDialog === "bridge" ? bridgeSchema : portSchema) as any}
              data={formData}
              onChange={(v) => setFormData(v as Record<string, unknown>)}
            />
          </div>
          <div className="flex justify-end mt-4">
            <button className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">Create</button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
