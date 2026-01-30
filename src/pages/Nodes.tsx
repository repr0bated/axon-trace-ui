import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Server, Search, RefreshCw, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const mockNodes = [
  { id: "1", hostname: "node-01", ip: "10.0.1.10", status: "online", services: 84, objects: 1523, lastSeen: "Just now" },
  { id: "2", hostname: "node-02", ip: "10.0.1.11", status: "online", services: 72, objects: 1248, lastSeen: "Just now" },
  { id: "3", hostname: "node-03", ip: "10.0.1.12", status: "warning", services: 91, objects: 1892, lastSeen: "2 min ago" },
  { id: "4", hostname: "node-04", ip: "10.0.1.13", status: "online", services: 68, objects: 1105, lastSeen: "Just now" },
  { id: "5", hostname: "node-05", ip: "10.0.1.14", status: "offline", services: 0, objects: 0, lastSeen: "15 min ago" },
  { id: "6", hostname: "node-06", ip: "10.0.1.15", status: "online", services: 79, objects: 1467, lastSeen: "Just now" },
  { id: "7", hostname: "node-07", ip: "10.0.1.16", status: "warning", services: 88, objects: 1734, lastSeen: "1 min ago" },
  { id: "8", hostname: "node-08", ip: "10.0.1.17", status: "online", services: 65, objects: 1089, lastSeen: "Just now" },
];

const Nodes = () => {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Nodes</h2>
            <p className="text-muted-foreground">Manage and monitor cluster nodes</p>
          </div>
          <Button>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  All Nodes
                </CardTitle>
                <CardDescription>{mockNodes.length} nodes in cluster</CardDescription>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search nodes..." className="pl-9" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hostname</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Services</TableHead>
                  <TableHead className="text-right">Objects</TableHead>
                  <TableHead>Last Seen</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockNodes.map((node) => (
                  <TableRow key={node.id}>
                    <TableCell className="font-medium">{node.hostname}</TableCell>
                    <TableCell className="font-mono text-sm">{node.ip}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          node.status === "online"
                            ? "outline"
                            : node.status === "warning"
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {node.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{node.services}</TableCell>
                    <TableCell className="text-right">{node.objects.toLocaleString()}</TableCell>
                    <TableCell className="text-muted-foreground">{node.lastSeen}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View Details</DropdownMenuItem>
                          <DropdownMenuItem>View Services</DropdownMenuItem>
                          <DropdownMenuItem>View Traces</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Nodes;
