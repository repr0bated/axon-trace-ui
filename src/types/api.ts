/**
 * Operation-DBUS API types.
 * Mirrors the Rust backend's data model for D-Bus services, agents, tools, etc.
 */

// ── D-Bus Core ──────────────────────────────────────────
export interface DbusService {
  name: string;
  uniqueName: string | null;
  pid: number | null;
  cmdline: string | null;
  bus: "system" | "session";
  isActivatable: boolean;
  interfaces: string[];
  objectPaths: string[];
}

export interface DbusObject {
  path: string;
  interfaces: string[];
  serviceId: string;
}

export interface DbusInterface {
  name: string;
  methods: DbusMethod[];
  signals: DbusSignal[];
  properties: DbusProperty[];
}

export interface DbusMethod {
  name: string;
  inSignature: string;
  outSignature: string;
  annotations: Record<string, string>;
}

export interface DbusSignal {
  name: string;
  signature: string;
}

export interface DbusProperty {
  name: string;
  signature: string;
  access: "read" | "write" | "readwrite";
  value?: unknown;
}

// ── Tools & Agents ──────────────────────────────────────
export interface Tool {
  id: string;
  name: string;
  description: string;
  inputSchema: JsonSchema;
  outputSchema?: JsonSchema;
  category: string;
  enabled: boolean;
  source: "builtin" | "dbus" | "mcp" | "custom";
}

export interface Agent {
  id: string;
  name: string;
  status: "running" | "idle" | "error" | "stopped";
  model: string;
  sessionKey: string;
  tools: string[];
  lastActive: string | null;
  errorMessage?: string;
}

export interface LlmProvider {
  id: string;
  name: string;
  model: string;
  endpoint: string;
  status: "connected" | "disconnected" | "error";
  tokenUsage: { prompt: number; completion: number; total: number };
}

// ── Sessions & Chat ─────────────────────────────────────
export interface Session {
  key: string;
  agentId: string;
  channel: string;
  createdAt: string;
  lastMessageAt: string | null;
  messageCount: number;
  tokenUsage: { prompt: number; completion: number };
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  timestamp: string;
  toolCalls?: ToolCall[];
  metadata?: Record<string, unknown>;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  result?: unknown;
  status: "pending" | "running" | "completed" | "error";
  duration?: number;
}

// ── System ──────────────────────────────────────────────
export interface HealthSnapshot {
  status: "healthy" | "degraded" | "error";
  uptimeMs: number;
  version: string;
  services: number;
  agents: number;
  activeSessions: number;
  memoryMb: number;
  cpuPercent: number;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: "trace" | "debug" | "info" | "warn" | "error";
  source: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export type LogLevel = LogEntry["level"];

export interface EventEntry {
  id: string;
  type: string;
  timestamp: string;
  data: unknown;
}

// ── Config ──────────────────────────────────────────────
export interface ConfigSnapshot {
  config: Record<string, unknown>;
  schema: JsonSchema;
  version: string;
  lastModified: string;
}

// ── JSON Schema ─────────────────────────────────────────
export interface JsonSchema {
  type?: string;
  title?: string;
  description?: string;
  properties?: Record<string, JsonSchema>;
  items?: JsonSchema;
  required?: string[];
  enum?: unknown[];
  default?: unknown;
  oneOf?: JsonSchema[];
  anyOf?: JsonSchema[];
  additionalProperties?: boolean | JsonSchema;
  format?: string;
  [key: string]: unknown;
}

// ── SSE Events ──────────────────────────────────────────
export type SseEventType =
  | "health"
  | "log"
  | "service_change"
  | "agent_status"
  | "chat_message"
  | "tool_call"
  | "state_update"
  | "system_stats";

export interface SseEvent<T = unknown> {
  type: SseEventType;
  timestamp: string;
  data: T;
}
