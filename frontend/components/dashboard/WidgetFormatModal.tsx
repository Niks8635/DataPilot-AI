"use client";

import React, { useState, useEffect } from "react";
import { 
  Palette, 
  BarChart2, 
  Settings, 
  Check, 
  Type, 
  Hash, 
  Layers 
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { DashboardWidget, DatasetProfile } from "@/types";

interface WidgetFormatModalProps {
  isOpen: boolean;
  widget: DashboardWidget | null;
  profile?: DatasetProfile | null;
  theme?: "dark" | "light";
  onClose: () => void;
  onSave: (updatedWidget: DashboardWidget) => void;
}

const PALETTES = [
  { id: "blue", label: "Modern Blue", color: "#3b82f6" },
  { id: "cyan", label: "Crisp Cyan", color: "#06b6d4" },
  { id: "emerald", label: "Emerald Mint", color: "#10b981" },
  { id: "violet", label: "Cyber Violet", color: "#8b5cf6" },
  { id: "indigo", label: "Deep Indigo", color: "#6366f1" },
  { id: "rose", label: "Rose Neon", color: "#ec4899" },
  { id: "monochrome", label: "Monochrome Slate", color: "#64748b" },
];

const CHART_TYPES = [
  { id: "bar", label: "Vertical Bar" },
  { id: "horizontal_bar", label: "Horizontal Bar" },
  { id: "line", label: "Trend Line" },
  { id: "area", label: "Area Fill" },
  { id: "pie", label: "Pie Chart" },
  { id: "donut", label: "Donut Chart" },
  { id: "scatter", label: "Scatter Plot" },
];

export function WidgetFormatModal({
  isOpen,
  widget,
  profile,
  theme = "dark",
  onClose,
  onSave,
}: WidgetFormatModalProps) {
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [chartType, setChartType] = useState<any>("bar");
  const [palette, setPalette] = useState("blue");
  const [xAxis, setXAxis] = useState("");
  const [yAxis, setYAxis] = useState("");
  const [agg, setAgg] = useState<"sum" | "mean" | "count" | "min" | "max">("sum");
  const [formatType, setFormatType] = useState<"currency" | "number" | "percentage">("currency");
  const [gridW, setGridW] = useState(6);
  const [gridH, setGridH] = useState(4);

  useEffect(() => {
    if (widget) {
      setTitle(widget.title || "");
      setSubtitle(widget.subtitle || "");
      setChartType(widget.chart_config?.chart_type || "bar");
      setPalette(widget.color_palette || "blue");
      setGridW(widget.grid_w || 6);
      setGridH(widget.grid_h || 4);

      if (widget.chart_config) {
        setXAxis(widget.chart_config.x_axis_title || "");
        setYAxis(widget.chart_config.y_axis_title || "");
      }
    }
  }, [widget]);

  if (!widget) return null;

  const columns = profile?.columns?.map((c) => c.name) || [];
  const numericCols =
    profile?.columns?.filter((c) => c.inferred_type === "numerical").map((c) => c.name) || [];
  const catCols =
    profile?.columns?.filter((c) => c.inferred_type !== "numerical").map((c) => c.name) || [];

  const handleApply = () => {
    const updated: DashboardWidget = {
      ...widget,
      title,
      subtitle,
      color_palette: palette,
      grid_w: gridW,
      grid_h: gridH,
    };

    if (widget.widget_type === "chart" && updated.chart_config) {
      updated.chart_config = {
        ...updated.chart_config,
        chart_type: chartType,
        title,
        subtitle,
        x_axis_title: xAxis || updated.chart_config.x_axis_title,
        y_axis_title: yAxis || updated.chart_config.y_axis_title,
      };
    } else if (widget.widget_type === "kpi" && updated.kpi_data) {
      updated.kpi_data = {
        ...updated.kpi_data,
        label: title,
        subtext: subtitle,
      };
    }

    onSave(updated);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Format & Customize Widget" maxWidth="2xl">
      <div className="space-y-5 text-xs text-slate-300">
        {/* General Typography */}
        <div className="space-y-3 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
          <div className="flex items-center gap-1.5 font-semibold text-slate-200">
            <Type className="w-3.5 h-3.5 text-blue-400" />
            Titles & Labels
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-slate-400 font-medium block mb-1">Widget Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 font-medium block mb-1">Subtitle / Context</label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Optional description"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Chart Type Selector (if chart widget) */}
        {widget.widget_type === "chart" && (
          <div className="space-y-2.5 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center gap-1.5 font-semibold text-slate-200">
              <BarChart2 className="w-3.5 h-3.5 text-emerald-400" />
              Chart Type
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CHART_TYPES.map((ct) => (
                <button
                  key={ct.id}
                  onClick={() => setChartType(ct.id)}
                  className={`px-2.5 py-2 rounded-lg font-medium text-xs border transition-all text-center ${
                    chartType === ct.id
                      ? "bg-blue-600 border-blue-500 text-white shadow-md font-semibold"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  {ct.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Color Palette Theme */}
        <div className="space-y-2.5 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
          <div className="flex items-center gap-1.5 font-semibold text-slate-200">
            <Palette className="w-3.5 h-3.5 text-violet-400" />
            Color Theme Palette
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {PALETTES.map((p) => {
              const isSelected = palette === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setPalette(p.id)}
                  className={`flex items-center gap-2.5 p-2 rounded-lg border transition-all ${
                    isSelected
                      ? "bg-slate-800 border-blue-500 text-white font-semibold"
                      : "bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800"
                  }`}
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full shadow-sm"
                    style={{ backgroundColor: p.color }}
                  />
                  <span>{p.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-blue-400 ml-auto" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dimensions & Grid Sizing */}
        <div className="space-y-2.5 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
          <div className="flex items-center gap-1.5 font-semibold text-slate-200">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            Grid Size & Proportions
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] text-slate-400 font-medium block mb-1">
                Width (12-col Grid): {gridW === 3 ? "1/4" : gridW === 4 ? "1/3" : gridW === 6 ? "1/2" : gridW === 8 ? "2/3" : "Full"}
              </label>
              <div className="flex items-center gap-1.5">
                {[3, 4, 6, 8, 12].map((wVal) => (
                  <button
                    key={wVal}
                    onClick={() => setGridW(wVal)}
                    className={`flex-1 py-1 rounded text-xs font-mono font-bold border transition-colors ${
                      gridW === wVal
                        ? "bg-blue-600 border-blue-500 text-white"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800"
                    }`}
                  >
                    {wVal}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 font-medium block mb-1">
                Height Profile: {gridH === 2 ? "Small" : gridH === 4 ? "Medium" : gridH === 6 ? "Large" : "Extra Large"}
              </label>
              <div className="flex items-center gap-1.5">
                {[
                  { h: 2, label: "S" },
                  { h: 4, label: "M" },
                  { h: 6, label: "L" },
                  { h: 8, label: "XL" },
                ].map((hOpt) => (
                  <button
                    key={hOpt.h}
                    onClick={() => setGridH(hOpt.h)}
                    className={`flex-1 py-1 rounded text-xs font-mono font-bold border transition-colors ${
                      gridH === hOpt.h
                        ? "bg-emerald-600 border-emerald-500 text-white"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800"
                    }`}
                  >
                    {hOpt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleApply}>
            Save Formatting
          </Button>
        </div>
      </div>
    </Modal>
  );
}
