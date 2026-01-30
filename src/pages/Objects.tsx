import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Box, Search, ChevronRight, Folder, FileCode } from "lucide-react";

interface TreeNode {
  name: string;
  path: string;
  children?: TreeNode[];
  interfaces?: string[];
}

const mockObjectTree: TreeNode[] = [
  {
    name: "org",
    path: "/org",
    children: [
      {
        name: "freedesktop",
        path: "/org/freedesktop",
        children: [
          {
            name: "systemd1",
            path: "/org/freedesktop/systemd1",
            interfaces: ["org.freedesktop.systemd1.Manager"],
            children: [
              { name: "unit", path: "/org/freedesktop/systemd1/unit", children: [] },
              { name: "job", path: "/org/freedesktop/systemd1/job", children: [] },
            ],
          },
          {
            name: "NetworkManager",
            path: "/org/freedesktop/NetworkManager",
            interfaces: ["org.freedesktop.NetworkManager"],
            children: [
              { name: "Devices", path: "/org/freedesktop/NetworkManager/Devices", children: [] },
              { name: "Settings", path: "/org/freedesktop/NetworkManager/Settings", children: [] },
            ],
          },
          {
            name: "UDisks2",
            path: "/org/freedesktop/UDisks2",
            interfaces: ["org.freedesktop.UDisks2.Manager"],
            children: [],
          },
        ],
      },
      {
        name: "bluez",
        path: "/org/bluez",
        interfaces: ["org.bluez.AgentManager1"],
        children: [],
      },
    ],
  },
];

const TreeItem = ({ node, depth = 0 }: { node: TreeNode; depth?: number }) => {
  const [isOpen, setIsOpen] = useState(depth < 2);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div>
      <div
        className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-muted cursor-pointer"
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => setIsOpen(!isOpen)}
      >
        {hasChildren ? (
          <ChevronRight
            className={`h-4 w-4 text-muted-foreground transition-transform ${
              isOpen ? "rotate-90" : ""
            }`}
          />
        ) : (
          <div className="w-4" />
        )}
        {hasChildren ? (
          <Folder className="h-4 w-4 text-primary" />
        ) : (
          <FileCode className="h-4 w-4 text-muted-foreground" />
        )}
        <span className="text-sm font-mono">{node.name}</span>
        {node.interfaces && (
          <span className="text-xs text-muted-foreground ml-2">
            ({node.interfaces.length} interface{node.interfaces.length > 1 ? "s" : ""})
          </span>
        )}
      </div>
      {isOpen && hasChildren && (
        <div>
          {node.children!.map((child) => (
            <TreeItem key={child.path} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

const Objects = () => {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">D-Bus Objects</h2>
            <p className="text-muted-foreground">Browse object hierarchy across services</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Object Tree */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Box className="h-4 w-4" />
                Object Tree
              </CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search paths..." className="pl-9" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                <div className="p-4">
                  {mockObjectTree.map((node) => (
                    <TreeItem key={node.path} node={node} />
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Object Details */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Object Details</CardTitle>
              <CardDescription>
                {selectedPath || "Select an object to view its interfaces and methods"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border bg-muted/50 p-8 text-center">
                <Box className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-sm text-muted-foreground">
                  Select an object from the tree to view its interfaces, methods, properties, and signals.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default Objects;
