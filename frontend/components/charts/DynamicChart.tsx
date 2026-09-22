"use client";

import React, { useRef } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { ChartConfig } from "@/types";
import { ChartToolbar } from "./ChartToolbar";

const PALETTES: Record<string, string[]> = {
  blue: ["#3b82f6", "#60a5fa", "#2563eb", "#93c5fd", "#1d4ed8", "#0284c7"],
  emerald: ["#10b981", "#34d399", "#059669", "#6ee7b7", "#047857", "#14b8a6"],
  violet: ["#8b5cf6", "#a78bfa", "#7c3aed", "#c4b5fd", "#6d28d9", "#9333ea"],
  cyan: ["#06b6d4", "#22d3ee", "#0891b2", "#67e8f9", "#0e7490", "#0284c7"],
  indigo: ["#6366f1", "#818cf8", "#4f46e5", "#a5b4fc", "#4338ca", "#3730a3"],
  amber: ["#6366f1", "#818cf8", "#4f46e5", "#a5b4fc", "#4338ca", "#3730a3"],
  rose: ["#ec4899", "#f472b6", "#db2777", "#fbcfe8", "#be185d", "#e11d48"],
  monochrome: ["#64748b", "#94a3b8", "#475569", "#cbd5e1", "#334155", "#1e293b"],
};

interface DynamicChartProps {
  config: ChartConfig;
  height?: number;
  color_palette?: string;
  theme?: "dark" | "light";
  onPointClick?: (category: string, value: number, fieldName?: string) => void;
  activeFilterValue?: string;
  show_legend?: boolean;
  show_grid?: boolean;
  showToolbar?: boolean;
}

export function DynamicChart({
  config,
  height = 300,
  color_palette = "blue",
  theme = "dark",
  onPointClick,
  activeFilterValue,
  show_legend = true,
  show_grid = true,
  showToolbar = true,
}: DynamicChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { chart_type, x_data = [], y_data = [], series, title, subtitle } = config;

  const paletteColors = PALETTES[color_palette] || PALETTES.blue;
  const isDark = theme === "dark";
  const axisColor = isDark ? "#94a3b8" : "#475569";
  const gridColor = isDark ? "#334155" : "#e2e8f0";

  // Format data into standard Recharts format
  let chartData: any[] = [];

  if (
    series &&
    series.length > 0 &&
    series[0].data &&
    typeof series[0].data[0] === "object" &&
    series[0].data[0]?.name
  ) {
    chartData = series[0].data;
  } else if (x_data && y_data && x_data.length === y_data.length) {
    chartData = x_data.map((x, i) => ({
      name: String(x),
      value: typeof y_data[i] === "number" ? y_data[i] : Number(y_data[i]) || 0,
    }));
  } else if (series && series.length > 0) {
    chartData = (x_data || []).map((x, i) => {
      const entry: any = { name: String(x) };
      series.forEach((s) => {
        entry[s.name] = s.data[i];
      });
      return entry;
    });
  }

  const handleBarClick = (data: any) => {
    if (!onPointClick || !data) return;
    const cat = data.name || data.activeLabel || "";
    const val = typeof data.value === "number" ? data.value : 0;
    onPointClick(cat, val, config.title);
  };

  const handlePieClick = (entry: any) => {
    if (!onPointClick || !entry) return;
    onPointClick(entry.name, entry.value, config.title);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          className={`p-3 rounded-xl border text-xs shadow-xl backdrop-blur-md ${
            isDark
              ? "bg-slate-900/95 border-slate-700 text-slate-100"
              : "bg-white/95 border-slate-200 text-slate-800"
          }`}
        >
          <p className={`font-semibold mb-1 ${isDark ? "text-slate-200" : "text-slate-900"}`}>{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} style={{ color: entry.color || paletteColors[0] }}>
              {entry.name || "Value"}: {typeof entry.value === "number" ? entry.value.toLocaleString() : entry.value}
            </p>
          ))}
          {onPointClick && (
            <p className="text-[10px] text-blue-400 mt-1 italic font-medium">Click to cross-filter dashboard</p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div ref={containerRef} className="w-full flex flex-col h-full select-none relative group">
      {showToolbar && (
        <ChartToolbar
          config={config}
          containerRef={containerRef}
          color_palette={color_palette}
          theme={theme}
        />
      )}
      {(title || subtitle) && (
        <div className="mb-3">
          {title && (
            <h4 className={`text-sm font-semibold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
              {title}
            </h4>
          )}
          {subtitle && (
            <p className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              {subtitle}
            </p>
          )}
        </div>
      )}
      <div className="w-full flex-1" style={{ minHeight: height }}>
        <ResponsiveContainer width="100%" height={height}>
          {chart_type === "line" ? (
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              {show_grid && <CartesianGrid strokeDasharray="3 3" stroke={gridColor} opacity={0.5} />}
              <XAxis dataKey="name" stroke={axisColor} fontSize={11} tickLine={false} />
              <YAxis stroke={axisColor} fontSize={11} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              {show_legend && <Legend wrapperStyle={{ fontSize: "11px", color: axisColor }} />}
              <Line
                type="monotone"
                dataKey="value"
                name={config.y_axis_title || "Value"}
                stroke={paletteColors[0]}
                strokeWidth={2.5}
                dot={{ fill: paletteColors[0], r: 3 }}
                activeDot={{
                  r: 6,
                  fill: paletteColors[1],
                  onClick: (_, event) => handleBarClick(event),
                  cursor: onPointClick ? "pointer" : "default",
                }}
              />
            </LineChart>
          ) : chart_type === "area" ? (
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id={`areaGrad_${config.chart_id || 'def'}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={paletteColors[0]} stopOpacity={0.6} />
                  <stop offset="95%" stopColor={paletteColors[0]} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              {show_grid && <CartesianGrid strokeDasharray="3 3" stroke={gridColor} opacity={0.5} />}
              <XAxis dataKey="name" stroke={axisColor} fontSize={11} tickLine={false} />
              <YAxis stroke={axisColor} fontSize={11} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              {show_legend && <Legend wrapperStyle={{ fontSize: "11px", color: axisColor }} />}
              <Area
                type="monotone"
                dataKey="value"
                name={config.y_axis_title || "Value"}
                stroke={paletteColors[0]}
                fill={`url(#areaGrad_${config.chart_id || 'def'})`}
                strokeWidth={2}
              />
            </AreaChart>
          ) : chart_type === "horizontal_bar" ? (
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 10, right: 20, left: 20, bottom: 0 }}
            >
              {show_grid && <CartesianGrid strokeDasharray="3 3" stroke={gridColor} opacity={0.5} horizontal={false} />}
              <XAxis type="number" stroke={axisColor} fontSize={11} tickLine={false} />
              <YAxis dataKey="name" type="category" stroke={axisColor} fontSize={11} tickLine={false} width={80} />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="value"
                fill={paletteColors[0]}
                radius={[0, 4, 4, 0]}
                onClick={handleBarClick}
                cursor={onPointClick ? "pointer" : "default"}
              >
                {chartData.map((entry, index) => {
                  const isSelected = activeFilterValue && activeFilterValue.toLowerCase() === entry.name.toLowerCase();
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={paletteColors[index % paletteColors.length]}
                      opacity={activeFilterValue ? (isSelected ? 1.0 : 0.35) : 0.9}
                      stroke={isSelected ? "#ffffff" : "none"}
                      strokeWidth={isSelected ? 2 : 0}
                    />
                  );
                })}
              </Bar>
            </BarChart>
          ) : chart_type === "donut" || chart_type === "pie" ? (
            <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <Tooltip content={<CustomTooltip />} />
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={chart_type === "donut" ? 55 : 0}
                outerRadius={80}
                paddingAngle={3}
                onClick={handlePieClick}
                cursor={onPointClick ? "pointer" : "default"}
              >
                {chartData.map((entry, index) => {
                  const isSelected = activeFilterValue && activeFilterValue.toLowerCase() === entry.name.toLowerCase();
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={paletteColors[index % paletteColors.length]}
                      opacity={activeFilterValue ? (isSelected ? 1.0 : 0.4) : 0.9}
                      stroke={isSelected ? "#ffffff" : "none"}
                      strokeWidth={isSelected ? 2 : 0}
                    />
                  );
                })}
              </Pie>
              {show_legend && <Legend wrapperStyle={{ fontSize: "11px", color: axisColor }} />}
            </PieChart>
          ) : chart_type === "scatter" ? (
            <ScatterChart margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              {show_grid && <CartesianGrid strokeDasharray="3 3" stroke={gridColor} opacity={0.5} />}
              <XAxis dataKey="x" name={config.x_axis_title || "X"} stroke={axisColor} fontSize={11} />
              <YAxis dataKey="y" name={config.y_axis_title || "Y"} stroke={axisColor} fontSize={11} />
              <Tooltip cursor={{ strokeDasharray: "3 3" }} />
              <Scatter
                name={config.title}
                data={
                  config.series?.[0]?.data?.map((p: any) => ({ x: p[0], y: p[1] })) ||
                  x_data.map((x, i) => ({ x, y: y_data[i] }))
                }
                fill={paletteColors[0]}
              />
            </ScatterChart>
          ) : (
            /* Standard Vertical Bar Chart */
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
              onClick={(state: any) => {
                if (state && state.activePayload && state.activePayload.length) {
                  const p = state.activePayload[0].payload;
                  handleBarClick(p);
                }
              }}
            >
              {show_grid && <CartesianGrid strokeDasharray="3 3" stroke={gridColor} opacity={0.5} vertical={false} />}
              <XAxis dataKey="name" stroke={axisColor} fontSize={11} tickLine={false} />
              <YAxis stroke={axisColor} fontSize={11} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              {show_legend && <Legend wrapperStyle={{ fontSize: "11px", color: axisColor }} />}
              <Bar
                dataKey="value"
                name={config.y_axis_title || "Value"}
                fill={paletteColors[0]}
                radius={[4, 4, 0, 0]}
                onClick={handleBarClick}
                cursor={onPointClick ? "pointer" : "default"}
              >
                {chartData.map((entry, index) => {
                  const isSelected = activeFilterValue && activeFilterValue.toLowerCase() === entry.name.toLowerCase();
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={paletteColors[index % paletteColors.length]}
                      opacity={activeFilterValue ? (isSelected ? 1.0 : 0.35) : 0.9}
                      stroke={isSelected ? "#ffffff" : "none"}
                      strokeWidth={isSelected ? 2 : 0}
                    />
                  );
                })}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
      {config.summary_text && (
        <p
          className={`text-[11px] mt-2 italic px-2.5 py-1.5 rounded-lg border ${
            isDark
              ? "bg-slate-950/60 text-slate-400 border-slate-800/80"
              : "bg-slate-50 text-slate-600 border-slate-200"
          }`}
        >
          {config.summary_text}
        </p>
      )}
    </div>
  );
}
