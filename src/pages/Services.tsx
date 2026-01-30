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
import { Layers, Search, Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const mockServices = [
  { id: "1", name: "org.freedesktop.systemd1", bus: "system", node: "node-01", pid: 1, objects: 423 },
  { id: "2", name: "org.freedesktop.NetworkManager", bus: "system", node: "node-01", pid: 892, objects: 156 },
  { id: "3", name: "org.freedesktop.UDisks2", bus: "system", node: "node-02", pid: 1045, objects: 89 },
  { id: "4", name: "org.freedesktop.DBus", bus: "system", node: "node-01", pid: 1, objects: 12 },
  { id: "5", name: "org.freedesktop.PolicyKit1", bus: "system", node: "node-03", pid: 1234, objects: 34 },
  { id: "6", name: "org.bluez", bus: "system", node: "node-02", pid: 2341, objects: 67 },
  { id: "7", name: "org.freedesktop.Avahi", bus: "system", node: "node-04", pid: 3421, objects: 45 },
  { id: "8", name: "org.freedesktop.ModemManager1", bus: "system", node: "node-01", pid: 4532, objects: 23 },
  { id: "9", name: "org.gnome.SessionManager", bus: "session", node: "node-03", pid: 5643, objects: 78 },
  { id: "10", name: "org.freedesktop.secrets", bus: "session", node: "node-02", pid: 6754, objects: 12 },
];

const Services = () => {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Services</h2>
            <p className="text-muted-foreground">D-Bus services across all nodes</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  All Services
                </CardTitle>
                <CardDescription>{mockServices.length} services discovered</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Search services..." className="pl-9" />
                </div>
                <Select defaultValue="all">
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Bus type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All buses</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                    <SelectItem value="session">Session</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service Name</TableHead>
                  <TableHead>Bus</TableHead>
                  <TableHead>Node</TableHead>
                  <TableHead className="text-right">PID</TableHead>
                  <TableHead className="text-right">Objects</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockServices.map((service) => (
                  <TableRow key={service.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-mono text-sm">{service.name}</TableCell>
                    <TableCell>
                      <Badge variant={service.bus === "system" ? "default" : "secondary"}>
                        {service.bus}
                      </Badge>
                    </TableCell>
                    <TableCell>{service.node}</TableCell>
                    <TableCell className="text-right font-mono">{service.pid}</TableCell>
                    <TableCell className="text-right">{service.objects}</TableCell>
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

export default Services;
