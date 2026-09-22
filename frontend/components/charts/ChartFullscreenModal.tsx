"use client";

import React, { useState, useMemo } from "react";
import { 
  X, 
  Download, 
  Copy, 
  Check, 
  BarChart3, 
  Table, 
  Maximize2,
  FileSpreadsheet,
  TrendingUp,
  Activity,
  Layers
} from "lucide-react";
import { ChartConfig } from "@/types";
import { DynamicChart } from "./DynamicChart";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

interface ChartFullscreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ChartConfig;
  color_palette?: string;
  theme?: "dark" | "light";
  onExportPNG?: () => void;
  onExportSVG?: () => void;
  onCopyCSV?: () => void;
  onCopyJSON?: () => void;
  copiedState?: "csv" | "json" | null;
}

export function ChartFullscreenModal({
  isOpen,
  onClose,
  config,
  color_palette = "blue",
  theme = "dark",
  onExportPNG,
  onExportSVG,
  onCopyCSV,
  onCopyJSON,
  copiedState,
}: ChartFullscreenModalProps) {
  const [activeTab, setActiveTab] = useState<"chart" | "data">("chart");
  const [selectedPalette, setSelectedPalette] = useState(color_palette);

  // Compute summary statistics
  const stats = useMemo(() => {
    const yVals: number[] = [];
    if (config.series && config.series.length > 0) {
      config.series.forEach((s) => {
        (s.data || []).forEach((v: any) => {
          const num = typeof v === "number" ? v : Number(v);
          if (!isNaN(num)) yVals.push(num);
        });
      });
    } else if (config.y_data && Array.isArray(config.y_data)) {
      config.y_data.forEach((v) => {
        const num = typeof v === "number" ? v : Number(v);
        if (!isNaN(num)) yVals.push(num);
      });
    }

    if (yVals.length === 0) {
      return { count: 0, min: 0, max: 0, avg: 0, sum: 0 };
    }

    const count = yVals.length;
    const min = Math.min(...yVals);
    const max = Math.max(...yVals);
    const sum = yVals.reduce((a, b) => a + b, 0);
    const avg = sum / count;

    return { count, min, max, avg, sum };
  }, [config]);

  // Formatted data points for table view
  const tableRows = useMemo(() => {
    const x = config.x_data || [];
    const y = config.y_data || [];
    if (config.series && config.series.length > 0) {
      return x.map((label, idx) => {
        const row: Record<string, any> = { Index: idx + 1, Category: String(label) };
        config.series?.forEach((s) => {
          row[s.name] = s.data?.[idx];
        });
        return row;
      });
    }
    return x.map((label, idx) => ({
      Index: idx + 1,
      Category: String(label),
      Value: y[idx] ?? "—",
    }));
  }, [config]);

  if (!isOpen) return null;

  const isDark = theme === "dark";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-xl animate-in fade-in duration-200">
      <div 
        className={`relative w-full max-w-6xl max-h-[92vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden ${
          isDark 
            ? "bg-slate-900/95 border-slate-700/80 text-slate-100" 
            : "bg-white border-slate-200 text-slate-900"
        }`}
      >
        {/* Modal Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 border-b border-white/[0.08] bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  {config.title || "Visualization Inspector"}
                </h2>
                <Badge variant="outline" className="text-[10px] uppercase font-mono text-cyan-400 border-cyan-500/30">
                  {config.chart_type || "chart"}
                </Badge>
              </div>
              {config.subtitle && (
                <p className="text-xs text-slate-400 mt-0.5">{config.subtitle}</p>
              )}
            </div>
          </div>

          {/* Action Controls & Palette Switcher */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* View Tabs */}
            <div className="flex items-center p-1 rounded-xl bg-slate-950/60 border border-white/[0.08] text-xs">
              <button
                onClick={() => setActiveTab("chart")}
                className={`px-3 py-1 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                  activeTab === "chart"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                Chart
              </button>
              <button
                onClick={() => setActiveTab("data")}
                className={`px-3 py-1 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                  activeTab === "data"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                Data Points ({tableRows.length})
              </button>
            </div>

            {/* Export Buttons */}
            {onExportPNG && (
              <Button
                variant="outline"
                size="sm"
                onClick={onExportPNG}
                className="gap-1.5 text-xs border-white/[0.1] hover:border-blue-500/40 text-slate-200"
                title="Download High-Res 300 DPI PNG"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">PNG</span>
              </Button>
            )}

            {onExportSVG && (
              <Button
                variant="outline"
                size="sm"
                onClick={onExportSVG}
                className="gap-1.5 text-xs border-white/[0.1] hover:border-purple-500/40 text-slate-200"
                title="Download Vector SVG"
              >
                <Download className="w-3.5 h-3.5 text-purple-400" />
                <span className="hidden sm:inline">SVG</span>
              </Button>
            )}

            {onCopyCSV && (
              <Button
                variant="outline"
                size="sm"
                onClick={onCopyCSV}
                className="gap-1.5 text-xs border-white/[0.1] hover:border-emerald-500/40 text-slate-200"
                title="Copy Data as CSV to Clipboard"
              >
                {copiedState === "csv" ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <span className="hidden sm:inline">
                  {copiedState === "csv" ? "Copied!" : "CSV"}
                </span>
              </Button>
            )}

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors ml-1"
              title="Close Fullscreen (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          {activeTab === "chart" ? (
            <div className="space-y-6">
              {/* Main Expanded High-Res Chart */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-white/[0.06] shadow-inner">
                <DynamicChart
                  config={config}
                  height={460}
                  color_palette={selectedPalette}
                  theme={theme}
                  showToolbar={false}
                />
              </div>

              {/* Statistical KPI Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="p-3 rounded-xl bg-slate-950/40 border border-white/[0.06]">
                  <span className="text-[10px] uppercase font-mono text-slate-500 block">Total Data Points</span>
                  <span className="text-lg font-mono font-bold text-white">{stats.count}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/40 border border-white/[0.06]">
                  <span className="text-[10px] uppercase font-mono text-slate-500 block">Peak / Max</span>
                  <span className="text-lg font-mono font-bold text-emerald-400">
                    {stats.max.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/40 border border-white/[0.06]">
                  <span className="text-[10px] uppercase font-mono text-slate-500 block">Floor / Min</span>
                  <span className="text-lg font-mono font-bold text-rose-400">
                    {stats.min.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/40 border border-white/[0.06]">
                  <span className="text-[10px] uppercase font-mono text-slate-500 block">Mean Average</span>
                  <span className="text-lg font-mono font-bold text-blue-400">
                    {stats.avg.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/40 border border-white/[0.06]">
                  <span className="text-[10px] uppercase font-mono text-slate-500 block">Total Sum</span>
                  <span className="text-lg font-mono font-bold text-cyan-300">
                    {stats.sum.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* Tabular Data View */
            <div className="rounded-xl border border-white/[0.08] overflow-hidden bg-slate-950/60">
              <div className="max-h-[500px] overflow-y-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-950/90 text-slate-400 sticky top-0 border-b border-white/[0.08] backdrop-blur-md">
                    <tr>
                      {tableRows.length > 0 &&
                        Object.keys(tableRows[0]).map((col) => (
                          <th key={col} className="p-3 font-mono font-semibold uppercase tracking-wider text-[10px]">
                            {col}
                          </th>
                        ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.05] font-mono text-[11px]">
                    {tableRows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-white/[0.02] transition-colors">
                        {Object.values(row).map((val, cIdx) => (
                          <td key={cIdx} className="p-3 text-slate-300">
                            {typeof val === "number" ? val.toLocaleString() : String(val)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-white/[0.08] bg-slate-950/40 flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>Resolution: High-DPI Vector Rendered</span>
          <span>Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">ESC</kbd> to close</span>
        </div>
      </div>
    </div>
  );
}
