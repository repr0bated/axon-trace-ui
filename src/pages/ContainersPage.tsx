import { useState, useMemo } from "react";
import { PageHeader, Card } from "@/components/shell/Primitives";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { SchemaRenderer } from "@/components/json/SchemaRenderer";
import { StatusDot } from "@/components/shell/Primitives";
import { useEventStore } from "@/stores/event-store";
import { Box, Cpu, HardDrive, MemoryStick, Network, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface IncusInstance {
  id: string;
  name: string;
  type: "system" | "user";
  status: "running" | "stopped" | "frozen" | "error";
  os: string;
  cpu_limit: number;
  memory_limit: string;
  disk_limit: string;
  ip?: string;
  created_at: string;
  config: Record<string, unknown>;
  devices: Record<string, unknown>;
}

const DEFAULT_CONTAINERS: IncusInstance[] = [
  { id: "ct-1", name: "dns-resolver", type: "system", status: "running", os: "Alpine 3.19", cpu_limit: 2, memory_limit: "512MB", disk_limit: "4GB", ip: "10.10.0.2", created_at: "2025-01-15T08:00:00Z", config: { "limits.cpu": 2, "limits.memory": "512MB", "security.nesting": false, "boot.autostart": true, "raw.idmap": "both 1000 1000" }, devices: { eth0: { type: "nic", network: "lxdbr0", name: "eth0" }, root: { type: "disk", pool: "default", path: "/" } } },
  { id: "ct-2", name: "privacy-router", type: "system", status: "running", os: "Debian 12", cpu_limit: 4, memory_limit: "1GB", disk_limit: "8GB", ip: "10.10.0.3", created_at: "2025-01-10T12:00:00Z", config: { "limits.cpu": 4, "limits.memory": "1GB", "security.privileged": false, "security.nesting": true }, devices: { eth0: { type: "nic", network: "lxdbr0" }, wg0: { type: "nic", nictype: "p2p" }, root: { type: "disk", pool: "fast-ssd", path: "/" } } },
  { id: "ct-3", name: "media-stack", type: "user", status: "running", os: "Ubuntu 24.04", cpu_limit: 8, memory_limit: "4GB", disk_limit: "100GB", ip: "10.10.0.10", created_at: "2025-02-01T00:00:00Z", config: { "limits.cpu": 8, "limits.memory": "4GB", "nvidia.runtime": true, "environment.PUID": "1000" }, devices: { root: { type: "disk", pool: "hdd-pool", path: "/" }, media: { type: "disk", source: "/mnt/media", path: "/media" }, gpu: { type: "gpu", gputype: "physical", pci: "0000:01:00.0" } } },
  { id: "ct-4", name: "dev-env", type: "user", status: "stopped", os: "Fedora 40", cpu_limit: 4, memory_limit: "2GB", disk_limit: "20GB", created_at: "2025-03-01T00:00:00Z", config: { "limits.cpu": 4, "limits.memory": "2GB", "security.nesting": true }, devices: { root: { type: "disk", pool: "default", path: "/" } } },
  { id: "ct-5", name: "monitoring", type: "system", status: "frozen", os: "Alpine 3.19", cpu_limit: 1, memory_limit: "256MB", disk_limit: "2GB", ip: "10.10.0.5", created_at: "2025-01-20T00:00:00Z", config: { "limits.cpu": 1, "limits.memory": "256MB" }, devices: { root: { type: "disk", pool: "default", path: "/" } } },
];

const statusColor: Record<string, "ok" | "warn" | "error" | "offline"> = {
  running: "ok", stopped: "offline", frozen: "warn", error: "error",
};

function configSchema(config: Record<string, unknown>): Record<string, unknown> {
  const props: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(config)) {
    if (typeof v === "boolean") props[k] = { type: "boolean", title: k };
    else if (typeof v === "number") props[k] = { type: "number", title: k };
    else props[k] = { type: "string", title: k };
  }
  return { type: "object", properties: props };
}

function devicesSchema(devices: Record<string, unknown>): Record<string, unknown> {
  const props: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(devices)) {
    if (typeof v === "object" && v !== null) {
      const inner: Record<string, unknown> = {};
      for (const [dk, dv] of Object.entries(v as Record<string, unknown>)) {
        inner[dk] = { type: typeof dv === "boolean" ? "boolean" : "string", title: dk };
      }
      props[k] = { type: "object", title: k, properties: inner };
    }
  }
  return { type: "object", properties: props };
}

export default function ContainersPage() {
  const { latestState } = useEventStore();
  const [editTarget, setEditTarget] = useState<IncusInstance | null>(null);
  const [localConfigs, setLocalConfigs] = useState<Record<string, Record<string, unknown>>>({});

  const containers = useMemo(() => {
    return DEFAULT_CONTAINERS.map((c) => {
      const live = latestState[`incus.${c.id}`] ?? latestState[`containers:${c.id}`];
      if (live && typeof live === "object") return { ...c, ...(live as Partial<IncusInstance>) };
      return c;
    });
  }, [latestState]);

  const system = containers.filter((c) => c.type === "system");
  const user = containers.filter((c) => c.type === "user");

  const renderGrid = (items: IncusInstance[]) => (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
      {items.map((ct) => (
        <div key={ct.id} className="rounded-lg border border-border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Box className="h-4 w-4 text-primary" />
              <span className="font-mono text-sm font-semibold text-foreground">{ct.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <StatusDot status={statusColor[ct.status] ?? "muted"} />
              <Badge variant="outline" className="text-[10px] font-mono">{ct.status}</Badge>
            </div>
          </div>

          <div className="text-xs text-muted-foreground">{ct.os}</div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground"><Cpu className="h-3 w-3" />{ct.cpu_limit} cores</div>
            <div className="flex items-center gap-1.5 text-muted-foreground"><MemoryStick className="h-3 w-3" />{ct.memory_limit}</div>
            <div className="flex items-center gap-1.5 text-muted-foreground"><HardDrive className="h-3 w-3" />{ct.disk_limit}</div>
          </div>

          {ct.ip && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Network className="h-3 w-3" /><span className="font-mono">{ct.ip}</span>
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <Badge variant="outline" className="text-[10px]">{Object.keys(ct.devices).length} devices</Badge>
            <button
              onClick={() => setEditTarget(ct)}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-xs font-medium hover:bg-muted/30 transition-colors text-muted-foreground hover:text-foreground"
            >
              <Settings2 className="h-3 w-3" /> Edit Config
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <>
      <PageHeader title="Incus Containers" subtitle="Manage system and user LXD/Incus instances." />

      <Tabs defaultValue="system" className="w-full">
        <TabsList>
          <TabsTrigger value="system">System ({system.length})</TabsTrigger>
          <TabsTrigger value="user">User ({user.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="system">{renderGrid(system)}</TabsContent>
        <TabsContent value="user">{renderGrid(user)}</TabsContent>
      </Tabs>

      <Sheet open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          {editTarget && (
            <>
              <SheetHeader>
                <SheetTitle className="font-mono">{editTarget.name}</SheetTitle>
                <SheetDescription>Container configuration via Generative UI</SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Config</h4>
                  <SchemaRenderer
                    schema={configSchema(editTarget.config) as any}
                    data={localConfigs[editTarget.id] ?? editTarget.config}
                    onChange={(val) => setLocalConfigs((p) => ({ ...p, [editTarget.id]: val as Record<string, unknown> }))}
                  />
                </div>
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Devices</h4>
                  <SchemaRenderer
                    schema={devicesSchema(editTarget.devices) as any}
                    data={editTarget.devices}
                    onChange={() => {}}
                  />
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
