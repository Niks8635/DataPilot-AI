"use client";

import React from "react";
import { Calendar, X } from "lucide-react";
import { DateFilterWidgetConfig } from "@/types";
import { ActiveDateFilter } from "@/lib/crossFilter";

interface DateFilterWidgetProps {
  title: string;
  config: DateFilterWidgetConfig;
  currentFilter?: ActiveDateFilter;
  theme?: "dark" | "light";
  onSelectPreset: (preset: string) => void;
  onCustomDates: (start?: string, end?: string) => void;
  onClear: () => void;
}

const PRESETS = [
  { id: "all", label: "All Time" },
  { id: "7d", label: "Last 7D" },
  { id: "30d", label: "Last 30D" },
  { id: "90d", label: "Last 90D" },
  { id: "ytd", label: "YTD" },
];

export function DateFilterWidget({
  title,
  config,
  currentFilter,
  theme = "dark",
  onSelectPreset,
  onCustomDates,
  onClear,
}: DateFilterWidgetProps) {
  const isDark = theme === "dark";
  const activePreset = currentFilter?.preset || config.preset || "all";

  return (
    <div className="flex flex-col h-full text-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-800/60">
        <div className="flex items-center gap-1.5 font-semibold text-slate-300">
          <Calendar className="w-3.5 h-3.5 text-emerald-400" />
          <span>{title || `${config.date_col} Range`}</span>
        </div>
        {activePreset !== "all" && (
          <button
            onClick={onClear}
            className="text-[10px] text-slate-400 hover:text-red-400 transition-colors flex items-center gap-0.5"
          >
            <X className="w-2.5 h-2.5" />
            Reset
          </button>
        )}
      </div>

      {/* Preset Pills */}
      <div className="grid grid-cols-5 gap-1.5 mb-3">
        {PRESETS.map((p) => {
          const isSelected = activePreset === p.id;
          return (
            <button
              key={p.id}
              onClick={() => onSelectPreset(p.id)}
              className={`py-1 rounded-lg text-[11px] font-medium border transition-all text-center ${
                isSelected
                  ? "bg-emerald-600 border-emerald-500 text-white shadow-sm font-semibold"
                  : isDark
                  ? "bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white"
                  : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200 hover:text-slate-950"
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {/* Custom Date Pickers */}
      <div className="flex items-center gap-2 pt-1">
        <div className="flex-1">
          <label className="text-[10px] text-slate-500 font-semibold block mb-0.5 uppercase">From</label>
          <input
            type="date"
            value={currentFilter?.start_date || ""}
            onChange={(e) => onCustomDates(e.target.value, currentFilter?.end_date)}
            className={`w-full px-2 py-1 rounded text-[11px] outline-none border transition-colors ${
              isDark
                ? "bg-slate-950 border-slate-800 text-slate-200 focus:border-emerald-500"
                : "bg-slate-100 border-slate-300 text-slate-900 focus:border-emerald-500"
            }`}
          />
        </div>
        <div className="flex-1">
          <label className="text-[10px] text-slate-500 font-semibold block mb-0.5 uppercase">To</label>
          <input
            type="date"
            value={currentFilter?.end_date || ""}
            onChange={(e) => onCustomDates(currentFilter?.start_date, e.target.value)}
            className={`w-full px-2 py-1 rounded text-[11px] outline-none border transition-colors ${
              isDark
                ? "bg-slate-950 border-slate-800 text-slate-200 focus:border-emerald-500"
                : "bg-slate-100 border-slate-300 text-slate-900 focus:border-emerald-500"
            }`}
          />
        </div>
      </div>
    </div>
  );
}
