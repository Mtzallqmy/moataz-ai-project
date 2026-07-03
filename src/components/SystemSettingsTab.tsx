import React, { useState, useEffect } from "react";
import {
  Sliders,
  User,
  Building2,
  Flag,
  Activity,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Cpu,
  Clock,
  Save,
  Globe,
  Settings
} from "lucide-react";

interface SystemSettingsTabProps {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export default function SystemSettingsTab({ token, user }: SystemSettingsTabProps) {
  const isAdmin = user.role === "ADMIN";

  // System Settings state
  const [settings, setSettings] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Success Feedbacks
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchSettingsAndJobs = async () => {
    setLoading(true);
    try {
      // 1. Fetch system settings
      const settingsRes = await fetch("/api/settings/system", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (settingsRes.ok) {
        const data = await settingsRes.json();
        setSettings(data);
      }

      // 2. Fetch background jobs (admins only)
      if (isAdmin) {
        const jobsRes = await fetch("/api/jobs", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (jobsRes.ok) {
          const jobsData = await jobsRes.json();
          setJobs(jobsData);
        }
      }
    } catch (e) {
      console.error("Failed to load settings metrics:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettingsAndJobs();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/settings/system", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });

      if (res.ok) {
        setSuccessMsg("System configuration state persisted securely.");
        setTimeout(() => setSuccessMsg(null), 3000);
        fetchSettingsAndJobs();
      }
    } catch {
      console.error("Save system configs failure");
    }
  };

  const handleTriggerJob = async (jobName: string, queue: string) => {
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: jobName,
          queue,
          data: { triggeredBy: user.email }
        })
      });

      if (res.ok) {
        setSuccessMsg(`Background Job "${jobName}" spawned inside bullmq queue.`);
        setTimeout(() => setSuccessMsg(null), 3000);
        fetchSettingsAndJobs();
      }
    } catch {
      console.error("Trigger job failure");
    }
  };

  const updateSettingField = (category: string, field: string, value: any) => {
    setSettings((prev: any) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
  };

  if (loading && !settings) {
    return (
      <div className="flex justify-center py-20">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div id="system-settings-tab" className="p-8 max-w-7xl mx-auto space-y-8 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Platform Settings</h2>
          <p className="text-slate-400 text-sm mt-1">
            Configure system engineering variables, feature flags, workspace constraints, and monitor active background indexing workers
          </p>
        </div>
        <button
          onClick={fetchSettingsAndJobs}
          className="bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 p-2.5 rounded-lg text-sm transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-950/40 border border-emerald-900/40 rounded-lg text-emerald-400 text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Panel 1: Localization & Appearance */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
              <Globe className="w-4.5 h-4.5 text-blue-400" />
              <h3 className="text-sm font-semibold text-white">Localization & Customization</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-mono text-slate-500 font-bold mb-1.5 uppercase">
                  Default Language
                </label>
                <select
                  value={settings?.localization?.defaultLanguage || "en"}
                  onChange={(e) => updateSettingField("localization", "defaultLanguage", e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-sans"
                >
                  <option value="en">English (US)</option>
                  <option value="ar">Arabic (العربية)</option>
                  <option value="fr">French (Français)</option>
                  <option value="de">German (Deutsch)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-500 font-bold mb-1.5 uppercase">
                  Timezone Cluster
                </label>
                <select
                  value={settings?.localization?.defaultTimezone || "UTC"}
                  onChange={(e) => updateSettingField("localization", "defaultTimezone", e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                >
                  <option value="UTC">UTC (Universal)</option>
                  <option value="EST">EST (New York)</option>
                  <option value="PST">PST (Los Angeles)</option>
                  <option value="EET">EET (Cairo/Beirut)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-500 font-bold mb-1.5 uppercase">
                  Active Brand Accent Theme
                </label>
                <select
                  value={settings?.appearance?.brandColor || "blue"}
                  onChange={(e) => updateSettingField("appearance", "brandColor", e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-sans capitalize"
                >
                  <option value="blue">Slate Blue</option>
                  <option value="violet">Cosmic Violet</option>
                  <option value="rose">Sunset Rose</option>
                  <option value="emerald">Forest Emerald</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-500 font-bold mb-1.5 uppercase">
                  Corporate Logo URL
                </label>
                <input
                  type="text"
                  placeholder="e.g. /assets/logo.png"
                  value={settings?.appearance?.logoUrl || ""}
                  onChange={(e) => updateSettingField("appearance", "logoUrl", e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Panel 2: Global Security and Organization Capabilities (Admin Only) */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
              <Building2 className="w-4.5 h-4.5 text-blue-400" />
              <h3 className="text-sm font-semibold text-white">Organization Caps & Constraints</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-mono text-slate-500 font-bold mb-1.5 uppercase">
                  Organization Legal Name
                </label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={settings?.organization?.name || ""}
                  onChange={(e) => updateSettingField("organization", "name", e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 disabled:opacity-50 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-500 font-bold mb-1.5 uppercase">
                  Max Projects Per User
                </label>
                <input
                  type="number"
                  disabled={!isAdmin}
                  value={settings?.organization?.maxProjectsPerUser || 10}
                  onChange={(e) => updateSettingField("organization", "maxProjectsPerUser", parseInt(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 disabled:opacity-50 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-500 font-bold mb-1.5 uppercase">
                  Max Files Per Project
                </label>
                <input
                  type="number"
                  disabled={!isAdmin}
                  value={settings?.organization?.maxFilesPerProject || 50}
                  onChange={(e) => updateSettingField("organization", "maxFilesPerProject", parseInt(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 disabled:opacity-50 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-500 font-bold mb-1.5 uppercase">
                  Storage Allocation Per Project (MB)
                </label>
                <input
                  type="number"
                  disabled={!isAdmin}
                  value={Math.round((settings?.organization?.maxStorageBytesPerProject || 104857600) / (1024 * 1024))}
                  onChange={(e) => updateSettingField("organization", "maxStorageBytesPerProject", parseInt(e.target.value) * 1024 * 1024)}
                  className="w-full bg-slate-950 border border-slate-800 disabled:opacity-50 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono font-semibold"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Panel 3: Feature Flags / Switches (Admins Only) */}
        {isAdmin && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
              <Flag className="w-4.5 h-4.5 text-blue-400" />
              <h3 className="text-sm font-semibold text-white">Engine Feature Flags & Integrations</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl flex flex-col justify-between">
                <div>
                  <span className="block text-xs font-bold text-white">Streaming API</span>
                  <span className="block text-[10px] text-slate-500 mt-1">Chunked Server-Sent Events</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer mt-3">
                  <input
                    type="checkbox"
                    checked={settings?.featureFlags?.enableStreaming || false}
                    onChange={(e) => updateSettingField("featureFlags", "enableStreaming", e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl flex flex-col justify-between">
                <div>
                  <span className="block text-xs font-bold text-white">Prompt Templates</span>
                  <span className="block text-[10px] text-slate-500 mt-1">Versioned Shared Schemas</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer mt-3">
                  <input
                    type="checkbox"
                    checked={settings?.featureFlags?.enablePromptLibrary || false}
                    onChange={(e) => updateSettingField("featureFlags", "enablePromptLibrary", e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl flex flex-col justify-between">
                <div>
                  <span className="block text-xs font-bold text-white">RAG Embeddings</span>
                  <span className="block text-[10px] text-slate-500 mt-1">Vector DB Document Indexing</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer mt-3">
                  <input
                    type="checkbox"
                    checked={settings?.featureFlags?.enableKnowledgeBase || false}
                    onChange={(e) => updateSettingField("featureFlags", "enableKnowledgeBase", e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl flex flex-col justify-between">
                <div>
                  <span className="block text-xs font-bold text-white">Usage & Billing</span>
                  <span className="block text-[10px] text-slate-500 mt-1">Aggregate Cost Limits</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer mt-3">
                  <input
                    type="checkbox"
                    checked={settings?.featureFlags?.enableBilling || false}
                    onChange={(e) => updateSettingField("featureFlags", "enableBilling", e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl flex flex-col justify-between">
                <div>
                  <span className="block text-xs font-bold text-white">Self Registration</span>
                  <span className="block text-[10px] text-slate-500 mt-1">Open Signups Gate</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer mt-3">
                  <input
                    type="checkbox"
                    checked={settings?.featureFlags?.enableRegistration || false}
                    onChange={(e) => updateSettingField("featureFlags", "enableRegistration", e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Submit Actions panel */}
        <div className="flex justify-end gap-3 bg-slate-900 border border-slate-800 rounded-xl p-4">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-sm transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Persist System Configs</span>
          </button>
        </div>
      </form>

      {/* Panel 4: Background Jobs Monitor & Ingestion Worker Trigger (Admin Only) */}
      {isAdmin && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Activity className="w-4.5 h-4.5 text-blue-400" />
              <h3 className="text-sm font-semibold text-white">BullMQ Worker queues & active processes</h3>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleTriggerJob("Aggregate System Usage Reports", "metrics-cron")}
                className="bg-slate-950 hover:bg-slate-900 border border-slate-850 text-slate-400 hover:text-white font-mono text-[10px] px-3 py-1.5 rounded transition-all"
              >
                Trigger Metrics Cron
              </button>
              <button
                onClick={() => handleTriggerJob("Recalculate Storage Sizes", "document-indexing")}
                className="bg-slate-950 hover:bg-slate-900 border border-slate-850 text-slate-400 hover:text-white font-mono text-[10px] px-3 py-1.5 rounded transition-all"
              >
                Trigger Index Sweep
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-850 text-slate-400 font-bold uppercase tracking-wider text-[10px] font-mono">
                  <th className="py-3 px-2">Job Identifier</th>
                  <th className="py-3 px-2">Worker Queue</th>
                  <th className="py-3 px-2">Status</th>
                  <th className="py-3 px-2">Telemetry Results</th>
                  <th className="py-3 px-2 text-right">Attempts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850/60 font-mono text-[11px]">
                {jobs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-slate-500 text-center font-sans text-xs">
                      No jobs actively running.
                    </td>
                  </tr>
                ) : (
                  jobs.map((job) => (
                    <tr key={job.id} className="hover:bg-slate-950/10 transition-colors">
                      <td className="py-3.5 px-2 font-semibold text-white">
                        <div className="flex items-center gap-2 font-sans">
                          <Cpu className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          <span>{job.name}</span>
                        </div>
                        <span className="text-[9px] text-slate-500 font-mono block mt-0.5">{job.id}</span>
                      </td>
                      <td className="py-3.5 px-2 text-slate-400 font-mono text-[11px]">
                        {job.queue}
                      </td>
                      <td className="py-3.5 px-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          job.status === "completed"
                            ? "bg-emerald-950/40 text-emerald-400 border border-emerald-900/15"
                            : "bg-blue-950/40 text-blue-400 border border-blue-900/15 animate-pulse"
                        }`}>
                          {job.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-2 text-slate-300 text-[11px] font-sans">
                        {job.result ? JSON.stringify(job.result) : "Processing..."}
                      </td>
                      <td className="py-3.5 px-2 text-right text-slate-400 font-mono">
                        {job.attempts} / {job.maxAttempts}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
