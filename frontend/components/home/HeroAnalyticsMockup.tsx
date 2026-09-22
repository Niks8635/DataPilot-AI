"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  BarChart3, 
  Database, 
  TrendingUp, 
  ShieldCheck, 
  Sparkles, 
  Cpu, 
  ArrowRight,
  Maximize2,
  Filter,
  Layers,
  Table
} from "lucide-react";
import { Sparkline } from "@/components/ui/Sparkline";
import { Badge } from "@/components/ui/Badge";
import { DynamicChart } from "@/components/charts/DynamicChart";
import { ChartConfig } from "@/types";

const SAMPLE_REVENUE_CHART: ChartConfig = {
  chart_id: "hero_rev",
  chart_type: "line",
  title: "Revenue Trajectory vs. Target",
  subtitle: "Monthly recurring revenue progression across enterprise tiers",
  x_data: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"],
  y_data: [320, 410, 390, 520, 610, 580, 740, 890],
  series: [
    { name: "Actual ARR ($K)", data: [320, 410, 390, 520, 610, 580, 740, 890] },
    { name: "Target Budget", data: [300, 350, 400, 480, 550, 620, 700, 800] }
  ]
};

export function HeroAnalyticsMockup() {
  const [activeTab, setActiveTab] = useState<"visuals" | "data" | "insights">("visuals");

  return (
    <div className="w-full rounded-3xl border border-white/[0.1] bg-gradient-to-b from-[#121722] via-[#0D1117] to-[#080A0F] p-4 sm:p-6 shadow-[0_30px_90px_rgba(0,0,0,0.8)] relative overflow-hidden specular-top">
      {/* Top Window Chrome Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-5 border-b border-white/[0.08]">
        {/* Window Dots + Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500/80" />
            <span className="w-3 h-3 rounded-full bg-slate-600/80" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
          </div>
          <div className="flex items-center gap-2 text-xs font-mono">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.05] border border-white/[0.1] text-white font-semibold">
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              <span>workspace_sales_q3.parquet</span>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 font-bold text-[11px] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              96/100 Quality Score
            </span>
          </div>
        </div>

        {/* Status Indicators & Navigation Tabs */}
        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950/80 border border-white/[0.08] text-[11px] font-mono text-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>14,280 Rows Analyzed</span>
          </div>

          <div className="flex items-center p-0.5 rounded-xl bg-slate-950/90 border border-white/[0.08] text-xs">
            <button
              onClick={() => setActiveTab("visuals")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === "visuals" 
                  ? "bg-violet-600 text-white font-semibold shadow-md shadow-violet-600/30" 
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Visual Analytics
            </button>
            <button
              onClick={() => setActiveTab("data")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === "data" 
                  ? "bg-violet-600 text-white font-semibold shadow-md shadow-violet-600/30" 
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Data Grid
            </button>
            <button
              onClick={() => setActiveTab("insights")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === "insights" 
                  ? "bg-violet-600 text-white font-semibold shadow-md shadow-violet-600/30" 
                  : "text-slate-400 hover:text-white"
              }`}
            >
              AI Insights
            </button>
          </div>
        </div>
      </div>

      {/* Main Bento Analytics Content */}
      {activeTab === "visuals" && (
        <div className="space-y-4">
          {/* 4 Bento KPI Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="p-4.5 rounded-2xl border border-white/[0.08] bg-slate-950/70 hover:border-cyan-500/40 transition-all group">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span className="group-hover:text-cyan-300 transition">Total Revenue</span>
                <span className="text-emerald-400 font-bold">+24.2%</span>
              </div>
              <div className="text-2xl sm:text-3xl font-bold font-mono text-white mt-1.5">$1,842,500</div>
              <div className="mt-2.5 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-mono">Q3 Run Rate</span>
                <Sparkline data={[12, 16, 19, 23, 22, 28, 32]} color="cyan" width={60} height={20} />
              </div>
            </div>

            <div className="p-4.5 rounded-2xl border border-white/[0.08] bg-slate-950/70 hover:border-blue-500/40 transition-all group">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span className="group-hover:text-blue-300 transition">Orders Processed</span>
                <span className="text-emerald-400 font-bold">+12.8%</span>
              </div>
              <div className="text-2xl sm:text-3xl font-bold font-mono text-white mt-1.5">14,280</div>
              <div className="mt-2.5 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-mono">0 Failed Drops</span>
                <Sparkline data={[80, 85, 92, 98, 105, 114]} color="blue" width={60} height={20} />
              </div>
            </div>

            <div className="p-4.5 rounded-2xl border border-white/[0.08] bg-slate-950/70 hover:border-purple-500/40 transition-all group">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span className="group-hover:text-purple-300 transition">Active Accounts</span>
                <span className="text-purple-400 font-bold">4,821</span>
              </div>
              <div className="text-2xl sm:text-3xl font-bold font-mono text-white mt-1.5">94.6% Ret</div>
              <div className="mt-2.5 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-mono">Top Tier: Enterprise</span>
                <Sparkline data={[40, 42, 45, 48, 51, 53]} color="violet" width={60} height={20} />
              </div>
            </div>

            <div className="p-4.5 rounded-2xl border border-white/[0.08] bg-slate-950/70 hover:border-emerald-500/40 transition-all group">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span className="group-hover:text-emerald-300 transition">Data Quality</span>
                <span className="text-emerald-400 font-bold">Pristine</span>
              </div>
              <div className="text-2xl sm:text-3xl font-bold font-mono text-emerald-400 mt-1.5">98 / 100</div>
              <div className="mt-2.5 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-mono">0 Corrupt Cells</span>
                <Sparkline data={[88, 90, 93, 95, 98]} color="emerald" width={60} height={20} />
              </div>
            </div>
          </div>

          {/* Chart + AI Intelligence Strip */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 p-4 sm:p-5 rounded-2xl border border-white/[0.08] bg-slate-950/80 flex flex-col justify-between">
              <div className="flex items-center justify-between pb-2 mb-1 border-b border-white/[0.05]">
                <div className="flex items-center gap-2 text-xs font-semibold text-white">
                  <BarChart3 className="w-4 h-4 text-cyan-400" />
                  <span>Revenue Trajectory vs. Target</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">Monthly Run Rate</span>
              </div>
              <DynamicChart
                config={SAMPLE_REVENUE_CHART}
                height={240}
                color_palette="blue"
                theme="dark"
                showToolbar={false}
              />
            </div>

            {/* AI Real-time Insight Card */}
            <div className="p-5 rounded-2xl border border-purple-500/30 bg-gradient-to-b from-purple-950/20 to-slate-950/80 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-mono text-purple-300 pb-2 border-b border-white/[0.06] mb-3">
                  <span className="flex items-center gap-1.5 font-bold">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    AI Insight & Analysis
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono">✓ Verified</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  Enterprise tier revenue accelerated by <strong className="text-emerald-400">+24.2%</strong> in Q3. 
                  North America contributed <strong className="text-cyan-300">58.4%</strong> of net-new expansion.
                </p>
                <div className="mt-3 p-2.5 rounded-xl bg-slate-900/80 border border-white/[0.06] text-[11px] font-mono text-slate-400">
                  <span>Confidence: 99.4% • Statistical Proof</span>
                </div>
              </div>

              <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400">Grounded in Dataset</span>
                <Link href="/dashboards" className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1">
                  Explore Visual Analytics <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "data" && (
        <div className="rounded-2xl border border-white/[0.08] overflow-hidden bg-slate-950/90">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-900/90 text-slate-400 font-mono text-[10px] uppercase border-b border-white/[0.08]">
              <tr>
                <th className="p-3">Order_ID (int)</th>
                <th className="p-3">Customer_Region (str)</th>
                <th className="p-3">Product_Line (str)</th>
                <th className="p-3">ARR_Amount (float)</th>
                <th className="p-3">Status (badge)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05] font-mono text-[11px]">
              {[
                { id: "ORD-8491", region: "North America", prod: "Enterprise Suite", arr: "$42,500.00", status: "Active" },
                { id: "ORD-8492", region: "EMEA", prod: "AI Intelligence Core", arr: "$28,900.00", status: "Active" },
                { id: "ORD-8493", region: "APAC", prod: "Analytics Studio", arr: "$19,200.00", status: "Active" },
                { id: "ORD-8494", region: "Latin America", prod: "Enterprise Suite", arr: "$34,100.00", status: "Active" },
                { id: "ORD-8495", region: "North America", prod: "Security Enclave", arr: "$51,000.00", status: "Active" },
              ].map((row, idx) => (
                <tr key={idx} className="hover:bg-white/[0.02]">
                  <td className="p-3 text-cyan-400">{row.id}</td>
                  <td className="p-3 text-slate-300">{row.region}</td>
                  <td className="p-3 text-white font-medium">{row.prod}</td>
                  <td className="p-3 text-emerald-400 font-bold">{row.arr}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px]">
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "insights" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl border border-white/[0.08] bg-slate-950/80 space-y-2">
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-bold">
              <Sparkles className="w-4 h-4" />
              <span>Statistical Driver Discovery</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Pearson correlation between <code>Enterprise Seat Upgrades</code> and <code>Net Retention</code> measured at <strong>0.88</strong> (strong positive relationship).
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-white/[0.08] bg-slate-950/80 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>Anomaly Quarantine Report</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Zero corrupt records found. 7 statistical outliers capped at 1.5x IQR boundaries without data loss.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
