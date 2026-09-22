"use client";

import React from "react";
import { Database, Cpu, Sparkles, LineChart, LayoutDashboard, ArrowDown } from "lucide-react";

interface PipelineNode {
  id: string;
  label: string;
  sublabel: string;
  icon: React.ElementType;
  color: "cyan" | "purple" | "mint" | "indigo";
}

const NODES: PipelineNode[] = [
  { id: "raw", label: "Raw Data Ingestion", sublabel: "CSV, Excel, Parquet, JSON", icon: Database, color: "indigo" },
  { id: "clean", label: "AST Deterministic Cleaning", sublabel: "Imputation & IQR Bounds", icon: Cpu, color: "mint" },
  { id: "ai", label: "Autonomous Analysis", sublabel: "Pearson Correlation & EDA", icon: Sparkles, color: "purple" },
  { id: "insights", label: "Grounded Insights", sublabel: "Statistical Driver Attribution", icon: LineChart, color: "cyan" },
  { id: "dash", label: "Executive Dashboard", sublabel: "Power BI Canvas & Reports", icon: LayoutDashboard, color: "purple" },
];

export function DataPipelineVisual({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#121722] to-[#080A0F] p-6 relative overflow-hidden specular-top shadow-xl ${className}`}
    >
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-24 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-cyan-500/10 blur-[50px] pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/[0.06] text-xs">
        <div className="flex items-center gap-2 font-mono">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="font-semibold text-white uppercase tracking-wider text-[11px]">
            Data Transformation Pipeline
          </span>
        </div>
        <span className="text-[10px] font-mono text-slate-500">Autonomous Air-Gapped Flow</span>
      </div>

      {/* Connected Nodes Row (Desktop) / Column (Mobile) */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 relative z-10">
        {NODES.map((node, idx) => {
          const Icon = node.icon;
          const isLast = idx === NODES.length - 1;

          const colorClasses = {
            cyan: "border-cyan-500/30 text-cyan-400 bg-cyan-500/10 hover:border-cyan-500/60 shadow-cyan-500/10",
            purple: "border-purple-500/30 text-purple-400 bg-purple-500/10 hover:border-purple-500/60 shadow-purple-500/10",
            mint: "border-emerald-500/30 text-emerald-400 bg-emerald-500/10 hover:border-emerald-500/60 shadow-emerald-500/10",
            indigo: "border-indigo-500/30 text-indigo-400 bg-indigo-500/10 hover:border-indigo-500/60 shadow-indigo-500/10",
          }[node.color];

          return (
            <React.Fragment key={node.id}>
              {/* Node Card */}
              <div
                className={`flex-1 w-full md:w-auto p-3.5 rounded-xl border transition-all duration-300 hover:-translate-y-1 shadow-lg ${colorClasses}`}
              >
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div className="p-1.5 rounded-lg bg-slate-950/60 border border-white/[0.08]">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="font-semibold text-xs text-white tracking-tight truncate">
                    {node.label}
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 font-mono leading-tight pl-0.5">
                  {node.sublabel}
                </div>
              </div>

              {/* Connecting glowing line / arrow */}
              {!isLast && (
                <div className="flex items-center justify-center shrink-0 my-1 md:my-0">
                  {/* Desktop horizontal flow line */}
                  <div className="hidden md:flex items-center text-slate-600">
                    <svg width="28" height="12" viewBox="0 0 28 12" fill="none">
                      <path
                        d="M0 6H24M24 6L19 1M24 6L19 11"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeDasharray="2 2"
                        className="animate-pulse"
                      />
                    </svg>
                  </div>

                  {/* Mobile vertical flow arrow */}
                  <div className="md:hidden flex items-center justify-center py-1 text-slate-600">
                    <ArrowDown className="w-3.5 h-3.5" />
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
