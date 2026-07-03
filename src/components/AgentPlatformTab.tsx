import React, { useState, useEffect } from "react";
import {
  Cpu,
  Play,
  Terminal,
  Network,
  GitBranch,
  Search,
  Database,
  Activity,
  FileCode,
  CheckCircle,
  AlertCircle,
  Trash2,
  Plus,
  Clock,
  ArrowRight,
  Sparkles,
  Volume2,
  Eye,
  RefreshCw,
  Sliders,
  BookOpen
} from "lucide-react";

interface AgentPlatformTabProps {
  token: string;
  activeProjectId: string | null;
}

export default function AgentPlatformTab({ token, activeProjectId }: AgentPlatformTabProps) {
  // Navigation Tabs inside Agent OS
  const [currentSubTab, setCurrentSubTab] = useState<"agents" | "sandbox" | "workflows" | "tools" | "mcp" | "memory" | "observability" | "testing">("agents");

  // State arrays from API
  const [agents, setAgents] = useState<any[]>([]);
  const [tools, setTools] = useState<any[]>([]);
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [workflowRuns, setWorkflowRuns] = useState<any[]>([]);
  const [mcpConnections, setMcpConnections] = useState<any[]>([]);
  const [memories, setMemories] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [testResults, setTestResults] = useState<any[]>([]);

  // Interactive forms & selection state
  const [loading, setLoading] = useState(false);
  const [testingWorkflowId, setTestingWorkflowId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMcp, setSelectedMcp] = useState("mcp-github");
  const [mcpTools, setMcpTools] = useState<any[]>([]);
  const [mcpResources, setMcpResources] = useState<any[]>([]);

  // Sandbox State
  const [sandboxLang, setSandboxLang] = useState<"javascript" | "typescript" | "python" | "bash" | "json">("javascript");
  const [sandboxCode, setSandboxCode] = useState(`// Secure Node Sandbox
const msg = "Agent Operating System Sandbox is running.";
console.log(msg);

// Write to mock virtual filesystem
fs.writeFileSync("output_report.txt", "Deployment metrics look healthy.");
console.log("Written file: output_report.txt");
`);
  const [sandboxResult, setSandboxResult] = useState<any>(null);

  // New Agent Form
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [newAgentData, setNewAgentData] = useState({
    id: "",
    name: "",
    role: "",
    description: "",
    systemPrompt: "You are a helpful assistant.",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
    permissions: ["sandbox", "filesystem"],
    tools: ["web_search"]
  });

  // Tool Execution State
  const [selectedToolId, setSelectedToolId] = useState("web_search");
  const [toolArgsText, setToolArgsText] = useState(`{\n  "query": "React 19 Server Components"\n}`);
  const [toolExecutionOutput, setToolExecutionOutput] = useState<any>(null);

  // New Workflow Form
  const [showWorkflowModal, setShowWorkflowModal] = useState(false);
  const [newWfData, setNewWfData] = useState({
    name: "",
    description: "",
    promptNode: "Research latest pricing benchmarks",
    selectedAgent: "agt-research"
  });

  // Load state upon mount/project switch
  useEffect(() => {
    fetchAgents();
    fetchTools();
    fetchWorkflows();
    fetchWorkflowRuns();
    fetchMcpConnections();
    fetchMetrics();
    fetchLogs();
    if (activeProjectId) {
      fetchMemories();
    }
  }, [token, activeProjectId]);

  // Fetch MCP server details when selection changes
  useEffect(() => {
    if (selectedMcp) {
      fetchMcpDetails(selectedMcp);
    }
  }, [selectedMcp]);

  // ==========================================
  // API SERVICE CALLS
  // ==========================================

  const fetchAgents = async () => {
    try {
      const res = await fetch("/api/agents", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setAgents(await res.json());
    } catch (e) { console.error("Error fetching agents:", e); }
  };

  const fetchTools = async () => {
    try {
      const res = await fetch("/api/tools", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setTools(await res.json());
    } catch (e) { console.error("Error fetching tools:", e); }
  };

  const fetchWorkflows = async () => {
    try {
      const res = await fetch("/api/workflows", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setWorkflows(data);
        if (data.length > 0 && !testingWorkflowId) {
          setTestingWorkflowId(data[0].id);
        }
      }
    } catch (e) { console.error("Error fetching workflows:", e); }
  };

  const fetchWorkflowRuns = async () => {
    try {
      const res = await fetch("/api/workflow-runs", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setWorkflowRuns(await res.json());
    } catch (e) { console.error("Error fetching workflow runs:", e); }
  };

  const fetchMcpConnections = async () => {
    try {
      const res = await fetch("/api/mcp/connections", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setMcpConnections(await res.json());
    } catch (e) { console.error("Error fetching MCP connections:", e); }
  };

  const fetchMcpDetails = async (id: string) => {
    try {
      const toolsRes = await fetch(`/api/mcp/connections/${id}/tools`, { headers: { Authorization: `Bearer ${token}` } });
      if (toolsRes.ok) setMcpTools(await toolsRes.json());
      
      const resRes = await fetch(`/api/mcp/connections/${id}/resources`, { headers: { Authorization: `Bearer ${token}` } });
      if (resRes.ok) setMcpResources(await resRes.json());
    } catch (e) { console.error("Error fetching MCP details:", e); }
  };

  const fetchMemories = async () => {
    if (!activeProjectId) return;
    try {
      const res = await fetch(`/api/memories/${activeProjectId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setMemories(await res.json());
    } catch (e) { console.error("Error fetching memories:", e); }
  };

  const fetchMetrics = async () => {
    try {
      const res = await fetch("/api/observability/metrics", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setMetrics(await res.json());
    } catch (e) { console.error("Error fetching metrics:", e); }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch("/api/observability/logs", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setLogs(await res.json());
    } catch (e) { console.error("Error fetching logs:", e); }
  };

  const handleCreateAgent = async () => {
    if (!newAgentData.id || !newAgentData.name || !newAgentData.role) return;
    setLoading(true);
    try {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(newAgentData)
      });
      if (res.ok) {
        setShowAgentModal(false);
        fetchAgents();
        fetchMetrics();
        // Reset form
        setNewAgentData({
          id: "",
          name: "",
          role: "",
          description: "",
          systemPrompt: "You are a helpful assistant.",
          avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
          permissions: ["sandbox", "filesystem"],
          tools: ["web_search"]
        });
      }
    } catch (e) { console.error("Error creating custom agent:", e); }
    finally { setLoading(false); }
  };

  const handleDeleteAgent = async (id: string) => {
    try {
      const res = await fetch(`/api/agents/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchAgents();
        fetchMetrics();
      }
    } catch (e) { console.error("Error deleting agent:", e); }
  };

  const handleExecuteSandbox = async () => {
    setLoading(true);
    setSandboxResult(null);
    try {
      const res = await fetch("/api/sandbox/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          language: sandboxLang,
          code: sandboxCode,
          options: { timeoutMs: 4000 }
        })
      });
      if (res.ok) {
        setSandboxResult(await res.json());
      }
    } catch (e) { console.error("Error running sandbox:", e); }
    finally { setLoading(false); }
  };

  const handleRunTool = async () => {
    setLoading(true);
    setToolExecutionOutput(null);
    try {
      let parsedArgs = {};
      try { parsedArgs = JSON.parse(toolArgsText); } catch (jsonErr) {
        setToolExecutionOutput({ error: "Invalid JSON parameters" });
        setLoading(false);
        return;
      }

      const res = await fetch(`/api/tools/${selectedToolId}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ args: parsedArgs })
      });
      if (res.ok) {
        const data = await res.json();
        setToolExecutionOutput(data.result);
      } else {
        setToolExecutionOutput({ error: "HTTP Execution Error response." });
      }
    } catch (e: any) { setToolExecutionOutput({ error: e.message }); }
    finally { setLoading(false); }
  };

  const handleCreateWorkflow = async () => {
    if (!newWfData.name || !activeProjectId) return;
    setLoading(true);
    try {
      const node1Id = "node_research_" + Math.random().toString(36).substring(2, 6);
      const node2Id = "node_summary_" + Math.random().toString(36).substring(2, 6);

      const res = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: newWfData.name,
          description: newWfData.description,
          projectId: activeProjectId,
          nodes: [
            {
              id: node1Id,
              name: "Research Web Data",
              type: "agent_task",
              agentId: newWfData.selectedAgent,
              config: { prompt: newWfData.promptNode },
              nextNodes: [node2Id]
            },
            {
              id: node2Id,
              name: "Auto Documentation",
              type: "agent_task",
              agentId: "agt-writer",
              config: { prompt: "Formulate report of the research output results." },
              nextNodes: []
            }
          ],
          triggers: []
        })
      });

      if (res.ok) {
        setShowWorkflowModal(false);
        fetchWorkflows();
        setNewWfData({
          name: "",
          description: "",
          promptNode: "Research latest pricing benchmarks",
          selectedAgent: "agt-research"
        });
      }
    } catch (e) { console.error("Error creating workflow:", e); }
    finally { setLoading(false); }
  };

  const handleRunWorkflow = async (wfId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/workflows/${wfId}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ state: { trigger: "visual_dashboard" } })
      });
      if (res.ok) {
        fetchWorkflowRuns();
      }
    } catch (e) { console.error("Error starting workflow run:", e); }
    finally { setLoading(false); }
  };

  const handleMemorySearch = async () => {
    if (!activeProjectId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/memories/${activeProjectId}/search?q=${encodeURIComponent(searchQuery)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setMemories(await res.json());
      }
    } catch (e) { console.error("Error searching memory:", e); }
    finally { setLoading(false); }
  };

  const handleRunSuiteTests = async () => {
    setLoading(true);
    setTestResults([]);
    try {
      const res = await fetch("/api/test/run", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setTestResults(await res.json());
      }
    } catch (e) { console.error("Error running test suite:", e); }
    finally { setLoading(false); }
  };

  // Switch default templates for language selection
  const handleSandboxLangChange = (lang: typeof sandboxLang) => {
    setSandboxLang(lang);
    if (lang === "javascript") {
      setSandboxCode(`// Secure Node Sandbox
const msg = "Agent Operating System Sandbox is running.";
console.log(msg);

// Write to mock virtual filesystem
fs.writeFileSync("output_report.txt", "Deployment metrics look healthy.");
console.log("Written file: output_report.txt");
`);
    } else if (lang === "typescript") {
      setSandboxCode(`// TypeScript static compile checks
interface AuditResult {
  passed: boolean;
  score: number;
}

const audit: AuditResult = { passed: true, score: 98 };
console.log("TS Verified successfully. Score:", audit.score);
`);
    } else if (lang === "python") {
      setSandboxCode(`# Isolated Python environment
print("Loading Planner modules...")
plan = ["web_search", "ocr_extraction", "writer_synthesize"]
for idx, step in enumerate(plan):
    print(f"Step {idx + 1}: Executing {step}")
`);
    } else if (lang === "bash") {
      setSandboxCode(`# Simulating secure shell statements
pwd
echo "Checking directory files..."
ls -la
`);
    } else if (lang === "json") {
      setSandboxCode(`{\n  "agentState": "ready",\n  "activeThreads": 4,\n  "memoryUtilization": "128MB"\n}`);
    }
  };

  // ==========================================
  // RENDER SECTIONS
  // ==========================================

  return (
    <div id="agent-operating-system-panel" className="p-8 max-w-7xl mx-auto font-sans text-slate-100 bg-slate-950 min-h-screen">
      {/* Visual Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-slate-900 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full tracking-wider uppercase">
              PHASE 4 - INFRASTRUCTURE READY
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <Cpu className="w-8 h-8 text-blue-500 animate-pulse" /> Agent Operating System
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Enterprise-grade orchestration, isolated secure sandboxes, DAG workflow engine and unified memory indexing.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              fetchAgents();
              fetchWorkflows();
              fetchWorkflowRuns();
              fetchMetrics();
              fetchLogs();
              if (activeProjectId) fetchMemories();
            }}
            className="p-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-lg text-slate-400 hover:text-white transition-all"
            title="Refresh Server Logs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setCurrentSubTab("testing");
              handleRunSuiteTests();
            }}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold font-mono tracking-wider shadow-md shadow-blue-600/10 transition-all flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" /> RUN COMPLIANCE TESTS
          </button>
        </div>
      </div>

      {/* Observability Ribbon */}
      {metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-900/60 border border-slate-850 p-4 rounded-xl flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center border border-blue-500/20">
              <Cpu className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-slate-500 block uppercase tracking-wider">SPECIALIZED AGENTS</span>
              <span className="text-lg font-bold text-white font-mono">{metrics.agents.totalCount} Seeded</span>
            </div>
          </div>
          <div className="bg-slate-900/60 border border-slate-850 p-4 rounded-xl flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center border border-emerald-500/20">
              <Terminal className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-slate-500 block uppercase tracking-wider">SANDBOX LOAD</span>
              <span className="text-lg font-bold text-white font-mono">{metrics.sandbox.cpuLoadPercentage}% CPU</span>
            </div>
          </div>
          <div className="bg-slate-900/60 border border-slate-850 p-4 rounded-xl flex items-center gap-4">
            <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center border border-purple-500/20">
              <Database className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-slate-500 block uppercase tracking-wider">MEMORY VECTOR NODES</span>
              <span className="text-lg font-bold text-white font-mono">{metrics.memory.totalNodesCount} Indexed</span>
            </div>
          </div>
          <div className="bg-slate-900/60 border border-slate-850 p-4 rounded-xl flex items-center gap-4">
            <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center border border-amber-500/20">
              <Network className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-slate-500 block uppercase tracking-wider">ACTIVE SYSTEM TOOLS</span>
              <span className="text-lg font-bold text-white font-mono">{metrics.tools.activeCount} Mapped</span>
            </div>
          </div>
        </div>
      )}

      {/* Sub Navigation Menus */}
      <div className="flex overflow-x-auto gap-2 border-b border-slate-900 pb-px mb-8 scrollbar-hide">
        {[
          { id: "agents", label: "Multi-Agent System", icon: Cpu },
          { id: "sandbox", label: "Secure Sandbox", icon: Terminal },
          { id: "workflows", label: "DAG Workflows", icon: GitBranch },
          { id: "tools", label: "Tool Execution", icon: Sliders },
          { id: "mcp", label: "MCP Connections", icon: Network },
          { id: "memory", label: "Semantic Memory", icon: Database },
          { id: "observability", label: "Observability Metrics", icon: Activity },
          { id: "testing", label: "Compliance Test Suite", icon: CheckCircle }
        ].map((item) => {
          const Icon = item.icon;
          const isActive = currentSubTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentSubTab(item.id as any)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 text-xs font-mono font-bold tracking-wider uppercase transition-all shrink-0 ${
                isActive
                  ? "border-blue-500 text-white bg-blue-500/5"
                  : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </button>
          );
        })}
      </div>

      {/* ==========================================
          SUBTAB 1: AGENTS REGISTRY & METRICS
          ========================================== */}
      {currentSubTab === "agents" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Agent Directory</h3>
              <p className="text-xs text-slate-400">10 core pre-seeded task-specialized actors ready to collaborate.</p>
            </div>
            <button
              onClick={() => setShowAgentModal(true)}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white text-xs font-mono font-bold rounded-lg flex items-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4 text-blue-500" /> INSTANTIATE CUSTOM AGENT
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent) => (
              <div key={agent.id} className="bg-slate-900 border border-slate-850 rounded-xl p-5 hover:border-slate-800 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <img
                      referrerPolicy="no-referrer"
                      src={agent.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"}
                      alt={agent.name}
                      className="w-12 h-12 rounded-lg object-cover bg-slate-800 border border-slate-800 shadow"
                    />
                    <div>
                      <h4 className="text-sm font-extrabold text-white">{agent.name}</h4>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-400 bg-blue-500/5 px-1.5 py-0.5 rounded border border-blue-500/10">
                        {agent.role}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed mb-4">{agent.description}</p>

                  <div className="space-y-3 pt-3 border-t border-slate-850">
                    <div>
                      <span className="text-[9px] font-mono text-slate-500 block uppercase tracking-wider mb-1">MAPPED PERMISSIONS</span>
                      <div className="flex flex-wrap gap-1">
                        {agent.permissions?.map((p: string) => (
                          <span key={p} className="text-[9px] font-mono font-bold text-slate-300 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-850">
                            {p}
                          </span>
                        )) || <span className="text-slate-600 text-[10px]">None</span>}
                      </div>
                    </div>
                    <div>
                      <span className="text-[9px] font-mono text-slate-500 block uppercase tracking-wider mb-1">CAPABLE TOOLS</span>
                      <div className="flex flex-wrap gap-1">
                        {agent.tools?.map((t: string) => (
                          <span key={t} className="text-[9px] font-mono font-bold text-blue-300 bg-blue-500/5 px-1.5 py-0.5 rounded border border-blue-500/10">
                            {t}
                          </span>
                        )) || <span className="text-slate-600 text-[10px]">None</span>}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-850 flex items-center justify-between">
                  <div className="grid grid-cols-3 gap-2 text-center flex-1">
                    <div className="bg-slate-950/40 p-2 rounded border border-slate-850/50">
                      <span className="text-[9px] font-mono text-slate-500 block uppercase">TASKS</span>
                      <span className="text-xs font-mono font-bold text-white">{agent.metrics?.tasksCompleted || 0}</span>
                    </div>
                    <div className="bg-slate-950/40 p-2 rounded border border-slate-850/50">
                      <span className="text-[9px] font-mono text-slate-500 block uppercase">LATENCY</span>
                      <span className="text-xs font-mono font-bold text-white">{agent.metrics?.avgResponseMs || 0}ms</span>
                    </div>
                    <div className="bg-slate-950/40 p-2 rounded border border-slate-850/50">
                      <span className="text-[9px] font-mono text-slate-500 block uppercase">ERR RATE</span>
                      <span className="text-xs font-mono font-bold text-amber-500">{Math.round((agent.metrics?.errorRate || 0) * 100)}%</span>
                    </div>
                  </div>
                  {!agent.id.startsWith("agt-") && (
                    <button
                      onClick={() => handleDeleteAgent(agent.id)}
                      className="ml-3 p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/20 transition-all shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==========================================
          SUBTAB 2: SECURE WORKSPACE SANDBOX
          ========================================== */}
      {currentSubTab === "sandbox" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Panel */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-slate-900 border border-slate-850 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-blue-400" />
                  <span className="text-sm font-bold text-white">Isolated Execution Container</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-xs font-mono">LANGUAGE:</span>
                  <select
                    value={sandboxLang}
                    onChange={(e) => handleSandboxLangChange(e.target.value as any)}
                    className="bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-white py-1.5 px-3 focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="javascript">JavaScript (Node.js)</option>
                    <option value="typescript">TypeScript</option>
                    <option value="python">Python 3.10</option>
                    <option value="bash">Bash Terminal</option>
                    <option value="json">JSON Validator</option>
                  </select>
                </div>
              </div>

              <textarea
                value={sandboxCode}
                onChange={(e) => setSandboxCode(e.target.value)}
                className="w-full h-80 bg-slate-950 border border-slate-850 rounded-lg p-4 font-mono text-xs text-emerald-400 focus:outline-none focus:border-slate-700 leading-relaxed resize-none"
              />

              <div className="flex items-center justify-between mt-4">
                <span className="text-[10px] font-mono text-slate-500">
                  ⚠️ Resource constraints: Max 128MB RAM | 4000ms CPU Timeout
                </span>
                <button
                  onClick={handleExecuteSandbox}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white rounded-lg text-xs font-mono font-bold tracking-wider transition-all flex items-center gap-2"
                >
                  {loading ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                  RUN IN SANDBOX
                </button>
              </div>
            </div>
          </div>

          {/* Outputs Console */}
          <div className="space-y-4">
            <div className="bg-slate-950 border border-slate-850 rounded-xl p-5 flex flex-col h-full min-h-[440px]">
              <span className="text-xs font-mono font-bold uppercase text-slate-500 tracking-wider mb-3">SANDBOX STREAMS</span>

              {sandboxResult ? (
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    {/* Diagnostic Metrics */}
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <div className="bg-slate-900 border border-slate-850 p-2.5 rounded text-center">
                        <span className="text-[9px] font-mono text-slate-500 block">CPU UTILS</span>
                        <span className="text-xs font-mono font-bold text-white">{sandboxResult.cpuUsagePercentage}%</span>
                      </div>
                      <div className="bg-slate-900 border border-slate-850 p-2.5 rounded text-center">
                        <span className="text-[9px] font-mono text-slate-500 block">MEM USED</span>
                        <span className="text-xs font-mono font-bold text-white">{sandboxResult.memoryUsageMb}MB</span>
                      </div>
                      <div className="bg-slate-900 border border-slate-850 p-2.5 rounded text-center">
                        <span className="text-[9px] font-mono text-slate-500 block">LATENCY</span>
                        <span className="text-xs font-mono font-bold text-white">{sandboxResult.executionTimeMs}ms</span>
                      </div>
                      <div className="bg-slate-900 border border-slate-850 p-2.5 rounded text-center">
                        <span className="text-[9px] font-mono text-slate-500 block">EXIT STATUS</span>
                        <span className={`text-xs font-mono font-bold ${sandboxResult.status === "success" ? "text-emerald-400" : "text-red-400"}`}>
                          {sandboxResult.status.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* Console logger */}
                    <div className="bg-slate-900 rounded-lg p-3 border border-slate-850/50 min-h-[140px] font-mono text-[11px] text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {sandboxResult.output || sandboxResult.error}
                    </div>
                  </div>

                  {sandboxResult.filesCreated && sandboxResult.filesCreated.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-850">
                      <span className="text-[10px] font-mono text-slate-500 block mb-1.5 uppercase">FILES GENERATED IN VIRTUAL WORKSPACE</span>
                      <div className="space-y-1">
                        {sandboxResult.filesCreated.map((f: string) => (
                          <div key={f} className="flex items-center gap-2 text-xs font-mono text-slate-300">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                            {f}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-600 font-mono text-xs">
                  <Terminal className="w-8 h-8 text-slate-800 mb-2" />
                  Console Idle.<br />Launch scripts above to inspect telemetry channels.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          SUBTAB 3: DAG WORKFLOWS
          ========================================== */}
      {currentSubTab === "workflows" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Workflows Directory */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-400 tracking-wider uppercase">Active Workflows</span>
              <button
                onClick={() => setShowWorkflowModal(true)}
                className="px-2 py-1 border border-slate-850 hover:bg-slate-900 rounded text-[10px] font-mono font-bold flex items-center gap-1.5 transition-all text-blue-400"
              >
                <Plus className="w-3.5 h-3.5" /> BUILD NEW FLOW
              </button>
            </div>

            <div className="space-y-3">
              {workflows.length === 0 ? (
                <div className="p-8 text-center text-xs font-mono text-slate-600 bg-slate-900/40 rounded-xl border border-slate-900">
                  No custom workflows built yet. Click the Build button to design a sequence.
                </div>
              ) : (
                workflows.map((wf) => (
                  <div
                    key={wf.id}
                    onClick={() => setTestingWorkflowId(wf.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      testingWorkflowId === wf.id
                        ? "bg-slate-900 border-blue-500/50 shadow shadow-blue-500/5"
                        : "bg-slate-900/60 border-slate-850 hover:border-slate-800"
                    }`}
                  >
                    <h4 className="text-xs font-bold text-white font-mono">{wf.name}</h4>
                    <p className="text-[11px] text-slate-400 mt-1">{wf.description}</p>
                    <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-850/50">
                      <span className="text-[9px] font-mono text-slate-500 uppercase">{wf.nodes?.length || 0} nodes</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRunWorkflow(wf.id);
                        }}
                        className="px-2 py-1 bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white text-[10px] font-mono font-bold rounded border border-blue-500/20 transition-all flex items-center gap-1"
                      >
                        <Play className="w-2.5 h-2.5" /> TRIGGER RUN
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Selected Workflow Visualization */}
          <div className="lg:col-span-2 space-y-4">
            {testingWorkflowId ? (
              <div className="bg-slate-900 border border-slate-850 rounded-xl p-5">
                {/* Visualizing DAG Node Graph */}
                <span className="text-xs font-mono font-bold uppercase text-slate-500 tracking-wider mb-4 block">DAG Execution Sequence Flow</span>
                <div className="space-y-4 py-4">
                  {workflows.find(w => w.id === testingWorkflowId)?.nodes?.map((node: any, idx: number) => (
                    <div key={node.id} className="relative">
                      {idx > 0 && (
                        <div className="w-0.5 h-6 bg-blue-500/20 absolute left-8 -top-5" />
                      )}
                      <div className="flex items-center gap-4 bg-slate-950 p-3.5 rounded-lg border border-slate-850">
                        <div className="w-9 h-9 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center font-mono font-bold text-xs text-blue-400 shadow">
                          {idx + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white font-mono">{node.name}</span>
                            <span className="text-[9px] font-mono uppercase bg-slate-900 text-slate-400 border border-slate-800 px-1.5 py-0.5 rounded">
                              {node.type.toUpperCase()}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 font-mono block mt-0.5">
                            Task Target: {node.config?.prompt || JSON.stringify(node.config)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Runs list */}
                <div className="mt-6 pt-5 border-t border-slate-850">
                  <span className="text-xs font-mono font-bold uppercase text-slate-500 tracking-wider mb-3 block">EXECUTION LOGGER HISTORY</span>
                  <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                    {workflowRuns.filter(r => r.workflowId === testingWorkflowId).length === 0 ? (
                      <div className="text-center p-4 text-[11px] font-mono text-slate-600">
                        No recorded run sequences for this workflow. Trigger a run to inspect metrics.
                      </div>
                    ) : (
                      workflowRuns
                        .filter(r => r.workflowId === testingWorkflowId)
                        .map((run) => (
                          <div key={run.id} className="bg-slate-950 p-3 rounded-lg border border-slate-850 flex items-center justify-between text-xs">
                            <div>
                              <span className="font-mono font-bold text-white block">{run.id}</span>
                              <span className="text-[10px] text-slate-500 mt-0.5 block">{run.createdAt}</span>
                            </div>
                            <div className="flex items-center gap-3 font-mono">
                              <span className="text-[10px] text-slate-400">DURATION: {run.durationMs}ms</span>
                              <span className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase ${
                                run.status === "completed"
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                  : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                              }`}>
                                {run.status}
                              </span>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-850 rounded-xl p-8 text-center text-xs font-mono text-slate-600">
                Select a workflow from the left sidebar panel to preview execution logs.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==========================================
          SUBTAB 4: UNIVERSAL TOOLS
          ========================================== */}
      {currentSubTab === "tools" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* List of tools */}
          <div className="space-y-3">
            <span className="text-xs font-mono font-bold text-slate-400 tracking-wider uppercase">AVAILABLE INTERFACES</span>
            <div className="space-y-2">
              {tools.map((t) => (
                <div
                  key={t.id}
                  onClick={() => setSelectedToolId(t.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    selectedToolId === t.id
                      ? "bg-slate-900 border-blue-500/50"
                      : "bg-slate-900/50 border-slate-850 hover:border-slate-800"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white font-mono">{t.name}</h4>
                    <span className="text-[9px] font-mono text-slate-500 bg-slate-950 border border-slate-850 px-1 py-0.5 rounded uppercase">
                      {t.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{t.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive testing panel */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-slate-900 border border-slate-850 rounded-xl p-5">
              <span className="text-xs font-mono font-bold uppercase text-slate-500 tracking-wider mb-3 block">RUN INTERACTIVE PROBE TEST</span>

              <div className="mb-4">
                <span className="text-[10px] font-mono text-slate-400 block mb-1 uppercase">ARGUMENTS ARGS (Strict JSON Required)</span>
                <textarea
                  value={toolArgsText}
                  onChange={(e) => setToolArgsText(e.target.value)}
                  className="w-full h-24 bg-slate-950 border border-slate-850 rounded-lg p-3 font-mono text-xs text-blue-300 focus:outline-none focus:border-slate-700 leading-relaxed resize-none"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono text-slate-500">
                  🔐 Universal permissions verified. Output payload mapped securely.
                </span>
                <button
                  onClick={handleRunTool}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-mono font-bold tracking-wider transition-all"
                >
                  RUN TOOL DIRECTLY
                </button>
              </div>

              {/* Tool outputs */}
              <div className="mt-6 pt-5 border-t border-slate-850">
                <span className="text-[10px] font-mono text-slate-500 block mb-2 uppercase">RAW PAYLOAD RESPONSE</span>
                {toolExecutionOutput ? (
                  <pre className="bg-slate-950 rounded-lg p-4 font-mono text-[11px] text-emerald-400 overflow-x-auto max-h-[220px] border border-slate-850">
                    {JSON.stringify(toolExecutionOutput, null, 2)}
                  </pre>
                ) : (
                  <div className="text-center p-8 bg-slate-950 rounded-lg border border-slate-850 text-xs font-mono text-slate-600">
                    Click execute parameters to query active payload sockets.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          SUBTAB 5: MCP CHANNELS
          ========================================== */}
      {currentSubTab === "mcp" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* MCP Servers */}
          <div className="space-y-3">
            <span className="text-xs font-mono font-bold text-slate-400 tracking-wider uppercase">Registered MCP Hosts</span>
            <div className="space-y-2.5">
              {mcpConnections.map((conn) => (
                <div
                  key={conn.id}
                  onClick={() => setSelectedMcp(conn.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    selectedMcp === conn.id
                      ? "bg-slate-900 border-blue-500/50"
                      : "bg-slate-900/50 border-slate-850 hover:border-slate-800"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white font-mono">{conn.name}</h4>
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono uppercase tracking-wider ${
                      conn.status === "connected"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-slate-950 text-slate-500 border border-slate-850"
                    }`}>
                      {conn.status}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 block mt-1">{conn.endpoint}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Schema tools and resource URIs */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-slate-900 border border-slate-850 rounded-xl p-5">
              <span className="text-xs font-mono font-bold uppercase text-slate-500 tracking-wider mb-4 block">Discovered Server Capabilities</span>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-xs font-bold text-white font-mono mb-2 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-blue-400" /> Discovered Tools ({mcpTools.length})
                  </h4>
                  <div className="space-y-2 max-h-[250px] overflow-y-auto">
                    {mcpTools.map((t) => (
                      <div key={t.name} className="p-3 bg-slate-950 rounded-lg border border-slate-850">
                        <span className="text-xs font-bold font-mono text-slate-300 block">{t.name}</span>
                        <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">{t.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-white font-mono mb-2 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-purple-400" /> Declared Resources ({mcpResources.length})
                  </h4>
                  <div className="space-y-2 max-h-[250px] overflow-y-auto">
                    {mcpResources.map((r) => (
                      <div key={r.uri} className="p-3 bg-slate-950 rounded-lg border border-slate-850">
                        <span className="text-xs font-bold font-mono text-slate-300 block">{r.name}</span>
                        <span className="text-[9px] font-mono text-purple-400 block mt-1 truncate">{r.uri}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          SUBTAB 6: SEMANTIC MEMORY
          ========================================== */}
      {currentSubTab === "memory" && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 p-4 rounded-xl border border-slate-850">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Type semantic match lookup (e.g. 'router benchmarking margins')..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-xs font-mono text-white pl-9 pr-4 py-2.5 rounded-lg focus:outline-none focus:border-blue-500 transition-all"
              />
            </div>
            <button
              onClick={handleMemorySearch}
              disabled={loading}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-mono font-bold tracking-wider uppercase transition-all"
            >
              QUERY SEMANTIC LOOKUP
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {memories.length === 0 ? (
              <div className="md:col-span-2 text-center p-8 text-xs font-mono text-slate-600 bg-slate-900/40 rounded-xl border border-slate-900">
                No indexed memory nodes found for this workspace. Use the search bar above or prompt agents to populate the memory layer.
              </div>
            ) : (
              memories.map((mem) => (
                <div key={mem.id} className="bg-slate-900 border border-slate-850 rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono text-purple-400 bg-purple-500/5 px-2 py-0.5 rounded border border-purple-500/10 font-bold uppercase">
                        {mem.type}
                      </span>
                      {mem.relevanceScore > 0 && (
                        <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10">
                          Relevance Score: {mem.relevanceScore}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 font-mono leading-relaxed bg-slate-950 p-3 rounded border border-slate-850/50 mb-3 whitespace-pre-wrap">
                      {mem.content}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-2 border-t border-slate-850/50">
                    <span>INDEXED AT: {mem.createdAt}</span>
                    <span>COMPRESSION RATIO: 1:4.2</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ==========================================
          SUBTAB 7: METRICS & OBSERVABILITY
          ========================================== */}
      {currentSubTab === "observability" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Detailed metrics cards */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900 border border-slate-850 rounded-xl p-5">
              <span className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider mb-4 block">Telemetry Streams</span>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-white font-mono">Sandbox CPU Core Utilization</h4>
                  <div className="h-4 w-full bg-slate-950 rounded overflow-hidden relative">
                    <div className="h-full bg-blue-500 rounded" style={{ width: "34%" }} />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-mono text-white font-bold">34% Allocated</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 block leading-relaxed">
                    Host containers allocated: 8 logic threads. Isolation model binds execution contexts into thread limits.
                  </span>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-white font-mono">Dynamic Agent Success Margin</h4>
                  <div className="h-4 w-full bg-slate-950 rounded overflow-hidden relative">
                    <div className="h-full bg-emerald-500 rounded" style={{ width: "98%" }} />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-mono text-white font-bold">98% Success</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 block leading-relaxed">
                    Evaluated tasks success: 110 of 112 runs completed. Automatic fallbacks and scheduler task retries are active.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Active system orchestrator log stream */}
          <div>
            <div className="bg-slate-950 border border-slate-850 rounded-xl p-5 h-full min-h-[350px] flex flex-col justify-between">
              <div>
                <span className="text-xs font-mono font-bold uppercase text-slate-500 tracking-wider mb-3 block">SYSTEM LEVEL LOGSTREAM</span>
                <div className="space-y-2.5 max-h-[300px] overflow-y-auto">
                  {logs.map((log, idx) => (
                    <div key={idx} className="font-mono text-[10px] leading-relaxed pb-2.5 border-b border-slate-900 last:border-0">
                      <div className="flex items-center justify-between text-slate-500 mb-0.5">
                        <span>{log.timestamp}</span>
                        <span className="text-blue-400 font-bold uppercase">{log.level}</span>
                      </div>
                      <p className="text-slate-300">{log.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          SUBTAB 8: TESTING COMPLIANCE
          ========================================== */}
      {currentSubTab === "testing" && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-850 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h3 className="text-sm font-extrabold text-white font-mono uppercase">AUTOMATED TEST VALIDATOR SUITE</h3>
              <p className="text-xs text-slate-400 mt-1">
                Executes sandbox constraints, semantic distance indices, multi-agent registries, and workflow DAG runners.
              </p>
            </div>
            <button
              onClick={handleRunSuiteTests}
              disabled={loading}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-mono font-bold tracking-wider shadow-md shadow-blue-600/10 transition-all flex items-center gap-2 shrink-0"
            >
              {loading ? <span className="w-4.5 h-4.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              EXECUTE SUITE MATRIX
            </button>
          </div>

          {testResults.length > 0 && (
            <div className="bg-slate-900 border border-slate-850 rounded-xl p-5 space-y-4">
              <span className="text-xs font-mono font-bold uppercase text-slate-500 tracking-wider">COMPLIANCE TEST METRICS</span>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {testResults.map((test, idx) => (
                  <div key={idx} className="p-3.5 bg-slate-950 rounded-lg border border-slate-850 flex items-center justify-between text-xs font-mono">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 uppercase">[{test.suite}]</span>
                        <span className="font-bold text-white">{test.testName}</span>
                      </div>
                      {test.error && (
                        <p className="text-[10px] text-red-400 mt-1.5 whitespace-pre-wrap leading-relaxed">{test.error}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-4">
                      <span className="text-[10px] text-slate-500">{test.durationMs}ms</span>
                      <span className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase ${
                        test.status === "PASSED"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-red-500/10 text-red-400 border border-red-500/20"
                      }`}>
                        {test.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==========================================
          POPUP MODAL: INSTANTIATE CUSTOM AGENT
          ========================================== */}
      {showAgentModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-extrabold text-white">Instantiate Custom Specialist</h3>
            
            <div className="grid grid-cols-2 gap-4 text-xs font-mono">
              <div className="space-y-1">
                <label className="text-slate-400">AGENT ID (Unique)</label>
                <input
                  type="text"
                  placeholder="e.g. agt-custom-auditor"
                  value={newAgentData.id}
                  onChange={(e) => setNewAgentData({ ...newAgentData, id: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400">NAME</label>
                <input
                  type="text"
                  placeholder="e.g. Security Specialist"
                  value={newAgentData.name}
                  onChange={(e) => setNewAgentData({ ...newAgentData, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="space-y-1 col-span-2">
                <label className="text-slate-400">ROLE TITLE</label>
                <input
                  type="text"
                  placeholder="e.g. Code vulnerability examiner"
                  value={newAgentData.role}
                  onChange={(e) => setNewAgentData({ ...newAgentData, role: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="space-y-1 col-span-2">
                <label className="text-slate-400">DESCRIPTION</label>
                <input
                  type="text"
                  placeholder="e.g. Audits incoming project statements against SQL injection vulnerabilities."
                  value={newAgentData.description}
                  onChange={(e) => setNewAgentData({ ...newAgentData, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="space-y-1 col-span-2">
                <label className="text-slate-400">SYSTEM PROMPT</label>
                <textarea
                  value={newAgentData.systemPrompt}
                  onChange={(e) => setNewAgentData({ ...newAgentData, systemPrompt: e.target.value })}
                  className="w-full h-24 bg-slate-950 border border-slate-800 rounded p-3 text-white focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-850">
              <button
                onClick={() => setShowAgentModal(false)}
                className="px-4 py-2 bg-slate-950 hover:bg-slate-850 text-slate-400 rounded-lg text-xs font-mono font-bold"
              >
                CANCEL
              </button>
              <button
                onClick={handleCreateAgent}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-mono font-bold"
              >
                SPAWN INSTANCE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          POPUP MODAL: BUILD NEW WORKFLOW
          ========================================== */}
      {showWorkflowModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-extrabold text-white">Create New Orchestration Plan</h3>
            
            <div className="space-y-3 text-xs font-mono">
              <div className="space-y-1">
                <label className="text-slate-400">PLAN NAME</label>
                <input
                  type="text"
                  placeholder="e.g. Audit PR branch"
                  value={newWfData.name}
                  onChange={(e) => setNewWfData({ ...newWfData, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400">DESCRIPTION</label>
                <input
                  type="text"
                  placeholder="e.g. Initiates code scans, validates test compilations and registers reports."
                  value={newWfData.description}
                  onChange={(e) => setNewWfData({ ...newWfData, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400">PRIMARY TASK AGENT PROMPT</label>
                <input
                  type="text"
                  placeholder="e.g. Find OWASP loopholes"
                  value={newWfData.promptNode}
                  onChange={(e) => setNewWfData({ ...newWfData, promptNode: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400">DELEGATE TO SPECIALIST</label>
                <select
                  value={newWfData.selectedAgent}
                  onChange={(e) => setNewWfData({ ...newWfData, selectedAgent: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  {agents.map(a => (
                    <option key={a.id} value={a.id}>{a.name} ({a.role})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-850">
              <button
                onClick={() => setShowWorkflowModal(false)}
                className="px-4 py-2 bg-slate-950 hover:bg-slate-850 text-slate-400 rounded-lg text-xs font-mono font-bold"
              >
                CANCEL
              </button>
              <button
                onClick={handleCreateWorkflow}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-mono font-bold"
              >
                ASSEMBLE PIPELINE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
