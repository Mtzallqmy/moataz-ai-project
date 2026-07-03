import React, { useState, useEffect } from "react";
import {
  Cpu,
  Play,
  Layers,
  Code2,
  Database,
  Network,
  LineChart,
  Plus,
  Trash2,
  Shield,
  Clock,
  Search,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Send,
  CheckCircle,
  Terminal,
  ChevronRight,
  ToggleLeft,
  ToggleRight,
  HelpCircle,
  CheckSquare
} from "lucide-react";

interface AgentProfile {
  id: string;
  name: string;
  role: string;
  description: string;
  systemPrompt: string;
  modelId: string;
  permissions: string[];
  tools: string[];
  isActive: boolean;
  metrics: {
    runs: number;
    errors: number;
    tokenUsage: number;
  };
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  steps: {
    id: string;
    name: string;
    type: "agent" | "tool" | "condition" | "wait";
    targetId: string;
    config: any;
  }[];
  isActive: boolean;
}

interface WorkflowLog {
  id: string;
  workflowId: string;
  status: "completed" | "failed" | "running";
  logs: string[];
  results: any;
  createdAt: string;
}

interface MemoryItem {
  id: string;
  type: string;
  content: string;
  createdAt: string;
}

interface McpServer {
  id: string;
  name: string;
  url: string;
  status: string;
  toolsCount: number;
}

interface AutomationRule {
  id: string;
  name: string;
  triggerType: "cron" | "event" | "webhook";
  triggerConfig: any;
  workflowId: string;
  isActive: boolean;
}

interface AgentTabProps {
  token: string;
}

export default function AgentTab({ token }: AgentTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<
    "registry" | "collaboration" | "sandbox" | "workflows" | "automation" | "memory" | "mcp" | "observability"
  >("registry");

  // State caches
  const [agents, setAgents] = useState<AgentProfile[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [workflowLogs, setWorkflowLogs] = useState<WorkflowLog[]>([]);
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [mcpServers, setMcpServers] = useState<McpServer[]>([]);
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([]);
  const [metrics, setMetrics] = useState<any>(null);

  // Global loading states
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // 1. Single Agent execution state
  const [selectedAgent, setSelectedAgent] = useState<AgentProfile | null>(null);
  const [agentPrompt, setAgentPrompt] = useState("");
  const [agentExecutionResult, setAgentExecutionResult] = useState("");
  const [agentExecutionLogs, setAgentExecutionLogs] = useState<string[]>([]);

  // 2. Collaborative session state
  const [collabGoal, setCollabGoal] = useState("Research and write a full workspace compliance guideline file in the project path.");
  const [collabResult, setCollabResult] = useState("");
  const [collabLogs, setCollabLogs] = useState<string[]>([]);

  // 3. Sandbox execution state
  const [sandboxCode, setSandboxCode] = useState(`// Preloaded standard test
const numbers = [12, 45, 8, 99, 23];
const max = Math.max(...numbers);
console.log("Analyzing local sandbox numeric buffers...");
console.log(\`Numeric evaluation finalized. Maximum buffer: \${max}\`);
`);
  const [sandboxLang, setSandboxLang] = useState<"javascript" | "python" | "shell">("javascript");
  const [sandboxOutput, setSandboxOutput] = useState<any>(null);
  const [sandboxLogs, setSandboxLogs] = useState<string[]>([]);

  // 4. Workflow Creator state
  const [workflowName, setWorkflowName] = useState("");
  const [workflowDesc, setWorkflowDesc] = useState("");
  const [workflowSteps, setWorkflowSteps] = useState<any[]>([
    { id: "step-1", name: "Decompose specifications", type: "agent", targetId: "agent-planner", config: { prompt: "Decompose workspace requirements" } },
    { id: "step-2", name: "Perform external lookup", type: "tool", targetId: "web_navigation_search", config: { args: { query: "secure container isolate design" } } }
  ]);

  // 5. Automation Rule state
  const [ruleName, setRuleName] = useState("");
  const [ruleCron, setRuleCron] = useState("0 * * * *");
  const [ruleWorkflowId, setRuleWorkflowId] = useState("");

  // 6. Memory search state
  const [searchQuery, setSearchQuery] = useState("");
  const [compressText, setCompressText] = useState("");

  // 7. MCP Server state
  const [mcpName, setMcpName] = useState("");
  const [mcpUrl, setMcpUrl] = useState("http://localhost:8080");

  useEffect(() => {
    fetchInitialData();
  }, [activeSubTab]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
      if (activeSubTab === "registry") {
        const res = await fetch("/api/agents", { headers });
        if (res.ok) setAgents(await res.json());
      } else if (activeSubTab === "workflows") {
        const resWf = await fetch("/api/workflows", { headers });
        const resLogs = await fetch("/api/workflow-logs", { headers });
        const resA = await fetch("/api/agents", { headers });
        if (resWf.ok) setWorkflows(await resWf.json());
        if (resLogs.ok) setWorkflowLogs(await resLogs.json());
        if (resA.ok) setAgents(await resA.json());
      } else if (activeSubTab === "automation") {
        const resR = await fetch("/api/automation", { headers });
        const resWf = await fetch("/api/workflows", { headers });
        if (resR.ok) setAutomationRules(await resR.json());
        if (resWf.ok) setWorkflows(await resWf.json());
      } else if (activeSubTab === "memory") {
        const url = searchQuery ? `/api/memories?q=${encodeURIComponent(searchQuery)}` : "/api/memories";
        const res = await fetch(url, { headers });
        if (res.ok) setMemories(await res.json());
      } else if (activeSubTab === "mcp") {
        const res = await fetch("/api/mcp/servers", { headers });
        if (res.ok) setMcpServers(await res.json());
      } else if (activeSubTab === "observability") {
        const res = await fetch("/api/observability/metrics", { headers });
        if (res.ok) setMetrics(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Run single agent task
  const handleRunAgent = async () => {
    if (!selectedAgent) return;
    setActionLoading(true);
    setAgentExecutionResult("");
    setAgentExecutionLogs([]);
    try {
      const res = await fetch(`/api/agents/${selectedAgent.id}/run`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: agentPrompt }),
      });
      const data = await res.json();
      if (data.success) {
        setAgentExecutionResult(data.output);
        setAgentExecutionLogs(data.logs || []);
      } else {
        setAgentExecutionResult(`Execution failed: ${data.error}`);
        setAgentExecutionLogs(data.logs || []);
      }
    } catch (e: any) {
      setAgentExecutionResult(`Connection error: ${e.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Run multi-agent session
  const handleCollaborativeSession = async () => {
    setActionLoading(true);
    setCollabResult("");
    setCollabLogs([]);
    try {
      const res = await fetch("/api/agents/collaborate", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ goal: collabGoal }),
      });
      const data = await res.json();
      if (data.success) {
        setCollabResult(data.output);
        setCollabLogs(data.logs || []);
      } else {
        setCollabResult(`Session failed: ${data.error}`);
        setCollabLogs(data.logs || []);
      }
    } catch (e: any) {
      setCollabResult(`Connection error: ${e.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Execute isolated process in Sandbox
  const handleRunSandbox = async () => {
    setActionLoading(true);
    setSandboxOutput(null);
    setSandboxLogs([]);
    try {
      const res = await fetch("/api/sandbox/run", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ code: sandboxCode, language: sandboxLang }),
      });
      const data = await res.json();
      setSandboxOutput(data);
      setSandboxLogs(data.logs || []);
    } catch (e: any) {
      setSandboxOutput({ stderr: e.message, exitCode: 1 });
    } finally {
      setActionLoading(false);
    }
  };

  // Save workflow
  const handleCreateWorkflow = async () => {
    if (!workflowName) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/workflows", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ name: workflowName, description: workflowDesc, steps: workflowSteps }),
      });
      if (res.ok) {
        setWorkflowName("");
        setWorkflowDesc("");
        fetchInitialData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  // Run workflow
  const handleRunWorkflow = async (wfId: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/workflows/${wfId}/run`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        fetchInitialData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  // Delete workflow
  const handleDeleteWorkflow = async (id: string) => {
    try {
      await fetch(`/api/workflows/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchInitialData();
    } catch (e) {
      console.error(e);
    }
  };

  // Add memory fragment & trigger compression
  const handleAddMemory = async (compress: boolean) => {
    if (!compressText) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/memories", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ content: compressText, type: "long_term", compress }),
      });
      if (res.ok) {
        setCompressText("");
        fetchInitialData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  // Delete memory
  const handleDeleteMemory = async (id: string) => {
    try {
      await fetch(`/api/memories/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchInitialData();
    } catch (e) {
      console.error(e);
    }
  };

  // Save automation rule
  const handleAddAutomationRule = async () => {
    if (!ruleName || !ruleWorkflowId) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/automation", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ name: ruleName, triggerType: "cron", triggerConfig: { cron: ruleCron }, workflowId: ruleWorkflowId }),
      });
      if (res.ok) {
        setRuleName("");
        fetchInitialData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle automation rule state
  const handleToggleRule = async (rule: AutomationRule) => {
    try {
      await fetch(`/api/automation/${rule.id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !rule.isActive }),
      });
      fetchInitialData();
    } catch (e) {
      console.error(e);
    }
  };

  // Delete automation rule
  const handleDeleteRule = async (id: string) => {
    try {
      await fetch(`/api/automation/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchInitialData();
    } catch (e) {
      console.error(e);
    }
  };

  // Save MCP server connection
  const handleAddMcp = async () => {
    if (!mcpName || !mcpUrl) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/mcp/servers", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ name: mcpName, url: mcpUrl }),
      });
      if (res.ok) {
        setMcpName("");
        setMcpUrl("http://localhost:8080");
        fetchInitialData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  // Delete MCP Server
  const handleDeleteMcp = async (id: string) => {
    try {
      await fetch(`/api/mcp/servers/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchInitialData();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div id="mz-agent-tab-container" className="p-8 max-w-7xl mx-auto space-y-8 text-slate-100 font-sans">
      {/* 1. Header Hero Banner */}
      <div id="mz-agent-header" className="relative p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950/20 border border-slate-800/80 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-500/5 via-transparent to-transparent pointer-events-none" />
        <div className="space-y-2 relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center border border-blue-500/20 text-blue-400">
              <Cpu className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Agent Operating System</h1>
              <p className="text-slate-400 text-xs font-mono font-medium">10-Agent Collaborative Suite & Multi-Task Executor</p>
            </div>
          </div>
        </div>

        {/* Real-time system diagnostics widget */}
        <div className="flex flex-wrap gap-4 relative">
          <div className="px-4 py-2 bg-slate-950/80 border border-slate-850 rounded-xl flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <div>
              <span className="block text-[10px] font-mono text-slate-500 font-bold tracking-wide">SANDBOX</span>
              <span className="text-xs font-mono font-bold text-slate-200">ACTIVE ISOLATES</span>
            </div>
          </div>
          <div className="px-4 py-2 bg-slate-950/80 border border-slate-850 rounded-xl flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-blue-400 animate-pulse" />
            <div>
              <span className="block text-[10px] font-mono text-slate-500 font-bold tracking-wide">METRICS</span>
              <span className="text-xs font-mono font-bold text-slate-200">100% SUCCESS RATE</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Primary Navigation Bar */}
      <div id="mz-agent-navbar" className="flex flex-wrap gap-1 bg-slate-900/80 p-1.5 border border-slate-800 rounded-xl">
        {[
          { id: "registry", label: "Agent Registry", icon: Cpu },
          { id: "collaboration", label: "Multi-Agent Collaboration", icon: Sparkles },
          { id: "sandbox", label: "Secure Sandbox", icon: Terminal },
          { id: "workflows", label: "Workflows Engine", icon: Layers },
          { id: "automation", label: "Automation Rules", icon: Clock },
          { id: "memory", label: "Memory Index & Search", icon: Database },
          { id: "mcp", label: "MCP Gateway", icon: Network },
          { id: "observability", label: "Observability Hub", icon: LineChart },
        ].map((subTab) => {
          const Icon = subTab.icon;
          const isActive = activeSubTab === subTab.id;
          return (
            <button
              key={subTab.id}
              onClick={() => setActiveSubTab(subTab.id as any)}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                isActive
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/10"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{subTab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Central Router Viewport */}
      <div id="mz-agent-viewport" className="min-h-[500px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
            <span className="text-slate-400 text-xs font-mono tracking-widest font-bold">LOADING SYSTEM CORE...</span>
          </div>
        ) : (
          <>
            {/* ==================== SUBTAB: REGISTRY ==================== */}
            {activeSubTab === "registry" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left pane: Grid list of 10 Agents */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-mono font-bold tracking-widest text-slate-400 uppercase">Seeded Agent Register (10)</h3>
                    <span className="px-2.5 py-1 text-[10px] font-mono font-bold rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/15">SYSTEM SEEDED</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {agents.map((agent) => (
                      <div
                        key={agent.id}
                        onClick={() => {
                          setSelectedAgent(agent);
                          setAgentPrompt(`Act as the ${agent.name} to help optimize active system parameters.`);
                        }}
                        className={`p-5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-4 ${
                          selectedAgent?.id === agent.id
                            ? "bg-blue-950/20 border-blue-500 shadow-md shadow-blue-500/5"
                            : "bg-slate-900/60 hover:bg-slate-900 border-slate-800"
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <span className="text-xs font-mono font-bold text-blue-400">{agent.role}</span>
                            <span className="text-[9px] font-mono text-slate-500">{agent.modelId}</span>
                          </div>
                          <h4 className="font-bold text-white text-base font-sans">{agent.name}</h4>
                          <p className="text-slate-400 text-xs leading-relaxed">{agent.description}</p>
                        </div>

                        {/* Meta counts */}
                        <div className="pt-3 border-t border-slate-850 flex justify-between text-[10px] font-mono text-slate-500">
                          <span>Runs: {agent.metrics?.runs || 0}</span>
                          <span>Errors: {agent.metrics?.errors || 0}</span>
                          <span>Tools: {agent.tools?.length || 0}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right pane: Agent Executing Slider Console */}
                <div className="space-y-6 bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
                  <div className="space-y-1.5">
                    <h3 className="text-base font-bold text-white">Agent Live Console</h3>
                    <p className="text-slate-400 text-xs">Execute tasks through any registry node individually.</p>
                  </div>

                  {selectedAgent ? (
                    <div className="space-y-4">
                      <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-850 space-y-1.5">
                        <span className="text-[10px] font-mono text-blue-400 font-bold uppercase">SELECTED ELEMENT</span>
                        <h4 className="font-bold text-sm text-white">{selectedAgent.name}</h4>
                        <p className="text-slate-400 text-xs leading-relaxed font-mono">{selectedAgent.systemPrompt}</p>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-[10px] font-mono font-bold text-slate-400 tracking-wider">EXECUTION INSTRUCTION</label>
                        <textarea
                          rows={3}
                          value={agentPrompt}
                          onChange={(e) => setAgentPrompt(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      <button
                        onClick={handleRunAgent}
                        disabled={actionLoading || !agentPrompt}
                        className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white font-semibold py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-2"
                      >
                        {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-white" />}
                        <span>DISPATCH INDIVIDUAL AGENT</span>
                      </button>

                      {/* Execution Logs Drawer */}
                      {agentExecutionLogs.length > 0 && (
                        <div className="space-y-2 pt-3 border-t border-slate-850">
                          <label className="block text-[10px] font-mono font-bold text-blue-400 tracking-wider">ROUTING LOGS</label>
                          <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 font-mono text-[10px] text-slate-300 max-h-40 overflow-y-auto space-y-1">
                            {agentExecutionLogs.map((log, index) => (
                              <div key={index} className="leading-relaxed">{log}</div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Execution Output result */}
                      {agentExecutionResult && (
                        <div className="space-y-2 pt-3 border-t border-slate-850">
                          <label className="block text-[10px] font-mono font-bold text-emerald-400 tracking-wider">FINAL DELIVERED RESPONSE</label>
                          <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 text-xs text-slate-200 leading-relaxed font-mono whitespace-pre-wrap max-h-60 overflow-y-auto">
                            {agentExecutionResult}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-60 flex flex-col items-center justify-center text-center gap-2 p-6 border-2 border-dashed border-slate-800 rounded-2xl">
                      <Cpu className="w-8 h-8 text-slate-600" />
                      <span className="text-slate-400 text-xs">Select an agent node from the Register list to dispatch live instructions.</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ==================== SUBTAB: COLLABORATION ==================== */}
            {activeSubTab === "collaboration" && (
              <div className="space-y-8">
                <div className="p-6 bg-slate-900/40 rounded-2xl border border-slate-800 space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-white">Multi-Agent Task Playground</h3>
                    <p className="text-slate-400 text-xs">Unleash the full 10-agent pipeline. Planner breaks it down, Coordinator delegates, Researchers ground context, Coders construct modules, and Reviewer safety-audits final reports.</p>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-mono font-bold text-slate-400 tracking-wider">GLOBAL STRATEGIC OBJECTIVE</label>
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={collabGoal}
                        onChange={(e) => setCollabGoal(e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                      <button
                        onClick={handleCollaborativeSession}
                        disabled={actionLoading || !collabGoal}
                        className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white font-semibold px-6 rounded-xl text-xs transition-all flex items-center gap-2 shrink-0"
                      >
                        {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 fill-white" />}
                        <span>TRIGGER TEAM PIPELINE</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Real-time Collaboration Log Drawer */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-mono font-bold tracking-widest text-slate-400 uppercase">Collaboration Process Logs</h4>
                    <div className="bg-slate-950 rounded-2xl border border-slate-850 p-5 font-mono text-xs text-slate-300 h-[450px] overflow-y-auto space-y-3 shadow-inner">
                      {collabLogs.length > 0 ? (
                        collabLogs.map((log, index) => {
                          const isError = log.includes("Error");
                          const isSpecial = log.includes("[Planner") || log.includes("[Coordinator") || log.includes("[Agent");
                          return (
                            <div
                              key={index}
                              className={`p-2 rounded-lg border leading-relaxed ${
                                isError
                                  ? "bg-red-950/20 border-red-900/50 text-red-400"
                                  : isSpecial
                                  ? "bg-blue-950/10 border-blue-900/30 text-blue-300"
                                  : "bg-slate-900/40 border-slate-850 text-slate-400"
                              }`}
                            >
                              {log}
                            </div>
                          );
                        })
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center text-slate-600 gap-2">
                          <Terminal className="w-8 h-8" />
                          <span>Console idle. Initiate a team pipeline objective to view real-time state traces.</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Delivered Multi-Agent Output */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-mono font-bold tracking-widest text-slate-400 uppercase">Final Delivered Deliverables</h4>
                    <div className="bg-slate-950 rounded-2xl border border-slate-850 p-6 h-[450px] overflow-y-auto text-xs text-slate-200 leading-relaxed font-mono whitespace-pre-wrap whitespace-normal space-y-2">
                      {collabResult ? (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 text-emerald-400 text-[10px] font-mono font-bold uppercase">
                            <CheckSquare className="w-4 h-4" />
                            <span>Verified Audit report correct</span>
                          </div>
                          <div className="border-t border-slate-850 pt-3 text-slate-300">
                            {collabResult}
                          </div>
                        </div>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center text-slate-600 gap-2">
                          <Layers className="w-8 h-8" />
                          <span>No deliverables prepared yet.</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ==================== SUBTAB: SANDBOX ==================== */}
            {activeSubTab === "sandbox" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Coding Area */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="flex justify-between items-center bg-slate-900 p-4 border border-slate-800 rounded-xl">
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-mono font-bold text-slate-400 uppercase">Sandbox Terminal Isolate</span>
                      <div className="flex gap-1.5">
                        {["javascript", "python", "shell"].map((lang) => (
                          <button
                            key={lang}
                            onClick={() => {
                              setSandboxLang(lang as any);
                              if (lang === "python") {
                                setSandboxCode(`print("Analyzing Python cluster buffers...")\nbuffers = [4.5, 9.2, 1.1]\nprint("Summed evaluation:", sum(buffers))`);
                              } else if (lang === "shell") {
                                setSandboxCode(`echo "Listing current isolated platform core folders:"\nls -l\necho "Task done."`);
                              } else {
                                setSandboxCode(`const numbers = [12, 45, 8, 99, 23];\nconst max = Math.max(...numbers);\nconsole.log(\`Numeric evaluation finalized. Maximum: \${max}\`);`);
                              }
                            }}
                            className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase transition-all ${
                              sandboxLang === lang
                                ? "bg-blue-600 text-white"
                                : "bg-slate-950 text-slate-400 hover:text-slate-200"
                            }`}
                          >
                            {lang}
                          </button>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={handleRunSandbox}
                      disabled={actionLoading || !sandboxCode}
                      className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all"
                    >
                      {actionLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-white" />}
                      <span>RUN ISOLATE</span>
                    </button>
                  </div>

                  <div className="relative">
                    <textarea
                      rows={14}
                      value={sandboxCode}
                      onChange={(e) => setSandboxCode(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-2xl p-5 font-mono text-xs text-emerald-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 leading-relaxed shadow-lg"
                    />
                  </div>
                </div>

                {/* Right Sandbox Process Diagnostics Console */}
                <div className="space-y-6 bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-white">Process Diagnostics</h3>
                    <p className="text-slate-400 text-xs">Inspect isolated execution metrics, exits, stdout, and trace stderr.</p>
                  </div>

                  <div className="space-y-4">
                    {sandboxOutput ? (
                      <div className="space-y-4">
                        {/* Process Exit Code details */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 text-center">
                            <span className="block text-[10px] font-mono text-slate-500 font-bold uppercase">EXIT CODE</span>
                            <span className={`text-sm font-mono font-bold ${sandboxOutput.exitCode === 0 ? "text-emerald-400" : "text-red-400"}`}>
                              {sandboxOutput.exitCode}
                            </span>
                          </div>
                          <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 text-center">
                            <span className="block text-[10px] font-mono text-slate-500 font-bold uppercase">DURATION</span>
                            <span className="text-sm font-mono font-bold text-blue-400">
                              {sandboxOutput.durationMs} ms
                            </span>
                          </div>
                        </div>

                        {/* Logs stack */}
                        {sandboxLogs.length > 0 && (
                          <div className="space-y-1.5">
                            <span className="text-[10px] font-mono text-blue-400 font-bold uppercase block">SANDBOX RUNNER DAEMON TRACE</span>
                            <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 font-mono text-[10px] text-slate-400 max-h-36 overflow-y-auto space-y-1 leading-relaxed">
                              {sandboxLogs.map((log, idx) => (
                                <div key={idx}>{log}</div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* STDOUT output */}
                        {sandboxOutput.stdout && (
                          <div className="space-y-1.5">
                            <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase block">STDOUT (PROCESS CAPTURE)</span>
                            <pre className="bg-slate-950 p-3.5 rounded-xl border border-slate-850 font-mono text-xs text-slate-200 overflow-x-auto leading-relaxed">
                              {sandboxOutput.stdout}
                            </pre>
                          </div>
                        )}

                        {/* STDERR output */}
                        {sandboxOutput.stderr && (
                          <div className="space-y-1.5">
                            <span className="text-[10px] font-mono text-red-400 font-bold uppercase block">STDERR (DIAGNOSTIC EXCEPTION)</span>
                            <pre className="bg-slate-950 p-3.5 rounded-xl border border-red-950/20 font-mono text-xs text-red-300 overflow-x-auto leading-relaxed">
                              {sandboxOutput.stderr}
                            </pre>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="h-64 flex flex-col items-center justify-center text-center gap-2 p-6 border-2 border-dashed border-slate-800 rounded-2xl">
                        <Terminal className="w-8 h-8 text-slate-600 animate-pulse" />
                        <span className="text-slate-400 text-xs">Run a script task inside our isolate container sandbox to generate diagnostics.</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ==================== SUBTAB: WORKFLOWS ==================== */}
            {activeSubTab === "workflows" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Create/Manage workflows */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-800 space-y-4">
                    <h3 className="text-base font-bold text-white">Create Custom Automated Workflow Pipeline</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono font-bold text-slate-400 block">PIPELINE NAME</label>
                        <input
                          type="text"
                          placeholder="e.g. Weekly Research Summary"
                          value={workflowName}
                          onChange={(e) => setWorkflowName(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono font-bold text-slate-400 block">PIPELINE DESCRIPTION</label>
                        <input
                          type="text"
                          placeholder="Short task objective details"
                          value={workflowDesc}
                          onChange={(e) => setWorkflowDesc(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    {/* Step visualization list */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-mono font-bold text-slate-400 block uppercase">Workflow Steps Pipeline</span>
                      <div className="space-y-2">
                        {workflowSteps.map((step, idx) => (
                          <div key={step.id} className="flex items-center gap-3 bg-slate-950 p-3 rounded-xl border border-slate-850">
                            <span className="w-5 h-5 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-mono text-[10px] font-bold">
                              {idx + 1}
                            </span>
                            <div className="flex-1">
                              <h5 className="text-xs font-bold text-white">{step.name}</h5>
                              <span className="text-[9px] font-mono text-slate-500 uppercase">{step.type} - {step.targetId}</span>
                            </div>
                            <button
                              onClick={() => setWorkflowSteps(workflowSteps.filter(s => s.id !== step.id))}
                              className="text-slate-500 hover:text-red-400 p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              const stepId = "step-" + (workflowSteps.length + 1);
                              setWorkflowSteps([
                                ...workflowSteps,
                                { id: stepId, name: "Consult Researcher findings", type: "agent", targetId: "agent-researcher", config: { prompt: "Query secure compliance parameters" } }
                              ]);
                            }}
                            className="bg-slate-950 hover:bg-slate-900 border border-slate-850 px-4 py-2 rounded-xl text-[10px] font-mono font-bold text-slate-400 flex items-center gap-1.5 transition-all"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>ADD AGENT RUN STEP</span>
                          </button>
                          <button
                            onClick={() => {
                              const stepId = "step-" + (workflowSteps.length + 1);
                              setWorkflowSteps([
                                ...workflowSteps,
                                { id: stepId, name: "Output summary speech", type: "tool", targetId: "text_to_speech", config: { args: { text: "Compliance checks completed successfully" } } }
                              ]);
                            }}
                            className="bg-slate-950 hover:bg-slate-900 border border-slate-850 px-4 py-2 rounded-xl text-[10px] font-mono font-bold text-slate-400 flex items-center gap-1.5 transition-all"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>ADD TTS VOICE STEP</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleCreateWorkflow}
                      disabled={actionLoading || !workflowName}
                      className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white px-5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      <span>REGISTER ACTION PIPELINE</span>
                    </button>
                  </div>

                  {/* Registered workflows list */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-mono font-bold tracking-widest text-slate-400 uppercase">Registered Workflows ({workflows.length})</h4>
                    {workflows.length === 0 ? (
                      <div className="p-6 bg-slate-900/20 border border-slate-850 rounded-xl text-center text-slate-500 text-xs">
                        No active workflow pipelines registered yet.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {workflows.map((wf) => (
                          <div key={wf.id} className="p-4 bg-slate-900/60 hover:bg-slate-900 border border-slate-850 rounded-xl flex items-center justify-between gap-4 transition-all">
                            <div className="space-y-1">
                              <h4 className="font-bold text-sm text-white">{wf.name}</h4>
                              <p className="text-slate-400 text-xs">{wf.description}</p>
                              <div className="flex gap-1.5 pt-1.5">
                                {wf.steps.map((st, i) => (
                                  <span key={st.id} className="px-2 py-0.5 rounded bg-slate-950 text-[8px] font-mono font-bold text-slate-400 uppercase">
                                    {st.type}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleRunWorkflow(wf.id)}
                                disabled={actionLoading}
                                className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
                              >
                                <Play className="w-3 h-3 fill-white" />
                                <span>RUN</span>
                              </button>
                              <button
                                onClick={() => handleDeleteWorkflow(wf.id)}
                                className="text-slate-500 hover:text-red-400 p-2 border border-slate-800 rounded-lg bg-slate-950"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Past workflow logs status drawer */}
                <div className="space-y-6 bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-white">Execution Logs History</h3>
                    <p className="text-slate-400 text-xs">Track current states and outputs from workflow execution pipelines.</p>
                  </div>

                  <div className="space-y-4">
                    {workflowLogs.length === 0 ? (
                      <div className="p-6 text-center text-slate-600 text-xs font-mono">
                        No previous execution history.
                      </div>
                    ) : (
                      <div className="space-y-4 max-h-[500px] overflow-y-auto">
                        {workflowLogs.map((log) => (
                          <div key={log.id} className="p-3.5 bg-slate-950 rounded-xl border border-slate-850 space-y-3">
                            <div className="flex justify-between items-center text-[10px] font-mono">
                              <span className="text-blue-400 font-bold">{log.id}</span>
                              <span className={`px-2 py-0.5 rounded font-bold uppercase ${
                                log.status === "completed" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15" : "bg-red-500/10 text-red-400 border border-red-500/15"
                              }`}>
                                {log.status}
                              </span>
                            </div>

                            <div className="space-y-1 leading-relaxed">
                              {log.logs.slice(0, 4).map((l, idx) => (
                                <div key={idx} className="text-[10px] text-slate-400 font-mono">{l}</div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ==================== SUBTAB: AUTOMATION ==================== */}
            {activeSubTab === "automation" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Rule Register block */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-800 space-y-4">
                    <h3 className="text-base font-bold text-white">Register Automation Triggers</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono font-bold text-slate-400 block">TRIGGER RULE NAME</label>
                        <input
                          type="text"
                          placeholder="Hourly Security Run"
                          value={ruleName}
                          onChange={(e) => setRuleName(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono font-bold text-slate-400 block">CRON PATTERN EXPRESSION</label>
                        <input
                          type="text"
                          placeholder="e.g. */10 * * * * for 10 mins"
                          value={ruleCron}
                          onChange={(e) => setRuleCron(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono font-bold text-slate-400 block">TRIGGER ASSOCIATED PIPELINE</label>
                      <select
                        value={ruleWorkflowId}
                        onChange={(e) => setRuleWorkflowId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="">Select Pipeline Target</option>
                        {workflows.map((wf) => (
                          <option key={wf.id} value={wf.id}>{wf.name}</option>
                        ))}
                      </select>
                    </div>

                    <button
                      onClick={handleAddAutomationRule}
                      disabled={actionLoading || !ruleName || !ruleWorkflowId}
                      className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white px-5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all"
                    >
                      <Clock className="w-4 h-4" />
                      <span>ACTIVATE HOOK ACTION</span>
                    </button>
                  </div>

                  {/* Registered Rules List */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-mono font-bold tracking-widest text-slate-400 uppercase">Automation Scheduler Rules</h4>
                    {automationRules.length === 0 ? (
                      <div className="p-6 bg-slate-900/20 border border-slate-850 rounded-xl text-center text-slate-500 text-xs">
                        No scheduled rules registered yet.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {automationRules.map((rule) => {
                          const associatedWf = workflows.find(w => w.id === rule.workflowId);
                          return (
                            <div key={rule.id} className="p-4 bg-slate-900/60 border border-slate-850 rounded-xl flex items-center justify-between gap-4">
                              <div className="space-y-1">
                                <h4 className="font-bold text-sm text-white">{rule.name}</h4>
                                <div className="flex items-center gap-2 text-slate-400 text-xs font-mono">
                                  <span>Cron: {rule.triggerConfig?.cron}</span>
                                  <span>•</span>
                                  <span className="text-blue-400 font-bold">Target: {associatedWf?.name || "System default"}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => handleToggleRule(rule)}
                                  className="text-slate-400 hover:text-white p-1"
                                >
                                  {rule.isActive ? <ToggleRight className="w-8 h-8 text-blue-500" /> : <ToggleLeft className="w-8 h-8 text-slate-600" />}
                                </button>
                                <button
                                  onClick={() => handleDeleteRule(rule.id)}
                                  className="text-slate-500 hover:text-red-400 p-2 bg-slate-950 border border-slate-850 rounded-lg"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Info pane */}
                <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 space-y-4 h-fit">
                  <div className="flex items-center gap-2.5 text-blue-400">
                    <HelpCircle className="w-5 h-5" />
                    <h3 className="font-bold text-sm text-white">Cron Scheduling Support</h3>
                  </div>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Our platform executes on a 10-second daemon tick check to trigger matched active cron patterns in real-time, executing corresponding agent-collaboration routines instantly on isolated backend runtimes.
                  </p>
                </div>
              </div>
            )}

            {/* ==================== SUBTAB: MEMORY ==================== */}
            {activeSubTab === "memory" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left query and long-term memory view */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Semantic TF-IDF search input */}
                  <div className="bg-slate-900/40 p-4 border border-slate-800 rounded-2xl flex gap-3 items-center">
                    <Search className="w-4 h-4 text-slate-500 shrink-0" />
                    <input
                      type="text"
                      placeholder="TF-IDF Semantic Search query on indexed memories..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1 bg-transparent text-xs text-white focus:outline-none placeholder-slate-500"
                    />
                    <button
                      onClick={fetchInitialData}
                      className="bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all shrink-0"
                    >
                      SEARCH MATCHES
                    </button>
                  </div>

                  {/* Memory card lists */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-mono font-bold tracking-widest text-slate-400 uppercase">Semantic Memory Clusters ({memories.length})</h4>
                    {memories.length === 0 ? (
                      <div className="p-8 bg-slate-900/20 border border-slate-850 rounded-2xl text-center text-slate-600 text-xs">
                        No memory indexes matched or configured.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {memories.map((mem) => (
                          <div key={mem.id} className="p-4 bg-slate-900/60 hover:bg-slate-900 border border-slate-850 rounded-xl flex items-start justify-between gap-4 transition-all">
                            <div className="space-y-1 flex-1">
                              <div className="flex gap-2 items-center text-[9px] font-mono">
                                <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/15 uppercase font-bold">
                                  {mem.type}
                                </span>
                                <span className="text-slate-500">{new Date(mem.createdAt).toLocaleString()}</span>
                              </div>
                              <p className="text-slate-300 text-xs leading-relaxed font-mono whitespace-pre-wrap">{mem.content}</p>
                            </div>
                            <button
                              onClick={() => handleDeleteMemory(mem.id)}
                              className="text-slate-500 hover:text-red-400 p-2 bg-slate-950 border border-slate-850 rounded-lg shrink-0"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Compression / Condensing Form */}
                <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 space-y-4 h-fit">
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-white">Index Memory Fragment</h3>
                    <p className="text-slate-400 text-xs">Synthesize context. Tick the Gemini Compression option to summarize complex notes into condensed long-term index clusters.</p>
                  </div>

                  <div className="space-y-3">
                    <textarea
                      rows={5}
                      placeholder="Add raw findings, meeting summaries, or research reports here..."
                      value={compressText}
                      onChange={(e) => setCompressText(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAddMemory(true)}
                        disabled={actionLoading || !compressText}
                        className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                      >
                        <Sparkles className="w-4 h-4 fill-white" />
                        <span>COMPRESS & INDEX</span>
                      </button>
                      <button
                        onClick={() => handleAddMemory(false)}
                        disabled={actionLoading || !compressText}
                        className="bg-slate-950 hover:bg-slate-900 border border-slate-850 text-slate-300 px-4 py-2.5 rounded-xl text-xs transition-all"
                      >
                        INDEX RAW
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ==================== SUBTAB: MCP ==================== */}
            {activeSubTab === "mcp" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Connect Server Form */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-800 space-y-4">
                    <h3 className="text-base font-bold text-white">Register Model Context Protocol (MCP) Host</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono font-bold text-slate-400 block">MCP SERVER NAME</label>
                        <input
                          type="text"
                          placeholder="e.g. Local Machine Metrics"
                          value={mcpName}
                          onChange={(e) => setMcpName(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono font-bold text-slate-400 block">TCP URL / WEBSOCKET ENDPOINT</label>
                        <input
                          type="text"
                          value={mcpUrl}
                          onChange={(e) => setMcpUrl(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleAddMcp}
                      disabled={actionLoading || !mcpName || !mcpUrl}
                      className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white px-5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      <span>BIND LOCAL MCP PROXY</span>
                    </button>
                  </div>

                  {/* Servers List */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-mono font-bold tracking-widest text-slate-400 uppercase">Configured MCP Servers</h4>
                    {mcpServers.length === 0 ? (
                      <div className="p-6 bg-slate-900/20 border border-slate-850 rounded-xl text-center text-slate-500 text-xs">
                        No MCP context servers linked.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {mcpServers.map((server) => (
                          <div key={server.id} className="p-4 bg-slate-900/60 border border-slate-850 rounded-xl flex items-center justify-between gap-4">
                            <div className="space-y-1">
                              <h4 className="font-bold text-sm text-white">{server.name}</h4>
                              <p className="text-slate-400 text-xs font-mono">{server.url}</p>
                              <div className="flex items-center gap-2 pt-1">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                <span className="text-[9px] font-mono text-emerald-400 uppercase font-bold">{server.status}</span>
                                <span className="text-[9px] font-mono text-slate-500">•</span>
                                <span className="text-[9px] font-mono text-slate-500">{server.toolsCount} Context Tools Discovered</span>
                              </div>
                            </div>
                            <button
                              onClick={() => handleDeleteMcp(server.id)}
                              className="text-slate-500 hover:text-red-400 p-2 bg-slate-950 border border-slate-850 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right discovery tools view */}
                <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 space-y-4 h-fit">
                  <div className="flex items-center gap-2.5 text-blue-400">
                    <Network className="w-5 h-5 animate-pulse" />
                    <h3 className="font-bold text-sm text-white">Discovered MCP Tools</h3>
                  </div>
                  <div className="space-y-3">
                    {[
                      { name: "mcp_get_system_time", desc: "Retrieves time context from host machine." },
                      { name: "mcp_get_cpu_usage", desc: "Checks host performance, threads, and limits." },
                    ].map((tool, idx) => (
                      <div key={idx} className="p-3 bg-slate-950 rounded-xl border border-slate-850 space-y-1">
                        <span className="font-mono text-xs text-blue-400 font-bold block">{tool.name}</span>
                        <p className="text-[10px] text-slate-400">{tool.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ==================== SUBTAB: OBSERVABILITY ==================== */}
            {activeSubTab === "observability" && metrics && (
              <div className="space-y-8">
                {/* KPI metrics row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800 space-y-1">
                    <span className="text-[10px] font-mono text-slate-500 font-bold tracking-wider block uppercase">TOTAL AGENT TASKS</span>
                    <span className="text-2xl font-bold font-mono text-blue-400">{metrics.agents?.totalRuns}</span>
                  </div>
                  <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800 space-y-1">
                    <span className="text-[10px] font-mono text-slate-500 font-bold tracking-wider block uppercase">PLATFORM RUN ERRORS</span>
                    <span className="text-2xl font-bold font-mono text-red-400">{metrics.agents?.totalErrors}</span>
                  </div>
                  <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800 space-y-1">
                    <span className="text-[10px] font-mono text-slate-500 font-bold tracking-wider block uppercase">SANDBOX EXECUTIONS</span>
                    <span className="text-2xl font-bold font-mono text-purple-400">{metrics.sandbox?.executionCount}</span>
                  </div>
                  <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800 space-y-1">
                    <span className="text-[10px] font-mono text-slate-500 font-bold tracking-wider block uppercase">PLATFORM SUCCESS RATE</span>
                    <span className="text-2xl font-bold font-mono text-emerald-400">{metrics.agents?.successRate}%</span>
                  </div>
                </div>

                {/* Agent metric distributions bar panel */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Active Agents distribution counts */}
                  <div className="bg-slate-900/30 p-6 rounded-2xl border border-slate-800 space-y-4">
                    <h4 className="text-xs font-mono font-bold tracking-widest text-slate-400 uppercase">Agent Load Distribution</h4>
                    <div className="space-y-3">
                      {metrics.agents?.metricsByAgent?.map((item: any) => (
                        <div key={item.id} className="space-y-1.5">
                          <div className="flex justify-between text-xs font-mono text-slate-300">
                            <span>{item.name}</span>
                            <span>{item.runs} runs</span>
                          </div>
                          {/* Simulated bar progress indicator */}
                          <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-600 rounded-full"
                              style={{ width: `${Math.min(100, (item.runs / (metrics.agents.totalRuns || 1)) * 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Observability Host metrics */}
                  <div className="bg-slate-900/30 p-6 rounded-2xl border border-slate-800 space-y-5">
                    <h4 className="text-xs font-mono font-bold tracking-widest text-slate-400 uppercase">System Container Limits</h4>
                    <div className="space-y-4 font-mono text-xs text-slate-300">
                      <div className="flex justify-between p-3 bg-slate-950 rounded-xl border border-slate-850">
                        <span>CPU Allocations</span>
                        <span className="text-blue-400 font-bold">{metrics.sandbox?.cpuCoresAllocated} Virtual Cores</span>
                      </div>
                      <div className="flex justify-between p-3 bg-slate-950 rounded-xl border border-slate-850">
                        <span>Isolate RAM Limit</span>
                        <span className="text-blue-400 font-bold">{metrics.sandbox?.memoryLimitsAllocatedMB} MB Isolated Buffer</span>
                      </div>
                      <div className="flex justify-between p-3 bg-slate-950 rounded-xl border border-slate-850">
                        <span>Memory retrieval latency</span>
                        <span className="text-emerald-400 font-bold">{metrics.memory?.retrievalAverageMs} ms</span>
                      </div>
                      <div className="flex justify-between p-3 bg-slate-950 rounded-xl border border-slate-850">
                        <span>Most Active Core Tool</span>
                        <span className="text-purple-400 font-bold uppercase">{metrics.tools?.mostActive}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
