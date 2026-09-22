"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle2, Sparkles, Cpu, ShieldCheck, Activity } from "lucide-react";
import { Badge } from "./Badge";

interface StepItem {
  id: string;
  title: string;
  details: string[];
  status: "complete" | "in-progress" | "pending";
}

interface AiAnalystIndicatorProps {
  currentStep?: number;
  interactive?: boolean;
  className?: string;
}

const DEFAULT_STEPS: StepItem[] = [
  {
    id: "step-1",
    title: "Understanding Dataset",
    details: ["18 columns detected & typed", "24,821 rows analyzed (0 corruption)"],
    status: "complete",
  },
  {
    id: "step-2",
    title: "Finding Patterns & Anomalies",
    details: ["4 statistically significant trends identified", "7 outliers isolated in IQR bounds"],
    status: "complete",
  },
  {
    id: "step-3",
    title: "Generating Executive Insights",
    details: ["Synthesizing driver attribution matrix", "Compiling boardroom executive briefing"],
    status: "in-progress",
  },
];

export function AiAnalystIndicator({
  currentStep = 2,
  interactive = false,
  className = "",
}: AiAnalystIndicatorProps) {
  const [steps, setSteps] = useState<StepItem[]>(DEFAULT_STEPS);

  return (
    <div
      className={`rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#121722] to-[#0D1117] p-5 text-left shadow-xl relative overflow-hidden specular-top ${className}`}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/[0.07]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Cpu className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold">
              AI Autonomous Analyst
            </div>
            <div className="text-xs font-semibold text-white">AST Verification Pipeline</div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Active Core v2.4</span>
        </div>
      </div>

      {/* Progressive Stepper */}
      <div className="space-y-4">
        {steps.map((step, idx) => {
          const isDone = step.status === "complete";
          const isInProgress = step.status === "in-progress";

          return (
            <div key={step.id} className="relative pl-6 text-xs">
              {/* Vertical connector line */}
              {idx < steps.length - 1 && (
                <div
                  className={`absolute left-2.5 top-5 w-[1px] h-full ${
                    isDone ? "bg-emerald-500/40" : "bg-white/[0.08]"
                  }`}
                />
              )}

              {/* Step indicator node */}
              <div
                className={`absolute left-0 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                  isDone
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                    : isInProgress
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 radar-beacon"
                    : "bg-slate-800 text-slate-500 border border-slate-700"
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="w-3 h-3" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                )}
              </div>

              {/* Step Title */}
              <div className="flex items-center justify-between">
                <span
                  className={`font-semibold tracking-tight ${
                    isDone ? "text-white" : isInProgress ? "text-cyan-300" : "text-slate-500"
                  }`}
                >
                  {step.title}
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  {isDone ? "Verified" : isInProgress ? "Analyzing..." : "Queued"}
                </span>
              </div>

              {/* Bulleted details */}
              <div className="mt-1.5 space-y-1 font-mono text-[11px]">
                {step.details.map((detail, dIdx) => (
                  <div key={dIdx} className="flex items-center gap-1.5 text-slate-400">
                    <span className={isDone ? "text-emerald-400" : "text-cyan-400"}>✓</span>
                    <span>{detail}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
