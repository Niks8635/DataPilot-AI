"use client";

import React from "react";
import { StructuredInsightItem } from "@/types";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { 
  Sparkles, 
  Calculator, 
  Columns, 
  HelpCircle, 
  TrendingUp, 
  AlertTriangle, 
  Zap,
  ArrowRight
} from "lucide-react";

interface InsightDrillDownModalProps {
  insight: StructuredInsightItem | null;
  isOpen: boolean;
  onClose: () => void;
  onAskQuestion?: (q: string) => void;
}

export function InsightDrillDownModal({ insight, isOpen, onClose, onAskQuestion }: InsightDrillDownModalProps) {
  if (!insight) return null;

  const handleAsk = () => {
    onClose();
    if (onAskQuestion) {
      onAskQuestion(`Explain the drivers behind: "${insight.title}"`);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Insight Quantitative Drill-Down"
      maxWidth="2xl"
    >
      <div className="space-y-5">
        {/* Header Block */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <Badge
              variant={
                insight.severity === "critical" ? "danger" :
                insight.severity === "warning" ? "warning" :
                insight.severity === "positive" ? "success" : "default"
              }
              className="uppercase font-mono text-[10px]"
            >
              {insight.severity} • {insight.type}
            </Badge>
            <span className="text-xs font-mono font-bold text-blue-400">
              {insight.metric}: {String(insight.value)}
            </span>
          </div>
          <h3 className="text-base font-bold text-white leading-snug">
            {insight.title}
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            {insight.description}
          </p>
        </div>

        {/* Calculation Reference & Source Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
              <Calculator className="w-3.5 h-3.5 text-cyan-400" />
              Mathematical Grounding Formula
            </div>
            <code className="text-[11px] text-cyan-300 font-mono block break-words bg-slate-900 p-2 rounded border border-slate-800/80">
              {insight.calculation_reference}
            </code>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
              <Columns className="w-3.5 h-3.5 text-blue-400" />
              Source Dataset Columns
            </div>
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              {Array.from(new Set(insight.source_columns.map(String))).map((c, cIdx) => (
                <span
                  key={`src-col-${c}-${cIdx}`}
                  className="px-2 py-0.5 rounded text-[11px] font-mono bg-blue-500/10 text-blue-300 border border-blue-500/20"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Comparison Context */}
        <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
          <span className="text-slate-400">Benchmark Comparison:</span>
          <span className="font-semibold text-slate-200">{insight.comparison}</span>
        </div>

        {/* Action Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button variant="primary" size="sm" onClick={handleAsk}>
            <HelpCircle className="w-3.5 h-3.5 mr-1.5 text-cyan-300" />
            Ask Follow-up in Ask Your Data
          </Button>
        </div>
      </div>
    </Modal>
  );
}
