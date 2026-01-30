import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Search, Download, Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LogEntry {
  id: string;
  timestamp: string;
  level: "debug" | "info" | "warn" | "error";
  source: string;
  message: string;
  node: string;
}

const mockLogs: LogEntry[] = [
  { id: "1", timestamp: "2024-01-15 14:32:15", level: "info", source: "systemd", message: "Started NetworkManager", node: "node-01" },
  { id: "2", timestamp: "2024-01-15 14:32:14", level: "debug", source: "dbus-broker", message: "Registered name org.freedesktop.NetworkManager", node: "node-01" },
  { id: "3", timestamp: "2024-01-15 14:32:12", level: "warn", source: "systemd", message: "Unit bluetooth.service entered failed state", node: "node-03" },
  { id: "4", timestamp: "2024-01-15 14:32:10", level: "error", source: "dbus-broker", message: "Connection timeout for :1.234", node: "node-02" },
  { id: "5", timestamp: "2024-01-15 14:32:08", level: "info", source: "udevd", message: "Successfully created device node /dev/sda1", node: "node-01" },
  { id: "6", timestamp: "2024-01-15 14:32:05", level: "debug", source: "polkitd", message: "Registered authentication agent", node: "node-04" },
  { id: "7", timestamp: "2024-01-15 14:32:02", level: "info", source: "avahi-daemon", message: "Service 'workstation' successfully established", node: "node-02" },
  { id: "8", timestamp: "2024-01-15 14:31:58", level: "warn", source: "systemd", message: "Failed to start docker.service: Unit not found", node: "node-05" },
];

const levelColors: Record<string, string> = {
  debug: "text-gray-500",
  info: "text-blue-500",
  warn: "text-yellow-500",
  error: "text-red-500",
};

const levelBadgeVariant: Record<string, "outline" | "secondary" | "destructive"> = {
  debug: "outline",
  info: "outline",
  warn: "secondary",
  error: "destructive",
};

const Logs = () => {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Logs</h2>
            <p className="text-muted-foreground">System and application logs</p>
          </div>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Logs
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filters:</span>
              </div>
              <Select defaultValue="all">
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All levels</SelectItem>
                  <SelectItem value="debug">Debug</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warn">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="all">
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Node" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All nodes</SelectItem>
                  <SelectItem value="node-01">node-01</SelectItem>
                  <SelectItem value="node-02">node-02</SelectItem>
                  <SelectItem value="node-03">node-03</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search logs..." className="pl-9" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Log Entries */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Log Entries
            </CardTitle>
            <CardDescription>{mockLogs.length} entries</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              <div className="divide-y">
                {mockLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-4 px-6 py-3 hover:bg-muted/50"
                  >
                    <span className="text-xs font-mono text-muted-foreground w-36 flex-shrink-0">
                      {log.timestamp}
                    </span>
                    <Badge
                      variant={levelBadgeVariant[log.level]}
                      className="w-16 justify-center text-xs"
                    >
                      {log.level.toUpperCase()}
                    </Badge>
                    <span className="text-xs text-muted-foreground w-20 truncate">
                      {log.node}
                    </span>
                    <span className="text-xs font-medium w-24 truncate">
                      {log.source}
                    </span>
                    <span className="text-sm flex-1">{log.message}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Logs;
