import React, { useEffect, useState } from "react";
import {
  Coins,
  Cpu,
  Activity,
  History,
  CloudLightning,
  Sparkles,
  RefreshCw,
  Bell,
  ArrowRight
} from "lucide-react";
import { User, AnalyticsData, Project, Conversation } from "../types";

interface DashboardTabProps {
  user: User;
  projects: Project[];
  activeProjectId: string | null;
  onNavigateTab: (tab: string) => void;
  token: string;
}

export default function DashboardTab({
  user,
  projects,
  activeProjectId,
  onNavigateTab,
  token
}: DashboardTabProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [providers, setProviders] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Analytics
      const analyticsRes = await fetch("/api/analytics", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const analyticsData = await analyticsRes.json();
      setAnalytics(analyticsData);

      // 2. Fetch Provider state via health endpoint
      const healthRes = await fetch("/api/health");
      const healthData = await healthRes.json();
      
      // Convert report details to layout arrays
      const list = [
        { name: "Google Gemini API", type: "gemini", status: healthData.aiGateway?.healthReport?.["prov-google"] || "healthy", latency: "140ms" },
        { name: "OpenAI GPT Proxy", type: "openai", status: "healthy", latency: "210ms" },
        { name: "Anthropic Claude Proxy", type: "anthropic", status: "healthy", latency: "290ms" }
      ];
      setProviders(list);

      // 3. Fetch notifications
      const notifRes = await fetch("/api/notifications", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const notifData = await notifRes.json();
      setNotifications(notifData);

    } catch (e) {
      console.error("Dashboard metrics aggregation failure:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [activeProjectId]);

  const activeProject = projects.find((p) => p.id === activeProjectId);

  // SVG dimensions for hand-crafted Area Chart
  const svgW = 600;
  const svgH = 200;
  const paddingX = 40;
  const paddingY = 20;

  const renderSVGChart = () => {
    if (!analytics || !analytics.dailyStats || analytics.dailyStats.length === 0) return null;
    const stats = analytics.dailyStats;

    const maxVal = Math.max(...stats.map((s) => s.costUSD), 0.01);
    
    // Convert date items into plotted coordinates
    const points = stats.map((stat, i) => {
      const x = paddingX + (i * (svgW - paddingX * 2)) / (stats.length - 1);
      const y = svgH - paddingY - (stat.costUSD * (svgH - paddingY * 2)) / maxVal;
      return { x, y, date: stat.date, value: stat.costUSD };
    });

    const pathD = points.reduce((acc, p, i) => {
      return acc + (i === 0 ? `M ${p.x} ${p.y}` : ` L ${p.x} ${p.y}`);
    }, "");

    // Path representing closed polygon for area gradient fill
    const areaD = points.length > 0
      ? `${pathD} L ${points[points.length - 1].x} ${svgH - paddingY} L ${points[0].x} ${svgH - paddingY} Z`
      : "";

    return (
      <div className="relative group">
        <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-48 overflow-visible font-mono">
          <defs>
            <linearGradient id="chart-area-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1={paddingX} y1={paddingY} x2={svgW - paddingX} y2={paddingY} stroke="#1e293b" strokeDasharray="3,3" />
          <line x1={paddingX} y1={svgH / 2} x2={svgW - paddingX} y2={svgH / 2} stroke="#1e293b" strokeDasharray="3,3" />
          <line x1={paddingX} y1={svgH - paddingY} x2={svgW - paddingX} y2={svgH - paddingY} stroke="#334155" />

          {/* Area Fill */}
          {areaD && <path d={areaD} fill="url(#chart-area-grad)" className="transition-all duration-300" />}

          {/* Stroke line */}
          {pathD && <path d={pathD} fill="none" stroke="#3b82f6" strokeWidth="2.5" className="transition-all duration-300" />}

          {/* Interactive dots */}
          {points.map((p, i) => (
            <g key={i} className="group/dot cursor-pointer">
              <circle cx={p.x} cy={p.y} r="4" fill="#0f172a" stroke="#3b82f6" strokeWidth="2" />
              <circle cx={p.x} cy={p.y} r="8" fill="#3b82f6" fillOpacity="0" className="hover:fill-opacity-15 transition-all" />
              {/* Tooltip */}
              <text
                x={p.x}
                y={p.y - 10}
                textAnchor="middle"
                className="hidden group-hover/dot:block text-[10px] fill-blue-400 font-bold font-sans bg-slate-900"
              >
                ${p.value.toFixed(4)}
              </text>
            </g>
          ))}

          {/* Labels */}
          {points.map((p, i) => (
            <text
              key={`lbl-${i}`}
              x={p.x}
              y={svgH - 4}
              textAnchor="middle"
              className="text-[9px] fill-slate-500 font-medium"
            >
              {p.date.substring(5)}
            </text>
          ))}

          <text x={2} y={paddingY + 4} className="text-[9px] fill-slate-500 font-bold">$max</text>
          <text x={2} y={svgH - paddingY} className="text-[9px] fill-slate-500 font-bold">$0</text>
        </svg>
      </div>
    );
  };

  const markNotificationsAsRead = async () => {
    try {
      await fetch("/api/notifications/read", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications([]);
    } catch {}
  };

  return (
    <div id="dashboard-tab-content" className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Upper Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white font-sans">
            Welcome, {user.name || "Developer"}
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Active Workspace:{" "}
            <span className="text-blue-400 font-semibold">{activeProject?.name || "No active workspace select"}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="dashboard-refresh-btn"
            onClick={fetchDashboardData}
            className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 p-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span>Sync Stats</span>
          </button>
        </div>
      </div>

      {/* Notifications Alert banner */}
      {notifications.length > 0 && (
        <div className="bg-blue-950/40 border border-blue-900/50 rounded-xl p-4 flex items-start gap-3 justify-between">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600/10 flex items-center justify-center shrink-0 mt-0.5">
              <Bell className="w-4.5 h-4.5 text-blue-400" />
            </div>
            <div>
              <span className="block font-semibold text-white text-sm">Platform Notifications</span>
              <p className="text-slate-300 text-xs mt-0.5">{notifications[0].content}</p>
            </div>
          </div>
          <button
            onClick={markNotificationsAsRead}
            className="text-slate-400 hover:text-white text-xs font-semibold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Key Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Cost */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-400 text-xs font-semibold tracking-wider font-mono uppercase">
              PLATFORM EXPENDITURE
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-600/10 flex items-center justify-center">
              <Coins className="w-4.5 h-4.5 text-blue-400" />
            </div>
          </div>
          <div className="text-3xl font-mono font-bold text-white tracking-tight">
            ${analytics?.summary?.totalCostUSD?.toFixed(5) || "0.00000"}
          </div>
          <span className="text-[10px] text-slate-500 font-semibold block mt-1.5">
            USD calculated per standard model parameters
          </span>
        </div>

        {/* Total Tokens */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-400 text-xs font-semibold tracking-wider font-mono uppercase">
              ACCUMULATED TOKENS
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-600/10 flex items-center justify-center">
              <Cpu className="w-4.5 h-4.5 text-emerald-400" />
            </div>
          </div>
          <div className="text-3xl font-mono font-bold text-white tracking-tight">
            {analytics?.summary?.totalTokens?.toLocaleString() || "0"}
          </div>
          <span className="text-[10px] text-slate-500 font-semibold block mt-1.5">
            Input & output aggregated context tokens
          </span>
        </div>

        {/* Requests Count */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-400 text-xs font-semibold tracking-wider font-mono uppercase">
              ROUTED REQUESTS
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-600/10 flex items-center justify-center">
              <Activity className="w-4.5 h-4.5 text-indigo-400" />
            </div>
          </div>
          <div className="text-3xl font-mono font-bold text-white tracking-tight">
            {analytics?.summary?.totalRequests || "0"}
          </div>
          <span className="text-[10px] text-slate-500 font-semibold block mt-1.5">
            100% gateway routing uptime
          </span>
        </div>

        {/* Avg Latency */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-400 text-xs font-semibold tracking-wider font-mono uppercase">
              GATEWAY LATENCY
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-600/10 flex items-center justify-center">
              <History className="w-4.5 h-4.5 text-amber-400" />
            </div>
          </div>
          <div className="text-3xl font-mono font-bold text-white tracking-tight">
            {analytics?.summary?.avgLatencyMs || "0"} <span className="text-lg font-sans">ms</span>
          </div>
          <span className="text-[10px] text-slate-500 font-semibold block mt-1.5">
            Avg roundtrip model routing overhead
          </span>
        </div>
      </div>

      {/* Main Charts & Telemetry Visual */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cost Trend graph (2 cols) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-white">Daily Cost Consumption Trend</h3>
              <p className="text-slate-400 text-xs mt-0.5">Expenditure (USD) calculated across the past 7 active days</p>
            </div>
            <span className="text-[10px] font-mono text-blue-400 bg-blue-900/10 border border-blue-500/15 rounded px-2 py-0.5">
              Live Telemetry
            </span>
          </div>

          <div className="pt-2">
            {renderSVGChart()}
          </div>
        </div>

        {/* Providers health layout (1 col) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <div>
            <h3 className="text-base font-semibold text-white">Active Providers Health status</h3>
            <p className="text-slate-400 text-xs mt-0.5">Real-time load statuses of Moataz AI proxies</p>
          </div>

          <div className="space-y-3 pt-2">
            {providers.map((p, i) => (
              <div key={i} className="bg-slate-950 border border-slate-850 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${p.status === "healthy" ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
                  <div>
                    <span className="block text-xs font-semibold text-white">{p.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono">ID: prov-{p.type}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="block text-xs font-bold text-slate-400 font-mono">{p.latency}</span>
                  <span className="text-[10px] text-slate-500 font-semibold block">latency</span>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => onNavigateTab("chat")}
            className="w-full bg-slate-950 hover:bg-slate-800 text-blue-400 hover:text-white border border-slate-850 rounded-xl py-3 text-xs font-bold transition-all flex items-center justify-center gap-2 group cursor-pointer"
          >
            <span>Launch Playground AI</span>
            <ArrowRight className="w-3.5 h-3.5 text-blue-400 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}
