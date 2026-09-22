"use client";

import React from "react";
import { 
  GripVertical, 
  Settings2, 
  Trash2, 
  Copy, 
  Maximize2 
} from "lucide-react";
import { DashboardWidget } from "@/types";

interface WidgetContainerProps {
  widget: DashboardWidget;
  index: number;
  theme?: "dark" | "light";
  isCustomizeMode?: boolean;
  children: React.ReactNode;
  onFormat: (widget: DashboardWidget) => void;
  onDuplicate: (widget: DashboardWidget) => void;
  onDelete: (widgetId: string) => void;
  onResizeWidth: (widgetId: string, newW: number) => void;
  onResizeHeight: (widgetId: string, newH: number) => void;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDrop: (e: React.DragEvent, index: number) => void;
}

const WIDTH_OPTIONS = [
  { label: "1/4", w: 3 },
  { label: "1/3", w: 4 },
  { label: "1/2", w: 6 },
  { label: "2/3", w: 8 },
  { label: "Full", w: 12 },
];

const HEIGHT_OPTIONS = [
  { label: "S", h: 2 },
  { label: "M", h: 4 },
  { label: "L", h: 6 },
  { label: "XL", h: 8 },
];

export function WidgetContainer({
  widget,
  index,
  theme = "dark",
  isCustomizeMode = false,
  children,
  onFormat,
  onDuplicate,
  onDelete,
  onResizeWidth,
  onResizeHeight,
  onDragStart,
  onDragOver,
  onDrop,
}: WidgetContainerProps) {
  const isDark = theme === "dark";
  const w = widget.grid_w || 6;
  const h = widget.grid_h || 4;

  // Responsive column span class
  const colSpanClass =
    w === 3
      ? "col-span-12 sm:col-span-6 lg:col-span-3"
      : w === 4
      ? "col-span-12 sm:col-span-6 lg:col-span-4"
      : w === 6
      ? "col-span-12 lg:col-span-6"
      : w === 8
      ? "col-span-12 lg:col-span-8"
      : "col-span-12";

  // Height style
  const minHeightPx = h === 2 ? 180 : h === 4 ? 320 : h === 6 ? 440 : 560;

  return (
    <div
      draggable={isCustomizeMode}
      onDragStart={(e) => {
        if (!isCustomizeMode) return;
        onDragStart(e, index);
      }}
      onDragOver={(e) => {
        if (!isCustomizeMode) return;
        e.preventDefault();
        onDragOver(e, index);
      }}
      onDrop={(e) => {
        if (!isCustomizeMode) return;
        onDrop(e, index);
      }}
      className={`group relative flex flex-col rounded-2xl border transition-all duration-200 shadow-md ${colSpanClass} ${
        isDark
          ? "bg-slate-900/90 border-slate-800 text-slate-100 hover:border-slate-700 hover:shadow-xl"
          : "bg-white border-slate-200 text-slate-900 hover:border-slate-300 hover:shadow-xl"
      }`}
      style={{ minHeight: minHeightPx }}
    >
      {/* Top Floating Control Bar */}
      {isCustomizeMode ? (
        <div
          className={`absolute top-2.5 right-2.5 z-20 flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity px-2 py-1 rounded-xl shadow-lg border backdrop-blur-md ${
            isDark
              ? "bg-slate-950/95 border-slate-700 text-slate-300"
              : "bg-white/95 border-slate-200 text-slate-700"
          }`}
        >
          {/* Width Selector Pills */}
          <div className="flex items-center gap-0.5 mr-1 pr-1 border-r border-slate-800/80">
            {WIDTH_OPTIONS.map((opt) => (
              <button
                key={opt.w}
                onClick={() => onResizeWidth(widget.id, opt.w)}
                title={`Span ${opt.w} of 12 columns (${opt.label})`}
                className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold transition-colors ${
                  w === opt.w
                    ? "bg-blue-600 text-white"
                    : "hover:bg-slate-800 hover:text-white text-slate-400"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Height Selector Pills */}
          <div className="flex items-center gap-0.5 mr-1 pr-1 border-r border-slate-800/80">
            {HEIGHT_OPTIONS.map((opt) => (
              <button
                key={opt.h}
                onClick={() => onResizeHeight(widget.id, opt.h)}
                title={`Height ${opt.label}`}
                className={`px-1 py-0.5 rounded text-[9px] font-mono font-bold transition-colors ${
                  h === opt.h
                    ? "bg-emerald-600 text-white"
                    : "hover:bg-slate-800 hover:text-white text-slate-400"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Format / Inspector button */}
          <button
            onClick={() => onFormat(widget)}
            title="Format & Edit Widget"
            className="p-1 hover:text-blue-400 rounded transition-colors"
          >
            <Settings2 className="w-3.5 h-3.5" />
          </button>

          {/* Duplicate button */}
          <button
            onClick={() => onDuplicate(widget)}
            title="Duplicate Widget"
            className="p-1 hover:text-emerald-400 rounded transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          {/* Delete button */}
          <button
            onClick={() => onDelete(widget.id)}
            title="Delete Widget"
            className="p-1 hover:text-red-400 rounded transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        /* Subtle Format trigger in View mode */
        <button
          onClick={() => onFormat(widget)}
          title="Format widget"
          className="absolute top-2.5 right-28 z-20 p-1.5 rounded-lg opacity-0 group-hover:opacity-80 hover:!opacity-100 transition-opacity text-slate-400 hover:text-blue-400 bg-slate-950/80 border border-slate-800/80 shadow-md backdrop-blur-xs"
        >
          <Settings2 className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Drag Handle Indicator */}
      {isCustomizeMode && (
        <div
          title="Drag to reorder card"
          className="absolute top-3 left-3 z-10 p-1 rounded cursor-grab active:cursor-grabbing text-slate-400 hover:text-white"
        >
          <GripVertical className="w-4 h-4" />
        </div>
      )}

      {/* Widget Content Body */}
      <div className="p-4 flex-1 flex flex-col">{children}</div>
    </div>
  );
}
