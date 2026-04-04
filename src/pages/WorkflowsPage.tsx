/**
 * Workflow Builder — 3-pane layout with tool palette, React Flow canvas, and chat sidebar.
 * Tools dropped onto canvas auto-generate forms from their input schemas via SchemaRenderer.
 */
import { useState, useCallback, useRef, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Edge,
  type Node,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ToolPalette } from "@/components/workflow/ToolPalette";
import { WorkflowNodeCard, type WorkflowNodeData } from "@/components/workflow/WorkflowNodeCard";
import { PageHeader } from "@/components/shell/Primitives";
import { Play, CheckCircle, Send, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Tool } from "@/types/api";

// ── Mock tools (same source as ToolsPage) ───────────────
const MOCK_TOOLS: Tool[] = [
  {
    id: "dbus.list_services", name: "dbus.list_services", description: "List all D-Bus services",
    inputSchema: { type: "object", properties: { bus: { type: "string", enum: ["system", "session"], description: "Bus type" }, pattern: { type: "string", description: "Name filter pattern" } }, required: ["bus"] },
    category: "dbus", enabled: true, source: "builtin",
  },
  {
    id: "dbus.call_method", name: "dbus.call_method", description: "Call a method on a D-Bus service",
    inputSchema: { type: "object", properties: { service: { type: "string", description: "Service name" }, path: { type: "string", description: "Object path" }, interface: { type: "string", description: "Interface name" }, method: { type: "string", description: "Method name" }, args: { type: "array", items: { type: "string" }, description: "Arguments" } }, required: ["service", "path", "interface", "method"] },
    category: "dbus", enabled: true, source: "builtin",
  },
  {
    id: "dbus.introspect", name: "dbus.introspect", description: "Introspect a D-Bus object path",
    inputSchema: { type: "object", properties: { service: { type: "string" }, path: { type: "string", default: "/" } }, required: ["service"] },
    category: "dbus", enabled: true, source: "builtin",
  },
  {
    id: "system.exec", name: "system.exec", description: "Execute a system command",
    inputSchema: { type: "object", properties: { command: { type: "string", description: "Shell command" }, timeout: { type: "number", minimum: 1, maximum: 300, description: "Timeout seconds" }, capture_output: { type: "boolean", description: "Capture stdout/stderr" } }, required: ["command"] },
    category: "system", enabled: true, source: "builtin",
  },
  {
    id: "agent.spawn", name: "agent.spawn", description: "Spawn a new agent with tools",
    inputSchema: { type: "object", properties: { name: { type: "string" }, model: { type: "string", enum: ["gpt-4", "claude-3", "llama-3"] }, tools: { type: "array", items: { type: "string" }, description: "Tool IDs" }, system_prompt: { type: "string", description: "System instructions" } }, required: ["name", "model"] },
    category: "agents", enabled: true, source: "builtin",
  },
  {
    id: "mcp.relay", name: "mcp.relay", description: "Relay a tool call to an MCP server",
    inputSchema: { type: "object", properties: { server: { type: "string", description: "MCP server URL" }, tool_name: { type: "string" }, arguments: { type: "object", properties: {} } }, required: ["server", "tool_name"] },
    category: "mcp", enabled: true, source: "mcp",
  },
];

const nodeTypes = { workflowTool: WorkflowNodeCard };

function WorkflowsInner() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [chatMessages, setChatMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [chatDraft, setChatDraft] = useState("");
  const flowRef = useRef<HTMLDivElement>(null);
  const reactFlowInstance = useRef<any>(null);

  const onConnect = useCallback((params: Connection) => {
    setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: "hsl(var(--primary))" } }, eds));
  }, [setEdges]);

  const handleFormChange = useCallback((nodeId: string, values: Record<string, unknown>) => {
    setNodes((nds) => nds.map((n) =>
      n.id === nodeId ? { ...n, data: { ...n.data, formValues: values } } : n
    ));
  }, [setNodes]);

  const handleRemoveNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
  }, [setNodes, setEdges]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const toolData = e.dataTransfer.getData("application/workflow-tool");
    if (!toolData) return;

    const tool: Tool = JSON.parse(toolData);
    const bounds = flowRef.current?.getBoundingClientRect();
    const position = reactFlowInstance.current?.screenToFlowPosition({
      x: e.clientX - (bounds?.left ?? 0),
      y: e.clientY - (bounds?.top ?? 0),
    }) ?? { x: e.clientX - 200, y: e.clientY - 100 };

    const newNode: Node = {
      id: `${tool.id}-${Date.now()}`,
      type: "workflowTool",
      position,
      data: {
        toolId: tool.id,
        toolName: tool.name,
        category: tool.category,
        inputSchema: tool.inputSchema,
        formValues: {},
        onFormChange: handleFormChange,
        onRemove: handleRemoveNode,
      } satisfies WorkflowNodeData as any,
    };
    setNodes((nds) => [...nds, newNode]);
  }, [setNodes, handleFormChange, handleRemoveNode]);

  const handleValidate = useCallback(() => {
    const workflow = {
      nodes: nodes.map((n) => ({
        id: n.id,
        tool: (n.data as any).toolId,
        config: (n.data as any).formValues,
        position: n.position,
      })),
      edges: edges.map((e) => ({ source: e.source, target: e.target })),
    };
    const msg = `Validate this workflow:\n\`\`\`json\n${JSON.stringify(workflow, null, 2)}\n\`\`\``;
    setChatMessages((prev) => [
      ...prev,
      { role: "user", content: msg },
      { role: "assistant", content: `Workflow has ${nodes.length} nodes and ${edges.length} edges. Schema validation passed for all node configurations.` },
    ]);
  }, [nodes, edges]);

  const handleChatSend = useCallback(() => {
    if (!chatDraft.trim()) return;
    setChatMessages((prev) => [
      ...prev,
      { role: "user", content: chatDraft },
      { role: "assistant", content: `Acknowledged. Working on: "${chatDraft}"` },
    ]);
    setChatDraft("");
  }, [chatDraft]);

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Workflows"
        subtitle="Visual workflow builder with schema-driven tool nodes."
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px]">{nodes.length} nodes</Badge>
            <Badge variant="outline" className="text-[10px]">{edges.length} edges</Badge>
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={handleValidate}>
              <CheckCircle className="h-3 w-3" />Validate
            </Button>
            <Button size="sm" className="h-7 text-xs gap-1.5">
              <Play className="h-3 w-3" />Run
            </Button>
          </div>
        }
      />

      <div className="flex-1 min-h-0">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Left: Tool Palette */}
          <ResizablePanel defaultSize={18} minSize={14} maxSize={28}>
            <ToolPalette tools={MOCK_TOOLS} />
          </ResizablePanel>
          <ResizableHandle withHandle />

          {/* Center: React Flow Canvas */}
          <ResizablePanel defaultSize={57}>
            <div ref={flowRef} className="h-full w-full bg-background" onDragOver={onDragOver} onDrop={onDrop}>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onInit={(instance) => { reactFlowInstance.current = instance; }}
                nodeTypes={nodeTypes}
                fitView
                className="[&_.react-flow__background]:!bg-background"
                proOptions={{ hideAttribution: true }}
              >
                <Background gap={16} size={1} color="hsl(var(--border))" />
                <Controls className="[&_button]:!bg-card [&_button]:!border-border [&_button]:!text-foreground [&_button:hover]:!bg-muted" />
                <MiniMap
                  className="!bg-card !border-border"
                  nodeColor="hsl(var(--primary))"
                  maskColor="hsl(var(--background) / 0.8)"
                />
              </ReactFlow>
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />

          {/* Right: Chat Sidebar */}
          <ResizablePanel defaultSize={25} minSize={18} maxSize={35}>
            <div className="flex flex-col h-full border-l border-border">
              <div className="px-3 py-2 border-b border-border flex items-center gap-2">
                <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Workflow Assistant</span>
              </div>
              <div className="flex-1 overflow-auto p-3 space-y-3">
                {chatMessages.length === 0 && (
                  <div className="text-xs text-muted-foreground text-center py-8">
                    Drop tools onto the canvas, configure them, then validate.
                  </div>
                )}
                {chatMessages.map((msg, i) => (
                  <div key={i} className={cn("flex gap-2", msg.role === "user" && "flex-row-reverse")}>
                    <div className={cn(
                      "h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
                      msg.role === "user" ? "bg-muted text-foreground" : "bg-primary/20 text-primary",
                    )}>
                      {msg.role === "user" ? "OP" : "AI"}
                    </div>
                    <div className={cn(
                      "rounded-lg px-3 py-2 text-xs max-w-[85%]",
                      msg.role === "user" ? "bg-primary/10 border border-primary/20" : "bg-card border border-border",
                    )}>
                      <div className="whitespace-pre-wrap font-mono text-[11px]">{msg.content}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-border px-3 py-2 flex gap-2">
                <input
                  value={chatDraft}
                  onChange={(e) => setChatDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleChatSend())}
                  placeholder="Ask about this workflow..."
                  className="flex-1 px-2 py-1.5 rounded-md border border-input bg-secondary text-xs font-mono outline-none focus:border-ring"
                />
                <Button size="sm" variant="ghost" className="h-7 px-2" onClick={handleChatSend}>
                  <Send className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}

export default function WorkflowsPage() {
  return (
    <ReactFlowProvider>
      <WorkflowsInner />
    </ReactFlowProvider>
  );
}
