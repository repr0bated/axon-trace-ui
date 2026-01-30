import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity, Play, Pause, Filter, Download, Trash2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TraceEntry {
  id: string;
  timestamp: string;
  type: "method_call" | "method_return" | "signal" | "error";
  sender: string;
  destination: string;
  path: string;
  interface: string;
  member: string;
  serial: number;
}

const mockTraces: TraceEntry[] = [
  {
    id: "1",
    timestamp: "14:32:15.234",
    type: "method_call",
    sender: ":1.234",
    destination: "org.freedesktop.systemd1",
    path: "/org/freedesktop/systemd1",
    interface: "org.freedesktop.systemd1.Manager",
    member: "GetUnit",
    serial: 1234,
  },
  {
    id: "2",
    timestamp: "14:32:15.238",
    type: "method_return",
    sender: "org.freedesktop.systemd1",
    destination: ":1.234",
    path: "/org/freedesktop/systemd1",
    interface: "org.freedesktop.systemd1.Manager",
    member: "GetUnit",
    serial: 1235,
  },
  {
    id: "3",
    timestamp: "14:32:15.512",
    type: "signal",
    sender: "org.freedesktop.NetworkManager",
    destination: "(broadcast)",
    path: "/org/freedesktop/NetworkManager",
    interface: "org.freedesktop.NetworkManager",
    member: "StateChanged",
    serial: 892,
  },
  {
    id: "4",
    timestamp: "14:32:15.789",
    type: "method_call",
    sender: ":1.456",
    destination: "org.freedesktop.DBus",
    path: "/org/freedesktop/DBus",
    interface: "org.freedesktop.DBus",
    member: "GetNameOwner",
    serial: 2341,
  },
  {
    id: "5",
    timestamp: "14:32:15.892",
    type: "error",
    sender: "org.freedesktop.DBus",
    destination: ":1.456",
    path: "/org/freedesktop/DBus",
    interface: "org.freedesktop.DBus.Error",
    member: "NameHasNoOwner",
    serial: 2342,
  },
];

const typeColors: Record<string, string> = {
  method_call: "bg-blue-500",
  method_return: "bg-green-500",
  signal: "bg-purple-500",
  error: "bg-red-500",
};

const Trace = () => {
  const [isLive, setIsLive] = useState(true);
  const [traces] = useState(mockTraces);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Live Trace</h2>
            <p className="text-muted-foreground">Real-time D-Bus message stream</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={isLive ? "default" : "outline"}
              onClick={() => setIsLive(!isLive)}
            >
              {isLive ? (
                <>
                  <Pause className="mr-2 h-4 w-4" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Resume
                </>
              )}
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button variant="outline">
              <Trash2 className="mr-2 h-4 w-4" />
              Clear
            </Button>
          </div>
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
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Message type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="method_call">Method calls</SelectItem>
                  <SelectItem value="method_return">Method returns</SelectItem>
                  <SelectItem value="signal">Signals</SelectItem>
                  <SelectItem value="error">Errors</SelectItem>
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
                </SelectContent>
              </Select>
              <Input placeholder="Filter by path or interface..." className="max-w-xs" />
            </div>
          </CardContent>
        </Card>

        {/* Trace Stream */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Message Stream
                  {isLive && (
                    <Badge variant="outline" className="ml-2 animate-pulse">
                      <span className="mr-1 h-2 w-2 rounded-full bg-green-500 inline-block" />
                      Live
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>{traces.length} messages captured</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              <div className="divide-y">
                {traces.map((trace) => (
                  <div
                    key={trace.id}
                    className="flex items-start gap-4 px-6 py-3 hover:bg-muted/50 cursor-pointer"
                  >
                    <span className="text-xs font-mono text-muted-foreground w-24 flex-shrink-0">
                      {trace.timestamp}
                    </span>
                    <div
                      className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${typeColors[trace.type]}`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {trace.type.replace("_", " ")}
                        </Badge>
                        <span className="font-mono text-sm truncate">
                          {trace.interface}.{trace.member}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground font-mono">
                        <span>{trace.sender}</span>
                        <span className="mx-2">→</span>
                        <span>{trace.destination}</span>
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground font-mono truncate">
                        {trace.path}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">
                      #{trace.serial}
                    </span>
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

export default Trace;
