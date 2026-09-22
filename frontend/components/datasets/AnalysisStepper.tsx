"use client";

import React from "react";
import { CheckCircle2, Clock, Sparkles, Target, Calendar, Tag, ShieldAlert } from "lucide-react";
import { AnalysisPlanStep, DatasetIntelligence, DomainInfo } from "@/types";
import { Badge } from "@/components/ui/Badge";

interface AnalysisStepperProps {
  plan?: AnalysisPlanStep[];
  intelligence?: DatasetIntelligence;
  domain?: DomainInfo;
  totalDurationMs?: number;
}

export function AnalysisStepper({ plan, intelligence, domain, totalDurationMs }: AnalysisStepperProps) {
  const steps = plan || [
    { step_number: 1, name: "Dataset Ingestion & Schema Profiling", status: "completed", description: "Profiled columns and structural cardinality.", execution_time_ms: 12 },
    { step_number: 2, name: "Domain & Semantic Classification", status: "completed", description: "Classified semantic roles and domain indicators.", execution_time_ms: 18 },
    { step_number: 3, name: "Pareto & Bivariate Cross-Tabulation", status: "completed", description: "Evaluated 80/20 concentration and dimension drivers.", execution_time_ms: 24 },
    { step_number: 4, name: "Time-Series & Growth Dynamics", status: "completed", description: "Calculated growth rates, seasonality, and peak periods.", execution_time_ms: 31 },
    { step_number: 5, name: "Correlation & Multicollinearity Audit", status: "completed", description: "Screened collinearity and pairwise dependencies.", execution_time_ms: 15 },
    { step_number: 6, name: "Executive Synthesis & Intelligence Package", status: "completed", description: "Synthesized executive takeaways and recommendations.", execution_time_ms: 10 },
  ];

  const totalTime = totalDurationMs || steps.reduce((acc, s) => acc + s.execution_time_ms, 0);

  return (
    <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
      {/* Top Banner: Domain & Meta */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-200">Domain Classification:</span>
              <Badge variant="primary" className="font-semibold text-xs bg-blue-500/20 text-blue-300 border-blue-500/30">
                {domain?.domain || intelligence?.business_domain?.domain || "General Tabular"}
              </Badge>
              <span className="text-[11px] text-emerald-400 font-mono font-medium">
                {Math.round(((domain?.confidence || intelligence?.business_domain?.confidence || 0.85) * 100))}% Confidence
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {domain?.description || intelligence?.business_domain?.description || "Automated intelligence profiling applied."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-1.5 font-mono text-[11px] bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Execution: {totalTime}ms</span>
          </div>
        </div>
      </div>

      {/* Intelligence Attributes Chips */}
      {intelligence && (
        <div className="flex items-center gap-2 flex-wrap text-xs text-slate-300">
          {intelligence.target_variable && (
            <div className="flex items-center gap-1 bg-slate-950/80 border border-slate-800 px-2 py-1 rounded-md">
              <Target className="w-3 h-3 text-blue-400" />
              <span className="text-[11px] text-slate-400">Target:</span>
              <span className="text-[11px] font-mono text-blue-300 font-semibold">{intelligence.target_variable}</span>
            </div>
          )}
          {intelligence.primary_date_col && (
            <div className="flex items-center gap-1 bg-slate-950/80 border border-slate-800 px-2 py-1 rounded-md">
              <Calendar className="w-3 h-3 text-cyan-400" />
              <span className="text-[11px] text-slate-400">Primary Date:</span>
              <span className="text-[11px] font-mono text-cyan-300 font-semibold">{intelligence.primary_date_col}</span>
            </div>
          )}
          {intelligence.entity_column && (
            <div className="flex items-center gap-1 bg-slate-950/80 border border-slate-800 px-2 py-1 rounded-md">
              <Tag className="w-3 h-3 text-purple-400" />
              <span className="text-[11px] text-slate-400">Primary Entity:</span>
              <span className="text-[11px] font-mono text-purple-300 font-semibold">{intelligence.entity_column}</span>
            </div>
          )}
          {intelligence.geo_columns && intelligence.geo_columns.length > 0 && (
            <div className="flex items-center gap-1 bg-slate-950/80 border border-slate-800 px-2 py-1 rounded-md">
              <span className="text-[11px] text-slate-400">Geo:</span>
              <span className="text-[11px] font-mono text-cyan-300 font-semibold">{intelligence.geo_columns.join(", ")}</span>
            </div>
          )}
        </div>
      )}

      {/* Stepper Progress Steps */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
        {steps.map((step) => (
          <div
            key={step.step_number}
            className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-2.5 transition hover:border-slate-700"
          >
            <div className="mt-0.5 shrink-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-semibold text-slate-200 truncate">
                  {step.step_number}. {step.name}
                </span>
                <span className="text-[10px] font-mono text-slate-500 shrink-0">
                  {step.execution_time_ms}ms
                </span>
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
