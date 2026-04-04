/**
 * Typed API client for the operation-dbus gateway.
 * All methods return typed data; the base URL is configurable.
 */
import type {
  HealthSnapshot,
  DbusService,
  Tool,
  Agent,
  Session,
  ChatMessage,
  LogEntry,
  ConfigSnapshot,
  LlmProvider,
} from "@/types/api";

const BASE_URL = "/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    throw new Error(`API ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

export const api = {
  // Health
  health: () => request<HealthSnapshot>("/health"),

  // D-Bus Services
  services: {
    list: () => request<DbusService[]>("/services"),
    get: (name: string) => request<DbusService>(`/services/${encodeURIComponent(name)}`),
    introspect: (name: string, path: string) =>
      request<unknown>(`/services/${encodeURIComponent(name)}/introspect?path=${encodeURIComponent(path)}`),
    call: (name: string, path: string, iface: string, method: string, args: unknown[] = []) =>
      request<unknown>(`/services/${encodeURIComponent(name)}/call`, {
        method: "POST",
        body: JSON.stringify({ path, interface: iface, method, args }),
      }),
  },

  // Tools
  tools: {
    list: () => request<Tool[]>("/tools"),
    get: (id: string) => request<Tool>(`/tools/${id}`),
    execute: (id: string, input: Record<string, unknown>) =>
      request<unknown>(`/tools/${id}/execute`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
  },

  // Agents
  agents: {
    list: () => request<Agent[]>("/agents"),
    get: (id: string) => request<Agent>(`/agents/${id}`),
    start: (id: string) =>
      request<void>(`/agents/${id}/start`, { method: "POST" }),
    stop: (id: string) =>
      request<void>(`/agents/${id}/stop`, { method: "POST" }),
  },

  // LLM
  llm: {
    providers: () => request<LlmProvider[]>("/llm/providers"),
  },

  // Sessions
  sessions: {
    list: () => request<Session[]>("/sessions"),
    get: (key: string) => request<Session>(`/sessions/${encodeURIComponent(key)}`),
    delete: (key: string) =>
      request<void>(`/sessions/${encodeURIComponent(key)}`, { method: "DELETE" }),
  },

  // Chat
  chat: {
    history: (sessionKey: string) =>
      request<ChatMessage[]>(`/chat/${encodeURIComponent(sessionKey)}/history`),
    send: (sessionKey: string, message: string) =>
      request<ChatMessage>(`/chat/${encodeURIComponent(sessionKey)}/send`, {
        method: "POST",
        body: JSON.stringify({ message }),
      }),
  },

  // Logs
  logs: {
    list: (opts?: { limit?: number; level?: string }) => {
      const params = new URLSearchParams();
      if (opts?.limit) params.set("limit", String(opts.limit));
      if (opts?.level) params.set("level", opts.level);
      return request<LogEntry[]>(`/logs?${params}`);
    },
  },

  // Config
  config: {
    get: () => request<ConfigSnapshot>("/config"),
    update: (config: Record<string, unknown>) =>
      request<void>("/config", {
        method: "PUT",
        body: JSON.stringify(config),
      }),
  },

  // State
  state: {
    get: () => request<Record<string, unknown>>("/state"),
  },
};
