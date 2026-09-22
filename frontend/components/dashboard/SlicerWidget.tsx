"use client";

import React, { useState } from "react";
import { Filter, Check, X, Search } from "lucide-react";
import { SlicerWidgetConfig } from "@/types";

interface SlicerWidgetProps {
  title: string;
  config: SlicerWidgetConfig;
  availableValues: string[];
  selectedValues: string[];
  theme?: "dark" | "light";
  onToggleValue: (col: string, val: string, multiSelect: boolean) => void;
  onClear: (col: string) => void;
}

export function SlicerWidget({
  title,
  config,
  availableValues,
  selectedValues,
  theme = "dark",
  onToggleValue,
  onClear,
}: SlicerWidgetProps) {
  const [search, setSearch] = useState("");
  const isDark = theme === "dark";

  const col = config.column;
  const multi = config.multi_select !== false;

  const filteredValues = availableValues.filter((v) =>
    v.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full text-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/60">
        <div className="flex items-center gap-1.5 font-semibold text-slate-300">
          <Filter className="w-3.5 h-3.5 text-blue-400" />
          <span>{title || `${col} Slicer`}</span>
          {selectedValues.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-500/20 text-blue-300 font-mono">
              {selectedValues.length}
            </span>
          )}
        </div>
        {selectedValues.length > 0 && (
          <button
            onClick={() => onClear(col)}
            className="text-[10px] text-slate-400 hover:text-red-400 transition-colors flex items-center gap-0.5"
          >
            <X className="w-2.5 h-2.5" />
            Clear
          </button>
        )}
      </div>

      {/* Search Input (if > 6 values) */}
      {availableValues.length > 6 && (
        <div className="relative mb-2">
          <Search className="w-3 h-3 absolute left-2 top-2 text-slate-500" />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full pl-6 pr-2 py-1 rounded text-[11px] outline-none border transition-colors ${
              isDark
                ? "bg-slate-950 border-slate-800 text-slate-200 focus:border-blue-500"
                : "bg-slate-100 border-slate-300 text-slate-900 focus:border-blue-500"
            }`}
          />
        </div>
      )}

      {/* Slicer Pill Buttons */}
      <div className="flex-1 overflow-y-auto max-h-52 flex flex-wrap gap-1.5 content-start pr-1">
        {filteredValues.length === 0 ? (
          <p className="text-[11px] text-slate-500 italic">No values found</p>
        ) : (
          filteredValues.map((val) => {
            const isSelected = selectedValues.some(
              (v) => String(v).trim().toLowerCase() === String(val).trim().toLowerCase()
            );

            return (
              <button
                key={val}
                onClick={() => onToggleValue(col, val, multi)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all select-none ${
                  isSelected
                    ? "bg-blue-600 border-blue-500 text-white shadow-sm"
                    : isDark
                    ? "bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:text-white"
                    : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200 hover:text-slate-950"
                }`}
              >
                <div
                  className={`w-3 h-3 rounded flex items-center justify-center border ${
                    isSelected
                      ? "bg-white border-white text-blue-600"
                      : isDark
                      ? "border-slate-700 bg-slate-900"
                      : "border-slate-300 bg-white"
                  }`}
                >
                  {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                </div>
                <span>{val}</span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
