"use client";

import React from "react";
import { 
  Download, 
  FileSpreadsheet, 
  FileText, 
  FileJson, 
  Layers, 
  CheckCircle2, 
  Sparkles,
  Printer
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { api } from "@/lib/api";

interface ExportCenterModalProps {
  datasetId: string;
  datasetName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ExportCenterModal({ datasetId, datasetName, isOpen, onClose }: ExportCenterModalProps) {
  const exportCards = [
    {
      id: "xlsx_multitab",
      title: "Multi-Tab Executive Excel Workbook",
      ext: ".xlsx",
      badge: "Recommended",
      icon: <FileSpreadsheet className="w-5 h-5 text-emerald-400" />,
      desc: "Complete 7-worksheet formatted Excel workbook containing Raw Data, Cleaned Data, Summary Statistics, KPIs & Metrics, AI Insights, Anomalies, and Forecast with corporate styling.",
      url: api.datasets.getExportUrl(datasetId, "xlsx_multitab", "current", true),
      variant: "primary" as const
    },
    {
      id: "csv_cleaned",
      title: "Active Cleaned Dataset",
      ext: ".csv",
      icon: <FileSpreadsheet className="w-5 h-5 text-blue-400" />,
      desc: "Standard CSV containing the latest cleaned dataset version, ready for external BI tools or Python scripts.",
      url: api.datasets.getExportUrl(datasetId, "csv", "current"),
      variant: "outline" as const
    },
    {
      id: "csv_raw",
      title: "Original Raw Upload",
      ext: ".csv",
      icon: <FileSpreadsheet className="w-5 h-5 text-slate-400" />,
      desc: "Untouched original source file as uploaded in version 1 before any transformations.",
      url: api.datasets.getExportUrl(datasetId, "csv", "original"),
      variant: "outline" as const
    },
    {
      id: "json",
      title: "Cleaned Records JSON",
      ext: ".json",
      icon: <FileJson className="w-5 h-5 text-cyan-400" />,
      desc: "JSON records array of the active dataset version for direct web APIs or software integration.",
      url: api.datasets.getExportUrl(datasetId, "json", "current"),
      variant: "outline" as const
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="DataPilot Export Center"
      maxWidth="3xl"
    >
      <div className="space-y-5">
        <div className="p-4 rounded-xl bg-gradient-to-r from-blue-950/40 via-slate-900 to-indigo-950/40 border border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              Download Dataset & Intelligence Artifacts
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Export high-fidelity spreadsheet workbooks, raw data, or programmatic formats.
            </p>
          </div>
          <Badge variant="outline" className="font-mono text-xs uppercase">
            {datasetName}
          </Badge>
        </div>

        {/* Formats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {exportCards.map((card) => (
            <div
              key={card.id}
              className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 transition ${
                card.id === "xlsx_multitab"
                  ? "bg-slate-900/90 border-blue-500/40 hover:border-blue-500/70"
                  : "bg-slate-950/80 border-slate-800 hover:border-slate-700"
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {card.icon}
                    <span className="font-semibold text-xs text-slate-100">{card.title}</span>
                  </div>
                  {card.badge && (
                    <Badge variant="primary" className="text-[10px] font-mono">
                      {card.badge}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {card.desc}
                </p>
              </div>

              <div className="pt-2">
                <a
                  href={card.url}
                  download
                  className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                    card.variant === "primary"
                      ? "bg-blue-600 hover:bg-blue-500 text-white shadow-sm"
                      : "bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200"
                  }`}
                >
                  <Download className="w-3.5 h-3.5" />
                  Download {card.ext}
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Close Button */}
        <div className="flex justify-end pt-3 border-t border-slate-800">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
