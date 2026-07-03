import React, { useState, useEffect } from "react";
import {
  CreditCard,
  PieChart,
  TrendingUp,
  Cpu,
  Coins,
  Check,
  Zap,
  ArrowRight,
  ShieldCheck
} from "lucide-react";
import { User, AnalyticsData, Subscription } from "../types";

interface AnalyticsTabProps {
  token: string;
  user: User;
  onRefreshUser: () => void;
}

export default function AnalyticsTab({ token, user, onRefreshUser }: AnalyticsTabProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSub, setActiveSub] = useState<Subscription | null>(null);
  const [planChanging, setPlanChanging] = useState<string | null>(null);

  const fetchAnalyticsAndBilling = async () => {
    setLoading(true);
    try {
      // 1. Analytics
      const res = await fetch("/api/analytics", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setAnalytics(data);

      // 2. User info (includes subscription status)
      const userRes = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const userData = await userRes.json();
      setActiveSub(userData.subscription);
    } catch {}
    finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsAndBilling();
  }, []);

  const handleSubscribe = async (plan: "FREE" | "PRO" | "ENTERPRISE") => {
    setPlanChanging(plan);
    try {
      const res = await fetch("/api/billing/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ plan })
      });
      const data = await res.json();
      if (res.ok) {
        setActiveSub(data);
        onRefreshUser();
      }
    } catch {}
    finally {
      setPlanChanging(null);
    }
  };

  const plans = [
    {
      id: "FREE",
      name: "Free Sandbox",
      price: "$0",
      period: "forever",
      desc: "For exploring AI routing foundations and developers testing core endpoints.",
      features: [
        "10k monthly sandbox tokens",
        "Gemini 3.5 Flash Model access",
        "Local filesystem storage index",
        "Standard request latencies",
      ],
      color: "border-slate-800 bg-slate-900/40 text-slate-400"
    },
    {
      id: "PRO",
      name: "Developer Pro",
      price: "$29",
      period: "month",
      desc: "For production scaling and multiple active model selections with pricing optimization.",
      features: [
        "2M high-speed quota tokens",
        "Gemini 3.1 Pro (Preview) access",
        "Full simulation of GPT-4o & Claude",
        "Local + AWS S3 active drivers",
        "Dynamic SSE chat streaming",
      ],
      color: "border-blue-500/50 bg-blue-950/10 text-blue-400 shadow-md shadow-blue-500/5"
    },
    {
      id: "ENTERPRISE",
      name: "Moataz Enterprise",
      price: "$299",
      period: "month",
      desc: "For complex product backends requiring high-volume failovers and strict SLAs.",
      features: [
        "Unlimited custom quota limits",
        "Custom provider routing maps",
        "Access to all model parameters",
        "Admin telemetry and Audit logs",
        "Dedicated database clusters",
        "Secure priority support",
      ],
      color: "border-violet-500/50 bg-violet-950/10 text-violet-400 shadow-md shadow-violet-500/5"
    }
  ];

  return (
    <div id="analytics-tab-panel" className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Upper header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-white font-sans">Billing & Usage analytics</h2>
        <p className="text-slate-400 text-sm mt-1">Review model-by-model pricing allocations, query cost aggregates, and upgrade plans</p>
      </div>

      {/* Usage Analytics Distributions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Model-by-model Cost breakdown list */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <PieChart className="w-4.5 h-4.5 text-blue-400" />
              <h3 className="text-sm font-semibold text-white">Model Cost Distributions</h3>
            </div>
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold">Accumulated costs</span>
          </div>

          <div className="space-y-4 pt-2">
            {!analytics || analytics.modelDistribution.length === 0 ? (
              <p className="text-slate-500 text-xs py-8 text-center">No cost distribution data available yet. Start chats in AI Playground.</p>
            ) : (
              analytics.modelDistribution.map((m, i) => {
                // Calculate percentage of total cost
                const pct = analytics.summary.totalCostUSD > 0
                  ? (m.costUSD / analytics.summary.totalCostUSD) * 100
                  : 0;

                return (
                  <div key={i} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-white">{m.modelName}</span>
                      <span className="text-slate-400 font-mono">${m.costUSD.toFixed(5)} ({pct.toFixed(1)}%)</span>
                    </div>
                    {/* Visual bar meter */}
                    <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-850">
                      <div
                        className="bg-blue-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Pricing reference calculations info */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <TrendingUp className="w-4.5 h-4.5 text-blue-400" />
            <h3 className="text-sm font-semibold text-white">Moataz AI Savings Analytics</h3>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="bg-slate-950 p-4 border border-slate-850 rounded-xl">
              <span className="text-[10px] text-slate-500 font-mono font-bold block uppercase tracking-wider">Average token Cost</span>
              <div className="text-lg font-bold text-white font-mono mt-1">$0.00034 <span className="text-xs font-sans text-slate-500">/1k</span></div>
            </div>
            <div className="bg-slate-950 p-4 border border-slate-850 rounded-xl">
              <span className="text-[10px] text-slate-500 font-mono font-bold block uppercase tracking-wider">Router optimization</span>
              <div className="text-lg font-bold text-emerald-400 font-mono mt-1">-74.2% <span className="text-xs font-sans text-slate-500">saved</span></div>
            </div>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed font-sans mt-2">
            The Moataz AI multi-provider router analyzes request prompts and routes simple queries to cheaper, faster models (Gemini 3.5 Flash) and locks complex codes triggers onto heavy reasoning models. These dynamic failovers safeguard pricing budgets.
          </p>
        </div>
      </div>

      {/* Subscription Switching Pricing Tiers */}
      <div className="space-y-6 pt-4">
        <div>
          <h3 className="text-xl font-bold text-white font-sans">Switch subscription tiers</h3>
          <p className="text-slate-400 text-xs mt-0.5">Toggle live billing packages and unlock premium models within the gateway registry</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((p) => {
            const isCurrent = activeSub?.plan === p.id;
            const changing = planChanging === p.id;

            return (
              <div
                key={p.id}
                className={`border rounded-2xl p-6 flex flex-col justify-between relative ${p.color} ${
                  isCurrent ? "ring-2 ring-blue-500" : ""
                }`}
              >
                {/* Active banner badge */}
                {isCurrent && (
                  <span className="absolute top-3 right-3 bg-blue-600 text-white font-mono font-bold text-[8px] tracking-widest px-2 py-0.5 rounded-full">
                    CURRENT ACTIVE PLAN
                  </span>
                )}

                <div className="space-y-4">
                  <div>
                    <h4 className="text-base font-bold text-white">{p.name}</h4>
                    <p className="text-slate-400 text-xs mt-1 leading-relaxed">{p.desc}</p>
                  </div>

                  <div className="flex items-baseline gap-1 py-1">
                    <span className="text-3xl font-mono font-bold text-white">{p.price}</span>
                    <span className="text-slate-500 text-xs">/ {p.period}</span>
                  </div>

                  <div className="border-t border-slate-850/60 pt-4 space-y-2.5">
                    {p.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6">
                  {isCurrent ? (
                    <div className="w-full bg-slate-900 border border-slate-800 text-slate-400 font-semibold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 cursor-not-allowed">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Plan Active</span>
                    </div>
                  ) : (
                    <button
                      id={`billing-upgrade-btn-${p.id}`}
                      disabled={!!planChanging}
                      onClick={() => handleSubscribe(p.id as any)}
                      className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 group cursor-pointer"
                    >
                      {changing ? (
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Zap className="w-3.5 h-3.5 fill-white" />
                          <span>Unlock {p.name}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-white/70 group-hover:translate-x-0.5 transition-transform" />
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
