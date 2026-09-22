"use client";

import React, { useState, useMemo, useRef } from "react";
import { 
  Sparkles, 
  ArrowRight, 
  SlidersHorizontal, 
  Columns2, 
  ListOrdered, 
  AlertCircle, 
  CheckCircle2, 
  TrendingUp, 
  ShieldCheck,
  Eye,
  RotateCcw
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";

export interface ChangedCell {
  row_idx: number;
  column: string;
  old_value: any;
  new_value: any;
}

export interface MetricsDiff {
  rows_before: number;
  rows_after: number;
  columns_before: number;
  columns_after: number;
  nulls_before: number;
  nulls_after: number;
  memory_before?: number;
  memory_after?: number;
}

interface CleaningSplitSliderProps {
  sampleBefore: Array<Record<string, any>>;
  sampleAfter: Array<Record<string, any>>;
  changedCells: ChangedCell[];
  metricsDiff: MetricsDiff;
  operationName?: string;
  columnName?: string;
}

export function CleaningSplitSlider({
  sampleBefore = [],
  sampleAfter = [],
  changedCells = [],
  metricsDiff,
  operationName,
  columnName,
}: CleaningSplitSliderProps) {
  // Slider position: 0% = all Before (Raw), 100% = all After (Cleaned), 50% = half/half
  const [sliderPos, setSliderPos] = useState<number>(50);
  const [viewMode, setViewMode] = useState<"slider" | "split" | "audit">("slider");
  const [activeFilterColumn, setActiveFilterColumn] = useState<string>("all");

  // Determine all unique column names
  const columns = useMemo(() => {
    const colsSet = new Set<string>();
    if (sampleBefore.length > 0) Object.keys(sampleBefore[0]).forEach((c) => colsSet.add(c));
    if (sampleAfter.length > 0) Object.keys(sampleAfter[0]).forEach((c) => colsSet.add(c));
    return Array.from(colsSet);
  }, [sampleBefore, sampleAfter]);

  // Fast lookup map for changed cells by `${row_idx}_${column}`
  const changedMap = useMemo(() => {
    const map = new Map<string, ChangedCell>();
    changedCells.forEach((c) => {
      map.set(`${c.row_idx}_${c.column}`, c);
    });
    return map;
  }, [changedCells]);

  // Format cell value helper
  const isNullish = (val: any) => {
    return val === null || val === undefined || val === "" || String(val).toLowerCase() === "nan" || String(val).toLowerCase() === "none";
  };

  // Synchronized scroll refs for side-by-side mode
  const leftTableRef = useRef<HTMLDivElement>(null);
  const rightTableRef = useRef<HTMLDivElement>(null);

  const handleScroll = (source: "left" | "right") => {
    if (source === "left" && leftTableRef.current && rightTableRef.current) {
      rightTableRef.current.scrollTop = leftTableRef.current.scrollTop;
      rightTableRef.current.scrollLeft = leftTableRef.current.scrollLeft;
    } else if (source === "right" && leftTableRef.current && rightTableRef.current) {
      leftTableRef.current.scrollTop = rightTableRef.current.scrollTop;
      leftTableRef.current.scrollLeft = rightTableRef.current.scrollLeft;
    }
  };

  const filteredColumns = activeFilterColumn === "all" 
    ? columns 
    : columns.filter((c) => c === activeFilterColumn);

  const maxRows = Math.max(sampleBefore.length, sampleAfter.length);

  return (
    <div className="space-y-4 select-none">
      {/* Metrics Delta Scorecard */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-950/70 border border-white/[0.08] shadow-inner">
        <div className="space-y-1">
          <span className="text-[11px] font-mono text-slate-400 block">Row Dimension:</span>
          <div className="flex items-center gap-2 font-mono text-xs font-bold">
            <span className="text-slate-300">{metricsDiff.rows_before.toLocaleString()}</span>
            <ArrowRight className="w-3 h-3 text-slate-500" />
            <span className={metricsDiff.rows_after < metricsDiff.rows_before ? "text-cyan-400" : "text-emerald-400"}>
              {metricsDiff.rows_after.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="space-y-1">
          <span className="text-[11px] font-mono text-slate-400 block">Missing Cells:</span>
          <div className="flex items-center gap-2 font-mono text-xs font-bold">
            <span className="text-rose-400">{metricsDiff.nulls_before.toLocaleString()}</span>
            <ArrowRight className="w-3 h-3 text-slate-500" />
            <span className="text-emerald-400">{metricsDiff.nulls_after.toLocaleString()}</span>
          </div>
        </div>

        <div className="space-y-1">
          <span className="text-[11px] font-mono text-slate-400 block">Modified Records:</span>
          <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-cyan-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{changedCells.length} cells altered</span>
          </div>
        </div>

        <div className="space-y-1">
          <span className="text-[11px] font-mono text-slate-400 block">Cleaning Efficacy:</span>
          <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>
              {metricsDiff.nulls_before > 0 
                ? `${Math.round(((metricsDiff.nulls_before - metricsDiff.nulls_after) / metricsDiff.nulls_before) * 100)}% Sanitized`
                : "100% Sanitized"}
            </span>
          </div>
        </div>
      </div>

      {/* Control Bar: Mode Toggles, Column Filter & Split Quick Presets */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-950/50 border border-white/[0.06]">
        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-900 border border-white/[0.08] text-xs">
          <button
            onClick={() => setViewMode("slider")}
            className={`px-3 py-1 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
              viewMode === "slider"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Split Slider
          </button>

          <button
            onClick={() => setViewMode("split")}
            className={`px-3 py-1 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
              viewMode === "split"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Columns2 className="w-3.5 h-3.5" />
            Side-by-Side Dual
          </button>

          <button
            onClick={() => setViewMode("audit")}
            className={`px-3 py-1 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
              viewMode === "audit"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5" />
            Audit Diff ({changedCells.length})
          </button>
        </div>

        {/* Quick Slider Presets (only visible in slider mode) */}
        {viewMode === "slider" && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono hidden md:inline">Reveal:</span>
            <div className="flex items-center gap-1 text-xs font-mono">
              <button
                onClick={() => setSliderPos(0)}
                className={`px-2 py-0.5 rounded border transition-colors ${
                  sliderPos === 0
                    ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                    : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                }`}
              >
                Dirty (0%)
              </button>
              <button
                onClick={() => setSliderPos(50)}
                className={`px-2 py-0.5 rounded border transition-colors ${
                  sliderPos === 50
                    ? "bg-blue-500/20 text-blue-300 border-blue-500/40"
                    : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                }`}
              >
                50 / 50 Split
              </button>
              <button
                onClick={() => setSliderPos(100)}
                className={`px-2 py-0.5 rounded border transition-colors ${
                  sliderPos === 100
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                    : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                }`}
              >
                Cleaned (100%)
              </button>
            </div>
          </div>
        )}

        {/* Column Filter Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono hidden sm:inline">Column:</span>
          <select
            value={activeFilterColumn}
            onChange={(e) => setActiveFilterColumn(e.target.value)}
            className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
          >
            <option value="all">All Columns ({columns.length})</option>
            {columns.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 1. SLIDER CURTAIN VIEW MODE */}
      {viewMode === "slider" && (
        <div className="space-y-3">
          {/* Interactive Split Range Slider Control */}
          <div className="px-2 py-1 flex items-center gap-4 bg-slate-950/40 rounded-xl border border-white/[0.05]">
            <div className="flex items-center gap-1.5 text-xs font-mono text-rose-400 font-semibold shrink-0">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Raw Dirty Data</span>
            </div>

            <div className="flex-1 relative flex items-center">
              <input
                type="range"
                min={0}
                max={100}
                value={sliderPos}
                onChange={(e) => setSliderPos(Number(e.target.value))}
                className="w-full h-2 bg-gradient-to-r from-rose-500/40 via-blue-500/40 to-emerald-500/40 rounded-lg appearance-none cursor-ew-resize accent-cyan-400"
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 font-semibold shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Sanitized Clean Data</span>
            </div>
          </div>

          {/* Interactive Comparison Table with Curtain Split */}
          <div className="rounded-xl border border-white/[0.08] overflow-hidden bg-slate-950/80 relative shadow-2xl">
            <div className="overflow-x-auto max-h-[380px] overflow-y-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-950 text-slate-400 sticky top-0 border-b border-white/[0.08] backdrop-blur-md z-10">
                  <tr>
                    <th className="p-3 font-mono text-[10px] w-12 text-slate-500">#</th>
                    {filteredColumns.map((col) => (
                      <th key={col} className="p-3 font-mono font-semibold uppercase tracking-wider text-[10px]">
                        <div className="flex items-center justify-between">
                          <span>{col}</span>
                          {columnName === col && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300 lowercase font-normal">
                              target
                            </span>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05] font-mono text-[11px]">
                  {Array.from({ length: maxRows }).map((_, rIdx) => {
                    const rowBefore = sampleBefore[rIdx] || {};
                    const rowAfter = sampleAfter[rIdx] || {};

                    return (
                      <tr key={rIdx} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-3 text-slate-500 font-mono text-[10px]">{rIdx + 1}</td>
                        {filteredColumns.map((col) => {
                          const valBefore = rowBefore[col];
                          const valAfter = rowAfter[col];
                          const cellDiff = changedMap.get(`${rIdx}_${col}`);
                          const isChanged = Boolean(cellDiff) || String(valBefore) !== String(valAfter);

                          // Determine display value based on slider position
                          const isAfter = sliderPos >= 50;
                          const currentVal = isAfter ? valAfter : valBefore;

                          return (
                            <td key={col} className="p-3">
                              {isChanged ? (
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {sliderPos < 50 ? (
                                    /* Before Side View */
                                    isNullish(valBefore) ? (
                                      <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold">
                                        NULL
                                      </span>
                                    ) : (
                                      <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-300 line-through">
                                        {String(valBefore)}
                                      </span>
                                    )
                                  ) : (
                                    /* After Side View */
                                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold flex items-center gap-1 shadow-2xs">
                                      <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
                                      {String(valAfter)}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className={isNullish(currentVal) ? "text-slate-600 italic" : "text-slate-300"}>
                                  {isNullish(currentVal) ? "—" : String(currentVal)}
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Split Indicator Badge at bottom */}
            <div className="p-2 border-t border-white/[0.06] bg-slate-950/60 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${sliderPos >= 50 ? "bg-emerald-400" : "bg-rose-400"}`} />
                Current Perspective:{" "}
                <strong className={sliderPos >= 50 ? "text-emerald-400" : "text-rose-400"}>
                  {sliderPos >= 50 ? "Sanitized Cleaned Dataset" : "Original Raw Dirty Dataset"}
                </strong>
              </span>
              <span>Drag slider to inspect transformation deltas</span>
            </div>
          </div>
        </div>
      )}

      {/* 2. SYNCHRONIZED SIDE-BY-SIDE DUAL TABLE VIEW */}
      {viewMode === "split" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left Table: Raw Dirty State */}
          <div className="rounded-xl border border-rose-500/20 bg-slate-950/90 overflow-hidden shadow-lg">
            <div className="p-2.5 border-b border-rose-500/20 bg-rose-950/20 flex items-center justify-between text-xs font-mono">
              <span className="font-bold text-rose-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                Raw Dirty State (Before)
              </span>
              <span className="text-[10px] text-rose-400/80">
                {metricsDiff.nulls_before} nulls • {sampleBefore.length} rows
              </span>
            </div>

            <div 
              ref={leftTableRef} 
              onScroll={() => handleScroll("left")}
              className="overflow-x-auto max-h-[350px] overflow-y-auto"
            >
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-950 text-slate-400 sticky top-0 border-b border-white/[0.08] backdrop-blur-md">
                  <tr>
                    <th className="p-2.5 font-mono text-[10px] w-10 text-slate-500">#</th>
                    {filteredColumns.map((col) => (
                      <th key={col} className="p-2.5 font-mono text-[10px] uppercase text-slate-400">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05] font-mono text-[11px]">
                  {sampleBefore.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-white/[0.02]">
                      <td className="p-2.5 text-slate-500 text-[10px]">{rIdx + 1}</td>
                      {filteredColumns.map((col) => {
                        const val = row[col];
                        const isNull = isNullish(val);
                        const cellDiff = changedMap.get(`${rIdx}_${col}`);

                        return (
                          <td key={col} className="p-2.5">
                            {isNull ? (
                              <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold">
                                NULL
                              </span>
                            ) : cellDiff ? (
                              <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-300 line-through">
                                {String(val)}
                              </span>
                            ) : (
                              <span className="text-slate-300">{String(val ?? "—")}</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Table: Sanitized Clean State */}
          <div className="rounded-xl border border-emerald-500/20 bg-slate-950/90 overflow-hidden shadow-lg">
            <div className="p-2.5 border-b border-emerald-500/20 bg-emerald-950/20 flex items-center justify-between text-xs font-mono">
              <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Sanitized Clean State (After)
              </span>
              <span className="text-[10px] text-emerald-400/80">
                {metricsDiff.nulls_after} nulls • {sampleAfter.length} rows
              </span>
            </div>

            <div 
              ref={rightTableRef} 
              onScroll={() => handleScroll("right")}
              className="overflow-x-auto max-h-[350px] overflow-y-auto"
            >
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-950 text-slate-400 sticky top-0 border-b border-white/[0.08] backdrop-blur-md">
                  <tr>
                    <th className="p-2.5 font-mono text-[10px] w-10 text-slate-500">#</th>
                    {filteredColumns.map((col) => (
                      <th key={col} className="p-2.5 font-mono text-[10px] uppercase text-slate-400">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05] font-mono text-[11px]">
                  {sampleAfter.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-white/[0.02]">
                      <td className="p-2.5 text-slate-500 text-[10px]">{rIdx + 1}</td>
                      {filteredColumns.map((col) => {
                        const val = row[col];
                        const cellDiff = changedMap.get(`${rIdx}_${col}`);

                        return (
                          <td key={col} className="p-2.5">
                            {cellDiff ? (
                              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold flex items-center gap-1 shadow-2xs">
                                <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
                                {String(val)}
                              </span>
                            ) : (
                              <span className="text-slate-300">{String(val ?? "—")}</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. DETAILED AUDIT DIFF LIST */}
      {viewMode === "audit" && (
        <div className="rounded-xl border border-white/[0.08] overflow-hidden bg-slate-950/80">
          <div className="p-3 border-b border-white/[0.08] bg-slate-950 flex items-center justify-between text-xs">
            <span className="font-semibold text-white">Modified Cell Delta Breakdown</span>
            <span className="text-slate-400 font-mono text-[11px]">
              Showing {changedCells.length} altered records
            </span>
          </div>

          <div className="max-h-[350px] overflow-y-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950/90 text-slate-400 sticky top-0 font-mono text-[10px] uppercase">
                <tr>
                  <th className="p-2.5">Row</th>
                  <th className="p-2.5">Target Column</th>
                  <th className="p-2.5 text-rose-400">Original (Dirty)</th>
                  <th className="p-2.5 text-emerald-400">Sanitized (Cleaned)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05] font-mono text-[11px]">
                {changedCells.map((cell, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02]">
                    <td className="p-2.5 text-slate-500">Row {cell.row_idx + 1}</td>
                    <td className="p-2.5 text-slate-300 font-semibold">{cell.column}</td>
                    <td className="p-2.5">
                      <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-300 line-through border border-rose-500/20">
                        {isNullish(cell.old_value) ? "NULL" : String(cell.old_value)}
                      </span>
                    </td>
                    <td className="p-2.5">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                        {String(cell.new_value)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
