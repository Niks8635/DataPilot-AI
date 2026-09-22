"use client";

import React from "react";
import { Filter, X, RotateCcw } from "lucide-react";
import { ActiveFilters, ActiveDateFilter } from "@/lib/crossFilter";

interface ActiveFilterBannerProps {
  categoricalFilters: ActiveFilters;
  dateFilter?: ActiveDateFilter;
  theme?: "dark" | "light";
  onRemoveCategoryFilter: (col: string, val: string) => void;
  onClearDateFilter: () => void;
  onClearAll: () => void;
}

export function ActiveFilterBanner({
  categoricalFilters,
  dateFilter,
  theme = "dark",
  onRemoveCategoryFilter,
  onClearDateFilter,
  onClearAll,
}: ActiveFilterBannerProps) {
  const isDark = theme === "dark";

  // Count active filters
  let totalFilters = 0;
  Object.values(categoricalFilters).forEach((vals) => {
    totalFilters += vals.length;
  });
  if (dateFilter && dateFilter.preset && dateFilter.preset !== "all") {
    totalFilters += 1;
  }

  if (totalFilters === 0) return null;

  return (
    <div
      className={`flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl border animate-in fade-in text-xs ${
        isDark
          ? "bg-blue-950/30 border-blue-800/40 text-blue-200"
          : "bg-blue-50 border-blue-200 text-blue-900"
      }`}
    >
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 font-semibold text-[11px] uppercase tracking-wider text-blue-400">
          <Filter className="w-3.5 h-3.5" />
          Active Filters:
        </div>

        {/* Categorical Filter Pills */}
        {Object.entries(categoricalFilters).map(([col, vals]) =>
          vals.map((v, vIdx) => (
            <span
              key={`filter-${col}-${v}-${vIdx}`}
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-mono text-[11px] border transition-colors ${
                isDark
                  ? "bg-blue-500/20 border-blue-500/40 text-blue-100"
                  : "bg-blue-100 border-blue-300 text-blue-800"
              }`}
            >
              <span className="font-semibold text-[10px] text-blue-400">{col}:</span>
              <span>{v}</span>
              <button
                onClick={() => onRemoveCategoryFilter(col, v)}
                className="hover:text-red-400 p-0.5 rounded-full transition-colors"
                title="Remove filter"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))
        )}

        {/* Date Filter Pill */}
        {dateFilter && dateFilter.preset && dateFilter.preset !== "all" && (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-mono text-[11px] border transition-colors ${
              isDark
                ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-100"
                : "bg-emerald-100 border-emerald-300 text-emerald-800"
            }`}
          >
            <span className="font-semibold text-[10px] text-emerald-400">Date:</span>
            <span>{dateFilter.preset.toUpperCase()}</span>
            <button
              onClick={onClearDateFilter}
              className="hover:text-red-400 p-0.5 rounded-full transition-colors"
              title="Remove date filter"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        )}
      </div>

      <button
        onClick={onClearAll}
        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium text-xs border transition-colors ${
          isDark
            ? "border-blue-700/50 text-blue-300 hover:text-white hover:bg-blue-600/20"
            : "border-blue-300 text-blue-700 hover:text-blue-950 hover:bg-blue-100"
        }`}
      >
        <RotateCcw className="w-3 h-3" />
        Clear All
      </button>
    </div>
  );
}
