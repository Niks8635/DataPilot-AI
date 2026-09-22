"use client";

import React, { useState, useCallback } from "react";
import { 
  Maximize2, 
  Download, 
  Copy, 
  Check, 
  FileSpreadsheet, 
  FileCode,
  Sparkles,
  ChevronDown
} from "lucide-react";
import { ChartConfig } from "@/types";
import { ChartFullscreenModal } from "./ChartFullscreenModal";

interface ChartToolbarProps {
  config: ChartConfig;
  containerRef: React.RefObject<HTMLDivElement | null>;
  color_palette?: string;
  theme?: "dark" | "light";
  className?: string;
}

export function ChartToolbar({
  config,
  containerRef,
  color_palette = "blue",
  theme = "dark",
  className = "",
}: ChartToolbarProps) {
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const [copiedState, setCopiedState] = useState<"csv" | "json" | null>(null);
  const [downloading, setDownloading] = useState(false);

  // Generate safe filename
  const getFilenameBase = useCallback(() => {
    const raw = config.title || "datapilot-chart";
    return raw.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }, [config.title]);

  // Export as High-Res 2x PNG
  const handleExportPNG = useCallback(async () => {
    if (!containerRef.current) return;
    try {
      setDownloading(true);
      const svgElement = containerRef.current.querySelector("svg");
      if (!svgElement) return;

      const svgBounds = svgElement.getBoundingClientRect();
      const width = Math.max(svgBounds.width, 600);
      const height = Math.max(svgBounds.height, 350);

      // Clone SVG and compute inline styles
      const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;
      clonedSvg.setAttribute("width", String(width));
      clonedSvg.setAttribute("height", String(height));
      clonedSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");

      // Add background rectangle to ensure dark mode contrast
      const bgRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      bgRect.setAttribute("width", "100%");
      bgRect.setAttribute("height", "100%");
      bgRect.setAttribute("fill", theme === "dark" ? "#0f172a" : "#ffffff");
      clonedSvg.insertBefore(bgRect, clonedSvg.firstChild);

      const svgData = new XMLSerializer().serializeToString(clonedSvg);
      const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      const URL = window.URL || window.webkitURL || window;
      const blobURL = URL.createObjectURL(svgBlob);

      const image = new Image();
      image.onload = () => {
        const scale = 2; // 2x Retina scaling
        const canvas = document.createElement("canvas");
        canvas.width = width * scale;
        canvas.height = height * scale;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.scale(scale, scale);
          ctx.drawImage(image, 0, 0, width, height);
          const pngURL = canvas.toDataURL("image/png");
          const downloadLink = document.createElement("a");
          downloadLink.href = pngURL;
          downloadLink.download = `${getFilenameBase()}.png`;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
        }
        URL.revokeObjectURL(blobURL);
        setDownloading(false);
      };
      image.onerror = () => {
        URL.revokeObjectURL(blobURL);
        setDownloading(false);
      };
      image.src = blobURL;
    } catch (err) {
      console.error("Failed to export chart PNG:", err);
      setDownloading(false);
    }
  }, [containerRef, getFilenameBase, theme]);

  // Export as Vector SVG
  const handleExportSVG = useCallback(() => {
    if (!containerRef.current) return;
    try {
      const svgElement = containerRef.current.querySelector("svg");
      if (!svgElement) return;

      const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;
      clonedSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");

      const svgData = new XMLSerializer().serializeToString(clonedSvg);
      const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      const downloadLink = document.createElement("a");
      downloadLink.href = URL.createObjectURL(svgBlob);
      downloadLink.download = `${getFilenameBase()}.svg`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } catch (err) {
      console.error("Failed to export chart SVG:", err);
    }
  }, [containerRef, getFilenameBase]);

  // Copy Underlying Data as CSV
  const handleCopyCSV = useCallback(() => {
    try {
      const x = config.x_data || [];
      const y = config.y_data || [];
      let csvContent = "";

      if (config.series && config.series.length > 0) {
        const seriesNames = config.series.map((s) => `"${s.name}"`);
        csvContent += `Category,${seriesNames.join(",")}\n`;
        x.forEach((label, idx) => {
          const rowVals = config.series?.map((s) => s.data?.[idx] ?? "") || [];
          csvContent += `"${label}",${rowVals.join(",")}\n`;
        });
      } else {
        csvContent += "Category,Value\n";
        x.forEach((label, idx) => {
          csvContent += `"${label}",${y[idx] ?? ""}\n`;
        });
      }

      navigator.clipboard.writeText(csvContent);
      setCopiedState("csv");
      setTimeout(() => setCopiedState(null), 2000);
    } catch (err) {
      console.error("Failed to copy CSV:", err);
    }
  }, [config]);

  // Copy Underlying Data as JSON
  const handleCopyJSON = useCallback(() => {
    try {
      const x = config.x_data || [];
      const y = config.y_data || [];
      let jsonData: any[] = [];

      if (config.series && config.series.length > 0) {
        jsonData = x.map((label, idx) => {
          const row: Record<string, any> = { category: label };
          config.series?.forEach((s) => {
            row[s.name] = s.data?.[idx];
          });
          return row;
        });
      } else {
        jsonData = x.map((label, idx) => ({
          category: label,
          value: y[idx],
        }));
      }

      navigator.clipboard.writeText(JSON.stringify(jsonData, null, 2));
      setCopiedState("json");
      setTimeout(() => setCopiedState(null), 2000);
    } catch (err) {
      console.error("Failed to copy JSON:", err);
    }
  }, [config]);

  return (
    <>
      {/* Floating Micro-Dock on Card Hover */}
      <div
        className={`absolute top-2.5 right-2.5 z-20 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 px-1.5 py-1 rounded-xl shadow-lg border backdrop-blur-md ${
          theme === "dark"
            ? "bg-slate-950/80 border-slate-700/80 text-slate-300"
            : "bg-white/90 border-slate-200 text-slate-700"
        } ${className}`}
      >
        {/* Fullscreen Button */}
        <button
          onClick={() => setFullscreenOpen(true)}
          className="p-1 hover:text-cyan-400 rounded-lg hover:bg-white/[0.08] transition-colors"
          title="Expand to Fullscreen Modal"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>

        {/* Export PNG */}
        <button
          onClick={handleExportPNG}
          disabled={downloading}
          className="p-1 hover:text-blue-400 rounded-lg hover:bg-white/[0.08] transition-colors"
          title="Download High-Res PNG (Retina 2x)"
        >
          <Download className="w-3.5 h-3.5" />
        </button>

        {/* Copy CSV Data */}
        <button
          onClick={handleCopyCSV}
          className="p-1 hover:text-emerald-400 rounded-lg hover:bg-white/[0.08] transition-colors relative"
          title="Copy Data Points as CSV"
        >
          {copiedState === "csv" ? (
            <Check className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Fullscreen Modal View */}
      <ChartFullscreenModal
        isOpen={fullscreenOpen}
        onClose={() => setFullscreenOpen(false)}
        config={config}
        color_palette={color_palette}
        theme={theme}
        onExportPNG={handleExportPNG}
        onExportSVG={handleExportSVG}
        onCopyCSV={handleCopyCSV}
        onCopyJSON={handleCopyJSON}
        copiedState={copiedState}
      />
    </>
  );
}
