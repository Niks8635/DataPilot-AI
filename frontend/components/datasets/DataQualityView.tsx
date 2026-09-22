"use client";

import React from "react";
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  HelpCircle,
  Database,
  Layers,
  Sparkles,
  Zap
} from "lucide-react";
import { QualityScore, DatasetProfile } from "@/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface DataQualityViewProps {
  quality: QualityScore | null;
  profile: DatasetProfile | null;
  onGoToCleaning?: () => void;
}

export function DataQualityView({ quality, profile, onGoToCleaning }: DataQualityViewProps) {
  if (!quality || !profile) {
    return (
      <div className="p-16 text-center text-xs text-slate-400">
        Loading quality audit and profiling analysis...
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-emerald-400";
    if (score >= 75) return "text-blue-400";
    if (score >= 60) return "text-indigo-400";
    return "text-rose-400";
  };

  const getScoreStroke = (score: number) => {
    if (score >= 90) return "#34d399";
    if (score >= 75) return "#60a5fa";
    if (score >= 60) return "#818cf8";
    return "#f87171";
  };

  return (
    <div className="space-y-6">
      {/* Top Quality Score Header */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Overall Score Gauge Card */}
        <Card className="lg:col-span-1 flex flex-col justify-between p-6 bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              Data Quality Score
            </div>
            <Badge
              variant={
                quality.overall_score >= 80 ? "success" : quality.overall_score >= 60 ? "warning" : "danger"
              }
            >
              {quality.grade}
            </Badge>
          </div>

          <div className="my-6 flex items-center justify-center relative">
            <div className="text-center">
              <div className={`text-5xl font-black tracking-tight ${getScoreColor(quality.overall_score)}`}>
                {quality.overall_score}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 uppercase tracking-wider font-semibold">
                out of 100
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>Overall Integrity Rating</span>
              <span className="font-semibold">{quality.grade}</span>
            </div>
            {onGoToCleaning && (
              <Button size="sm" variant="primary" className="w-full mt-2" onClick={onGoToCleaning}>
                <Zap className="w-3.5 h-3.5 mr-1.5 text-cyan-300" />
                Review Cleaning Suggestions
              </Button>
            )}
          </div>
        </Card>

        {/* Sub-Scores Matrix */}
        <Card className="lg:col-span-2 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">Integrity Dimensions Breakdown</h3>
              <div className="text-xs text-slate-400">
                {profile.row_count.toLocaleString()} rows • {profile.column_count} columns
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[10px] uppercase font-semibold text-slate-400">Structural Health</div>
                <div className="text-xl font-bold text-white mt-1">{quality.structural_health}%</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Schema integrity</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[10px] uppercase font-semibold text-slate-400">Completeness</div>
                <div className="text-xl font-bold text-white mt-1">{quality.completeness_score}%</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Non-null coverage</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[10px] uppercase font-semibold text-slate-400">Uniqueness</div>
                <div className="text-xl font-bold text-white mt-1">{quality.uniqueness_score}%</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Duplicate ratio</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[10px] uppercase font-semibold text-slate-400">Consistency</div>
                <div className="text-xl font-bold text-white mt-1">{quality.consistency_score}%</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Type & format match</div>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-800 flex flex-wrap gap-2">
            {quality.summary_badges.map((badge, idx) => (
              <Badge
                key={idx}
                variant={
                  badge.startsWith("✓")
                    ? "success"
                    : badge.startsWith("⚠")
                    ? "warning"
                    : "info"
                }
                className="text-xs py-1 px-2.5"
              >
                {badge}
              </Badge>
            ))}
          </div>
        </Card>
      </div>

      {/* Identified Issues & Deductions */}
      <Card>
        <CardHeader>
          <CardTitle>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            Identified Data Quality Opportunities ({quality.issues.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {quality.issues.length === 0 ? (
            <div className="p-8 text-center text-xs text-emerald-400 flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Dataset is in pristine condition with 0 structural issues or missing fields!
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {quality.issues.map((issue, idx) => (
                <div key={idx} className="py-3.5 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {issue.severity === "critical" ? (
                        <AlertTriangle className="w-4 h-4 text-rose-400" />
                      ) : issue.severity === "high" ? (
                        <AlertTriangle className="w-4 h-4 text-rose-400" />
                      ) : (
                        <Info className="w-4 h-4 text-blue-400" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-200">
                        {issue.message}
                      </div>
                      {issue.column && (
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Affected column: <span className="font-mono text-slate-300">{issue.column}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <Badge variant={issue.severity === "critical" || issue.severity === "high" ? "danger" : "warning"}>
                      -{issue.score_deduction} pts
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Column Profiler Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            <Database className="w-4 h-4 text-blue-400" />
            Detailed Column Profiling Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="p-3 font-semibold">Column</th>
                  <th className="p-3 font-semibold">Inferred Type</th>
                  <th className="p-3 font-semibold">Missing (Null)</th>
                  <th className="p-3 font-semibold">Unique Values</th>
                  <th className="p-3 font-semibold">Summary Stats / Mode</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {profile.columns.map((col) => {
                  let summaryStr = "-";
                  if (col.numerical_stats) {
                    summaryStr = `Mean: ${col.numerical_stats.mean} | Median: ${col.numerical_stats.median} | Min: ${col.numerical_stats.min} | Max: ${col.numerical_stats.max}`;
                  } else if (col.categorical_stats) {
                    summaryStr = `Mode: "${col.categorical_stats.mode || '-'}" (${col.categorical_stats.top_values?.[0]?.count || 0} occurrences)`;
                  } else if (col.datetime_stats) {
                    summaryStr = `${col.datetime_stats.min_date?.slice(0, 10)} to ${col.datetime_stats.max_date?.slice(0, 10)}`;
                  }

                  return (
                    <tr key={col.name} className="hover:bg-slate-900/30 transition">
                      <td className="p-3 font-semibold text-white">{col.name}</td>
                      <td className="p-3">
                        <Badge variant="outline" className="text-[10px]">
                          {col.inferred_type}
                        </Badge>
                      </td>
                      <td className="p-3 text-slate-300">
                        {col.null_count > 0 ? (
                          <span className="text-rose-400 font-semibold">
                            {col.null_count} ({col.null_percentage}%)
                          </span>
                        ) : (
                          <span className="text-emerald-400">0 (0%)</span>
                        )}
                      </td>
                      <td className="p-3 text-slate-300">
                        {col.unique_count.toLocaleString()}
                      </td>
                      <td className="p-3 text-slate-400 text-[10px]">{summaryStr}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
