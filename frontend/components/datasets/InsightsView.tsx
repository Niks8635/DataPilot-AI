"use client";

import React, { useState } from "react";
import { 
  Sparkles, 
  TrendingUp, 
  AlertTriangle, 
  Lightbulb, 
  HelpCircle, 
  CheckCircle, 
  ArrowRight, 
  Zap,
  RefreshCw,
  Sliders,
  Filter
} from "lucide-react";
import { AIInsights, StructuredInsightItem } from "@/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { InsightDrillDownModal } from "./InsightDrillDownModal";

interface InsightsViewProps {
  datasetId?: string;
  insights: AIInsights | null;
  onAskQuestion?: (q: string) => void;
  onRegenerate?: (focusPrompt?: string, detailLevel?: "brief" | "deep") => Promise<void>;
}

export function InsightsView({ datasetId, insights, onAskQuestion, onRegenerate }: InsightsViewProps) {
  const [detailLevel, setDetailLevel] = useState<"brief" | "deep">("brief");
  const [focusPrompt, setFocusPrompt] = useState("");
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState<StructuredInsightItem | null>(null);
  const [drillDownOpen, setDrillDownOpen] = useState(false);

  if (!insights) {
    return (
      <div className="p-16 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
        <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
        Synthesizing Executive Insights...
      </div>
    );
  }

  const structuredCards = insights.structured_insights || [];
  const displayedCards = detailLevel === "brief" ? structuredCards.slice(0, 4) : structuredCards;

  const handleRegenerate = async () => {
    if (!onRegenerate) return;
    try {
      setIsRegenerating(true);
      await onRegenerate(focusPrompt || undefined, detailLevel);
    } finally {
      setIsRegenerating(false);
    }
  };

  const openDrillDown = (card: StructuredInsightItem) => {
    setSelectedInsight(card);
    setDrillDownOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Executive Hero Card & Controls */}
      <div className="p-6 rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-950/50 via-slate-900 to-slate-950 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-blue-400" />
            Executive Intelligence Summary
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setDetailLevel("brief")}
              className={`px-3 py-1 rounded-md text-xs font-medium transition ${
                detailLevel === "brief"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Executive Brief
            </button>
            <button
              onClick={() => setDetailLevel("deep")}
              className={`px-3 py-1 rounded-md text-xs font-medium transition ${
                detailLevel === "deep"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Deep Dive Analysis
            </button>
          </div>
        </div>

        <p className="text-sm sm:text-base text-slate-100 leading-relaxed font-normal">
          {insights.executive_summary}
        </p>

        {/* Regenerate with Custom Strategic Focus */}
        <div className="flex flex-col sm:flex-row items-center gap-2 pt-2 border-t border-slate-800/80">
          <div className="relative flex-1 w-full">
            <input
              type="text"
              placeholder="Guide AI analysis focus (e.g., 'Focus on revenue concentration and regional margins')..."
              value={focusPrompt}
              onChange={(e) => setFocusPrompt(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRegenerate}
            loading={isRegenerating}
            className="shrink-0 text-xs w-full sm:w-auto"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1 text-blue-400" />
            Regenerate Summary
          </Button>
        </div>
      </div>

      {/* Structured Insight Cards (Interactive Drill-Down) */}
      {displayedCards.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-cyan-400" />
              Strategic Insight Cards ({displayedCards.length})
            </h3>
            <span className="text-[11px] text-slate-500">Click card for formula and underlying column drill-down</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayedCards.map((card, idx) => (
              <div
                key={idx}
                onClick={() => openDrillDown(card)}
                className={`p-4 rounded-xl border bg-slate-900/80 hover:bg-slate-900 transition cursor-pointer space-y-2.5 shadow-sm group ${
                  card.severity === "critical" ? "border-red-500/40 hover:border-red-500/70" :
                  card.severity === "warning" ? "border-rose-500/40 hover:border-rose-500/70" :
                  card.severity === "positive" ? "border-emerald-500/40 hover:border-emerald-500/70" :
                  "border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <Badge
                    variant={
                      card.severity === "critical" ? "danger" :
                      card.severity === "warning" ? "warning" :
                      card.severity === "positive" ? "success" : "default"
                    }
                    className="text-[10px] uppercase font-mono"
                  >
                    {card.type}
                  </Badge>
                  <span className="text-xs font-bold text-blue-400 font-mono">
                    {card.metric}: {String(card.value)}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-slate-100 group-hover:text-blue-300 transition leading-snug">
                  {card.title}
                </h4>

                <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                  {card.description}
                </p>

                <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[11px] text-slate-400">
                  <span className="truncate max-w-[240px] text-slate-500 font-mono text-[10px]">
                    {card.calculation_reference}
                  </span>
                  <span className="text-blue-400 font-medium flex items-center gap-1 group-hover:translate-x-0.5 transition">
                    Drill down <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Strategic Recommendations & Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Strategic Business Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" />
              Strategic Business Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {insights.business_recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 leading-relaxed flex items-start gap-3"
                >
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Behavioral & Chronological Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              Behavioral & Chronological Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {insights.trends.map((trend, idx) => (
                <div
                  key={idx}
                  className="text-xs text-slate-300 p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-start gap-2.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0 mt-1.5" />
                  <span>{trend}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Anomalies and Suggested Questions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quality & Statistical Anomalies */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              Statistical Anomalies & Data Outliers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {insights.anomalies.map((anom, idx) => (
                <div
                  key={idx}
                  className="text-xs text-slate-300 p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-start gap-2.5"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                  <span>{anom}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Potential Analytical Questions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-purple-400" />
              Recommended Follow-Up Inquiries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5">
              {insights.potential_questions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => onAskQuestion && onAskQuestion(q)}
                  className="w-full text-left p-3 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-purple-500/40 text-xs text-slate-300 hover:text-white transition flex items-center justify-between group"
                >
                  <span>"{q}"</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-purple-400 group-hover:translate-x-1 transition shrink-0" />
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Drill Down Modal */}
      <InsightDrillDownModal
        insight={selectedInsight}
        isOpen={drillDownOpen}
        onClose={() => setDrillDownOpen(false)}
        onAskQuestion={onAskQuestion}
      />
    </div>
  );
}
