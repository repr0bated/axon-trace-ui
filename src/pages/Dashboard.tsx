import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Server, Layers, Box, Activity, AlertTriangle, CheckCircle } from "lucide-react";

const stats = [
  { label: "Active Nodes", value: "12", icon: Server, change: "+2", trend: "up" },
  { label: "Services", value: "847", icon: Layers, change: "+15", trend: "up" },
  { label: "D-Bus Objects", value: "16,234", icon: Box, change: "+127", trend: "up" },
  { label: "Traces/sec", value: "1,247", icon: Activity, change: "-5%", trend: "down" },
];

const recentAlerts = [
  { id: 1, title: "High memory usage on node-03", severity: "warning", time: "2 min ago" },
  { id: 2, title: "Service org.freedesktop.systemd1 restarted", severity: "info", time: "5 min ago" },
  { id: 3, title: "Connection timeout to node-07", severity: "critical", time: "12 min ago" },
];

const nodeStatus = [
  { name: "node-01", status: "online", services: 84 },
  { name: "node-02", status: "online", services: 72 },
  { name: "node-03", status: "warning", services: 91 },
  { name: "node-04", status: "online", services: 68 },
  { name: "node-05", status: "offline", services: 0 },
];

export const Dashboard = () => {
  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className={`text-xs ${stat.trend === "up" ? "text-green-500" : "text-red-500"}`}>
                  {stat.change} from last hour
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Recent Alerts
              </CardTitle>
              <CardDescription>Latest system notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={
                          alert.severity === "critical"
                            ? "destructive"
                            : alert.severity === "warning"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {alert.severity}
                      </Badge>
                      <span className="text-sm">{alert.title}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{alert.time}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Node Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Node Status
              </CardTitle>
              <CardDescription>Cluster health overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {nodeStatus.map((node) => (
                  <div
                    key={node.name}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      {node.status === "online" ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : node.status === "warning" ? (
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      ) : (
                        <div className="h-4 w-4 rounded-full bg-red-500" />
                      )}
                      <span className="font-medium">{node.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">
                        {node.services} services
                      </span>
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
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
