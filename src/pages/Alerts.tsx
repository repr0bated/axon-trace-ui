import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, CheckCircle, AlertTriangle, XCircle, Clock } from "lucide-react";

interface Alert {
  id: string;
  title: string;
  description: string;
  severity: "critical" | "warning" | "info";
  status: "open" | "acknowledged" | "resolved";
  node: string;
  createdAt: string;
}

const mockAlerts: Alert[] = [
  { id: "1", title: "Connection timeout", description: "Failed to connect to node-07 after 30s", severity: "critical", status: "open", node: "node-07", createdAt: "12 min ago" },
  { id: "2", title: "High memory usage", description: "Memory usage exceeded 90% threshold", severity: "warning", status: "open", node: "node-03", createdAt: "25 min ago" },
  { id: "3", title: "Service restart", description: "org.freedesktop.systemd1 was restarted", severity: "info", status: "open", node: "node-01", createdAt: "1 hour ago" },
  { id: "4", title: "D-Bus flood detected", description: "Abnormal message rate detected from :1.234", severity: "warning", status: "acknowledged", node: "node-02", createdAt: "2 hours ago" },
  { id: "5", title: "Node offline", description: "node-05 is not responding", severity: "critical", status: "acknowledged", node: "node-05", createdAt: "3 hours ago" },
  { id: "6", title: "Certificate expiring", description: "TLS certificate expires in 7 days", severity: "warning", status: "resolved", node: "node-01", createdAt: "1 day ago" },
];

const severityConfig = {
  critical: { icon: XCircle, color: "text-red-500", badge: "destructive" as const },
  warning: { icon: AlertTriangle, color: "text-yellow-500", badge: "secondary" as const },
  info: { icon: Bell, color: "text-blue-500", badge: "outline" as const },
};

const statusConfig = {
  open: { icon: Clock, label: "Open", color: "text-red-500" },
  acknowledged: { icon: AlertTriangle, label: "Acknowledged", color: "text-yellow-500" },
  resolved: { icon: CheckCircle, label: "Resolved", color: "text-green-500" },
};

const Alerts = () => {
  const openAlerts = mockAlerts.filter((a) => a.status === "open");
  const acknowledgedAlerts = mockAlerts.filter((a) => a.status === "acknowledged");
  const resolvedAlerts = mockAlerts.filter((a) => a.status === "resolved");

  const renderAlertTable = (alerts: Alert[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Severity</TableHead>
          <TableHead>Alert</TableHead>
          <TableHead>Node</TableHead>
          <TableHead>Created</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {alerts.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
              No alerts in this category
            </TableCell>
          </TableRow>
        ) : (
          alerts.map((alert) => {
            const SeverityIcon = severityConfig[alert.severity].icon;
            return (
              <TableRow key={alert.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <SeverityIcon className={`h-4 w-4 ${severityConfig[alert.severity].color}`} />
                    <Badge variant={severityConfig[alert.severity].badge}>
                      {alert.severity}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{alert.title}</p>
                    <p className="text-sm text-muted-foreground">{alert.description}</p>
                  </div>
                </TableCell>
                <TableCell>{alert.node}</TableCell>
                <TableCell className="text-muted-foreground">{alert.createdAt}</TableCell>
                <TableCell className="text-right">
                  {alert.status === "open" && (
                    <Button variant="outline" size="sm">
                      Acknowledge
                    </Button>
                  )}
                  {alert.status === "acknowledged" && (
                    <Button variant="outline" size="sm">
                      Resolve
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Alerts</h2>
            <p className="text-muted-foreground">System alerts and notifications</p>
          </div>
        </div>

        {/* Alert Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Open</CardTitle>
              <Clock className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{openAlerts.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Acknowledged</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{acknowledgedAlerts.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Resolved (24h)</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{resolvedAlerts.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Alert Tabs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              All Alerts
            </CardTitle>
            <CardDescription>Manage and respond to system alerts</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="open">
              <TabsList>
                <TabsTrigger value="open">
                  Open ({openAlerts.length})
                </TabsTrigger>
                <TabsTrigger value="acknowledged">
                  Acknowledged ({acknowledgedAlerts.length})
                </TabsTrigger>
                <TabsTrigger value="resolved">
                  Resolved ({resolvedAlerts.length})
                </TabsTrigger>
              </TabsList>
              <TabsContent value="open" className="mt-4">
                {renderAlertTable(openAlerts)}
              </TabsContent>
              <TabsContent value="acknowledged" className="mt-4">
                {renderAlertTable(acknowledgedAlerts)}
              </TabsContent>
              <TabsContent value="resolved" className="mt-4">
                {renderAlertTable(resolvedAlerts)}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Alerts;
