import { useState, useMemo } from "react";
import { PageHeader, Card, Pill } from "@/components/shell/Primitives";
import { SchemaRenderer } from "@/components/json/SchemaRenderer";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Search, FlaskConical } from "lucide-react";

/* ── Skill type ────────────────────────────────────────── */

interface Skill {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  tags: string[];
  enabled: boolean;
  configSchema: Record<string, unknown>;
  configData: Record<string, unknown>;
}

/* ── Mock skills ───────────────────────────────────────── */

const INITIAL_SKILLS: Skill[] = [
  {
    id: "code-review",
    name: "Code Review",
    description: "Automated code review with configurable strictness, language awareness, and pattern matching against known anti-patterns.",
    version: "1.4.2",
    author: "openclaw-core",
    tags: ["analysis", "rust", "security"],
    enabled: true,
    configSchema: {
      type: "object",
      properties: {
        strictness: { type: "number", title: "Strictness", minimum: 0, maximum: 10 },
        language: { type: "string", title: "Primary Language", enum: ["rust", "typescript", "python", "go", "c"] },
        check_unsafe: { type: "boolean", title: "Flag Unsafe Blocks" },
        max_file_size_kb: { type: "number", title: "Max File Size (KB)" },
      },
    },
    configData: { strictness: 7, language: "rust", check_unsafe: true, max_file_size_kb: 500 },
  },
  {
    id: "deployment",
    name: "Deployment Orchestrator",
    description: "Manages multi-stage deployment pipelines with rollback, canary, and blue-green strategies.",
    version: "2.1.0",
    author: "openclaw-infra",
    tags: ["devops", "infrastructure", "ci-cd"],
    enabled: true,
    configSchema: {
      type: "object",
      properties: {
        target_env: { type: "string", title: "Target Environment", enum: ["development", "staging", "production"] },
        strategy: { type: "string", title: "Deploy Strategy", enum: ["rolling", "canary", "blue-green", "recreate"] },
        auto_rollback: { type: "boolean", title: "Auto-Rollback on Failure" },
        health_check_interval_s: { type: "number", title: "Health Check Interval (s)" },
      },
    },
    configData: { target_env: "staging", strategy: "canary", auto_rollback: true, health_check_interval_s: 15 },
  },
  {
    id: "threat-model",
    name: "Threat Modeling",
    description: "Generates STRIDE-based threat models from system architecture descriptions and D-Bus interface definitions.",
    version: "0.9.1",
    author: "openclaw-security",
    tags: ["security", "analysis", "dbus"],
    enabled: false,
    configSchema: {
      type: "object",
      properties: {
        framework: { type: "string", title: "Framework", enum: ["STRIDE", "PASTA", "LINDDUN"] },
        auto_generate: { type: "boolean", title: "Auto-Generate on Schema Change" },
        severity_threshold: { type: "string", title: "Min Severity", enum: ["low", "medium", "high", "critical"] },
        include_mitigations: { type: "boolean", title: "Include Mitigations" },
      },
    },
    configData: { framework: "STRIDE", auto_generate: false, severity_threshold: "medium", include_mitigations: true },
  },
  {
    id: "doc-gen",
    name: "Documentation Generator",
    description: "Produces structured API docs, README files, and architectural decision records from code and comments.",
    version: "1.2.0",
    author: "openclaw-core",
    tags: ["documentation", "api", "markdown"],
    enabled: true,
    configSchema: {
      type: "object",
      properties: {
        output_format: { type: "string", title: "Output Format", enum: ["markdown", "html", "asciidoc"] },
        include_examples: { type: "boolean", title: "Include Examples" },
        verbosity: { type: "number", title: "Verbosity", minimum: 1, maximum: 5 },
        auto_toc: { type: "boolean", title: "Auto Table of Contents" },
      },
    },
    configData: { output_format: "markdown", include_examples: true, verbosity: 3, auto_toc: true },
  },
  {
    id: "perf-profiler",
    name: "Performance Profiler",
    description: "Real-time CPU, memory, and I/O analysis for D-Bus services with flame graph integration.",
    version: "0.7.4",
    author: "openclaw-infra",
    tags: ["performance", "profiling", "dbus"],
    enabled: false,
    configSchema: {
      type: "object",
      properties: {
        sample_rate_hz: { type: "number", title: "Sample Rate (Hz)" },
        track_allocations: { type: "boolean", title: "Track Allocations" },
        flamegraph_depth: { type: "number", title: "Flame Graph Max Depth", minimum: 1, maximum: 128 },
        target_service: { type: "string", title: "Target Service" },
      },
    },
    configData: { sample_rate_hz: 100, track_allocations: false, flamegraph_depth: 64, target_service: "" },
  },
  {
    id: "context-linker",
    name: "Context Linker",
    description: "Cross-references conversation history with codebase symbols, issues, and prior decisions for richer context.",
    version: "1.0.3",
    author: "openclaw-memory",
    tags: ["memory", "context", "knowledge-graph"],
    enabled: true,
    configSchema: {
      type: "object",
      properties: {
        max_hops: { type: "number", title: "Max Graph Hops", minimum: 1, maximum: 10 },
        include_issues: { type: "boolean", title: "Link to Issues" },
        include_commits: { type: "boolean", title: "Link to Commits" },
        relevance_cutoff: { type: "number", title: "Relevance Cutoff", minimum: 0, maximum: 1 },
      },
    },
    configData: { max_hops: 3, include_issues: true, include_commits: true, relevance_cutoff: 0.6 },
  },
];

/* ── Component ─────────────────────────────────────────── */

export default function SkillsPage() {
  const [skills, setSkills] = useState<Skill[]>(INITIAL_SKILLS);
  const [selectedId, setSelectedId] = useState<string>(INITIAL_SKILLS[0].id);
  const [search, setSearch] = useState("");
  const [testOpen, setTestOpen] = useState(false);
  const [testInput, setTestInput] = useState("");
  const [testMessages, setTestMessages] = useState<{ role: "user" | "assistant"; text: string }[]>([]);

  const filtered = useMemo(
    () =>
      skills.filter(
        (s) =>
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          s.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
      ),
    [skills, search]
  );

  const selected = skills.find((s) => s.id === selectedId);

  const toggleEnabled = (id: string) => {
    setSkills((prev) => prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)));
  };

  const updateConfig = (id: string, data: unknown) => {
    setSkills((prev) =>
      prev.map((s) => (s.id === id ? { ...s, configData: data as Record<string, unknown> } : s))
    );
  };

  const handleTestSend = () => {
    if (!testInput.trim() || !selected) return;
    const userMsg = testInput.trim();
    setTestMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setTestInput("");
    setTimeout(() => {
      setTestMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: `[${selected.name}] Simulated response for: "${userMsg}"\n\nConfig: ${JSON.stringify(selected.configData, null, 2)}`,
        },
      ]);
    }, 600);
  };

  return (
    <>
      <PageHeader
        title="Cognitive Skills"
        subtitle="Browse, configure, and test domain-specific knowledge augmentations."
      />

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4 min-h-0">
        {/* ── Left: Skills Directory ── */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search skills…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs bg-[hsl(var(--bg-elevated))]"
            />
          </div>
          <div className="space-y-1 max-h-[calc(100vh-220px)] overflow-y-auto pr-1" style={{ scrollbarWidth: "thin" }}>
            {filtered.map((skill) => (
              <button
                key={skill.id}
                onClick={() => setSelectedId(skill.id)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  selectedId === skill.id
                    ? "border-primary/30 bg-primary/5"
                    : "border-transparent hover:bg-muted/30"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-foreground truncate">{skill.name}</span>
                  <Switch
                    checked={skill.enabled}
                    onCheckedChange={(e) => {
                      e && e; // prevent propagation handled by stopPropagation below
                      toggleEnabled(skill.id);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="shrink-0 scale-75"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{skill.description}</p>
                <div className="flex gap-1 mt-1.5 flex-wrap">
                  {skill.tags.slice(0, 3).map((t) => (
                    <Badge key={t} variant="secondary" className="text-[9px] px-1 py-0">
                      {t}
                    </Badge>
                  ))}
                </div>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-8">No skills match "{search}"</p>
            )}
          </div>
        </div>

        {/* ── Right: Skill Details ── */}
        {selected ? (
          <div className="space-y-4">
            <Card>
              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <h2 className="text-lg font-bold text-foreground">{selected.name}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">{selected.description}</p>
                </div>
                <Pill variant={selected.enabled ? "ok" : "default"}>
                  {selected.enabled ? "enabled" : "disabled"}
                </Pill>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="text-[10px]">
                  v{selected.version}
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  by {selected.author}
                </Badge>
                {selected.tags.map((t) => (
                  <Badge key={t} variant="secondary" className="text-[10px]">
                    {t}
                  </Badge>
                ))}
              </div>
            </Card>

            <Card title="Configuration">
              <div className="mt-2">
                <SchemaRenderer
                  schema={selected.configSchema}
                  data={selected.configData}
                  onChange={(d) => updateConfig(selected.id, d)}
                />
              </div>
            </Card>

            <button
              onClick={() => {
                setTestMessages([]);
                setTestOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-md border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
            >
              <FlaskConical className="h-4 w-4" />
              Test Skill
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center text-sm text-muted-foreground h-40">
            Select a skill to configure
          </div>
        )}
      </div>

      {/* ── Test Dialog ── */}
      <Dialog open={testOpen} onOpenChange={setTestOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-primary" />
              Test: {selected?.name}
            </DialogTitle>
            <DialogDescription>
              Chat with the LLM using this skill's current configuration.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-y-auto space-y-2 py-2 max-h-[40vh]">
            {testMessages.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-6">
                Send a message to test the "{selected?.name}" skill.
              </p>
            )}
            {testMessages.map((m, i) => (
              <div
                key={i}
                className={`p-2.5 rounded-lg text-xs whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-primary/10 text-foreground ml-8"
                    : "bg-muted/30 text-foreground mr-8 font-mono"
                }`}
              >
                {m.text}
              </div>
            ))}
          </div>
          <div className="flex gap-2 pt-2 border-t border-border">
            <Input
              placeholder="Test this skill…"
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleTestSend()}
              className="flex-1 h-8 text-xs"
            />
            <button
              onClick={handleTestSend}
              className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
            >
              Send
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
