import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  Server,
  Fingerprint,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  Sliders,
  DollarSign,
  Cpu,
  Activity,
  CheckCircle,
  Clock
} from "lucide-react";
import { AuditLog, Model } from "../types";

interface AdminTabProps {
  token: string;
}

export default function AdminTab({ token }: AdminTabProps) {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Parameter editing states
  const [editingModelId, setEditingModelId] = useState<string | null>(null);
  const [inputCost, setInputCost] = useState("");
  const [outputCost, setOutputCost] = useState("");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchAdminConsole = async () => {
    setLoading(true);
    try {
      // 1. Fetch Audit logs
      const auditRes = await fetch("/api/admin/audit-logs", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const auditData = await auditRes.json();
      setAuditLogs(auditData);

      // 2. Fetch Models
      const mRes = await fetch("/api/gateway/models", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const mData = await mRes.json();
      setModels(mData);

      // 3. Fetch Providers dynamically
      const pRes = await fetch("/api/admin/providers", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const pData = await pRes.json();

      // Fetch health and status reports
      const healthRes = await fetch("/api/health");
      const healthData = await healthRes.json();
      const healthReport = healthData.aiGateway?.healthReport || {};
      
      const combinedProviders = pData.map((p: any) => ({
        ...p,
        active: p.isActive,
        status: healthReport[p.id] || p.healthStatus || "healthy"
      }));

      setProviders(combinedProviders);
    } catch (e) {
      console.error("Admin aggregation fail:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminConsole();
  }, []);

  // Update Model pricing parameters
  const saveModelPricing = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/models/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          costPer1kInput: parseFloat(inputCost),
          costPer1kOutput: parseFloat(outputCost)
        })
      });
      if (res.ok) {
        setSuccessMsg("Model cost thresholds updated successfully.");
        setEditingModelId(null);
        fetchAdminConsole();
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch {}
  };

  const toggleProviderState = async (id: string, currentActive: boolean) => {
    try {
      const res = await fetch(`/api/admin/providers/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          isActive: !currentActive
        })
      });
      if (res.ok) {
        fetchAdminConsole();
      }
    } catch {}
  };

  return (
    <div id="admin-tab-panel" className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white font-sans">Admin Console</h2>
          <p className="text-slate-400 text-sm mt-1">Review system audit trails, model configuration parameters, and provider toggles</p>
        </div>
        <button
          onClick={fetchAdminConsole}
          className="bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 p-2 rounded-lg text-sm transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-900/50 rounded-lg text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Models Configuration & Provider control row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Gateway Model Parameter Controllers (2 cols) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Sliders className="w-4.5 h-4.5 text-blue-400" />
            <h3 className="text-sm font-semibold text-white">Models Config & cost thresholds</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-850 text-slate-400 font-bold uppercase tracking-wider text-[10px] font-mono">
                  <th className="py-3 px-2">Model ID</th>
                  <th className="py-3 px-2">Cost/1k In</th>
                  <th className="py-3 px-2">Cost/1k Out</th>
                  <th className="py-3 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850/60">
                {models.map((m) => {
                  const isEditing = editingModelId === m.id;
                  return (
                    <tr key={m.id} className="hover:bg-slate-950/20 transition-colors">
                      <td className="py-3.5 px-2 font-semibold text-white">
                        <div className="flex items-center gap-2">
                          <Cpu className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          <span>{m.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono block mt-0.5">{m.apiName}</span>
                      </td>
                      <td className="py-3.5 px-2 font-mono">
                        {isEditing ? (
                          <input
                            type="text"
                            value={inputCost}
                            onChange={(e) => setInputCost(e.target.value)}
                            className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-blue-400 w-20"
                          />
                        ) : (
                          <span className="text-slate-300 font-semibold">${m.costPer1kInput.toFixed(6)}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-2 font-mono">
                        {isEditing ? (
                          <input
                            type="text"
                            value={outputCost}
                            onChange={(e) => setOutputCost(e.target.value)}
                            className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-blue-400 w-20"
                          />
                        ) : (
                          <span className="text-slate-300 font-semibold">${m.costPer1kOutput.toFixed(6)}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-2 text-right">
                        {isEditing ? (
                          <div className="flex gap-1.5 justify-end">
                            <button
                              onClick={() => saveModelPricing(m.id)}
                              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] px-2.5 py-1 rounded"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingModelId(null)}
                              className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] px-2.5 py-1 rounded"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            id={`admin-edit-pricing-${m.id}`}
                            onClick={() => {
                              setEditingModelId(m.id);
                              setInputCost(m.costPer1kInput.toString());
                              setOutputCost(m.costPer1kOutput.toString());
                            }}
                            className="text-blue-400 hover:text-blue-300 hover:underline font-bold text-[11px]"
                          >
                            Update cost metrics
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Provider Toggle Switches (1 col) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Server className="w-4.5 h-4.5 text-blue-400" />
            <h3 className="text-sm font-semibold text-white">Registry Routing failovers</h3>
          </div>

          <div className="space-y-4 pt-2 max-h-[550px] overflow-y-auto pr-1">
            {providers.map((p) => (
              <div key={p.id} className="flex items-center justify-between bg-slate-950 border border-slate-850 p-3.5 rounded-xl">
                <div>
                  <span className="block text-xs font-semibold text-white">{p.name}</span>
                  <span className="text-[10px] text-slate-500 font-mono">Status: {p.status}</span>
                </div>
                <button
                  id={`admin-toggle-prov-${p.id}`}
                  onClick={() => toggleProviderState(p.id, p.active)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  {p.active ? (
                    <ToggleRight className="w-8 h-8 text-blue-500" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-slate-600" />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Security Audit log stream panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
          <Fingerprint className="w-4.5 h-4.5 text-blue-400" />
          <h3 className="text-sm font-semibold text-white">System Security Audit Log stream</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-850 text-slate-400 font-bold uppercase tracking-wider text-[10px] font-mono">
                <th className="py-3 px-2">Timestamp</th>
                <th className="py-3 px-2">Action</th>
                <th className="py-3 px-2">IP Address</th>
                <th className="py-3 px-2">Log Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850/60 divide-dashed font-mono">
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-slate-500 text-center font-sans text-xs">No logs registered yet.</td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-950/10 transition-colors">
                    <td className="py-3.5 px-2 text-slate-400 text-[11px] whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.action.includes("REGISTER") || log.action.includes("CREATE")
                          ? "bg-emerald-950/40 text-emerald-400 border border-emerald-900/15"
                          : "bg-blue-950/40 text-blue-400 border border-blue-900/15"
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-2 text-slate-400 text-[11px]">
                      {log.ipAddress || "127.0.0.1"}
                    </td>
                    <td className="py-3.5 px-2 text-slate-300 text-[11px] font-sans">
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
