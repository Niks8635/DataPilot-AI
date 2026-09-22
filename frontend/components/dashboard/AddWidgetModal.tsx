"use client";

import React, { useState } from "react";
import { 
  TrendingUp, 
  BarChart3, 
  Table, 
  Filter, 
  Calendar, 
  Plus 
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { DashboardWidget, DatasetProfile } from "@/types";
import { computeGroupedData, computeMetric, formatMetricValue } from "@/lib/crossFilter";

interface AddWidgetModalProps {
  isOpen: boolean;
  pageId: string;
  profile?: DatasetProfile | null;
  rows?: Record<string, any>[];
  theme?: "dark" | "light";
  onClose: () => void;
  onAdd: (newWidget: DashboardWidget) => void;
}

type WidgetCategory = "kpi" | "chart" | "table" | "slicer" | "date_filter";

export function AddWidgetModal({
  isOpen,
  pageId,
  profile,
  rows = [],
  theme = "dark",
  onClose,
  onAdd,
}: AddWidgetModalProps) {
  const [category, setCategory] = useState<WidgetCategory>("chart");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");

  // Chart options
  const [chartType, setChartType] = useState<any>("bar");
  const [xAxis, setXAxis] = useState("");
  const [yAxis, setYAxis] = useState("");
  const [agg, setAgg] = useState<"sum" | "mean" | "count" | "min" | "max">("sum");
  const [palette, setPalette] = useState("blue");

  // KPI options
  const [kpiMetric, setKpiMetric] = useState("");
  const [kpiFormat, setKpiFormat] = useState<"currency" | "number" | "percentage">("currency");

  // Table options
  const [selectedCols, setSelectedCols] = useState<string[]>([]);
  const [pageSize, setPageSize] = useState(5);

  // Slicer options
  const [slicerCol, setSlicerCol] = useState("");
  const [multiSelect, setMultiSelect] = useState(true);

  // Date Filter options
  const [dateCol, setDateCol] = useState("");

  const columns = profile?.columns?.map((c) => c.name) || (rows.length > 0 ? Object.keys(rows[0]) : []);
  const numericCols =
    profile?.columns?.filter((c) => c.inferred_type === "numerical").map((c) => c.name) ||
    (rows.length > 0 ? Object.keys(rows[0]).filter((k) => typeof rows[0][k] === "number") : []);
  const dateCols =
    profile?.columns?.filter((c) => c.inferred_type === "datetime").map((c) => c.name) ||
    columns.filter((c) => c.toLowerCase().includes("date") || c.toLowerCase().includes("time"));
  const catCols = columns.filter((c) => !numericCols.includes(c));

  // Default selections if empty
  React.useEffect(() => {
    if (columns.length > 0 && selectedCols.length === 0) {
      setSelectedCols(columns.slice(0, 5));
    }
    if (numericCols.length > 0 && !yAxis) {
      setYAxis(numericCols[0]);
      setKpiMetric(numericCols[0]);
    }
    if (catCols.length > 0 && !xAxis) {
      setXAxis(catCols[0]);
      setSlicerCol(catCols[0]);
    }
    if (dateCols.length > 0 && !dateCol) {
      setDateCol(dateCols[0]);
    }
  }, [columns, numericCols, catCols, dateCols]);

  const handleCreate = () => {
    const id = `w_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

    if (category === "kpi") {
      const metric = kpiMetric || (numericCols[0] ?? columns[0]);
      const rawVal = computeMetric(rows, metric, agg);
      const formatted = formatMetricValue(rawVal, kpiFormat);

      const widget: DashboardWidget = {
        id,
        widget_type: "kpi",
        title: title || `Total ${metric}`,
        subtitle: subtitle || `${agg.toUpperCase()} of ${metric}`,
        page_id: pageId,
        kpi_data: {
          id: `kpi_${id}`,
          label: title || `Total ${metric}`,
          value: rawVal,
          formatted_value: formatted,
          subtext: `${agg.toUpperCase()} across dataset`,
          trend_direction: rawVal >= 0 ? "up" : "down",
          icon_name: "TrendingUp",
        },
        grid_w: 3,
        grid_h: 2,
      };
      onAdd(widget);
    } else if (category === "chart") {
      const x = xAxis || (catCols[0] ?? columns[0]);
      const y = yAxis || (numericCols[0] ?? columns[1] ?? columns[0]);
      const grouped = computeGroupedData(rows, x, y, agg, 10);

      const widget: DashboardWidget = {
        id,
        widget_type: "chart",
        title: title || `${y} by ${x}`,
        subtitle: subtitle || `${agg.toUpperCase()} comparison`,
        page_id: pageId,
        color_palette: palette,
        chart_config: {
          chart_id: `chart_${id}`,
          chart_type: chartType,
          title: title || `${y} by ${x}`,
          subtitle: subtitle || `${agg.toUpperCase()} comparison`,
          x_axis_title: x,
          y_axis_title: y,
          x_data: grouped.map((g) => g.name),
          y_data: grouped.map((g) => g.value),
        },
        grid_w: 6,
        grid_h: 4,
      };
      onAdd(widget);
    } else if (category === "table") {
      const widget: DashboardWidget = {
        id,
        widget_type: "table",
        title: title || "Data Table",
        subtitle,
        page_id: pageId,
        table_config: {
          columns: selectedCols.length > 0 ? selectedCols : columns.slice(0, 5),
          page_size: pageSize,
          show_totals: true,
        },
        grid_w: 12,
        grid_h: 4,
      };
      onAdd(widget);
    } else if (category === "slicer") {
      const col = slicerCol || (catCols[0] ?? columns[0]);
      const widget: DashboardWidget = {
        id,
        widget_type: "slicer",
        title: title || `${col} Slicer`,
        subtitle,
        page_id: pageId,
        slicer_config: {
          column: col,
          multi_select: multiSelect,
          selected_values: [],
        },
        grid_w: 3,
        grid_h: 2,
      };
      onAdd(widget);
    } else if (category === "date_filter") {
      const col = dateCol || (dateCols[0] ?? columns[0]);
      const widget: DashboardWidget = {
        id,
        widget_type: "date_filter",
        title: title || `${col} Range`,
        subtitle,
        page_id: pageId,
        date_filter_config: {
          date_col: col,
          preset: "all",
        },
        grid_w: 4,
        grid_h: 2,
      };
      onAdd(widget);
    }

    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Dashboard Widget" maxWidth="3xl">
      <div className="space-y-5 text-xs text-slate-300">
        {/* Widget Type Picker */}
        <div>
          <label className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block mb-2">
            1. Select Widget Type
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {[
              { id: "chart", label: "Analytics Chart", icon: BarChart3, desc: "Bar, Line, Area, Pie, Scatter" },
              { id: "kpi", label: "KPI Metric", icon: TrendingUp, desc: "Highlighted single summary metric" },
              { id: "table", label: "Data Table", icon: Table, desc: "Paginated table with totals" },
              { id: "slicer", label: "Dimension Slicer", icon: Filter, desc: "Interactive button pill filters" },
              { id: "date_filter", label: "Date Filter", icon: Calendar, desc: "Timeline presets & date range" },
            ].map((item) => {
              const Icon = item.icon;
              const isSelected = category === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCategory(item.id as WidgetCategory)}
                  className={`flex flex-col items-center text-center p-3 rounded-xl border transition-all ${
                    isSelected
                      ? "bg-blue-600/20 border-blue-500 text-white shadow-md ring-1 ring-blue-500"
                      : "bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                  }`}
                >
                  <Icon className={`w-5 h-5 mb-1.5 ${isSelected ? "text-blue-400" : "text-slate-400"}`} />
                  <span className="font-semibold text-xs">{item.label}</span>
                  <span className="text-[10px] text-slate-500 mt-1 line-clamp-1">{item.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* General Titles */}
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-slate-400 font-medium block mb-1">Custom Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Auto-generated if blank"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 font-medium block mb-1">Subtitle / Context</label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Optional description or note"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Specific Configuration based on Type */}
        {category === "chart" && (
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
            <label className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">
              2. Chart Configuration
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Chart Type</label>
                <select
                  value={chartType}
                  onChange={(e) => setChartType(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-blue-500"
                >
                  <option value="bar">Vertical Bar Chart</option>
                  <option value="horizontal_bar">Horizontal Bar Chart</option>
                  <option value="line">Trend Line Chart</option>
                  <option value="area">Area Chart</option>
                  <option value="donut">Donut Chart</option>
                  <option value="pie">Pie Chart</option>
                  <option value="scatter">Scatter Plot</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Dimension (X-Axis / Category)</label>
                <select
                  value={xAxis}
                  onChange={(e) => setXAxis(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-blue-500"
                >
                  {columns.map((col) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Metric (Y-Axis / Measure)</label>
                <select
                  value={yAxis}
                  onChange={(e) => setYAxis(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-blue-500"
                >
                  {columns.map((col) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Aggregation</label>
                <select
                  value={agg}
                  onChange={(e) => setAgg(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-blue-500"
                >
                  <option value="sum">Sum</option>
                  <option value="mean">Average</option>
                  <option value="count">Count (Rows)</option>
                  <option value="min">Minimum</option>
                  <option value="max">Maximum</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Color Palette</label>
                <select
                  value={palette}
                  onChange={(e) => setPalette(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-blue-500"
                >
                  <option value="blue">Modern Blue</option>
                  <option value="cyan">Crisp Cyan</option>
                  <option value="emerald">Emerald Mint</option>
                  <option value="violet">Cyber Violet</option>
                  <option value="indigo">Deep Indigo</option>
                  <option value="rose">Rose Neon</option>
                  <option value="monochrome">Monochrome Slate</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {category === "kpi" && (
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
            <label className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">
              2. KPI Configuration
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Target Measure Column</label>
                <select
                  value={kpiMetric}
                  onChange={(e) => setKpiMetric(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-blue-500"
                >
                  {columns.map((col) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Aggregation</label>
                <select
                  value={agg}
                  onChange={(e) => setAgg(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-blue-500"
                >
                  <option value="sum">Sum</option>
                  <option value="mean">Average</option>
                  <option value="count">Count (Rows)</option>
                  <option value="min">Minimum</option>
                  <option value="max">Maximum</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Format</label>
                <select
                  value={kpiFormat}
                  onChange={(e) => setKpiFormat(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-blue-500"
                >
                  <option value="currency">Currency ($)</option>
                  <option value="number">Standard Number</option>
                  <option value="percentage">Percentage (%)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {category === "table" && (
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
            <label className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">
              2. Table Configuration
            </label>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1.5">Select Columns to Display</label>
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 rounded-lg bg-slate-900 border border-slate-800">
                {columns.map((c) => {
                  const isChecked = selectedCols.includes(c);
                  return (
                    <button
                      key={c}
                      onClick={() => {
                        if (isChecked) {
                          if (selectedCols.length > 1) {
                            setSelectedCols(selectedCols.filter((x) => x !== c));
                          }
                        } else {
                          setSelectedCols([...selectedCols, c]);
                        }
                      }}
                      className={`px-2 py-0.5 rounded text-[11px] font-mono border transition-all ${
                        isChecked
                          ? "bg-blue-600 border-blue-500 text-white"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="w-40">
              <label className="text-[11px] text-slate-400 block mb-1">Rows per Page</label>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-blue-500"
              >
                <option value={5}>5 rows</option>
                <option value={10}>10 rows</option>
                <option value={20}>20 rows</option>
              </select>
            </div>
          </div>
        )}

        {category === "slicer" && (
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
            <label className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">
              2. Slicer Dimension
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Category Column</label>
                <select
                  value={slicerCol}
                  onChange={(e) => setSlicerCol(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-blue-500"
                >
                  {columns.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="multi_check"
                  checked={multiSelect}
                  onChange={(e) => setMultiSelect(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0"
                />
                <label htmlFor="multi_check" className="text-xs text-slate-300 font-medium">
                  Allow Multi-Selection
                </label>
              </div>
            </div>
          </div>
        )}

        {category === "date_filter" && (
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
            <label className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">
              2. Date Column Selection
            </label>
            <div className="w-full sm:w-1/2">
              <label className="text-[11px] text-slate-400 block mb-1">Datetime Column</label>
              <select
                value={dateCol}
                onChange={(e) => setDateCol(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-blue-500"
              >
                {columns.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleCreate} className="gap-1">
            <Plus className="w-3.5 h-3.5" />
            Add to Page
          </Button>
        </div>
      </div>
    </Modal>
  );
}
